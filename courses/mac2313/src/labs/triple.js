import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { riemann3 } from '../math/riemann.js';
import { integral3, integral2, compositeSimpson } from '../math/quadrature.js';
import { closedBox } from '../math/triple.js';
import { agreeTo } from '../math/agree.js';
import { boxCell, range3 } from '../math/terms.js';
import { TRIPLE_MAX_N } from '../scene/tripleBoxes.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { ensureAnim, plain, syncPlayButton } from './reveal.js';

/*
 * The yardstick is the integral of |f| over the same region — not the value of the integral, which
 * can cancel to near zero while both routes are wrong, and not a floor of 1, which made the
 * tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

function axisOf(state) {
  return state.outer === 'z' ? 'z' : state.outer === 'y' ? 'y' : 'x';
}

function sliceAt(fn, state, axis, at) {
  const { xMin: xa, xMax: xb, yMin: ya, yMax: yb, zMin: za, zMax: zb } = state;
  if (axis === 'z') return integral2((x, y) => fn(x, y, at), xa, xb, ya, yb, { n: 8 });
  if (axis === 'y') return integral2((x, z) => fn(x, at, z), xa, xb, za, zb, { n: 8 });
  return integral2((y, z) => fn(at, y, z), ya, yb, za, zb, { n: 8 });
}

export default defineLab({
  id: 'triple',
  exam: 'ch5',
  title: 'Triple',
  hint: 'Sweep the plane · arrows pick a cube',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.6, 7.0, 9.8), target: new THREE.Vector3(0.5, 0.5, 0.5) },
  keys: { r: 'reset', R: 'reset', ' ': 'sweep', ArrowRight: 'next', ArrowLeft: 'prev' },
  toggles: [{ key: 'boxes', label: 'Cubes' }],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.triple,
  defaultState() {
    return {
      scenarioId: 'one',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      n: 4,
      cell: 0,
      outer: 'x',
      sweep: 0.5,
      anim: { playing: false, i: 1e9, t: 0 },
      probe: { x: 0.5, y: 0.5, z: 0.5 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      zMin: 0,
      zMax: 1,
      show: { boxes: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n × n × n</span>
          <div class="slider-row">
            <input type="range" id="tr-n" min="2" max="${TRIPLE_MAX_N}" step="1" value="4" />
            <span class="mono val" id="tr-n-val">4</span>
          </div>
        </label>
        <label class="field">
          <span>Outer variable</span>
          <select id="tr-outer">
            <option value="x">x outer · slice dy dz</option>
            <option value="y">y outer · slice dx dz</option>
            <option value="z">z outer · slice dx dy</option>
          </select>
        </label>
        <label class="field">
          <span>Plane</span>
          <div class="slider-row">
            <input type="range" id="tr-sweep" min="0" max="1" step="0.01" value="0.5" />
            <span class="mono val" id="tr-sweep-val">0.50</span>
          </div>
        </label>
        <div class="seg">
          <button type="button" id="tr-play">Play</button>
          <button type="button" id="tr-step">Step</button>
        </div>
        <p class="tiny">Play sweeps the plane. Arrows pick a cube.</p>
      </div>`;
  },
  bind(api) {
    document.getElementById('tr-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('tr-outer').addEventListener('change', (e) => {
      const s = api.slice();
      s.outer = e.target.value;
      s.sweep = NaN;
      if (s.anim) s.anim.playing = false;
      api.bump();
    });
    document.getElementById('tr-sweep').addEventListener('input', (e) => {
      const s = api.slice();
      s.sweep = Number(e.target.value);
      if (s.anim) s.anim.playing = false;
      api.bump();
    });
    document.getElementById('tr-play').addEventListener('click', () => {
      const s = api.slice();
      ensureAnim(s);
      if (s.anim.playing) {
        s.anim.playing = false;
      } else {
        s.anim.playing = true;
        s.anim.i = 0;
        s.anim.t = 0;
      }
      api.bump(false);
    });
    document.getElementById('tr-step').addEventListener('click', () => {
      const s = api.slice();
      ensureAnim(s);
      s.anim.playing = false;
      const axis = axisOf(s);
      const lo = s[`${axis}Min`];
      const hi = s[`${axis}Max`];
      const step = (hi - lo) / 12;
      const next = (Number.isFinite(s.sweep) ? s.sweep : lo) + step;
      s.sweep = next > hi ? lo : next;
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('tr-n');
    if (!el) return;
    el.value = state.n;
    document.getElementById('tr-n-val').textContent = String(state.n);
    const outer = document.getElementById('tr-outer');
    if (outer) outer.value = axisOf(state);
    const axis = axisOf(state);
    const lo = state[`${axis}Min`];
    const hi = state[`${axis}Max`];
    const sw = document.getElementById('tr-sweep');
    sw.min = String(lo);
    sw.max = String(hi);
    sw.value = String(state.sweep);
    document.getElementById('tr-sweep-val').textContent = Number(state.sweep).toFixed(2);
    syncPlayButton('tr', state);
  },
  applyScenario(id, state) {
    applyData('triple', id, state);
    if (!state.n) state.n = 4;
    state.cell = 0;
    state.sweep = NaN;
    if (!state.outer) state.outer = 'x';
    ensureAnim(state);
    state.anim.playing = false;
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      Math.abs(state.zMin || 0),
      Math.abs(state.zMax || 1),
      1,
    );
  },
  onAction(action, state) {
    if (action !== 'next' && action !== 'prev') return false;
    if (state.anim) state.anim.playing = false;
    const n = Math.max(2, Math.min(TRIPLE_MAX_N, state.n | 0));
    const total = n * n * n;
    const dir = action === 'next' ? 1 : -1;
    state.cell = (((state.cell | 0) + dir) % total + total) % total;
    return true;
  },
  tick(dt, state) {
    const a = state.anim;
    if (!a?.playing) return false;
    const axis = axisOf(state);
    const lo = state[`${axis}Min`];
    const hi = state[`${axis}Max`];
    const span = Math.max(1e-6, hi - lo);
    if ((a.i | 0) === 0) {
      state.sweep = lo;
      a.i = 1;
      return true;
    }
    state.sweep = Math.min(hi, (Number.isFinite(state.sweep) ? state.sweep : lo) + (dt * span) / 3.2);
    if (state.sweep >= hi - 1e-4) {
      state.sweep = hi;
      a.playing = false;
      a.i = 1e9;
    }
    return true;
  },
  recompute(state, computed) {
    ensureAnim(state);
    const n = Math.max(2, Math.min(TRIPLE_MAX_N, state.n | 0));
    state.n = n;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const xa = state.xMin;
    const xb = state.xMax;
    const ya = state.yMin;
    const yb = state.yMax;
    const za = Number.isFinite(state.zMin) ? state.zMin : 0;
    const zb = Number.isFinite(state.zMax) ? state.zMax : 1;
    state.zMin = za;
    state.zMax = zb;
    const axis = axisOf(state);
    state.outer = axis;
    const lo = state[`${axis}Min`];
    const hi = state[`${axis}Max`];
    if (!Number.isFinite(state.sweep)) state.sweep = 0.5 * (lo + hi);
    state.sweep = Math.max(lo, Math.min(hi, state.sweep));
    const total = n * n * n;
    state.cell = ((state.cell | 0) % total + total) % total;
    const mid = riemann3(fn, xa, xb, ya, yb, za, zb, { n });
    const Ixyz = integral3(fn, xa, xb, ya, yb, za, zb, { order: 'xyz', n: 16 });
    const Izyx = integral3(fn, xa, xb, ya, yb, za, zb, { order: 'zyx', n: 16 });
    const Iabs = integral3((x, y, z) => Math.abs(fn(x, y, z)), xa, xb, ya, yb, za, zb, { order: 'xyz', n: 16 });
    const closed = closedBox(fld.id, xa, xb, ya, yb, za, zb);
    const truth = Number.isFinite(closed) ? closed : Ixyz;
    const cell = boxCell(xa, xb, ya, yb, za, zb, n, state.cell);
    const fv = fn(cell.x, cell.y, cell.z);
    const scale = range3(fn, xa, xb, ya, yb, za, zb, 4);
    const S = sliceAt(fn, state, axis, state.sweep);
    const samples = 18;
    const xs = [];
    const ys = [];
    for (let i = 0; i < samples; i++) {
      const t = lo + ((hi - lo) * i) / (samples - 1);
      xs.push(t);
      ys.push(sliceAt(fn, state, axis, t));
    }
    const accum =
      state.sweep <= lo + 1e-8
        ? 0
        : compositeSimpson((t) => sliceAt(fn, state, axis, t), lo, state.sweep, 8);
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.sum = mid.sum;
    computed.Ixyz = Ixyz;
    computed.Izyx = Izyx;
    computed.closed = closed;
    computed.n = n;
    computed.dV = mid.dx * mid.dy * mid.dz;
    computed.err = Math.abs(mid.sum - truth);
    computed.Iabs = Iabs;
    computed.agree = agree(Ixyz, Izyx, Iabs) && agree(Ixyz, truth, Iabs);
    computed.cell = cell;
    computed.fv = fv;
    computed.term = fv * cell.dV;
    computed.slice = S;
    computed.accum = accum;
    computed.axis = axis;
    computed.truth = truth;
    computed.flo = scale.lo;
    computed.fhi = scale.hi;
    computed.flat = scale.flat;
    computed.plotXs = xs;
    computed.plotYs = ys;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const fld = computed.fld;
    const p = state.params;
    const f = (x, y, z) => fld.f(x, y, z, p);
    ctx.pool.tripleBoxes().setVisible(!!show.boxes);
    ctx.pool.tripleBoxes().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      zMin: state.zMin,
      zMax: state.zMax,
      n: state.n,
      show: !!show.boxes,
      select: computed.cell.index,
      lo: computed.flo,
      hi: computed.fhi,
      sweep: { axis: computed.axis, at: state.sweep },
    });
  },
  law(state, computed) {
    const c = computed.cell;
    if (!c) return ['\\displaystyle\\iiint_B f\\,dV = \\lim \\sum f\\,\\Delta V'];
    const name = computed.axis;
    return [
      `f\\,\\Delta V = ${fmt(computed.term)}`,
      `S(${name}) = ${fmt(computed.slice)}`,
    ];
  },
  liveRows(state, computed) {
    const c = computed.cell;
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('cube $(i,j,k)$', `$(${c.i + 1}, ${c.j + 1}, ${c.k + 1})$`) +
      kv('centre', `$(${fmt(c.x)}, ${fmt(c.y)}, ${fmt(c.z)})$`) +
      kv('$f\\,\\Delta V$', `$${fmt(computed.term)}$`) +
      kv(`slice at $${computed.axis}$`, `$${fmt(computed.slice)}$`) +
      kv('accumulated', `$${fmt(computed.accum)}$`) +
      kv('$dz\\,dy\\,dx$', `$${fmt(computed.Ixyz)}$`) +
      kv('$dx\\,dy\\,dz$', `$${fmt(computed.Izyx)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['this cube', `$${fmt(computed.term)}$`],
      ['slice', `$${fmt(computed.slice)}$`],
      ['so far', `$${fmt(computed.accum)}$`],
      ['$\\iiint$', `$${fmt(computed.truth)}$`],
    ]);
  },
  legendLabels(state, computed) {
    if (computed.flat) {
      const v = plain(computed.flo);
      return { low: `f = ${v}`, high: `f = ${v}` };
    }
    return { low: plain(computed.flo), high: plain(computed.fhi) };
  },
  coach(state, computed) {
    const c = computed.cell;
    const body = [];
    body.push(
      `The gold plane is the slice at $${computed.axis} = ${fmt(state.sweep)}$. Everything on the near side of it has been accumulated; the pale cubes are still ahead of the plane. The white cage is cube $(${c.i + 1}, ${c.j + 1}, ${c.k + 1})$, and its term is $f$ at the centre times $\\Delta V = ${fmt(computed.term)}$.`,
    );
    body.push(eq('\\iiint_B f\\,dV = \\int S'));
    body.push(
      computed.flat
        ? 'Here $f$ is constant, so the colour is one value — the cubes are the partition, not a height.'
        : 'Colour is $f$ on a fixed scale, the same scale the legend states.',
    );
    return { title: 'A triple integral, one slice at a time', body };
  },
  plot(state, computed) {
    if (!computed.plotXs) return null;
    return {
      type: 'accum',
      xs: computed.plotXs,
      ys: computed.plotYs,
      x: state.sweep,
      title: `S(${computed.axis})`,
    };
  },
});
