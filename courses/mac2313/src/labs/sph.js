import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { integralSph, integralSphCart } from '../math/quadrature.js';
import { closedBall } from '../math/triple.js';
import { agreeTo } from '../math/agree.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { sphMath, sphVolume } from '../math/terms.js';
import { M } from '../scene/manim.js';
import { plain } from './reveal.js';

/*
 * The yardstick is the integral of |f| over the same region by the same integrator — not the value
 * of the integral, which can cancel to near zero while both routes are wrong, and not a floor of 1,
 * which made the tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

export default defineLab({
  id: 'sph',
  exam: 'ch5',
  title: 'Spherical',
  hint: 'Equator cell vs pole cell · $\\rho^2\\sin\\varphi$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(7.8, 6.2, 8.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [{ key: 'solid', label: 'Solid' }],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.sph,
  defaultState() {
    return {
      scenarioId: 'vol',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      sinPhi: true,
      probe: { x: 0, y: 0, z: 0 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { solid: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="sp5-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="sp5-R-val">1.00</span>
          </div>
        </label>
        <div class="seg">
          <button type="button" id="sp-sin">Include sin φ</button>
        </div>
      </div>`;
  },
  bind(api) {
    document.getElementById('sp5-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    document.getElementById('sp-sin').addEventListener('click', () => {
      const s = api.slice();
      s.sinPhi = s.sinPhi === false;
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('sp5-R');
    if (!el) return;
    el.value = state.R;
    document.getElementById('sp5-R-val').textContent = Number(state.R).toFixed(2);
    const btn = document.getElementById('sp-sin');
    if (btn) {
      btn.classList.toggle('active', state.sinPhi !== false);
      btn.textContent = state.sinPhi === false ? 'sin φ dropped' : 'Include sin φ';
    }
  },
  applyScenario(id, state) {
    applyData('sph', id, state);
    if (!Number.isFinite(state.R)) state.R = 1;
    state.sinPhi = true;
  },
  extent(state) {
    return Math.max(state.R || 1, 1.2);
  },
  recompute(state, computed) {
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    state.R = R;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const useSin = state.sinPhi !== false;
    state.sinPhi = useSin;
    const Isph = integralSph(fn, R, { n: 24 });
    const Ibare = integralSph(fn, R, { n: 32, sinPhi: false });
    const Iabs = integralSph((x, y, z) => Math.abs(fn(x, y, z)), R, { n: 24 });
    const Icart = integralSphCart(fn, R, { n: 20 });
    const closed = closedBall(fld.id, R);
    const truth = Number.isFinite(closed) ? closed : Isph;
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.R = R;
    computed.Isph = Isph;
    computed.Ibare = Ibare;
    computed.sinPhi = useSin;
    computed.Icart = Icart;
    const dRho = 0.42 * R;
    const dPhi = 0.62;
    const dTh = 0.85;
    const rho0 = 0.4 * R;
    const rho = rho0 + 0.5 * dRho;
    const cells = [
      { name: 'equator', phi0: Math.PI / 2 - dPhi / 2, thCenter: 0.15, color: M.gold },
      { name: 'pole', phi0: 0.05, thCenter: 2.6, color: M.teal },
    ].map((c) => {
      const phi = c.phi0 + 0.5 * dPhi;
      const drawn = useSin ? dTh : Math.min(1.35, dTh / Math.max(0.2, Math.sin(phi)));
      const th0 = c.thCenter - 0.5 * drawn;
      return {
        ...c,
        rho0,
        rho1: rho0 + dRho,
        phi0: c.phi0,
        phi1: c.phi0 + dPhi,
        th0,
        th1: th0 + drawn,
        dV: sphVolume(rho, phi, dRho, dPhi, dTh, { sinPhi: useSin }),
        at: sphMath(rho, phi, th0 + 0.5 * drawn),
      };
    });
    computed.cells = cells;
    computed.closed = closed;
    computed.err = Math.abs(Isph - Icart);
    computed.Iabs = Iabs;
    computed.agree = agree(Isph, Icart, Iabs) && agree(Isph, truth, Iabs);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.solid().setVisible(!!show.solid);
    ctx.pool.solid().sync({
      kind: 'sph',
      R: computed.R,
      show: !!show.solid,
    });
    const spheres = (computed.cells || []).map((c) => ({
      rho0: c.rho0,
      rho1: c.rho1,
      phi0: c.phi0,
      phi1: c.phi1,
      th0: c.th0,
      th1: c.th1,
      color: c.color,
      opacity: 0.88,
    }));
    const labels = (computed.cells || []).map((c) => {
      const lift = c.name === 'pole' ? 0.35 : 0.05;
      const scale = 1.35;
      return {
        text: `${c.name} ${plain(c.dV)}`,
        x: c.at.x * scale,
        y: c.at.y * scale,
        z: c.at.z + lift,
      };
    });
    ctx.pool.element().setVisible(true);
    ctx.pool.element().sync({ show: true, spheres, labels });
  },
  law(state, computed) {
    const eqc = computed?.cells?.[0];
    const pole = computed?.cells?.[1];
    if (!eqc) return ['\\int_0^{2\\pi}\\int_0^{\\pi}\\int_0^R f\\,\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta'];
    return [
      `\\Delta V_{eq} = ${fmt(eqc.dV)},\\quad \\Delta V_{pole} = ${fmt(pole.dV)}`,
      '\\iiint f\\,\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta',
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$R$', `$${fmt(computed.R)}$`) +
      kv('$\\rho$', `$[0, ${fmt(computed.R)}]$`) +
      kv('$\\varphi$ from $+z$', '$[0,\\pi]$') +
      kv('$\\theta$', '$[0, 2\\pi)$') +
      kv('Jacobian', computed.sinPhi ? '$\\rho^2\\sin\\varphi$' : '$\\rho^2$ only') +
      kv('equator $\\Delta V$', `$${fmt(computed.cells[0].dV)}$`) +
      kv('pole $\\Delta V$', `$${fmt(computed.cells[1].dV)}$`) +
      kv('spherical with $\\sin\\varphi$', `$${fmt(computed.Isph)}$`) +
      kv('without $\\sin\\varphi$', `$${fmt(computed.Ibare)}$`) +
      kv('Cartesian iterated', `$${fmt(computed.Icart)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['equator', `$${fmt(computed.cells[0].dV)}$`],
      ['pole', `$${fmt(computed.cells[1].dV)}$`],
      [computed.sinPhi ? 'with $\\sin\\varphi$' : 'no $\\sin\\varphi$', `$${fmt(computed.sinPhi ? computed.Isph : computed.Ibare)}$`],
      ['Cartesian', `$${fmt(computed.Icart)}$`],
    ]);
  },
  coach(state, computed) {
    const eqc = computed.cells[0];
    const pole = computed.cells[1];
    const body = [];
    body.push(
      computed.sinPhi
        ? `Both cells use the same $\\Delta\\rho$, $\\Delta\\varphi$, and $\\Delta\\theta$. The gold one sits at the equator, where $\\sin\\varphi = 1$. The teal one sits near the positive $z$-axis, where $\\sin\\varphi$ is small, so its $\\theta$-arc is shorter and $\\Delta V = ${fmt(pole.dV)}$ against the equator’s $${fmt(eqc.dV)}$.`
        : `Sin $\\varphi$ is off, so both cells are given the equatorial $\\theta$-width. The pole cell puffs out and the two volumes match ($${fmt(eqc.dV)}$). The integral of the ball moves from $${fmt(computed.Isph)}$ to $${fmt(computed.Ibare)}$.`,
    );
    body.push(eq('\\Delta V = \\rho^2\\sin\\varphi\\,\\Delta\\rho\\,\\Delta\\varphi\\,\\Delta\\theta'));
    body.push('$\\varphi$ is the angle from the positive $z$-axis, so $\\varphi\\in[0,\\pi]$. $\\theta$ is the usual polar angle in the $xy$-plane.');
    return { title: 'Why the volume element has sin φ', body };
  },
  plot: () => null,
});
