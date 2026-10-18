import {
  T_CRIT, P_CRIT, ThermoRangeError, psat, satP, satT, toC, fromC, waterP, waterTP, waterTv,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, fmtTick, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/** Critical specific volume, m³/kg (IAPWS: ρc = 322 kg/m³). Only the dashed end of the dome uses it. */
const V_CRIT = 1 / 322;

const SCENARIOS = [
  { id: 'boil', name: 'Boiling at 100 kPa', path: 'isobar', p: 100e3, at: 0.5 },
  { id: 'high', name: 'Boiling at 10 MPa', path: 'isobar', p: 10e6, at: 0.5 },
  { id: 'tank', name: 'Rigid tank, mostly vapour by volume', path: 'isochore', v: 0.3396, T: fromC(120) },
  { id: 'tank-liquid', name: 'Rigid tank, mostly liquid', path: 'isochore', v: 0.0015, T: fromC(250) },
  { id: 'compress', name: 'Compressing steam at 200 °C', path: 'isotherm', T: fromC(200), v: 0.05 },
];

/** Where each path runs. Ends are inside IF97 regions 1 and 2. */
const ISOBAR_T = [fromC(5), fromC(500)];
const ISOCHORE_T = { tank: [fromC(100), fromC(500)], 'tank-liquid': [fromC(100), fromC(310)] };

function isobarEnds(p) {
  return [waterTP(ISOBAR_T[0], p).h, waterTP(ISOBAR_T[1], p).h];
}

function isochoreEnds(state) {
  return ISOCHORE_T[state.scenarioId] || [fromC(100), fromC(500)];
}

function isothermEnds(T) {
  // From liquid at 20 MPa to vapour at 5 kPa.
  return [waterTP(T, 20e6).v, waterTP(T, 5e3).v];
}

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.path = sc.path;
  state.view = state.view || 'Pv';
  if (sc.path === 'isobar') {
    state.p = sc.p;
    const sat = satP(sc.p);
    state.h = sat.hf + sc.at * sat.hfg;
  } else if (sc.path === 'isochore') {
    state.v = sc.v;
    state.T = sc.T;
  } else {
    state.T = sc.T;
    state.v = sc.v;
  }
}

/** The state on the path, from the property the slider moves. */
function stateOf(s) {
  if (s.path === 'isobar') return waterP(s.p, 'h', s.h);
  return waterTv(s.T, s.v);
}

/** The same state by the other inversion: (T, v) for an isobar, (p, h) for the rest. */
function secondState(s, st) {
  if (s.path === 'isobar') return waterTv(st.T, st.v);
  return waterP(st.p, 'h', st.h);
}

/** dp_sat/dT from the region 4 equation, against h_fg/(T v_fg) from regions 1 and 2. */
function clapeyronGap(T) {
  const dT = 1e-3;
  const slope = ((psat(T + dT) - psat(T - dT)) / (2 * dT)) * 1e6;
  const s = satT(T);
  return Math.abs(slope / (s.hfg / (T * (s.vg - s.vf))) - 1);
}

let DOME = null;
/** The saturation dome, liquid and vapour sides, from the triple point to 623.15 K. */
function dome() {
  if (DOME) return DOME;
  const liquid = [];
  const vapour = [];
  for (let T = 273.16; T <= 623.15 + 1e-9; T += T < 600 ? 2.5 : 0.5) {
    const s = satT(Math.min(T, 623.15));
    liquid.push({ v: s.vf, p: s.p, T: s.T });
    vapour.push({ v: s.vg, p: s.p, T: s.T });
  }
  DOME = { liquid, vapour };
  return DOME;
}

/** Samples along the path, for drawing. A sample outside regions 1 and 2 breaks the line. */
function pathPoints(s) {
  const pts = [];
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    let st = null;
    try {
      if (s.path === 'isobar') {
        const [a, b] = isobarEnds(s.p);
        st = waterP(s.p, 'h', a + k * (b - a));
      } else if (s.path === 'isochore') {
        const [a, b] = isochoreEnds(s);
        st = waterTv(a + k * (b - a), s.v);
      } else {
        const [a, b] = isothermEnds(s.T);
        st = waterTv(s.T, a * (b / a) ** k);
      }
    } catch (e) {
      if (!(e instanceof ThermoRangeError)) throw e;
    }
    pts.push(st ? { v: st.v, p: st.p, T: st.T } : null);
  }
  return pts;
}

function phaseName(st) {
  if (st.phase === 'saturated mixture') return 'mixture';
  if (st.phase === 'compressed liquid') return 'liquid';
  return st.phase === 'supercritical' ? 'supercritical' : 'vapour';
}

