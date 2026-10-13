import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { riemannPolar } from '../math/riemann.js';
import { closedDisk, diskTypeI } from '../math/double.js';
import { agreeTo } from '../math/agree.js';
import { integralPolar, integralTypeI } from '../math/quadrature.js';
import { polarCounts, polarCell, polarPartial, range2 } from '../math/terms.js';
import { RIEMANN_MAX_N } from '../scene/riemann.js';
import { M } from '../scene/manim.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { ensureAnim, shownCount, tickReveal, onTermAction, playControls, bindPlay, syncPlayButton, plain, showAll } from './reveal.js';
import { clickPicker } from './pick.js';

/*
 * The yardstick is the integral of |f| over the same region by the same integrator — not the value
 * of the integral, which can cancel to near zero while both routes are wrong, and not a floor of 1,
 * which made the tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

function gridOf(state) {
  const n = Math.max(3, Math.min(RIEMANN_MAX_N, state.n | 0));
  return polarCounts(n, RIEMANN_MAX_N);
}

/** Short tile, so the annular footprint is what you see rather than a tower of height f. */
function slab(h) {
  const mag = Math.min(0.22, Math.max(0.07, Math.abs(h) * 0.2));
  if (!Number.isFinite(h) || h >= 0) return { z0: 0, z1: mag };
  return { z0: -mag, z1: 0 };
}

function inset(cell) {
  const g = 0.1;
  return {
    r0: cell.r0 + g * cell.dr,
    r1: cell.r0 + cell.dr * (1 - 0.35 * g),
    th0: cell.th0 + g * cell.dth,
    th1: cell.th0 + cell.dth * (1 - g),
  };
}

