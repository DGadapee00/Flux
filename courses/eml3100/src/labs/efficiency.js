import {
  compressionExit, expansionExit, gas, heatByCp, isentropicT, tFromH, toC, waterP, waterTP,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, dot, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a lower isentropic efficiency means a hotter exit and more entropy generated, for a
 * steam turbine, an air compressor and an air nozzle.
 */

const AIR = gas('air');
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

const SCENARIOS = [
  { id: 'turbine', name: 'Steam turbine', kind: 'turbine', T1: 673.15, p1: 3e6, p2: 500e3, eta: 0.85, V1: 0 },
  { id: 'compressor', name: 'Air compressor', kind: 'compressor', T1: 290, p1: 1e5, p2: 8e5, eta: 0.8, V1: 0 },
  { id: 'nozzle', name: 'Air nozzle', kind: 'nozzle', T1: 400, p1: 500e3, p2: 100e3, eta: 0.92, V1: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, kind: sc.kind, T1: sc.T1, p1: sc.p1, p2: sc.p2, eta: sc.eta, V1: sc.V1,
  });
}

export default defineLab({
  id: 'efficiency',
  exam: 'u5',
  title: 'Isentropic efficiency',
  hint: 'Lower efficiency means a hotter exit. The entropy generation is zero only when the efficiency is 1.',
  gapLimit: 2e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('turbine', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'eta', lo: state.kind === 'nozzle' ? 0.8 : 0.7, hi: 1 };
  },
  controls() {
    return `${slider('ef-eta', 'isentropic efficiency', 0.85, 0.7, 1, 0.01)}
      <p class="tiny">The turbine is steam at 3 MPa and 400 °C expanding to 500 kPa, still superheated. The compressor takes air at 290 K from 100 kPa to 800 kPa. The nozzle takes air at 400 K from 500 kPa to 100 kPa. Kinetic energy at the turbine and compressor inlets is neglected.</p>`;
  },
  bind(api) {
    bindSlider('ef-eta', (s, v) => { s.eta = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('ef-eta');
    if (el && document.activeElement !== el) el.value = String(state.eta);
  },
  compute(state) {
    const eta = Math.min(1, Math.max(state.eta, 0.65));
    if (state.kind === 'turbine') {
      const one = waterTP(state.T1, state.p1);
      const twoS = waterP(state.p2, 's', one.s);
      const h2 = expansionExit(one.h, twoS.h, eta);
      const two = waterP(state.p2, 'h', h2);
      const w = one.h - h2;
      return {
        kind: 'turbine', eta, T1: state.T1, T2: two.T, T2s: twoS.T,
        h1: one.h, h2, h2s: twoS.h, s1: one.s, s2: two.s,
        w, sgen: two.s - one.s, x2: two.x, V2: 0,
        gap: rel(w, eta * (one.h - twoS.h)) + rel(one.h, one.u + state.p1 * one.v),
      };
    }
    const T2s = isentropicT(AIR, state.T1, state.p1, state.p2);
    const h1 = AIR.h(state.T1);
    const h2s = AIR.h(T2s);
    const h2 = state.kind === 'compressor'
      ? compressionExit(h1, h2s, eta)
      : expansionExit(h1, h2s, eta);
    const T2 = tFromH(AIR, h2);
    const dh = Math.abs(h2 - h1);
    const integ = Math.abs(heatByCp(AIR, state.T1, T2, 80));
    const s1 = AIR.s(state.T1, state.p1);
    const s2 = AIR.s(T2, state.p2);
    const w = state.kind === 'compressor' ? h2 - h1 : h1 - h2;
    const V2 = state.kind === 'nozzle' ? Math.sqrt(Math.max(0, state.V1 ** 2 + 2 * (h1 - h2))) : 0;
    const ident = state.kind === 'compressor'
      ? rel(h2, h1 + (h2s - h1) / eta)
      : rel(h2, h1 - eta * (h1 - h2s));
    return {
      kind: state.kind, eta, T1: state.T1, T2, T2s,
      h1, h2, h2s, s1, s2, w, sgen: s2 - s1, x2: null, V2,
      gap: Math.max(rel(dh, integ), ident),
    };
  },
  draw(canvas, state, c) {
    const tLo = Math.min(toC(c.T1), toC(c.T2), toC(c.T2s)) - 20;
    const tHi = Math.max(toC(c.T1), toC(c.T2), toC(c.T2s)) + 30;
    const P = layout(canvas, { lo: 0, hi: 3 }, { lo: tLo, hi: tHi });
    axes(P, { xLabel: 'device', yLabel: 'T (°C)' });
    const bar = (x, t, color) => line(P, [[x, tLo], [x, t]], { color, width: 16 });
    bar(0.7, toC(c.T1), C.teal);
    bar(1.5, toC(c.T2s), C.gold);
    bar(2.3, toC(c.T2), C.yellow);
    note(P, 'in', 0.7, toC(c.T1), { dy: -8, align: 'center' });
    note(P, 'isen', 1.5, toC(c.T2s), { dy: -8, align: 'center', color: C.gold });
    note(P, 'actual', 2.3, toC(c.T2), { dy: -8, align: 'center', color: C.yellow });
    dot(P, 2.3, toC(c.T2), { color: C.yellow, r: 4 });
  },
  law: (state) => (state.kind === 'compressor'
    ? [String.raw`h_2 = h_1 + (h_{2s} - h_1)/\eta`, String.raw`s_\mathrm{gen} = s_2 - s_1`]
    : [String.raw`h_2 = h_1 - \eta(h_1 - h_{2s})`, String.raw`s_\mathrm{gen} = s_2 - s_1`]),
  liveRows(state, c) {
    return [
      kv('T2', `${fig(toC(c.T2))} °C`),
      kv('T2s', `${fig(toC(c.T2s))} °C`),
      kv('work or KE', `${fig(c.w / 1000)} kJ/kg`),
      kv('s_gen', `${fig(c.sgen)} J/(kg·K)`),
    ].join('');
  },
  readout(state, c) {
    const rows = [
      ['η', fig(c.eta)],
      ['T2', `${fig(toC(c.T2))} °C`],
      ['s_gen', fig(c.sgen)],
      [c.kind === 'nozzle' ? 'V2' : 'w', c.kind === 'nozzle' ? `${fig(c.V2)} m/s` : `${fig(c.w / 1000)} kJ/kg`],
    ];
    return cells(rows);
  },
  coach(state, c) {
    const hotter = c.T2 > c.T2s;
    return {
      title: hotter ? 'The real exit is hotter' : 'The real exit is cooler than the isentrope',
      body: String.raw`The isentropic exit would be ${fig(toC(c.T2s))} °C. At $\eta = ${fig(c.eta)}$ the actual exit is ${fig(toC(c.T2))} °C, and the fluid generates ${fig(c.sgen)} J/(kg·K). That generation is zero only at $\eta = 1$.`,
    };
  },
});