export default defineLab({
  id: 'phase',
  exam: 'u1',
  title: 'Phase diagram',
  hint: 'Move along the path. On the dome, temperature and pressure stay put while the quality changes.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = { view: 'Pv' };
    apply('boil', s);
    return s;
  },
  applyScenario: apply,
  /** What the slider moves in this state's path, and over what range. labs-check sweeps it. */
  sweep(state) {
    if (state.path === 'isobar') {
      const [lo, hi] = isobarEnds(state.p);
      return { key: 'h', lo, hi };
    }
    if (state.path === 'isochore') {
      const [lo, hi] = isochoreEnds(state);
      return { key: 'T', lo, hi };
    }
    const [lo, hi] = isothermEnds(state.T);
    return { key: 'v', lo, hi, log: true };
  },
  controls() {
    return `
      <label class="field"><span>Diagram</span><select id="ph-view"><option value="Pv">P–v (log–log)</option><option value="Tv">T–v</option></select></label>
      ${slider('ph-p', 'pressure (kPa)', 100, 5, 16000, 5)}
      ${slider('ph-h', 'enthalpy h (kJ/kg)', 1400, 0, 3500, 1)}
      ${slider('ph-T', 'temperature (°C)', 120, 5, 500, 0.5)}
      ${slider('ph-v', 'log₁₀ v (m³/kg)', -1, -3, 1.5, 0.01)}
      <p class="tiny">Water from IAPWS-IF97. The dome is drawn to 350 °C; the dashed end, to the critical point, is region 3 and is not computed.</p>`;
  },
  bind(api) {
    document.getElementById('ph-view')?.addEventListener('change', (e) => {
      api.slice().view = e.target.value;
      api.bump(false);
    });
    bindSlider('ph-p', (s, v) => {
      const [a0, b0] = isobarEnds(s.p);
      const k = (s.h - a0) / (b0 - a0);
      s.p = v * 1e3;
      const [a, b] = isobarEnds(s.p);
      s.h = a + Math.min(1, Math.max(0, k)) * (b - a);
    }, api);
    bindSlider('ph-h', (s, v) => { s.h = v * 1e3; }, api);
    bindSlider('ph-T', (s, v) => { s.T = fromC(v); }, api);
    bindSlider('ph-v', (s, v) => { s.v = 10 ** v; }, api);
  },
  syncControls(state) {
    const set = (id, val, lo, hi) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lo != null) {
        el.min = String(lo);
        el.max = String(hi);
      }
      if (document.activeElement !== el) el.value = String(val);
    };
    const view = document.getElementById('ph-view');
    if (view && document.activeElement !== view) view.value = state.view;
    showField('ph-p', state.path === 'isobar');
    showField('ph-h', state.path === 'isobar');
    showField('ph-T', state.path === 'isochore');
    showField('ph-v', state.path === 'isotherm');
    if (state.path === 'isobar') {
      const [a, b] = isobarEnds(state.p);
      set('ph-p', state.p / 1e3);
      set('ph-h', Math.round(state.h / 1e3), Math.ceil(a / 1e3), Math.floor(b / 1e3));
    } else if (state.path === 'isochore') {
      const [a, b] = isochoreEnds(state);
      set('ph-T', toC(state.T), toC(a), toC(b));
    } else {
      const [a, b] = isothermEnds(state.T);
      set('ph-v', Math.log10(state.v), Math.log10(a).toFixed(3), Math.log10(b).toFixed(3));
    }
  },
  compute(state) {
    const st = stateOf(state);
    const again = secondState(state, st);
    const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
    const sat = st.p <= 16.5e6 ? satP(st.p) : null;
    const gaps = [rel(again.p, st.p), rel(again.h, st.h), rel(again.v, st.v), rel(again.T, st.T)];
    if (sat) gaps.push(clapeyronGap(sat.T));
    return {
      phase: phaseName(st),
      T: st.T,
      p: st.p,
      v: st.v,
      u: st.u,
      h: st.h,
      s: st.s,
      x: st.phase === 'saturated mixture' ? st.x : null,
      Tsat: sat ? sat.T : null,
      vf: sat ? sat.vf : null,
      vg: sat ? sat.vg : null,
      vfg: sat ? sat.vg - sat.vf : null,
      hf: sat ? sat.hf : null,
      hfg: sat ? sat.hfg : null,
      gap: Math.max(...gaps),
    };
  },
  draw(canvas, state, c) {
    const pv = state.view !== 'Tv';
    const P = layout(canvas, { lo: 7e-4, hi: 100, log: true }, pv ? { lo: 500, hi: 5e7, log: true } : { lo: 0, hi: 520, log: false });
    const yOf = (pt) => (pv ? pt.p : toC(pt.T));
    axes(P, {
      xLabel: 'v (m³/kg)',
      yLabel: pv ? 'P (kPa)' : 'T (°C)',
      yFmt: pv ? (v) => fmtTick(v / 1e3) : fmtTick,
    });
    const d = dome();
    const fill = alpha(C.teal, 0.08);
    P.ctx.save();
    P.ctx.fillStyle = fill;
    P.ctx.beginPath();
    d.liquid.forEach((pt, i) => (i ? P.ctx.lineTo(P.X(pt.v), P.Y(yOf(pt))) : P.ctx.moveTo(P.X(pt.v), P.Y(yOf(pt)))));
    for (let i = d.vapour.length - 1; i >= 0; i--) P.ctx.lineTo(P.X(d.vapour[i].v), P.Y(yOf(d.vapour[i])));
    P.ctx.closePath();
    P.ctx.fill();
    P.ctx.restore();
    line(P, d.liquid.map((pt) => [pt.v, yOf(pt)]), { color: C.blue, width: 2 });
    line(P, d.vapour.map((pt) => [pt.v, yOf(pt)]), { color: C.gold, width: 2 });
    const top = { v: V_CRIT, p: P_CRIT * 1e6, T: T_CRIT };
    const lastL = d.liquid[d.liquid.length - 1];
    const lastV = d.vapour[d.vapour.length - 1];
    line(P, [[lastL.v, yOf(lastL)], [top.v, yOf(top)], [lastV.v, yOf(lastV)]], { color: C.dim, width: 1.5, dash: [5, 5] });
    dot(P, top.v, yOf(top), { color: C.red, r: 3.5 });
    note(P, 'critical point', top.v, yOf(top), { dy: -8, align: 'left', color: C.muted });
    note(P, 'liquid', d.liquid[40].v, yOf(d.liquid[40]), { dx: -6, dy: -6, align: 'right', color: C.blue });
    note(P, 'vapour', d.vapour[60].v, yOf(d.vapour[60]), { dx: 8, dy: -6, color: C.gold });

    const path = pathPoints(state).map((pt) => (pt ? [pt.v, yOf(pt)] : null));
    line(P, path, { color: alpha(C.yellow, 0.75), width: 2.5 });
    dot(P, c.v, pv ? c.p : toC(c.T), { color: C.yellow, r: 5, ring: alpha(C.yellow, 0.35) });
    const tag = c.x == null ? c.phase : `x = ${c.x.toFixed(3)}`;
    note(P, tag, c.v, pv ? c.p : toC(c.T), { dx: 10, dy: 16, color: C.text });
  },
  law: () => [String.raw`x=\dfrac{v-v_f}{v_g-v_f}`, String.raw`h=h_f+x\,h_{fg}`],
  liveRows(state, c) {
    const rows = [kv('phase', c.phase)];
    if (c.Tsat != null) {
      rows.push(kv('$T_{sat}$ at this $P$', `${fig(toC(c.Tsat))} °C`));
      rows.push(kv('$v_f$, $v_g$', `${fig(c.vf)}, ${fig(c.vg)} m³/kg`));
    }
    if (c.x != null) rows.push(kv('$x$', fig(c.x)));
    rows.push(kv('$h$', `${fig(c.h / 1e3)} kJ/kg`));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['temperature', `${fig(toC(c.T))} °C`],
      ['pressure', c.p >= 1e6 ? `${fig(c.p / 1e6)} MPa` : `${fig(c.p / 1e3)} kPa`],
      ['volume v', `${fig(c.v)} m³/kg`],
      [c.x == null ? 'phase' : 'quality x', c.x == null ? c.phase : fig(c.x)],
    ]);
  },
  coach(state, c) {
    if (c.x != null) {
      return {
        title: 'On the plateau',
        body: String.raw`Liquid and vapour share the tank at $T_{sat} = ${fig(toC(c.Tsat))}$ °C. Heat changes the quality, not the temperature: $x = ${fig(c.x)}$.`,
      };
    }
    if (c.phase === 'liquid') {
      return { title: 'Compressed liquid', body: 'Left of the dome. The liquid is colder than its boiling point at this pressure, and its volume barely changes with pressure.' };
    }
    return { title: 'Superheated vapour', body: 'Right of the dome. Far from the dome the vapour behaves nearly like an ideal gas: v grows with T and falls with P.' };
  },
});
