import {
  fromC, gas, idealGasNozzle, integrateVdp, isentropicVdp, massFlow, toC, waterP, waterTP, exitVelocity, ThermoRangeError,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that a small drop in enthalpy buys a large velocity (V² = 2 Δh, so 5 kJ/kg is 100 m/s), and
 * that conservation of mass, ṁ = A V / v, then sets the area the stream needs. An ideal nozzle or
 * diffuser: steady, adiabatic, no shaft work, reversible, so the exit state follows from s₂ = s₁ at
 * the exit pressure. The energy balance h₁ + V₁²/2 = h₂ + V₂²/2 gives V₂; the mass balance gives A₂.
 * Second method: for a reversible adiabatic flow dh = v dp, so the kinetic energy gained must equal
 * −∫v dp along the isentrope, integrated numerically without using h.
 */

const AIR = gas('air');
/** The inlet area, m². ṁ follows from it and the inlet velocity. */
const A1 = 0.01;

const SCENARIOS = [
  { id: 'subsonic', name: 'Air through a converging nozzle', fluid: 'air', T1: 400, p1: 600e3, V1: 30, p2: 400e3 },
  { id: 'supersonic', name: 'Air expanding to 100 kPa', fluid: 'air', T1: 400, p1: 600e3, V1: 30, p2: 100e3 },
  { id: 'steam', name: 'Steam from 2 MPa and 300 °C', fluid: 'steam', T1: fromC(300), p1: 2e6, V1: 40, p2: 500e3 },
  { id: 'diffuser', name: 'Air slowing in a diffuser', fluid: 'air', T1: 300, p1: 100e3, V1: 250, p2: 125e3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, T1: sc.T1, p1: sc.p1, V1: sc.V1, p2: sc.p2 });
}

/** The inlet state: specific volume, enthalpy and (for steam) entropy. */
function inlet(state) {
  if (state.fluid === 'air') return { v: (AIR.R * state.T1) / state.p1, h: AIR.h(state.T1), s: null };
  const w = waterTP(state.T1, state.p1);
  return { v: w.v, h: w.h, s: w.s };
}

/** The ideal exit state at pressure p, with the exit velocity from the energy balance. Null if V₂² < 0. */
function exitAt(state, p, one = inlet(state)) {
  try {
    if (state.fluid === 'air') {
      const n = idealGasNozzle(AIR, { T1: state.T1, p1: state.p1, V1: state.V1, p2: p });
      return { T2: n.T2, h2: n.h2, v2: n.v2, V2: n.V2, x: null, a: Math.sqrt(AIR.gamma(n.T2) * AIR.R * n.T2) };
    }
    const w = waterP(p, 's', one.s);
    const V2 = exitVelocity({ h1: one.h, h2: w.h, V1: state.V1 });
    return { T2: w.T, h2: w.h, v2: w.v, V2, x: w.x ?? null, a: w.w ?? null };
  } catch (err) {
    if (err instanceof RangeError || err instanceof ThermoRangeError) return null;
    throw err;
  }
}

/** The exit pressures this lab can show: from the lowest the data and the physics allow to the stagnation pressure. */
function pLimits(state) {
  const one = inlet(state);
  // Low end: air stays above 1.02 × 200 K; steam stays above 20 kPa.
  let lo = state.fluid === 'air' ? state.p1 * 0.05 : 20e3;
  while (!exitAt(state, lo, one) && lo < state.p1) lo *= 1.1;
  // High end: where the stream has been brought to rest.
  let a = state.p1;
  let b = state.p1 * 40;
  if (exitAt(state, b, one)) return [lo, b];
  for (let i = 0; i < 80; i++) {
    const mid = (a + b) / 2;
    if (exitAt(state, mid, one)) a = mid;
    else b = mid;
  }
  return [lo, a * 0.999];
}

function clampP2(state) {
  const [lo, hi] = pLimits(state);
  return Math.min(hi, Math.max(lo, state.p2));
}

