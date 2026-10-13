import * as THREE from 'three';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, disposeTree } from '../scene/manim.js';
import { thruster, PROPELLANTS } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { fmtV, fmtI, fmtP, sciHTML } from '../ui/format.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: the gridded ion thruster (Ch 38–42). Gas is ionized in a chamber; the ions fall
 * through the potential difference between two grids and leave as a fast beam. Energy conservation
 * (qΔV = ½mv²) gives their speed, the beam current (I = dq/dt) how many leave each second, and the
 * momentum they carry away is the thrust. A neutralizer adds electrons to the beam so the craft does
 * not charge up.
 *
 * A side view, drawn as a schematic. Colours follow the scene palette: + grid and ions red, − grid
 * and electrons blue, E yellow, thrust pink. The particles move at a display speed that keeps their
 * ratio: a lighter ion at the same voltage visibly leaves faster.
 */
const SCENARIOS = [
  { id: 'nstar', name: 'Deep Space 1 / Dawn class: xenon, 1100 V, 1.76 A', gas: 'Xe', V: 1100, I: 1.76 },
  { id: 'next', name: 'Larger thruster: xenon, 1800 V, 3.52 A', gas: 'Xe', V: 1800, I: 3.52 },
  { id: 'krypton', name: 'Same beam, krypton instead of xenon', gas: 'Kr', V: 1100, I: 1.76 },
];

const GRID_A = -1.3; // screen grid (+), scene units
const GRID_B = -0.7; // accelerator grid (−)
const CH_X0 = -4.6; // back of the chamber
const EXIT_X = 6;
const N_IONS = 140;
const N_E = 36;




const rand = (a, b) => a + Math.random() * (b - a);
const kms = (v) => `${(v / 1000).toFixed(1)} km/s`;

