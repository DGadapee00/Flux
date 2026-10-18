import { gas, mixP, toC, fromC, waterP, waterTP } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, fillUnder, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const AIR = gas('air');

const SCENARIOS = [
  { id: 'isobaric', name: 'Air at constant pressure', gas: 'air', process: 'isobaric', p1: 200e3, T1: fromC(27), V1: 0.05, V2: 0.1, n: 1.3 },
  { id: 'isothermal', name: 'Air at constant temperature', gas: 'air', process: 'isothermal', p1: 400e3, T1: fromC(77), V1: 0.02, V2: 0.06, n: 1.3 },
  { id: 'polytropic', name: 'Air, polytropic', gas: 'air', process: 'polytropic', p1: 1000e3, T1: fromC(327), V1: 0.01, V2: 0.04, n: 1.3 },
  { id: 'steam', name: 'Steam at constant pressure', gas: 'steam', process: 'isobaric', p1: 500e3, x1: 0.2, m: 0.5, V2: 0.08 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, gas: sc.gas, process: sc.process, p1: sc.p1, V2: sc.V2, n: sc.n ?? 1.3 });
  if (sc.gas === 'air') {
    state.T1 = sc.T1;
    state.m = (sc.p1 * sc.V1) / (AIR.R * sc.T1);
  } else {
    state.x1 = sc.x1;
    state.m = sc.m;
  }
}

/** Pressure along the path, as a function of volume, from state 1. */
function pathOf(state, V1, process = state.process) {
  const { p1, n } = state;
  if (process === 'isobaric') return () => p1;
  if (process === 'isothermal') return (V) => (p1 * V1) / V;
  return (V) => p1 * (V1 / V) ** n;
}

/** Boundary work in closed form, J. */
function closedWork(state, V1, V2, process = state.process) {
  const { p1, n } = state;
  if (process === 'isobaric') return p1 * (V2 - V1);
  if (process === 'isothermal') return p1 * V1 * Math.log(V2 / V1);
  const p2 = p1 * (V1 / V2) ** n;
  return (p2 * V2 - p1 * V1) / (1 - n);
}

/** ∫ P dV by Simpson's rule: the second method. */
function simpson(f, a, b, n = 400) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Volume limits for the V₂ slider, m³. */
function v2Range(state) {
  if (state.gas === 'steam') {
    const sat = mixP(state.p1, 0);
    const hot = waterTP(fromC(400), state.p1);
    return [state.m * (sat.v + 0.02 * (mixP(state.p1, 1).v - sat.v)), state.m * hot.v];
  }
  const V1 = (state.m * AIR.R * state.T1) / state.p1;
  let lo = V1 * 0.25;
  let hi = V1 * 5;
  // Keep T₂ inside the air data's fitted range, 200 K to 3500 K, with a margin.
  const Tmin = AIR.T_low * 1.02;
  const Tmax = AIR.T_high * 0.98;
  if (state.process === 'isobaric') {
    lo = Math.max(lo, (V1 * Tmin) / state.T1);
    hi = Math.min(hi, (V1 * Tmax) / state.T1);
  } else if (state.process === 'polytropic') {
    const e = 1 / (state.n - 1);
    lo = Math.max(lo, V1 * (state.T1 / Tmax) ** e);
    hi = Math.min(hi, V1 * (state.T1 / Tmin) ** e);
  }
  return [lo, hi];
}

/** V₂ held inside the range the data covers for this process. */
function clampV2(state) {
  const [lo, hi] = v2Range(state);
  return Math.min(hi, Math.max(lo, state.V2));
}

function endStates(state) {
  state = { ...state, V2: clampV2(state) };
  if (state.gas === 'steam') {
    const one = mixP(state.p1, state.x1);
    const V1 = state.m * one.v;
    const two = waterP(state.p1, 'v', state.V2 / state.m);
    return { V1, one, two, T1: one.T, T2: two.T, p2: state.p1, dU: state.m * (two.u - one.u), dH: state.m * (two.h - one.h) };
  }
  const V1 = (state.m * AIR.R * state.T1) / state.p1;
  const p2 = pathOf(state, V1)(state.V2);
  const T2 = (p2 * state.V2) / (state.m * AIR.R);
  return { V1, T1: state.T1, T2, p2, dU: state.m * (AIR.u(T2) - AIR.u(state.T1)), dH: state.m * (AIR.h(T2) - AIR.h(state.T1)) };
}

