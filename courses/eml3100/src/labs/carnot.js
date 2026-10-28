import {
  brayton, braytonColdAir, carnotEfficiency, carnotWorkIntegral, copHeatPump, copRefrigerator, fromC, gas, heatByCp, toC,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, fillUnder, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that a reversible engine's limit depends only on the two temperatures in kelvin, that a
 * ratio written in Celsius is a different number, and that a Brayton gas turbine rises with
 * pressure ratio but stays under the Carnot limit between its coldest and hottest temperatures.
 */

const AIR = gas('air');
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

const SCENARIOS = [
  { id: 'engine', name: 'Carnot engine', mode: 'engine', TL: fromC(30), TH: fromC(550), T1: fromC(15), rp: 12, T3: fromC(1200), p1: 1e5 },
  { id: 'fridge', name: 'Carnot refrigerator', mode: 'fridge', TL: fromC(-18), TH: fromC(22), T1: fromC(15), rp: 12, T3: fromC(1200), p1: 1e5 },
  { id: 'brayton', name: 'Brayton gas turbine', mode: 'brayton', TL: fromC(15), TH: fromC(1200), T1: fromC(15), rp: 12, T3: fromC(1200), p1: 1e5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id,
    mode: sc.mode,
    TL: sc.TL,
    TH: sc.TH,
    T1: sc.T1,
    rp: sc.rp,
    T3: sc.T3,
    p1: sc.p1,
    v1: 0.5,
    v2: 1,
    m: 1,
  });
}

function clampReservoirs(state) {
  let TL = Math.min(Math.max(state.TL, 230), 400);
  let TH = Math.min(Math.max(state.TH, TL + 8), 1400);
  if (!(TH > TL)) TH = TL + 8;
  return { TL, TH };
}

const CONTROLS = [
  { id: 'cy-TH', key: 'TH', label: 'hot temperature (°C)', lo: 40, hi: 1100, step: 5, c: true, modes: ['engine', 'fridge'] },
  { id: 'cy-TL', key: 'TL', label: 'cold temperature (°C)', lo: -30, hi: 80, step: 1, c: true, modes: ['engine', 'fridge'] },
  { id: 'cy-rp', key: 'rp', label: 'pressure ratio', lo: 4, hi: 20, step: 0.5, modes: ['brayton'] },
  { id: 'cy-T3', key: 'T3', label: 'turbine inlet (°C)', lo: 800, hi: 1400, step: 10, c: true, modes: ['brayton'] },
];

