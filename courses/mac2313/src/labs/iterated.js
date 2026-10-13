import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { integral2, integralTypeI, integralTypeII, simpson, compositeSimpson } from '../math/quadrature.js';
import { closedRect, closedDisk, closedTriangle, diskTypeI, diskTypeII, triangleBounds, parabolaBounds } from '../math/double.js';
import { agreeTo } from '../math/agree.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

/*
 * The yardstick for "do the two orders agree?" is ∬|f| over the same region, computed by the same
 * integrator — not the value of the integral itself, which can cancel to near zero while both
 * routes are badly wrong, and not a floor of 1, which made the tolerance flatly absolute for every
 * integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale);

function bounds(state) {
  if (state.region === 'disk') {
    const R = state.R || 1;
    const I = diskTypeI(R);
    const II = diskTypeII(R);
    return { kind: 'disk', R, ...I, ...II, typeII: II };
  }
  if (state.region === 'triangle') {
    return { kind: 'typeI', ...triangleBounds() };
  }
  if (state.region === 'parabola') {
    return { kind: 'typeI', ...parabolaBounds() };
  }
  return {
    kind: 'rect',
    xa: state.xMin,
    xb: state.xMax,
    ya: state.yMin,
    yb: state.yMax,
    yLo: () => state.yMin,
    yHi: () => state.yMax,
    xLo: () => state.xMin,
    xHi: () => state.xMax,
  };
}

export default defineLab({
  id: 'iterated',
  exam: 'ch3',
  title: 'Iterated',
  hint: 'The filled slice is the inner integral · the plot is $A$',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(8.6, 6.8, 9.8), target: new THREE.Vector3(0.4, 0.5, 0.4) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'slice', label: 'Inner slice' },
    { key: 'region', label: 'Region $D$' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.iterated,
  defaultState() {
    return {
      scenarioId: 'para-sq',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      region: 'rect',
      order: 'xy',
      R: 1,
      probe: { x: 0.4, y: 0.4, z: 0 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      show: { surface: true, slice: true, region: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>Order</span>
          <select id="it-order">
            <option value="xy">dy dx (y inner)</option>
            <option value="yx">dx dy (x inner)</option>
          </select>
        </label>
        <label class="field" id="it-x-field">
          <span>x</span>
          <div class="slider-row">
            <input type="range" id="it-x" min="0" max="1" step="0.01" value="0.4" />
            <span class="mono val" id="it-x-val">0.40</span>
          </div>
        </label>
        <label class="field" id="it-y-field">
          <span>y</span>
          <div class="slider-row">
            <input type="range" id="it-y" min="0" max="1" step="0.01" value="0.4" />
            <span class="mono val" id="it-y-val">0.40</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('it-order').addEventListener('change', (e) => {
      api.slice().order = e.target.value;
      api.bump();
    });
    document.getElementById('it-x').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    document.getElementById('it-y').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const orderEl = document.getElementById('it-order');
    if (!orderEl) return;
    orderEl.value = state.order === 'yx' ? 'yx' : 'xy';
    const b = bounds(state);
    const xEl = document.getElementById('it-x');
    const yEl = document.getElementById('it-y');
    const xa = b.xa ?? state.xMin;
    const xb = b.xb ?? state.xMax;
    const ya = b.ya ?? state.yMin;
    const yb = b.yb ?? state.yMax;
    xEl.min = String(xa);
    xEl.max = String(xb);
    yEl.min = String(ya);
    yEl.max = String(yb);
    xEl.value = state.probe.x;
    yEl.value = state.probe.y;
    document.getElementById('it-x-val').textContent = Number(state.probe.x).toFixed(2);
    document.getElementById('it-y-val').textContent = Number(state.probe.y).toFixed(2);
    document.getElementById('it-x-field').hidden = state.order === 'yx';
    document.getElementById('it-y-field').hidden = state.order !== 'yx';
  },
  applyScenario(id, state) {
    applyData('iterated', id, state);
    if (!state.order) state.order = 'xy';
    if (!state.region) state.region = 'rect';
    // f = 1 on a disk or triangle is a flat sheet over the bounding square, which hides the slice.
    if (state.surfaceId === 'one' && state.region !== 'rect') {
      state.show = { ...(state.show || {}), surface: false, slice: true, region: true };
    }
  },
  extent(state) {
    const b = bounds(state);
    if (b.kind === 'disk') return Math.max(b.R, 1.2);
    return Math.max(Math.abs(b.xa ?? 0), Math.abs(b.xb ?? 0), Math.abs(b.ya ?? 0), Math.abs(b.yb ?? 1), 1);
  },
  recompute(state, computed) {
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const b = bounds(state);
    const order = state.order === 'yx' ? 'yx' : 'xy';
    state.order = order;

    const afn = (x, y) => Math.abs(fn(x, y));
    let Ixy;
    let Iyx;
    let Iabs;
    let closed = NaN;
    if (b.kind === 'rect') {
      Ixy = integral2(fn, b.xa, b.xb, b.ya, b.yb, { order: 'xy', n: 64 });
      Iyx = integral2(fn, b.xa, b.xb, b.ya, b.yb, { order: 'yx', n: 64 });
      Iabs = integral2(afn, b.xa, b.xb, b.ya, b.yb, { order: 'xy', n: 64 });
      closed = closedRect(surf.id, b.xa, b.xb, b.ya, b.yb, p);
      state.xMin = b.xa;
      state.xMax = b.xb;
      state.yMin = b.ya;
      state.yMax = b.yb;
    } else if (b.kind === 'disk') {
      Ixy = integralTypeI(fn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      Iyx = integralTypeII(fn, b.typeII.ya, b.typeII.yb, b.typeII.xLo, b.typeII.xHi, { n: 80 });
      Iabs = integralTypeI(afn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      closed = closedDisk(surf.id, b.R, p);
      state.xMin = -b.R;
      state.xMax = b.R;
      state.yMin = -b.R;
      state.yMax = b.R;
      state.R = b.R;
    } else {
      Ixy = integralTypeI(fn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      Iyx = b.xLo ? integralTypeII(fn, b.ya, b.yb, b.xLo, b.xHi, { n: 80 }) : NaN;
      Iabs = integralTypeI(afn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      if (state.region === 'triangle') closed = closedTriangle(surf.id, p);
      state.xMin = b.xa;
      state.xMax = b.xb;
      state.yMin = b.yLo(b.xa);
      state.yMax = Math.max(b.yHi(b.xa), b.yHi(0.5 * (b.xa + b.xb)), b.yHi(b.xb));
    }

    let x = Number.isFinite(state.probe.x) ? state.probe.x : 0.5 * ((b.xa ?? 0) + (b.xb ?? 1));
    let y = Number.isFinite(state.probe.y) ? state.probe.y : 0.5 * ((b.ya ?? 0) + (b.yb ?? 1));
    x = Math.max(b.xa ?? state.xMin, Math.min(b.xb ?? state.xMax, x));
    if (b.ya != null) y = Math.max(b.ya, Math.min(b.yb, y));
    if (b.yLo && b.yHi) {
      const lo = b.yLo(x);
      const hi = b.yHi(x);
      if (hi > lo) y = Math.max(lo, Math.min(hi, y));
    }
    state.probe.x = x;
    state.probe.y = y;

    const yLo = b.yLo ? b.yLo(x) : state.yMin;
    const yHi = b.yHi ? b.yHi(x) : state.yMax;
    const xLo = b.xLo ? b.xLo(y) : state.xMin;
    const xHi = b.xHi ? b.xHi(y) : state.xMax;
    const innerY = yHi > yLo ? simpson((yy) => fn(x, yy), yLo, yHi) : 0;
    const innerX = xHi > xLo ? simpson((xx) => fn(xx, y), xLo, xHi) : 0;
    const fP = fn(x, y);

    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.bounds = b;
    computed.Ixy = Ixy;
    computed.Iyx = Iyx;
    computed.closed = closed;
    computed.innerY = innerY;
    computed.innerX = innerX;
    computed.yLo = yLo;
    computed.yHi = yHi;
    computed.xLo = xLo;
    computed.xHi = xHi;
    computed.f = fP;
    computed.order = order;
    const a = Number.isFinite(closed) ? closed : Ixy;
    computed.Iabs = Iabs;
    computed.agree = agree(Ixy, Iyx, Iabs) && (!Number.isFinite(closed) || agree(Ixy, closed, Iabs));
    computed.truth = a;

    const samples = 28;
    const xs = [];
    const ys = [];
    const outerLo = order === 'yx' ? (b.ya ?? state.yMin) : (b.xa ?? state.xMin);
    const outerHi = order === 'yx' ? (b.yb ?? state.yMax) : (b.xb ?? state.xMax);
    for (let i = 0; i < samples; i++) {
      const t = outerLo + ((outerHi - outerLo) * i) / (samples - 1);
      let A = 0;
      if (order === 'yx') {
        const lo = b.xLo ? b.xLo(t) : state.xMin;
        const hi = b.xHi ? b.xHi(t) : state.xMax;
        A = hi > lo ? compositeSimpson((xx) => fn(xx, t), lo, hi, 8) : 0;
      } else {
        const lo = b.yLo ? b.yLo(t) : state.yMin;
        const hi = b.yHi ? b.yHi(t) : state.yMax;
        A = hi > lo ? compositeSimpson((yy) => fn(t, yy), lo, hi, 8) : 0;
      }
      xs.push(t);
      ys.push(A);
    }
    computed.plotXs = xs;
    computed.plotYs = ys;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    const b = computed.bounds;
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: state.probe,
      fP: computed.f,
      show: show.surface !== false,
    });
    const xy = computed.order === 'xy';
    ctx.pool.slices().setVisible(!!show.slice);
    ctx.pool.slices().sync({
      f,
      probe: state.probe,
      fP: computed.f,
      fx: 0,
      fy: 0,
      xMin: xy ? state.probe.x : computed.xLo,
      xMax: xy ? state.probe.x : computed.xHi,
      yMin: xy ? computed.yLo : state.probe.y,
      yMax: xy ? computed.yHi : state.probe.y,
      showX: !xy,
      showY: xy,
      showTan: false,
    });
    ctx.pool.region().setVisible(!!show.region);
    ctx.pool.region().sync({
      kind: b.kind === 'disk' ? 'disk' : b.kind === 'typeI' ? 'typeI' : 'rect',
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      R: b.R,
      yLo: b.yLo,
      yHi: b.yHi,
      xa: b.xa,
      xb: b.xb,
      show: !!show.region,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, computed.f, 'P');
    ctx.pool.sliceArea().setVisible(!!show.slice);
    ctx.pool.sliceArea().sync({
      f,
      order: computed.order,
      x: state.probe.x,
      y: state.probe.y,
      xLo: computed.xLo,
      xHi: computed.xHi,
      yLo: computed.yLo,
      yHi: computed.yHi,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      show: !!show.slice,
    });
  },
  law(state, computed) {
    const b = computed?.bounds;
    const yx = state?.order === 'yx';
    const R = b?.R;
    let setup;
    if (b?.kind === 'disk') {
      const r = fmt(R);
      setup = yx
        ? `\\int_{-${r}}^{${r}}\\int_{-\\sqrt{${r}^{2}-y^{2}}}^{\\sqrt{${r}^{2}-y^{2}}} f\\,dx\\,dy`
        : `\\int_{-${r}}^{${r}}\\int_{-\\sqrt{${r}^{2}-x^{2}}}^{\\sqrt{${r}^{2}-x^{2}}} f\\,dy\\,dx`;
    } else if (state?.region === 'triangle') {
      setup = yx ? '\\int_{0}^{1}\\int_{0}^{1-y} f\\,dx\\,dy' : '\\int_{0}^{1}\\int_{0}^{1-x} f\\,dy\\,dx';
    } else if (state?.region === 'parabola') {
      setup = '\\int_{-1}^{1}\\int_{0}^{1-x^{2}} f\\,dy\\,dx';
    } else if (yx) {
      setup = `\\int_{${fmt(b?.ya ?? state.yMin)}}^{${fmt(b?.yb ?? state.yMax)}}\\int_{${fmt(b?.xa ?? state.xMin)}}^{${fmt(b?.xb ?? state.xMax)}} f\\,dx\\,dy`;
    } else {
      setup = `\\int_{${fmt(b?.xa ?? state.xMin)}}^{${fmt(b?.xb ?? state.xMax)}}\\int_{${fmt(b?.ya ?? state.yMin)}}^{${fmt(b?.yb ?? state.yMax)}} f\\,dy\\,dx`;
    }
    if (!computed) return [setup];
    const slice = yx
      ? `\\int_{${fmt(computed.xLo)}}^{${fmt(computed.xHi)}} f(x, ${fmt(state.probe.y)})\\,dx = ${fmt(computed.innerX)}`
      : `\\int_{${fmt(computed.yLo)}}^{${fmt(computed.yHi)}} f(${fmt(state.probe.x)}, y)\\,dy = ${fmt(computed.innerY)}`;
    return [slice, setup];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    const yx = Number.isFinite(computed.Iyx) ? `$${fmt(computed.Iyx)}$` : '—';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('inner $\\int f\\,dy$ at this $x$', `$${fmt(computed.innerY)}$`) +
      kv('inner $\\int f\\,dx$ at this $y$', `$${fmt(computed.innerX)}$`) +
      kv('$\\int\\int\\,dy\\,dx$', `$${fmt(computed.Ixy)}$`) +
      kv('$\\int\\int\\,dx\\,dy$', yx) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    const yx = computed.order === 'yx';
    const inner = yx ? computed.innerX : computed.innerY;
    return cells([
      [yx ? 'inner $dx$' : 'inner $dy$', `$${fmt(inner)}$`],
      ['$dy\\,dx$', `$${fmt(computed.Ixy)}$`],
      ['$dx\\,dy$', Number.isFinite(computed.Iyx) ? `$${fmt(computed.Iyx)}$` : '—'],
      ['closed', Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : '—'],
    ]);
  },
  coach(state, computed) {
    const yx = computed.order === 'yx';
    const where = yx ? `$y = ${fmt(state.probe.y)}$` : `$x = ${fmt(state.probe.x)}$`;
    const inner = yx ? computed.innerX : computed.innerY;
    const body = [];
    const region =
      computed.bounds.kind === 'disk'
        ? 'On the disk the inner limits are the two halves of the circle, so the gold strip changes length as you slide.'
        : computed.bounds.kind === 'typeI'
          ? 'On this region the inner limits are curves, so the strip runs from the lower curve to the upper curve.'
          : 'On a rectangle the inner limits are constant.';
    body.push(
      `The filled slice at ${where} is the inner integral, equal to $${fmt(inner)}$. ${inner < -1e-8 ? 'Blue is where $f$ is negative, so this strip subtracts.' : 'Gold is where $f$ is positive.'} ${region}`,
    );
    body.push(eq('\\iint_D f\\,dA = \\int A = \\int\\!\\left(\\int f\\right)'));
    body.push(
      `The plot is $A$, the inner integral as a function of the outer variable. The marker is this slice, and the gold fill up to the marker is how much of the outer integral you have accumulated. ${computed.agree ? 'Swapping the order gives the same $\\iint$.' : 'The two orders are still settling.'}`,
    );
    return { title: 'The inner integral is an area', body };
  },
  plot(state, computed) {
    if (!computed.plotXs) return null;
    const yx = computed.order === 'yx';
    return {
      type: 'accum',
      xs: computed.plotXs,
      ys: computed.plotYs,
      x: yx ? state.probe.y : state.probe.x,
      title: yx ? 'A(y)' : 'A(x)',
    };
  },
});
