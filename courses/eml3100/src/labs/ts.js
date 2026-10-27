import {
  expansionExit, fromC, toC, waterP, waterTP,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the area under a reversible isobar on the T–s diagram is the heat, and that a real
 * adiabatic turbine leaves the steam to the right of the isentropic exit.
 */

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

const SCENARIOS = [
  { id: 'heat', name: 'Heat steam at constant pressure', mode: 'isobar', p: 500e3, T1: fromC(200), T2: fromC(400), p2: 10e3, eta: 1 },
  { id: 'isen', name: 'Isentropic expansion', mode: 'turbine', p: 3e6, T1: fromC(400), T2: fromC(400), p2: 10e3, eta: 1 },
  { id: 'real', name: 'A real turbine', mode: 'turbine', p: 3e6, T1: fromC(400), T2: fromC(400), p2: 10e3, eta: 0.85 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, mode: sc.mode, p: sc.p, T1: sc.T1, T2: sc.T2, p2: sc.p2, eta: sc.eta,
  });
}

function simpson(f, a, b, n = 40) {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** ∫ (∂h/∂T)_p dT/T along an isobar. Equals Δs when the path stays in one region. */
function isobarIntegral(p, T1, T2) {
  const lo = Math.min(T1, T2);
  const hi = Math.max(T1, T2);
  const f = (T) => {
    const d = 0.25;
    const hp = waterTP(T + d, p).h;
    const hm = waterTP(T - d, p).h;
    return ((hp - hm) / (2 * d)) / T;
  };
  const mag = simpson(f, lo, hi);
  return T2 >= T1 ? mag : -mag;
}

export default defineLab({
  id: 'ts',
  exam: 'u5',
  title: 'Temperature and entropy',
  hint: 'Heat at constant pressure is the area under the path. A real turbine ends to the right of the isentrope.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('heat', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.mode === 'isobar') return { key: 'T2', lo: fromC(250), hi: fromC(500) };
    return { key: 'eta', lo: 0.7, hi: 1 };
  },
  controls() {
    return `${slider('ts-T2', 'exit temperature (°C)', 400, 250, 500, 5)}
      ${slider('ts-eta', 'isentropic efficiency', 0.85, 0.7, 1, 0.01)}
      <p class="tiny">Steam properties are IAPWS-IF97. The heated steam is at 0.5 MPa. The turbine enters at 3 MPa and 400 °C and leaves at 10 kPa.</p>`;
  },
  bind(api) {
    bindSlider('ts-T2', (s, v) => { s.T2 = fromC(v); }, api);
    bindSlider('ts-eta', (s, v) => { s.eta = v; }, api);
  },
  syncControls(state) {
    showField('ts-T2', state.mode === 'isobar');
    showField('ts-eta', state.mode === 'turbine');
    const t = document.getElementById('ts-T2');
    if (t && document.activeElement !== t) t.value = String(Number(toC(state.T2).toPrecision(5)));
    const e = document.getElementById('ts-eta');
    if (e && document.activeElement !== e) e.value = String(state.eta);
  },
  compute(state) {
    if (state.mode === 'isobar') {
      const p = state.p;
      const T1 = Math.min(state.T1, state.T2 - 5);
      const T2 = Math.max(state.T2, T1 + 5);
      const one = waterTP(T1, p);
      const two = waterTP(T2, p);
      const ds = two.s - one.s;
      const integ = isobarIntegral(p, T1, T2);
      const q = two.h - one.h;
      return {
        mode: 'isobar', p, T1, T2,
        s1: one.s, s2: two.s, h1: one.h, h2: two.h, q, ds, integ,
        eta: 1, w: 0, sgen: 0, x2: two.x ?? 1,
        gap: Math.max(rel(integ, ds), rel(two.h, two.u + p * two.v)),
      };
    }
    const p1 = state.p;
    const p2 = state.p2;
    const T1 = state.T1;
    const eta = Math.min(Math.max(state.eta, 0.7), 1);
    const one = waterTP(T1, p1);
    const twoS = waterP(p2, 's', one.s);
    const h2 = expansionExit(one.h, twoS.h, eta);
    const two = waterP(p2, 'h', h2);
    const w = one.h - h2;
    const wCheck = eta * (one.h - twoS.h);
    const sgen = two.s - one.s;
    return {
      mode: 'turbine', p: p1, p2, T1, T2: two.T, T2s: twoS.T, eta,
      s1: one.s, s2: two.s, s2s: twoS.s, h1: one.h, h2, h2s: twoS.h,
      q: 0, ds: two.s - one.s, integ: 0, w, sgen, x2: two.x, x2s: twoS.x,
      gap: rel(w, wCheck) + rel(one.h, one.u + p1 * one.v) + (eta === 1 ? Math.abs(sgen) : 0),
    };
  },
  draw(canvas, state, c) {
    const sLo = Math.min(c.s1, c.s2) - 200;
    const sHi = Math.max(c.s1, c.s2, c.s2s || c.s2) + 200;
    const temps = [c.T1, c.T2, c.T2s].filter((t) => Number.isFinite(t)).map((t) => toC(t));
    const tLo = Math.min(...temps) - 30;
    const tHi = Math.max(...temps) + 40;
    const P = layout(canvas, { lo: sLo, hi: sHi }, { lo: tLo, hi: tHi });
    axes(P, { xLabel: 's (J/kg·K)', yLabel: 'T (°C)' });
    if (c.mode === 'turbine' && c.s2s != null) {
      line(P, [[c.s1, toC(c.T1)], [c.s2s, toC(c.T2s)]], { color: alpha(C.teal, 0.7), width: 3, dash: [4, 4] });
      // Temperature marks span the plot so a vertical isentrope is still visible on a phone.
      line(P, [[sLo + 40, toC(c.T1)], [sHi - 40, toC(c.T1)]], { color: alpha(C.gold, 0.85), width: 2 });
      line(P, [[sLo + 40, toC(c.T2)], [sHi - 40, toC(c.T2)]], { color: alpha(C.gold, 0.85), width: 2 });
    }
    line(P, [[c.s1, toC(c.T1)], [c.s2, toC(c.T2)]], { color: C.yellow, width: 4 });
    dot(P, c.s1, toC(c.T1), { color: C.teal, r: 4 });
    dot(P, c.s2, toC(c.T2), { color: C.gold, r: 4 });
    note(P, '1', c.s1, toC(c.T1), { dx: -12, dy: -6 });
    note(P, '2', c.s2, toC(c.T2), { dx: 8, dy: 12 });
  },
  law: (state) => (state.mode === 'isobar'
    ? [String.raw`q = \Delta h`, String.raw`\Delta s = \int dh/T`]
    : [String.raw`h_2 = h_1 - \eta(h_1 - h_{2s})`, String.raw`s_\mathrm{gen} = s_2 - s_1`]),
  liveRows(state, c) {
    if (c.mode === 'isobar') {
      return [
        kv('q = Δh', `${fig(c.q / 1000)} kJ/kg`),
        kv('Δs from the tables', fig(c.ds)),
        kv('∫ dh/T', fig(c.integ)),
      ].join('');
    }
    return [
      kv('work', `${fig(c.w / 1000)} kJ/kg`),
      kv('h2', `${fig(c.h2 / 1000)} kJ/kg`),
      kv('h2s', `${fig(c.h2s / 1000)} kJ/kg`),
      kv('s_gen', fig(c.sgen)),
      kv('exit quality', fig(c.x2)),
    ].join('');
  },
  readout(state, c) {
    if (c.mode === 'isobar') {
      return cells([
        ['q', `${fig(c.q / 1000)} kJ/kg`],
        ['Δs', fig(c.ds)],
        ['∫ dh/T', fig(c.integ)],
        ['T2', `${fig(toC(c.T2))} °C`],
      ]);
    }
    return cells([
      ['w', `${fig(c.w / 1000)} kJ/kg`],
      ['s_gen', fig(c.sgen)],
      ['x2', fig(c.x2)],
      ['η', fig(c.eta)],
    ]);
  },
  coach(state, c) {
    if (c.mode === 'isobar') {
      return {
        title: 'The area is the heat',
        body: String.raw`At constant pressure $q = \Delta h = ${fig(c.q / 1000)}$ kJ/kg. The entropy change from the tables and from $\int dh/T$ are the same number, ${fig(c.ds)} J/(kg·K).`,
      };
    }
    if (c.eta > 0.999) {
      return {
        title: 'Straight down',
        body: String.raw`The isentropic exit has the inlet entropy. The work is the whole enthalpy drop, ${fig(c.w / 1000)} kJ/kg, and $s_\mathrm{gen}$ is zero.`,
      };
    }
    return {
      title: 'To the right of the isentrope',
      body: String.raw`At $\eta = ${fig(c.eta)}$ the steam keeps ${fig((1 - c.eta) * 100)}$% of the isentropic enthalpy drop. The exit quality is ${fig(c.x2)}, above the isentropic quality ${fig(c.x2s)}, so the stream is drier. Entropy is still generated: $s_\mathrm{gen} = ${fig(c.sgen)}$ J/(kg·K).`,
    };
  },
});