export default defineLab({
  id: 'carnot',
  exam: 'u4',
  title: 'Carnot and Brayton',
  hint: 'The limit is a ratio of absolute temperatures. A Celsius ratio is a different number, and a gas turbine does not cross the limit.',
  gapLimit: 2e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('engine', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.mode === 'brayton') return { key: 'rp', lo: 4, hi: 20 };
    if (state.mode === 'fridge') return { key: 'TH', lo: state.TL + 12, hi: state.TL + 90 };
    return { key: 'TH', lo: state.TL + 40, hi: 1200 };
  },
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Air from the NASA polynomials. The Brayton inlet is 15 °C and 100 kPa, an assumed sea-level day. The reservoir temperatures are chosen so the limits are easy to read.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) {
      bindSlider(c.id, (s, v) => { s[c.key] = c.c ? fromC(v) : v; }, api);
    }
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, c.modes.includes(state.mode));
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      const raw = c.c ? toC(state[c.key]) : state[c.key];
      el.value = String(Number(raw.toPrecision(5)));
    }
  },
  compute(state) {
    const { TL, TH } = clampReservoirs(state);
    const eta = carnotEfficiency(TL, TH);
    const copR = copRefrigerator(TL, TH);
    const copHP = copHeatPump(TL, TH);
    const tL = toC(TL);
    const tH = toC(TH);
    const etaC = tH === 0 ? NaN : 1 - tL / tH;
    const m = Math.min(Math.max(state.m || 1, 0.01), 50);
    const v1 = Math.min(state.v1, state.v2 * 0.99);
    const v2 = Math.max(state.v2, v1 * 1.01);
    const integrated = carnotWorkIntegral(AIR, { TH, TL, v1, v2 }, 32);
    const cyc = integrated.cycle;
    const rp = Math.min(Math.max(state.rp, 2), 30);
    const T1 = Math.min(Math.max(state.T1, 250), 320);
    const T3 = Math.min(Math.max(state.T3, 900), 1900);
    const b = brayton(AIR, { T1, p1: state.p1, rp, T3 });
    const k = AIR.gamma(T1);
    const cold = braytonColdAir(rp, k);
    const qinInt = heatByCp(AIR, b.T2, b.T3, 80);
    const gaps = [
      rel(cyc.eta, eta),
      rel(integrated.wNet, cyc.wNet),
      Math.abs(copHP - copR - 1),
      rel(b.qin, qinInt),
      rel(b.wnet, b.qin - b.qout),
    ];
    return {
      mode: state.mode,
      TL,
      TH,
      eta,
      copR,
      copHP,
      etaC,
      m,
      qH: m * cyc.qH,
      qL: m * cyc.qL,
      wNet: m * cyc.wNet,
      wInt: m * integrated.wNet,
      v1,
      v2,
      T1: b.T1,
      T2: b.T2,
      T3: b.T3,
      T4: b.T4,
      rp,
      etaB: b.eta,
      wB: b.wnet,
      qin: b.qin,
      qout: b.qout,
      cold,
      k,
      s1: AIR.s(b.T1, state.p1),
      s2: AIR.s(b.T2, state.p1 * rp),
      s3: AIR.s(b.T3, state.p1 * rp),
      s4: AIR.s(b.T4, state.p1),
      gap: Math.max(...gaps),
    };
  },
  draw(canvas, state, c) {
    if (state.mode === 'brayton') {
      const sLo = Math.min(c.s1, c.s4) - 50;
      const sHi = Math.max(c.s3, c.s2) + 80;
      const P = layout(canvas, { lo: sLo, hi: sHi }, { lo: toC(c.T1) - 40, hi: toC(c.T3) + 80 });
      axes(P, { xLabel: 's (J/kg·K)', yLabel: 'T (°C)' });
      const pts = [[c.s1, toC(c.T1)], [c.s2, toC(c.T2)], [c.s3, toC(c.T3)], [c.s4, toC(c.T4)], [c.s1, toC(c.T1)]];
      line(P, pts, { color: C.yellow, width: 2.5 });
      pts.slice(0, 4).forEach((p, i) => dot(P, p[0], p[1], { color: i % 2 ? C.gold : C.teal, r: 4 }));
      note(P, '1', c.s1, toC(c.T1), { dx: -14, dy: 12 });
      note(P, '2', c.s2, toC(c.T2), { dx: 6, dy: -4 });
      note(P, '3', c.s3, toC(c.T3), { dx: 6, dy: -4 });
      note(P, '4', c.s4, toC(c.T4), { dx: 6, dy: 12 });
      note(P, `η = ${fig(c.etaB)}`, (c.s1 + c.s3) / 2, toC((c.T1 + c.T3) / 2), { align: 'center', color: C.gold });
      return;
    }
    const width = c.qH / c.TH;
    const P = layout(canvas, { lo: -0.05 * width, hi: width * 1.35 }, { lo: toC(Math.min(c.TL, c.TH)) - 30, hi: toC(c.TH) + 40 });
    axes(P, { xLabel: 's (J/kg·K)', yLabel: 'T (°C)' });
    const rect = [[0, toC(c.TH)], [width, toC(c.TH)], [width, toC(c.TL)], [0, toC(c.TL)], [0, toC(c.TH)]];
    fillUnder(P, [[0, toC(c.TH)], [width, toC(c.TH)]], alpha(C.gold, 0.18));
    line(P, rect, { color: C.yellow, width: 2.5 });
    note(P, 'Q_H', width * 0.5, toC(c.TH), { dy: -8, align: 'center', color: C.gold });
    note(P, 'Q_L', width * 0.5, toC(c.TL), { dy: 14, align: 'center', color: C.teal });
    note(P, `η = ${fig(c.eta)}`, width * 0.55, toC((c.TL + c.TH) / 2), { color: C.text });
  },
  law: (state) => (state.mode === 'brayton'
    ? [String.raw`\eta = 1 - q_{out}/q_{in}`, String.raw`\eta_C = 1 - T_1/T_3`]
    : [String.raw`\eta = 1 - T_L/T_H`, String.raw`\mathrm{COP_{HP}} = \mathrm{COP_R} + 1`]),
  liveRows(state, c) {
    if (state.mode === 'brayton') {
      return [
        kv('Brayton η', fig(c.etaB)),
        kv('cold-air η', fig(c.cold)),
        kv('Carnot between T1 and T3', fig(carnotEfficiency(c.T1, c.T3))),
        kv('$q_{in}$ from $\\Delta h$', `${fig(c.qin / 1e3)} kJ/kg`),
        kv('$\\int c_p\\,dT$', `${fig(heatByCp(AIR, c.T2, c.T3, 80) / 1e3)} kJ/kg`),
      ].join('');
    }
    return [
      kv('$\\eta = 1 - T_L/T_H$', fig(c.eta)),
      kv('Celsius ratio', fig(c.etaC)),
      kv('COP refrigerator', fig(c.copR)),
      kv('COP heat pump', fig(c.copHP)),
      kv('$\\oint P\\,dv$', `${fig(c.wInt / 1e3)} kJ/kg`),
      kv('$q_H - q_L$', `${fig(c.wNet / 1e3)} kJ/kg`),
    ].join('');
  },
  readout(state, c) {
    if (state.mode === 'brayton') {
      return cells([
        ['Brayton η', fig(c.etaB)],
        ['T2', `${fig(toC(c.T2))} °C`],
        ['T4', `${fig(toC(c.T4))} °C`],
        ['w_net', `${fig(c.wB / 1e3)} kJ/kg`],
      ]);
    }
    if (state.mode === 'fridge') {
      return cells([
        ['COP_R', fig(c.copR)],
        ['COP_HP', fig(c.copHP)],
        ['Carnot η', fig(c.eta)],
        ['Celsius ratio', fig(c.etaC)],
      ]);
    }
    return cells([
      ['Carnot η', fig(c.eta)],
      ['Celsius ratio', fig(c.etaC)],
      ['q_H', `${fig(c.qH / 1e3)} kJ/kg`],
      ['w_net', `${fig(c.wNet / 1e3)} kJ/kg`],
    ]);
  },
  coach(state, c) {
    if (state.mode === 'brayton') {
      return {
        title: 'Pressure ratio, not the turbine temperature',
        body: String.raw`The cold-air formula depends only on $r_p$. With $c_p(T)$ the efficiency still rises as the compressor works harder, and it stays under $1 - T_1/T_3 = ${fig(carnotEfficiency(c.T1, c.T3))}$. Raising the turbine inlet does not raise the cold-air efficiency at all.`,
      };
    }
    if (state.mode === 'fridge') {
      return {
        title: 'One device, two coefficients',
        body: String.raw`The refrigerator COP is $${fig(c.copR)}$ and the heat-pump COP is $${fig(c.copHP)}$. They differ by 1, because the heat delivered is the heat taken from the cold plus the work. Both fall when the kitchen gets warmer.`,
      };
    }
    return {
      title: 'Kelvin, not Celsius',
      body: String.raw`The limit is $${fig(c.eta)}$. The same temperatures in Celsius give $${fig(c.etaC)}$, which is not an efficiency. The rectangle's area is the work: $\oint P\,dv$ and $q_H - q_L$ are the same number.`,
    };
  },
});