export default defineLab({
  id: 'thruster',
  exam: 'e3',
  title: 'Ion thruster',
  hint: 'Raise the voltage: faster ions, more thrust per ion',
  orbit: false,
  camera: { pos: new THREE.Vector3(-0.2, 0.1, 23), target: new THREE.Vector3(-0.2, 0.1, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, ...sc, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const { name, ...sc } = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
  },
  controls() {
    const slider = (id, text, min, max, step) => `
          <label class="field">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="th-gas">
            ${Object.values(PROPELLANTS)
              .map((p) => `<button type="button" data-gas="${p.id}">${p.name}</button>`)
              .join('')}
          </div>
          ${slider('th-V', 'Grid voltage Δ<i>V</i>', 200, 3000, 50)}
          ${slider('th-I', 'Beam current <i>I</i>', 0.1, 5, 0.02)}
          <p class="tiny">Singly charged ions. The particles are slowed for display; their speeds keep the right ratio.</p>
        </div>`;
  },
  bind(api) {
    document.getElementById('th-gas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-gas]');
      if (!b) return;
      api.slice().gas = b.dataset.gas;
      api.bump();
    });
    const on = (id, f) =>
      document.getElementById(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('th-V', (s, v) => (s.V = v));
    on('th-I', (s, v) => (s.I = v));
  },
  syncControls(state) {
    document.querySelectorAll('#th-gas [data-gas]').forEach((b) => b.classList.toggle('active', b.dataset.gas === state.gas));
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('th-V', state.V, fmtV(state.V));
    set('th-I', state.I, fmtI(state.I));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ions = points(N_IONS, Q.pos, 7);
    const electrons = points(N_E, Q.neg, 5);
    group.add(ions, electrons);
    const P = Array.from({ length: N_IONS }, () => ({ x: rand(CH_X0 + 0.3, GRID_A - 0.2), y: rand(-1.2, 1.2), vy: 0, out: false }));
    const Ep = Array.from({ length: N_E }, () => ({ x: rand(0.4, EXIT_X), y: rand(-0.6, 0.6) }));
    group.visible = false;
    return { group, ions, electrons, P, Ep, scene: null, key: '', vDisp: 4 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.th = thruster(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.th;
    if (!h || !c) return;
    ctx.grid.visible = false;
    // Display speed of the beam: xenon at 1100 V is 4 units a second; the ratio to it is real.
    h.vDisp = Math.min(12.5, Math.max(1.2, (4 * c.v) / 40200));
    const key = JSON.stringify([state.gas, state.V, state.I]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The discharge chamber: a box open at the grids.
    const wall = [GRID_A, 1.6, 0, CH_X0, 1.6, 0, CH_X0, -1.6, 0, GRID_A, -1.6, 0];
    g.add(fatLine(wall, { color: M.grey, width: 3 }));
    g.add(label(`<span class="muted">${PROPELLANTS[state.gas].name} in, ionized</span>`, CH_X0 + 1.3, 1.25, 0.2));
    // The two grids: + (red) then − (blue), drawn dashed for their holes.
    g.add(fatLine([GRID_A, 1.6, 0, GRID_A, -1.6, 0], { color: Q.pos, width: 4, dashed: true, dashSize: 0.22, gapSize: 0.1 }));
    g.add(fatLine([GRID_B, 1.6, 0, GRID_B, -1.6, 0], { color: Q.neg, width: 4, dashed: true, dashSize: 0.22, gapSize: 0.1 }));
    g.add(label(`<span class="qV">Δ<i>V</i> = ${fmtV(state.V)}</span>`, (GRID_A + GRID_B) / 2, -2.05, 0));
    // E in the gap, from + to −.
    for (const y of [-1, 0, 1]) g.add(new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(GRID_A + 0.06, y, 0.05), GRID_B - GRID_A - 0.12, Q.E, 0.14, 0.12, 0.02));
    g.add(label(`<span style="color:var(--yellow,#F4D345)"><i>E</i> ≈ Δ<i>V</i>/<i>d</i></span>`, (GRID_A + GRID_B) / 2, 2.05, 0));
    // The neutralizer, below the exit, feeding electrons into the beam.
    const nz = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.3), new THREE.MeshBasicMaterial({ color: Q.neg, transparent: true, opacity: 0.7 }));
    nz.position.set(0.9, -2.1, 0);
    g.add(nz);
    g.add(label('<span style="color:var(--blue,#58C4DD)">neutralizer: e⁻ into the beam</span>', 2.6, -2.6, 0));
    // Thrust on the craft: backward, opposite the exhaust.
    const Tlen = 0.9 + 1.1 * Math.tanh(c.T / 0.12);
    g.add(new Arrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(CH_X0 - 0.1, 0, 0.05), Tlen, Q.F, 0.36, 0.3, 0.06));
    g.add(label(`<span style="color:var(--pink,#D147BD)">thrust ${si(c.T, 'N')}</span>`, CH_X0 - 0.2, -0.55, 0));
    g.add(label(`<span class="mono">ions leave at ${kms(c.v)}</span>`, 3.4, 1.55, 0));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.th;
    if (!h || !c) return;
    dt = Math.min(dt, 0.05);
    const pos = h.ions.geometry.attributes.position.array;
    // More beam current, more ions in flight: show a share of the pool in proportion.
    const shown = Math.max(20, Math.min(N_IONS, Math.round(N_IONS * Math.sqrt(state.I / 3.5))));
    // Draw only the ions in use: parking the rest off to one side would still project into view.
    h.ions.geometry.setDrawRange(0, shown);
    for (let i = 0; i < shown; i++) {
      const p = h.P[i];
      if (p.x < GRID_A) {
        // Inside the chamber: slow thermal drift toward the grids.
        p.x += dt * rand(0.1, 0.6);
        p.y += dt * rand(-0.5, 0.5);
        p.y = Math.max(-1.4, Math.min(1.4, p.y));
      } else if (p.x < GRID_B) {
        // In the gap: a constant force, so the speed builds from almost nothing to v.
        const f = (p.x - GRID_A) / (GRID_B - GRID_A);
        p.x += dt * (0.3 + h.vDisp * Math.sqrt(f + 0.02));
        p.y *= 0.97;
      } else {
        p.x += dt * h.vDisp;
        p.y += dt * p.y * 0.05;
      }
      if (p.x > EXIT_X) {
        p.x = rand(CH_X0 + 0.3, GRID_A - 0.4);
        p.y = rand(-1.3, 1.3);
      }
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = 0.1;
    }
    h.ions.geometry.attributes.position.needsUpdate = true;
    // Electrons rise from the neutralizer and ride out with the beam.
    const ep = h.electrons.geometry.attributes.position.array;
    for (let i = 0; i < N_E; i++) {
      const e = h.Ep[i];
      if (e.y < -0.7) {
        e.y += dt * 2.2;
        e.x += dt * 0.8;
      } else {
        e.x += dt * h.vDisp * 0.9;
        e.y += dt * rand(-0.8, 0.8);
      }
      if (e.x > EXIT_X) {
        e.x = rand(0.7, 1.1);
        e.y = -1.9;
      }
      ep[i * 3] = e.x;
      ep[i * 3 + 1] = Math.max(-1.95, Math.min(1.3, e.y));
      ep[i * 3 + 2] = 0.12;
    }
    h.electrons.geometry.attributes.position.needsUpdate = true;
  },
  law() {
    return [
      String.raw`q\,\Delta \qV = \tfrac12 m v^2 \;\Rightarrow\; v = \sqrt{\dfrac{2q\,\Delta \qV}{m}}`,
      String.raw`\dot m = \dfrac{\qI}{q}\,m \qquad T = \dot m\, v = \qI\sqrt{\dfrac{2m\,\Delta \qV}{q}}`,
      String.raw`\qP = \qI\,\Delta \qV`,
    ];
  },
  liveRows(state, computed) {
    const c = computed.th;
    if (!c) return '';
    return [
      kv('Energy per ion, $q\\,\\Delta V$', `${Math.round(state.V)} eV = ${sciHTML(c.KEion, 2)} J`),
      kv(tex(String.raw`v = \sqrt{2q\,\Delta\qV/m}`), kms(c.v)),
      kv(tex(String.raw`\qI/q`), `${sciHTML(c.ionsPerSec, 2)} ions/s`),
      kv(tex(String.raw`\dot m = \qI m/q`), `${si(c.mdot * 1e3, 'g')}/s`),
      kv(tex(String.raw`T = \dot m\,v`), qv('qF', si(c.T, 'N'))),
      kv(tex(String.raw`\qP = \qI\,\Delta\qV`), qv('qP', fmtP(c.P))),
      kv('Thrust per kilowatt', `${si(c.TperkW, 'N')}/kW`),
      kv('Propellant per day', `${(c.perDay * 1000).toFixed(0)} g`),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.th;
    if (!c) return '';
    return cells([
      [String.raw`Exhaust speed $v$`, kms(c.v), ''],
      [String.raw`Thrust $T$`, si(c.T, 'N'), 'qF'],
      [String.raw`Beam power $P$`, fmtP(c.P), 'qP'],
      [String.raw`Propellant a day`, `${(c.perDay * 1000).toFixed(0)} g`, ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.th;
    if (!c) return { title: '', body: '' };
    const grams = (c.T / 9.81) * 1000;
    const perSec = Math.round(Math.log10(c.ionsPerSec));
    return {
      title: `An ion thruster is $q\\Delta V = \\tfrac12 mv^2$, done about $10^{${perSec}}$ times a second`,
      body: [
        `Each ion falls through ${Math.round(state.V)} V and gains ${Math.round(state.V)} eV, all of it kinetic:`,
        eq(String.raw`v = \sqrt{\frac{2q\,\Delta V}{m}} = ${(c.v / 1000).toFixed(1)}\ \text{km/s}`),
        `The best chemical rockets' exhaust leaves at about 4.5 km/s. The beam current counts the ions: $I/q$ of them a second, carrying mass $\\dot m = Im/q$. The thrust is the momentum they take away each second, $\\dot m v$: ${si(c.T, 'N')}, the weight of about ${grams < 20 ? grams.toFixed(0) : Math.round(grams)} g. Small, but it runs for years on a few hundred kilograms of gas.`,
        '<b>What the course model leaves out.</b> In a real thruster the second grid sits a couple of hundred volts below the craft, so the beam’s electrons cannot stream back in. The ions pass it with extra energy and give that back as they leave. Only the net drop, from the chamber to the space behind the craft, sets their final energy: $\\Delta K = -q\\Delta V$ depends only on where they start and end. Making the ions costs energy too (a few hundred eV each), so the thruster draws more than $I\\,\\Delta V$, and about a tenth of the gas leaves un-ionized, adding mass flow but no thrust. The beam’s own charge limits how much current the grids can pull (the space-charge limit). Some ions are doubly charged. And without the neutralizer’s electrons, the craft would charge negative until it pulled its own ions back: charge is conserved.',
      ],
    };
  },
});