const PROCESS_NAME = { isobaric: 'constant pressure', isothermal: 'isothermal', polytropic: 'polytropic' };

export default defineLab({
  id: 'piston',
  exam: 'u2',
  title: 'Boundary work',
  hint: 'The shaded area under the path is the boundary work. Change the path between the same volumes and watch it change.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('isobaric', s);
    return s;
  },
  applyScenario: apply,
  /** What the V₂ slider covers. labs-check sweeps it. */
  sweep(state) {
    const [lo, hi] = v2Range(state);
    return { key: 'V2', lo, hi };
  },
  controls() {
    return `
      <label class="field" id="pi-process-field"><span>Process</span><select id="pi-process"><option value="isobaric">constant pressure</option><option value="isothermal">isothermal, PV = const</option><option value="polytropic">polytropic, PVⁿ = const</option></select></label>
      ${slider('pi-p1', 'P₁ (kPa)', 200, 50, 2000, 10)}
      ${slider('pi-T1', 'T₁ (°C)', 27, -50, 600, 1)}
      ${slider('pi-x1', 'quality x₁', 0.2, 0, 1, 0.01)}
      ${slider('pi-V2', 'V₂ (m³)', 0.1, 0.001, 1, 0.001)}
      ${slider('pi-n', 'n', 1.3, 1.05, 1.8, 0.05)}
      <p class="tiny">Air from the NASA polynomials, steam from IAPWS-IF97. Work done by the gas is positive.</p>`;
  },
  bind(api) {
    document.getElementById('pi-process')?.addEventListener('change', (e) => {
      api.slice().process = e.target.value;
      api.bump();
    });
    bindSlider('pi-p1', (s, v) => {
      const V1 = (s.m * AIR.R * s.T1) / s.p1;
      s.p1 = v * 1e3;
      s.m = (s.p1 * V1) / (AIR.R * s.T1);
    }, api);
    bindSlider('pi-T1', (s, v) => {
      const V1 = (s.m * AIR.R * s.T1) / s.p1;
      s.T1 = fromC(v);
      s.m = (s.p1 * V1) / (AIR.R * s.T1);
    }, api);
    bindSlider('pi-x1', (s, v) => { s.x1 = v; }, api);
    bindSlider('pi-V2', (s, v) => { s.V2 = v; }, api);
    bindSlider('pi-n', (s, v) => { s.n = v; }, api);
  },
  syncControls(state) {
    const set = (id, val, lo, hi, step) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lo != null) {
        el.min = String(lo);
        el.max = String(hi);
        el.step = String(step);
      }
      if (document.activeElement !== el) el.value = String(val);
    };
    const air = state.gas === 'air';
    const sel = document.getElementById('pi-process');
    if (sel && document.activeElement !== sel) sel.value = state.process;
    showField('pi-process', air);
    showField('pi-T1', air);
    showField('pi-p1', air);
    showField('pi-x1', !air);
    showField('pi-n', air && state.process === 'polytropic');
    const [lo, hi] = v2Range(state);
    const step = Number(((hi - lo) / 400).toPrecision(1));
    set('pi-V2', state.V2, Number(lo.toPrecision(3)), Number(hi.toPrecision(3)), step);
    set('pi-p1', state.p1 / 1e3);
    if (air) set('pi-T1', Math.round(toC(state.T1)));
    else set('pi-x1', state.x1);
    set('pi-n', state.n);
  },
  compute(state) {
    const V2 = clampV2(state);
    const e = endStates(state);
    const W = closedWork(state, e.V1, V2);
    const f = pathOf(state, e.V1);
    const Wnum = simpson(f, e.V1, V2);
    const Q = e.dU + W;
    const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
    const gaps = [rel(Wnum, W)];
    // At constant pressure the heat is the enthalpy change: Q = ΔU + PΔV = ΔH.
    if (state.process === 'isobaric') gaps.push(rel(Q, e.dH));
    if (state.process === 'isothermal') gaps.push(Math.abs(e.dU) / Math.max(Math.abs(W), 1e-9));
    return {
      gas: state.gas,
      process: state.process,
      m: state.m,
      V1: e.V1,
      V2,
      p1: state.p1,
      p2: e.p2,
      T1: e.T1,
      T2: e.T2,
      W,
      Wnum,
      dU: e.dU,
      dH: e.dH,
      Q,
      x2: state.gas === 'steam' ? e.two.x ?? null : null,
      gap: Math.max(...gaps),
    };
  },
  draw(canvas, state, c) {
    const Vmax = Math.max(c.V1, c.V2) * 1.15;
    const others = state.gas === 'air' ? ['isobaric', 'isothermal', 'polytropic'].filter((k) => k !== state.process) : [];
    const pOf = (proc) => pathOf(state, c.V1, proc);
    const pts = (proc) => {
      const f = pOf(proc);
      return Array.from({ length: 121 }, (_, i) => {
        const V = c.V1 + ((c.V2 - c.V1) * i) / 120;
        return [V, f(V) / 1e3];
      });
    };
    const peak = Math.max(c.p1, c.p2, ...others.map((k) => pOf(k)(Math.min(c.V1, c.V2)))) / 1e3;
    const P = layout(canvas, { lo: 0, hi: Vmax, log: false }, { lo: 0, hi: peak * 1.2, log: false });
    axes(P, { xLabel: 'V (m³)', yLabel: 'P (kPa)' });
    const own = pts(state.process);
    fillUnder(P, own, alpha(c.W >= 0 ? C.gold : C.blue, 0.22));
    for (const k of others) {
      line(P, pts(k), { color: alpha(C.text, 0.35), width: 1.5, dash: [5, 5] });
      const end = pts(k)[120];
      note(P, PROCESS_NAME[k], end[0], end[1], { dx: 6, dy: -4, color: C.dim });
    }
    line(P, own, { color: C.yellow, width: 2.5 });
    dot(P, c.V1, c.p1 / 1e3, { color: C.text, r: 4 });
    dot(P, c.V2, c.p2 / 1e3, { color: C.yellow, r: 5, ring: alpha(C.yellow, 0.35) });
    note(P, '1', c.V1, c.p1 / 1e3, { dx: -12, dy: -8, color: C.text });
    note(P, '2', c.V2, c.p2 / 1e3, { dx: 8, dy: -8, color: C.text });
    const mid = own[60];
    note(P, `W = ${fig(c.W / 1e3)} kJ`, mid[0], mid[1] / 2, { dx: 0, dy: 4, align: 'center', color: C.gold });
  },
  law: () => [String.raw`W_b=\int_1^2 P\,dV`, String.raw`Q-W_b=\Delta U`],
  liveRows(state, c) {
    const form = {
      isobaric: String.raw`$P_1(V_2-V_1)$`,
      isothermal: String.raw`$P_1V_1\ln(V_2/V_1)$`,
      polytropic: String.raw`$\dfrac{P_2V_2-P_1V_1}{1-n}$`,
    }[state.process];
    return [
      kv(`$W_b$ = ${form}`, `${fig(c.W / 1e3)} kJ`),
      kv('$\\int P\\,dV$, Simpson', `${fig(c.Wnum / 1e3)} kJ`),
      kv('$\\Delta U$', `${fig(c.dU / 1e3)} kJ`),
      kv('$Q = \\Delta U + W_b$', `${fig(c.Q / 1e3)} kJ`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['work W', `${fig(c.W / 1e3)} kJ`],
      ['heat Q', `${fig(c.Q / 1e3)} kJ`],
      ['ΔU', `${fig(c.dU / 1e3)} kJ`],
      ['T₂', `${fig(toC(c.T2))} °C`],
    ]);
  },
  coach(state, c) {
    if (state.gas === 'steam') {
      return c.x2 != null
        ? { title: 'Boiling at constant pressure', body: String.raw`The temperature stays at $${fig(toC(c.T2))}$ °C while the quality reaches $${fig(c.x2)}$. The heat goes into $h_{fg}$, and $Q = m\,\Delta h$.` }
        : { title: 'Past the dome', body: 'All the liquid has boiled. Now the heat raises the temperature, and the volume grows faster.' };
    }
    if (state.process === 'isothermal') {
      return { title: 'No change in internal energy', body: String.raw`For an ideal gas $u$ depends on $T$ only. At constant $T$, $\Delta U = 0$, so every joule of work came in as heat: $Q = W_b$.` };
    }
    if (state.process === 'polytropic') {
      return { title: 'Steeper than an isotherm', body: String.raw`With $n = ${fig(state.n)} > 1$ the pressure falls faster than $1/V$. Less area, less work, and the gas cools.` };
    }
    return { title: 'A rectangle', body: String.raw`At constant pressure the area under the path is $P\,\Delta V$. The gas heats as it expands, so $Q$ exceeds $W_b$.` };
  },
});
