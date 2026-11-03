import { closedEnergy, integratedBalance, seriesEfficiency } from '@flux/subjects/thermo/balances.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, fillUnder, layout, line } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that heat and work are both energy crossing the boundary, under one sign convention:
 * heat added and work done by the system are positive, so ΔE = Q − W. A second scene chains a
 * motor and a pump. The overall efficiency is the product of the two.
 *
 * The paddle scene matches the notes: 20 kJ of paddle work on the air and a 5 kJ heat leak,
 * with no heater. The heater scene and the 2.5 kW chain are lab choices.
 * Second method: integrate Q̇ − Ẇ over the duration, and divide fluid power by electric power.
 */

const KJ = 1000;

const SCENARIOS = [
  { id: 'paddle', name: 'Paddle and a heat leak', Qheater: 0, Qloss: 5, Won: 20, t: 60, electric: 2.5, etaM: 0.9, etaP: 0.8 },
  { id: 'heater', name: 'Heater, paddle and a leak', Qheater: 30, Qloss: 8, Won: 20, t: 120, electric: 2.5, etaM: 0.9, etaP: 0.8 },
  { id: 'chain', name: 'Motor and pump', Qheater: 0, Qloss: 5, Won: 20, t: 60, electric: 2.5, etaM: 0.9, etaP: 0.8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, sc, { scenarioId: sc.id });
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1);

function tankEnergy(state) {
  const Q = (state.Qheater - state.Qloss) * KJ;
  const W = -state.Won * KJ;
  const dU = closedEnergy({ Q, W });
  const byRate = integratedBalance({ Qdot: Q / state.t, Wdot: W / state.t, t: state.t });
  return { Q, W, dU, byRate };
}

const CONTROLS = [
  { id: 'bl-qh', key: 'Qheater', label: 'heater input (kJ)', lo: 0, hi: 80, step: 1, when: 'tank' },
  { id: 'bl-ql', key: 'Qloss', label: 'heat leak (kJ)', lo: 0, hi: 40, step: 1, when: 'tank' },
  { id: 'bl-w', key: 'Won', label: 'paddle work on the system (kJ)', lo: 0, hi: 60, step: 1, when: 'tank' },
  { id: 'bl-t', key: 't', label: 'duration (s)', lo: 10, hi: 300, step: 10, when: 'tank' },
  { id: 'bl-e', key: 'electric', label: 'electric power (kW)', lo: 0.5, hi: 8, step: 0.1, when: 'chain' },
  { id: 'bl-em', key: 'etaM', label: 'motor efficiency', lo: 0.5, hi: 0.98, step: 0.01, when: 'chain' },
  { id: 'bl-ep', key: 'etaP', label: 'pump efficiency', lo: 0.5, hi: 0.98, step: 0.01, when: 'chain' },
];

