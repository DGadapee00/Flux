import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { integralCyl, integralCylCart } from '../math/quadrature.js';
import { closedCyl } from '../math/triple.js';
import { agreeTo } from '../math/agree.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { M } from '../scene/manim.js';
import { plain } from './reveal.js';

/*
 * The yardstick is the integral of |f| over the same region by the same integrator — not the value
 * of the integral, which can cancel to near zero while both routes are wrong, and not a floor of 1,
 * which made the tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

export default defineLab({
  id: 'cyl',
  exam: 'ch5',
  title: 'Cylindrical',
  hint: 'One wedge · $\\Delta V = r\\,\\Delta r\\,\\Delta\\theta\\,\\Delta z$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.0, 6.6, 9.2), target: new THREE.Vector3(0, 0.8, 0) },
  keys: { r: 'reset', R: 'reset', ArrowRight: 'next', ArrowLeft: 'prev' },
  toggles: [
    { key: 'solid', label: 'Solid' },
    { key: 'grid', label: 'Polar grid' },
  ],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.cyl,
  defaultState() {
    return {
      scenarioId: 'vol',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      z0: 0,
      z1: 1,
      ring: 2,
      slot: 0,
      jacobian: true,
      probe: { x: 0, y: 0, z: 0.5 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { solid: true, grid: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="cy-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="cy-R-val">1.00</span>
          </div>
        </label>
        <label class="field">
          <span>z₁</span>
          <div class="slider-row">
            <input type="range" id="cy-z1" min="0.4" max="2.5" step="0.01" value="1" />
            <span class="mono val" id="cy-z1-val">1.00</span>
          </div>
        </label>
        <div class="seg">
          <button type="button" id="cy-jac">Include r</button>
        </div>
        <p class="tiny">Arrows move the wedge around the cylinder.</p>
      </div>`;
  },
  bind(api) {
    document.getElementById('cy-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    document.getElementById('cy-z1').addEventListener('input', (e) => {
      api.slice().z1 = Number(e.target.value);
      api.bump();
    });
    document.getElementById('cy-jac').addEventListener('click', () => {
      const s = api.slice();
      s.jacobian = s.jacobian === false;
      api.bump();
    });
  },
  syncControls(state) {
    const rEl = document.getElementById('cy-R');
    if (!rEl) return;
    rEl.value = state.R;
    document.getElementById('cy-R-val').textContent = Number(state.R).toFixed(2);
    document.getElementById('cy-z1').value = state.z1;
    document.getElementById('cy-z1-val').textContent = Number(state.z1).toFixed(2);
    const jac = document.getElementById('cy-jac');
    if (jac) {
      jac.classList.toggle('active', state.jacobian !== false);
      jac.textContent = state.jacobian === false ? 'r dropped' : 'Include r';
    }
  },
  applyScenario(id, state) {
    applyData('cyl', id, state);
    if (!Number.isFinite(state.R)) state.R = 1;
    if (!Number.isFinite(state.z0)) state.z0 = 0;
    if (!Number.isFinite(state.z1)) state.z1 = 1;
    state.jacobian = true;
    state.ring = 2;
    state.slot = 0;
  },
  onAction(action, state) {
    if (action !== 'next' && action !== 'prev') return false;
    const nth = 6;
    const nr = 3;
    const dir = action === 'next' ? 1 : -1;
    let k = (state.ring | 0) * nth + (state.slot | 0) + dir;
    const total = nr * nth;
    k = ((k % total) + total) % total;
    state.ring = Math.floor(k / nth);
    state.slot = k - state.ring * nth;
    return true;
  },
  extent(state) {
    return Math.max(state.R || 1, Math.abs(state.z0 || 0), Math.abs(state.z1 || 1), 1.2);
  },
  recompute(state, computed) {
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    const z0 = Number.isFinite(state.z0) ? state.z0 : 0;
    const z1 = Math.max(z0 + 0.2, Number.isFinite(state.z1) ? state.z1 : 1);
    state.R = R;
    state.z0 = z0;
    state.z1 = z1;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const jac = state.jacobian !== false;
    state.jacobian = jac;
    const nr = 3;
    const nth = 6;
    state.ring = Math.max(0, Math.min(nr - 1, state.ring | 0));
    state.slot = Math.max(0, Math.min(nth - 1, state.slot | 0));
    const Icyl = integralCyl(fn, R, z0, z1, { n: 24 });
    const Ibare = integralCyl(fn, R, z0, z1, { n: 24, jacobian: false });
    const Iabs = integralCyl((x, y, z) => Math.abs(fn(x, y, z)), R, z0, z1, { n: 24 });
    const Icart = integralCylCart(fn, R, z0, z1, { n: 24 });
    const closed = closedCyl(fld.id, R, z0, z1);
    const truth = Number.isFinite(closed) ? closed : Icyl;
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.R = R;
    computed.z0 = z0;
    computed.z1 = z1;
    computed.Icyl = Icyl;
    computed.Ibare = Ibare;
    computed.Icart = Icart;
    computed.jacobian = jac;
    const dr = R / nr;
    const dth = (2 * Math.PI) / nth;
    const dz = Math.max(1e-3, (z1 - z0) * 0.72);
    const r0 = state.ring * dr;
    const rMid = r0 + 0.5 * dr;
    const th0 = state.slot * dth;
    const zA = z0 + 0.5 * ((z1 - z0) - dz);
    const sampleZ = zA + 0.5 * dz;
    const dV = (jac ? rMid : 1) * dr * dth * dz;
    computed.wedge = { r0, rMid, dr, th0, dth, zA, dz, dV, sampleZ };
    computed.fv = fn(rMid * Math.cos(th0 + 0.5 * dth), rMid * Math.sin(th0 + 0.5 * dth), sampleZ);
    computed.closed = closed;
    computed.err = Math.abs(Icyl - Icart);
    computed.Iabs = Iabs;
    computed.agree = agree(Icyl, Icart, Iabs) && agree(Icyl, truth, Iabs);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.solid().setVisible(!!show.solid);
    ctx.pool.solid().sync({
      kind: 'cyl',
      R: computed.R,
      z0: computed.z0,
      z1: computed.z1,
      show: !!show.solid,
    });
    ctx.pool.polarGrid().setVisible(!!show.grid);
    ctx.pool.polarGrid().sync({ rMax: computed.R, show: !!show.grid });
    const w = computed.wedge;
    const g = 0.08;
    const wedgeOf = (r0, color, opacity) => {
      if (computed.jacobian) {
        return {
          r0: r0 + g * w.dr,
          r1: r0 + w.dr * (1 - 0.3 * g),
          th0: w.th0 + g * w.dth,
          th1: w.th0 + w.dth * (1 - g),
          z0: w.zA,
          z1: w.zA + w.dz,
          color,
          opacity,
          outline: opacity > 0.6,
        };
      }
      return {
        shape: 'rect',
        r: r0 + 0.5 * w.dr,
        th: w.th0 + 0.5 * w.dth,
        dr: w.dr * 0.9,
        tang: w.dth * 0.9,
        z0: w.zA,
        z1: w.zA + w.dz,
        color,
        opacity,
        outline: opacity > 0.6,
      };
    };
    const wedges = [wedgeOf(w.r0, computed.fv < 0 ? M.blue : M.gold, 0.88)];
    if (state.ring > 0) wedges.push(wedgeOf(w.r0 - w.dr, M.teal, 0.4));
    const midTh = w.th0 + 0.5 * w.dth;
    const outR = w.r0 + w.dr + 0.28;
    const labels = [
      {
        text: `ΔV ${plain(w.dV)}`,
        x: outR * Math.cos(midTh),
        y: outR * Math.sin(midTh),
        z: w.zA + w.dz + 0.15,
      },
    ];
    ctx.pool.element().setVisible(true);
    ctx.pool.element().sync({ show: true, wedges, labels });
  },
  law(state, computed) {
    const w = computed?.wedge;
    if (!w) return ['\\int_{z_0}^{z_1}\\int_0^{2\\pi}\\int_0^R f\\, r\\,dr\\,d\\theta\\,dz'];
    const factor = computed.jacobian ? 'r\\,\\Delta r\\,\\Delta\\theta\\,\\Delta z' : '\\Delta r\\,\\Delta\\theta\\,\\Delta z';
    return [`\\Delta V = ${factor} = ${fmt(w.dV)}`, '\\iiint_C f\\,dV = \\int f\\, r\\,dr\\,d\\theta\\,dz'];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$R$', `$${fmt(computed.R)}$`) +
      kv('$z$', `$[${fmt(computed.z0)}, ${fmt(computed.z1)}]$`) +
      kv('$\\theta$', '$[0, 2\\pi)$') +
      kv('Jacobian', computed.jacobian ? '$r$' : 'dropped') +
      kv('$\\Delta V$', `$${fmt(computed.wedge.dV)}$`) +
      kv('this term', `$${fmt(computed.fv * computed.wedge.dV)}$`) +
      kv('cylindrical with $r$', `$${fmt(computed.Icyl)}$`) +
      kv('without $r$', `$${fmt(computed.Ibare)}$`) +
      kv('Cartesian iterated', `$${fmt(computed.Icart)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['$\\Delta V$', `$${fmt(computed.wedge.dV)}$`],
      ['with $r$', `$${fmt(computed.Icyl)}$`],
      ['without $r$', `$${fmt(computed.Ibare)}$`],
      ['Cartesian', `$${fmt(computed.Icart)}$`],
    ]);
  },
  coach(state, computed) {
    const w = computed.wedge;
    const body = [];
    body.push(
      computed.jacobian
        ? `The gold wedge has radial width $\\Delta r = ${fmt(w.dr)}$ and outer arc $r\\,\\Delta\\theta = ${fmt(w.rMid * w.dth)}$. Its volume is $r\\,\\Delta r\\,\\Delta\\theta\\,\\Delta z = ${fmt(w.dV)}$. The teal wedge is one ring inward, same $\\Delta r$, $\\Delta\\theta$, and $\\Delta z$, so it holds less.`
        : `With $r$ dropped, the tangential width is $\\Delta\\theta$ on every ring, so the inner wedge and the outer wedge are the same size. The integral falls from $${fmt(computed.Icyl)}$ to $${fmt(computed.Ibare)}$.`,
    );
    body.push(eq('\\Delta V = r\\,\\Delta r\\,\\Delta\\theta\\,\\Delta z'));
    body.push('The solid behind the wedge is the whole cylinder. Arrows walk the wedge around it.');
    return { title: 'The cylindrical volume element', body };
  },
  plot: () => null,
});