export default defineLab({
  id: 'dpolar',
  exam: 'ch3',
  title: 'Polar',
  hint: 'One sector · $\\Delta A = r\\,\\Delta r\\,\\Delta\\theta$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(2.6, 2.15, 2.9), target: new THREE.Vector3(0.45, 0.1, 0.15) },
  keys: { r: 'reset', R: 'reset', ' ': 'sweep', ArrowRight: 'next', ArrowLeft: 'prev' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'boxes', label: 'Sectors' },
    { key: 'grid', label: 'Polar grid' },
    { key: 'region', label: 'Disk' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.dpolar,
  defaultState() {
    return {
      scenarioId: 'area',
      surfaceId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      n: 4,
      sample: 'mid',
      cell: 4 * 12,
      jacobian: true,
      partition: 'one',
      anim: { playing: false, i: 1e9, t: 0 },
      probe: { x: 0, y: 0, z: 0 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { surface: false, boxes: true, grid: true, region: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="dp-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="dp-R-val">1.00</span>
          </div>
        </label>
        <label class="field">
          <span>n (rings)</span>
          <div class="slider-row">
            <input type="range" id="dp-n" min="3" max="${RIEMANN_MAX_N}" step="1" value="4" />
            <span class="mono val" id="dp-n-val">4</span>
          </div>
        </label>
        <div class="seg">
          <button type="button" id="dp-one">One sector</button>
          <button type="button" id="dp-all">All cells</button>
        </div>
        <div class="seg">
          <button type="button" id="dp-jac">Include r</button>
        </div>
        ${playControls('dp')}
      </div>`;
  },
  bind(api) {
    document.getElementById('dp-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    document.getElementById('dp-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('dp-one').addEventListener('click', () => {
      api.slice().partition = 'one';
      api.bump();
    });
    document.getElementById('dp-all').addEventListener('click', () => {
      api.slice().partition = 'all';
      api.bump();
    });
    document.getElementById('dp-jac').addEventListener('click', () => {
      const s = api.slice();
      s.jacobian = s.jacobian === false;
      api.bump();
    });
    bindPlay('dp', api, (s) => gridOf(s).total);
  },
  syncControls(state) {
    const rEl = document.getElementById('dp-R');
    if (!rEl) return;
    rEl.value = state.R;
    document.getElementById('dp-R-val').textContent = Number(state.R).toFixed(2);
    document.getElementById('dp-n').value = state.n;
    document.getElementById('dp-n-val').textContent = String(state.n);
    document.getElementById('dp-one').classList.toggle('active', state.partition !== 'all');
    document.getElementById('dp-all').classList.toggle('active', state.partition === 'all');
    const jac = document.getElementById('dp-jac');
    jac.classList.toggle('active', state.jacobian !== false);
    jac.textContent = state.jacobian === false ? 'r dropped' : 'Include r';
    syncPlayButton('dp', state);
  },
  applyScenario(id, state) {
    applyData('dpolar', id, state);
    if (!state.n) state.n = 6;
    if (!Number.isFinite(state.R)) state.R = 1;
    const g = gridOf(state);
    state.cell = Math.max(0, (g.nr - 1) * g.nth);
    state.jacobian = true;
    state.partition = 'one';
    showAll(state);
  },
  extent(state) {
    return Math.max(state.R || 1, 1.2);
  },
  onAction(action, state) {
    return onTermAction(action, state, gridOf(state).total);
  },
  pointer: clickPicker((state, m, bump) => {
    const R = Math.max(0.2, state.R || 1);
    const r = Math.hypot(m.x, m.y);
    if (r > R + 1e-6) return;
    const g = gridOf(state);
    let th = Math.atan2(m.y, m.x);
    if (th < 0) th += 2 * Math.PI;
    const i = Math.min(g.nr - 1, Math.max(0, Math.floor((r / R) * g.nr)));
    const j = Math.min(g.nth - 1, Math.floor(th / ((2 * Math.PI) / g.nth)));
    state.cell = i * g.nth + j;
    showAll(state);
    bump();
  }),
  tick(dt, state) {
    return tickReveal(dt, state, gridOf(state).total, 0.06);
  },
  recompute(state, computed) {
    ensureAnim(state);
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    state.R = R;
    const n = Math.max(3, Math.min(RIEMANN_MAX_N, state.n | 0));
    state.n = n;
    const g = polarCounts(n, RIEMANN_MAX_N);
    const jac = state.jacobian !== false;
    state.jacobian = jac;
    if (state.partition !== 'all') state.partition = 'one';
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const polarF = (r, th) => fn(r * Math.cos(th), r * Math.sin(th));
    const Ipolar = integralPolar(polarF, 0, R, 0, 2 * Math.PI, { n: 80 });
    const Ibare = integralPolar(polarF, 0, R, 0, 2 * Math.PI, { n: 80, jacobian: false });
    const Iabs = integralPolar((r, th) => Math.abs(polarF(r, th)), 0, R, 0, 2 * Math.PI, { n: 80 });
    const d = diskTypeI(R);
    const Icart = integralTypeI(fn, d.xa, d.xb, d.yLo, d.yHi, { n: 80 });
    const rsum = riemannPolar(fn, R, { nr: g.nr, nth: g.nth, sample: 'mid' });
    const closed = closedDisk(surf.id, R, p);
    const truth = Number.isFinite(closed) ? closed : Ipolar;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    state.cell = ((state.cell | 0) % g.total + g.total) % g.total;
    const shown = shownCount(state, g.total);
    const cell = polarCell(R, g.nr, g.nth, shown <= 0 ? 0 : Math.min(state.cell, shown - 1), 'mid');
    const running = polarPartial(fn, R, g.nr, g.nth, 'mid', shown, { jacobian: jac });
    const fv = polarF(Math.max(cell.r, 0), cell.th);
    const scale = range2(fn, -R, R, -R, R, 8);
    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.R = R;
    computed.nr = g.nr;
    computed.nth = g.nth;
    computed.Ipolar = Ipolar;
    computed.Ibare = Ibare;
    computed.Icart = Icart;
    computed.rsum = rsum.sum;
    computed.running = running.sum;
    computed.shown = shown;
    computed.total = g.total;
    computed.closed = closed;
    computed.err = Math.abs(Ipolar - Icart);
    computed.Iabs = Iabs;
    computed.agree = agree(Ipolar, Icart, Iabs) && agree(Ipolar, truth, Iabs);
    computed.cell = cell;
    computed.fv = fv;
    computed.dA = jac ? cell.dA : cell.bare;
    computed.term = fv * computed.dA;
    computed.jacobian = jac;
    computed.partition = state.partition;
    computed.flo = scale.lo;
    computed.fhi = scale.hi;
    computed.flat = scale.flat;
    computed.truth = truth;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    const R = computed.R;
    const cell = computed.cell;
    const one = computed.partition !== 'all';
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: -R,
      xMax: R,
      yMin: -R,
      yMax: R,
      probe: { x: cell.r * Math.cos(cell.th), y: cell.r * Math.sin(cell.th) },
      fP: computed.fv,
      show: show.surface !== false,
      stem: false,
    });
    const showParts = !!show.boxes && !one;
    ctx.pool.riemann().setVisible(showParts);
    ctx.pool.riemann().sync({
      mode: 'polar',
      f,
      R,
      nr: computed.nr,
      nth: computed.nth,
      sample: 'mid',
      reveal: computed.shown,
      select: cell.index,
      lo: computed.flo,
      hi: computed.fhi,
      jacobian: computed.jacobian,
      show: showParts,
    });
    ctx.pool.polarGrid().setVisible(!!show.grid);
    ctx.pool.polarGrid().sync({ rMax: R, show: !!show.grid });
    ctx.pool.region().setVisible(!!show.region);
    ctx.pool.region().sync({ kind: 'disk', R, show: !!show.region });

    const drawOne = !!show.boxes && one;
    const wedges = [];
    const labels = [];
    if (drawOne) {
      const { z0, z1 } = slab(computed.fv);
      const box = inset(cell);
      const color = computed.fv < 0 ? M.blue : M.gold;
      if (computed.jacobian) {
        wedges.push({ ...box, z0, z1, color, opacity: 0.86, outline: true });
      } else {
        wedges.push({
          shape: 'rect',
          r: Math.max(cell.r, cell.dr * 0.5),
          th: cell.th,
          dr: cell.dr * 0.92,
          tang: cell.dth * 0.92,
          z0,
          z1,
          color,
          opacity: 0.86,
          outline: true,
        });
      }
      if (cell.i > 0) {
        const inner = polarCell(R, computed.nr, computed.nth, (cell.i - 1) * computed.nth + cell.j, 'mid');
        const ib = inset(inner);
        const ih = f(inner.r * Math.cos(inner.th), inner.r * Math.sin(inner.th));
        const iz = slab(ih);
        if (computed.jacobian) {
          wedges.push({ ...ib, z0: iz.z0, z1: iz.z1, color: M.teal, opacity: 0.45, outline: false });
        } else {
          wedges.push({
            shape: 'rect',
            r: Math.max(inner.r, inner.dr * 0.5),
            th: inner.th,
            dr: inner.dr * 0.92,
            tang: inner.dth * 0.92,
            z0: iz.z0,
            z1: iz.z1,
            color: M.teal,
            opacity: 0.45,
            outline: false,
          });
        }
        const ir = (ib.r0 + ib.r1) / 2;
        const ith = (ib.th0 + ib.th1) / 2;
        labels.push({
          text: `inner ${plain(computed.jacobian ? inner.dA : inner.bare)}`,
          x: (ib.r0 - 0.05) * Math.cos(ith),
          y: (ib.r0 - 0.05) * Math.sin(ith),
          z: 0.05,
        });
      }
      const midTh = (box.th0 + box.th1) / 2;
      const outR = box.r1 + 0.28;
      labels.push({
        text: `ΔA ${plain(computed.dA)}`,
        x: outR * Math.cos(midTh),
        y: outR * Math.sin(midTh),
        z: z1 + 0.2,
      });
    }
    ctx.pool.element().setVisible(drawOne);
    ctx.pool.element().sync({ show: drawOne, wedges, labels });
  },
  law(state, computed) {
    const c = computed?.cell;
    if (!c) {
      return ['\\int_0^R\\int_0^{2\\pi} f(r\\cos\\theta,\\, r\\sin\\theta)\\, r\\,d\\theta\\,dr'];
    }
    const factor = computed.jacobian ? 'r\\,\\Delta r\\,\\Delta\\theta' : '\\Delta r\\,\\Delta\\theta';
    return [
      `\\Delta A = ${factor} = ${fmt(computed.dA)}`,
      '\\iint_{D_R} f\\,dA = \\int_0^R\\!\\int_0^{2\\pi} f\\, r\\,dr\\,d\\theta',
    ];
  },
  liveRows(state, computed) {
    const c = computed.cell;
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    const partial = computed.shown < computed.total;
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('ring, $\\theta$ slot', `$${c.i + 1}$, $${c.j + 1}$`) +
      kv('$r^*$, $\\Delta r$, $\\Delta\\theta$', `$${fmt(c.r)}$, $${fmt(c.dr)}$, $${fmt(c.dth)}$`) +
      kv(computed.jacobian ? '$\\Delta A = r\\,\\Delta r\\,\\Delta\\theta$' : '$\\Delta A = \\Delta r\\,\\Delta\\theta$', `$${fmt(computed.dA)}$`) +
      kv('this term', `$${fmt(computed.term)}$`) +
      kv('polar $\\iint$ with $r$', `$${fmt(computed.Ipolar)}$`) +
      kv('without $r$', `$${fmt(computed.Ibare)}$`) +
      kv('Cartesian', `$${fmt(computed.Icart)}$`) +
      kv(partial ? 'sum so far' : 'polar Riemann', `$${fmt(partial ? computed.running : computed.rsum)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    const partial = computed.shown < computed.total;
    return cells([
      ['$\\Delta A$', `$${fmt(computed.dA)}$`],
      ['this term', `$${fmt(computed.term)}$`],
      [computed.jacobian ? 'with $r$' : 'without $r$', `$${fmt(computed.jacobian ? computed.Ipolar : computed.Ibare)}$`],
      [partial ? 'so far' : 'Cartesian', `$${fmt(partial ? computed.running : computed.Icart)}$`],
    ]);
  },
  legendLabels(state, computed) {
    if (computed.flat) return { low: `f = ${plain(computed.flo)}`, high: `f = ${plain(computed.fhi)}` };
    return { low: plain(computed.flo), high: plain(computed.fhi) };
  },
  coach(state, computed) {
    const c = computed.cell;
    const body = [];
    if (computed.jacobian) {
      body.push(
        `This sector sits at $r^* = ${fmt(c.r)}$. Its outer arc is $r\\,\\Delta\\theta = ${fmt(c.r * c.dth)}$, longer than the same $\\Delta\\theta$ on the inner ring. The area is $r\\,\\Delta r\\,\\Delta\\theta = ${fmt(c.dA)}$, and the term is $f$ times that.`,
      );
    } else {
      body.push(
        `The factor of $r$ is turned off. Every sector is drawn with tangential width $\\Delta\\theta$ instead of $r\\,\\Delta\\theta$, so the inner ring and the outer ring look the same size. The integral without $r$ is $${fmt(computed.Ibare)}$, and the Cartesian value is $${fmt(computed.Icart)}$.`,
      );
    }
    body.push(eq('\\iint_{D_R} f\\,dA = \\int_0^R\\int_0^{2\\pi} f(r\\cos\\theta, r\\sin\\theta)\\, r\\,d\\theta\\,dr'));
    body.push(
      computed.partition === 'all'
        ? 'All cells are the partition. Arrows and Play walk the sum; One sector puts the inner ring beside the one you are on.'
        : 'The teal piece is the matching sector one ring inward, same $\\Delta r$ and $\\Delta\\theta$. All cells draws the whole partition.',
    );
    return { title: 'Why the area element has an r', body };
  },
  plot: () => null,
});