export default defineLab({
  id: 'nozzle',
  exam: 'u3',
  title: 'Nozzle and diffuser',
  hint: 'Lower the exit pressure and the stream speeds up. The area it needs is set by mass: ṁ = A V / v.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('subsonic', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    const [lo, hi] = pLimits(state);
    return { key: 'p2', lo, hi, log: true };
  },
  controls() {
    return `
      ${slider('no-p2', 'exit pressure P₂ (kPa)', 400, 10, 2000, 1)}
      ${slider('no-V1', 'inlet velocity V₁ (m/s)', 30, 1, 300, 1)}
      ${slider('no-T1', 'inlet temperature T₁ (°C)', 127, 0, 600, 1)}
      <p class="tiny">Ideal and steady: adiabatic, no shaft work, reversible. The inlet area is 100 cm². Air from the NASA polynomials, steam from IAPWS-IF97.</p>`;
  },
  bind(api) {
    bindSlider('no-p2', (s, v) => { s.p2 = v * 1e3; }, api);
    bindSlider('no-V1', (s, v) => { s.V1 = v; }, api);
    bindSlider('no-T1', (s, v) => { s.T1 = fromC(v); }, api);
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
    const [lo, hi] = pLimits(state);
    set('no-p2', Math.round(state.p2 / 1e3), Math.ceil(lo / 1e3), Math.floor(hi / 1e3), 1);
    set('no-V1', state.V1);
    if (state.fluid === 'air') set('no-T1', Math.round(toC(state.T1)), 0, 600, 1);
    else set('no-T1', Math.round(toC(state.T1)), 250, 500, 1);
    showField('no-T1', true);
  },
  compute(state) {
    const one = inlet(state);
    const [lo, hi] = pLimits(state);
    const p2 = Math.min(hi, Math.max(lo, state.p2));
    const ex = exitAt(state, p2, one);
    const mdot = massFlow(A1, state.V1, one.v);
    const A2 = (mdot * ex.v2) / ex.V2;
    const dKE = (ex.V2 * ex.V2 - state.V1 * state.V1) / 2;
    const dh = ex.h2 - one.h;
    // Second method: ΔKE = −∫ v dp along the isentrope, without using h.
    const vdp = state.fluid === 'air'
      ? isentropicVdp(AIR, { T1: state.T1, p1: state.p1, p2 })
      : integrateVdp((p) => waterP(p, 's', one.s).v, state.p1, p2);
    const gap = Math.abs(dKE + vdp) / Math.max(Math.abs(dh), 1);
    // The required area along the whole range, to show where the throat is.
    const ps = Array.from({ length: 121 }, (_, i) => lo * (hi / lo) ** (i / 120));
    const curve = ps.map((p) => {
      const e = exitAt(state, p, one);
      return e ? { p, A: (mdot * e.v2) / e.V2, M: e.a ? e.V2 / e.a : null } : null;
    });
    return {
      fluid: state.fluid,
      p1: state.p1,
      p2,
      V1: state.V1,
      V2: ex.V2,
      T1: state.T1,
      T2: ex.T2,
      x2: ex.x,
      h1: one.h,
      h2: ex.h2,
      dh,
      dKE,
      vdp,
      v1: one.v,
      v2: ex.v2,
      mdot,
      A1,
      A2,
      M2: ex.a ? ex.V2 / ex.a : null,
      curve,
      pLo: lo,
      pHi: hi,
      gap,
    };
  },
  draw(canvas, state, c) {
    const pts = c.curve.filter(Boolean).map(({ p, A }) => [p / 1e3, A * 1e4]);
    const top = Math.max(c.A1 * 1.6, c.A2 * 1.25) * 1e4;
    const P = layout(canvas, { lo: c.pLo / 1e3, hi: c.pHi / 1e3, log: true }, { lo: 0, hi: top, log: false });
    axes(P, { xLabel: 'exit pressure (kPa)', yLabel: 'area A the stream needs (cm²)' });
    line(P, pts, { color: C.teal, width: 2.5 });
    // The inlet: area A₁ at P₁.
    dot(P, c.p1 / 1e3, c.A1 * 1e4, { color: C.text, r: 4 });
    note(P, `inlet ${fig(c.A1 * 1e4)} cm²`, c.p1 / 1e3, c.A1 * 1e4, { dx: 8, dy: -10, color: C.text });
    // The throat: where the Mach number crosses 1.
    const cross = c.curve.findIndex((e, i) => e && c.curve[i - 1] && e.M != null && c.curve[i - 1].M != null && (c.curve[i - 1].M - 1) * (e.M - 1) < 0);
    if (cross > 0) {
      const e = c.curve[cross];
      dot(P, e.p / 1e3, e.A * 1e4, { color: C.gold, r: 4 });
      note(P, 'throat, M = 1', e.p / 1e3, e.A * 1e4, { dx: 8, dy: 16, color: C.gold });
    }
    dot(P, c.p2 / 1e3, c.A2 * 1e4, { color: C.yellow, r: 5, ring: alpha(C.yellow, 0.35) });
    note(P, `exit ${fig(c.A2 * 1e4)} cm², ${fig(c.V2)} m/s`, c.p2 / 1e3, c.A2 * 1e4, { dx: -8, dy: -12, align: 'right', color: C.yellow });
  },
  law: () => [String.raw`h_1+\tfrac12V_1^2=h_2+\tfrac12V_2^2`, String.raw`\dot m=\dfrac{A_1V_1}{v_1}=\dfrac{A_2V_2}{v_2}`],
  liveRows(state, c) {
    const rows = [
      kv('$h_1 - h_2$', `${fig((c.h1 - c.h2) / 1e3)} kJ/kg`),
      kv('$\\tfrac12(V_2^2 - V_1^2)$', `${fig(c.dKE / 1e3)} kJ/kg`),
      kv('$-\\int v\\,dp$ along the isentrope', `${fig(-c.vdp / 1e3)} kJ/kg`),
      kv('$\\dot m$', `${fig(c.mdot)} kg/s`),
    ];
    if (c.M2 != null) rows.push(kv('exit Mach number', fig(c.M2)));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['exit velocity', `${fig(c.V2)} m/s`],
      ['enthalpy drop', `${fig((c.h1 - c.h2) / 1e3)} kJ/kg`],
      ['exit T', `${fig(toC(c.T2))} °C`],
      ['exit area', `${fig(c.A2 * 1e4)} cm²`],
    ]);
  },
  coach(state, c) {
    if (c.dh > 0) {
      return {
        title: 'The diffuser trades speed for enthalpy',
        body: String.raw`The stream slows from $${fig(c.V1)}$ to $${fig(c.V2)}$ m/s, and the kinetic energy it loses, $${fig(-c.dKE / 1e3)}$ kJ/kg, raises $h$ by the same amount. The gas warms and its pressure rises.`,
      };
    }
    if (c.M2 != null && c.M2 > 1) {
      return {
        title: 'Past the throat',
        body: String.raw`The exit Mach number is $${fig(c.M2)}$. The area fell until $M = 1$ and then grew again: a converging–diverging nozzle. The energy balance does not care, but the mass balance does.`,
      };
    }
    return {
      title: 'A small drop in h, a large V',
      body: String.raw`$h_1 - h_2 = ${fig((c.h1 - c.h2) / 1e3)}$ kJ/kg is $${fig(c.dKE)}$ J/kg, so $V_2 = ${fig(c.V2)}$ m/s. Dividing by $v$ and $V$ gives the area: $${fig(c.A2 * 1e4)}$ cm².`,
    };
  },
});