export default defineLab({
  id: 'balance',
  exam: 'u2',
  title: 'Energy balance',
  hint: 'Heat in and work on the system both raise the stored energy. Work done by the system is the positive work in Q − W = ΔE.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('paddle', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'chain') return { key: 'etaP', lo: 0.5, hi: 0.98 };
    if (state.scenarioId === 'heater') return { key: 'Won', lo: 0, hi: 60 };
    return { key: 'Qloss', lo: 0, hi: 40 };
  },
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Heat added to the system is positive. Work done by the system is positive, so paddle work on the air is negative. The 20 kJ paddle and 5 kJ leak match the notes. The heater inputs and the 2.5 kW chain are assumed.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = v; }, api);
  },
  syncControls(state) {
    const chain = state.scenarioId === 'chain';
    for (const c of CONTROLS) {
      showField(c.id, chain ? c.when === 'chain' : c.when === 'tank');
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      el.value = String(state[c.key]);
    }
  },
  compute(state) {
    if (state.scenarioId === 'chain') {
      const electric = state.electric * KJ;
      const overall = seriesEfficiency([state.etaM, state.etaP]);
      const shaft = state.etaM * electric;
      const fluid = state.etaP * shaft;
      return {
        mode: 'chain',
        overall,
        shaft,
        fluid,
        electric,
        dU: fluid,
        Q: 0,
        W: 0,
        gap: rel(fluid / electric, overall),
      };
    }
    const e = tankEnergy(state);
    return {
      mode: 'tank',
      ...e,
      overall: 0,
      shaft: 0,
      fluid: 0,
      electric: 0,
      gap: rel(e.byRate, e.dU),
    };
  },
  draw(canvas, state, c) {
    const samples = [];
    if (c.mode === 'chain') {
      for (let i = 0; i <= 40; i++) {
        const eta = 0.5 + (0.48 * i) / 40;
        samples.push([eta, (eta * state.etaP * state.electric)]);
      }
      const P = layout(canvas, { lo: 0.5, hi: 0.98 }, { lo: 0, hi: Math.max(...samples.map((pt) => pt[1]), c.fluid / KJ) * 1.15 });
      axes(P, { xLabel: 'motor efficiency', yLabel: 'fluid power (kW)' });
      fillUnder(P, samples, alpha(C.teal, 0.2));
      line(P, samples, { color: C.teal, width: 3 });
      dot(P, state.etaM, c.fluid / KJ, { color: C.yellow, r: 5 });
      return;
    }
    const loss = state.Qloss;
    const won = state.Won;
    for (let i = 0; i <= 40; i++) {
      const qh = (80 * i) / 40;
      samples.push([qh, qh - loss + won]);
    }
    const ys = samples.map((pt) => pt[1]);
    const lo = Math.min(0, ...ys, c.dU / KJ);
    const hi = Math.max(1, ...ys, c.dU / KJ);
    const P = layout(canvas, { lo: 0, hi: 80 }, { lo: lo - 0.08 * (hi - lo), hi: hi + 0.12 * (hi - lo) });
    axes(P, { xLabel: 'heater (kJ)', yLabel: 'stored (kJ)' });
    fillUnder(P, samples, alpha(C.teal, 0.18));
    line(P, samples, { color: C.teal, width: 3 });
    dot(P, state.Qheater, c.dU / KJ, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`Q - W = \Delta E`, String.raw`\eta = \eta_1\eta_2`],
  liveRows(state, c) {
    if (c.mode === 'chain') {
      return [
        kv('overall efficiency', fig(c.overall)),
        kv('shaft power', `${fig(c.shaft / KJ)} kW`),
        kv('fluid power', `${fig(c.fluid / KJ)} kW`),
        kv('electric power', `${fig(c.electric / KJ)} kW`),
      ].join('');
    }
    return [
      kv('heat into the system', `${fig(c.Q / KJ)} kJ`),
      kv('work by the system', `${fig(c.W / KJ)} kJ`),
      kv('stored energy', `${fig(c.dU / KJ)} kJ`),
      kv('duration', `${fig(state.t)} s`),
    ].join('');
  },
  readout(state, c) {
    if (c.mode === 'chain') {
      return cells([
        ['overall', fig(c.overall)],
        ['fluid', `${fig(c.fluid / KJ)} kW`],
        ['shaft', `${fig(c.shaft / KJ)} kW`],
        ['electric', `${fig(state.electric)} kW`],
      ]);
    }
    return cells([
      ['stored', `${fig(c.dU / KJ)} kJ`],
      ['Q', `${fig(c.Q / KJ)} kJ`],
      ['W', `${fig(c.W / KJ)} kJ`],
      ['time', `${fig(state.t)} s`],
    ]);
  },
  coach(state, c) {
    if (c.mode === 'chain') {
      return {
        title: 'The product, not the sum',
        body: `The motor turns ${fig(state.etaM * 100)}% of the electric power into shaft power. The pump turns ${fig(state.etaP * 100)}% of that shaft power into fluid power. The overall efficiency is ${fig(c.overall)}, and the fluid power is ${fig(c.fluid / KJ)} kW. Adding the efficiencies would count the shaft power twice.`,
      };
    }
    const stored = fig(c.dU / KJ);
    return {
      title: 'One balance, two crossings',
      body: `The heater adds ${fig(state.Qheater)} kJ. The leak removes ${fig(state.Qloss)} kJ. The paddle does ${fig(state.Won)} kJ of work on the air, so the work done by the system is ${fig(c.W / KJ)} kJ. Then Q − W = ${stored} kJ. Integrating the same rates over ${fig(state.t)} s stores the same energy.`,
    };
  },
});