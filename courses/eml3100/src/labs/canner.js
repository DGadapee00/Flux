import { M_PER_FT, PA_PER_PSI } from '@flux/subjects/convert.js';
import { psat, satP, toC, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, chart, clip, dot, fit, line, panes, stage } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a pressure canner boils water hotter than an open pot, because the absolute pressure
 * is the gauge reading plus the atmosphere, and that a higher altitude lowers that absolute
 * pressure unless the gauge setting is raised.
 *
 * Cited: USDA Complete Guide to Home Canning (AIB 539, 2015) states that 10.5 psi gauge at sea
 * level gives 240°F, and that a weighted-gauge canner above 1,000 ft runs at 15 psi where the
 * sea-level process used 10 psi. The sea-level atmosphere and its drop with height are the
 * troposphere of the international standard atmosphere (101325 Pa, 288.15 K, lapse 0.0065 K/m).
 * Second method: Tsat by bisection on the saturation pressure, and the standard-atmosphere
 * pressure by integrating the hydrostatic equation.
 */

const P0 = 101325;
const T0 = 288.15;
const LAPSE = 0.0065;
const G = 9.80665;
const R_ISA = 287.05287;
const MPA = 1e6;

const OUT = 'The model is pure steam in equilibrium, with no air left in the vessel. A canner that was not vented holds air, and the temperature at the same gauge reading is lower. The food is not pure water, the jars warm slowly, and a real day is not the standard atmosphere. The guide\'s processing time is about killing spores, which this diagram does not time.';

const SCENARIOS = [
  { id: 'sea', name: 'Sea level, 10 psi', altitudeFt: 0, gaugePsi: 10 },
  { id: 'stated', name: 'The 10.5 psi statement', altitudeFt: 0, gaugePsi: 10.5 },
  { id: 'high', name: '5,000 ft, 15 psi', altitudeFt: 5000, gaugePsi: 15 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.altitudeFt = sc.altitudeFt;
  state.gaugePsi = sc.gaugePsi;
}

/** Troposphere pressure, Pa, from the international standard atmosphere. */
export function isaPressure(ft) {
  const h = Math.max(0, ft) * M_PER_FT;
  const T = T0 - LAPSE * h;
  return P0 * (T / T0) ** (G / (R_ISA * LAPSE));
}

function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Hydrostatic integration of dp/p = −g dh /(R T). */
function isaHydro(ft) {
  const h = Math.max(0, ft) * M_PER_FT;
  if (h < 1) return P0;
  const integral = simpson((z) => G / (R_ISA * (T0 - LAPSE * z)), 0, h);
  return P0 * Math.exp(-integral);
}

function tsatBisect(pPa) {
  let lo = 273.16;
  let hi = 623.15;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (psat(mid) * MPA < pPa) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

const CONTROLS = [
  { id: 'cn-gauge', key: 'gaugePsi', label: 'gauge pressure (psi)', lo: 0, hi: 15, step: 0.5 },
  { id: 'cn-alt', key: 'altitudeFt', label: 'altitude (ft)', lo: 0, hi: 8000, step: 100 },
];

export default defineLab({
  id: 'canner',
  exam: 'u1',
  title: 'Pressure canner',
  hint: 'The boiling temperature follows the absolute pressure: gauge plus the atmosphere at that altitude.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = { t: 0 };
    apply('sea', s);
    return s;
  },
  tick(dt, state) {
    state.t = (state.t || 0) + dt;
    return true;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'gaugePsi', lo: 0, hi: 15 }),
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Cited: USDA Complete Guide to Home Canning (2015) states 240°F at 10.5 psi gauge at sea level, and 15 psi on a weighted gauge above 1,000 ft where the sea-level process used 10 psi. Altitude pressure is the standard atmosphere. Assumed: pure steam, fully vented.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, true);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      el.value = String(state[c.key]);
    }
  },
  compute(state) {
    const patm = isaPressure(state.altitudeFt);
    const p = patm + state.gaugePsi * PA_PER_PSI;
    const T = satP(p).T;
    const hydro = isaHydro(state.altitudeFt);
    const gap = Math.max(rel(T, tsatBisect(p)), rel(patm, hydro));
    return { patm, p, T, Tc: toC(T), Tf: toF(T), gap };
  },
  draw(canvas, state, c) {
    const samples = [];
    let tLo = c.Tc;
    let tHi = c.Tc;
    for (let i = 0; i <= 40; i++) {
      const g = (15 * i) / 40;
      const t = toC(satP(c.patm + g * PA_PER_PSI).T);
      samples.push([g, t]);
      tLo = Math.min(tLo, t);
      tHi = Math.max(tHi, t);
    }
    const open = toC(satP(c.patm).T);
    const B = stage(canvas);
    const [machine, plot] = panes(B.free, 0.64);
    drawCanner(B.ctx, machine, state, c, open);
    const P = chart(B.ctx, plot, { lo: 0, hi: 15 }, { lo: Math.min(tLo, open) - 4, hi: tHi + 4 }, {
      left: 44,
      right: 10,
      top: 22,
      bottom: 40,
    });
    clip(B.ctx, plot);
    axes(P, {
      xLabel: 'gauge (psi)',
      yLabel: '',
      yCount: P.box.y1 - P.box.y0 < 130 ? 3 : 5,
    });
    B.ctx.font = '13px Inter, system-ui, sans-serif';
    B.ctx.fillStyle = C.muted;
    B.ctx.textAlign = 'left';
    B.ctx.textBaseline = 'top';
    B.ctx.fillText('Tsat (°C)', P.box.x0, plot.y0 + 3);
    line(P, samples, { color: C.teal, width: 2.5 });
    line(P, [[0, open], [15, open]], { color: alpha(C.gold, 0.9), width: 2, dash: [5, 4] });
    dot(P, state.gaugePsi, c.Tc, { color: C.yellow, r: 4 });
    B.ctx.restore();
  },
  law: () => [String.raw`P = P_\mathrm{atm} + P_\mathrm{gauge}`, String.raw`T = T_\mathrm{sat}(P)`],
  liveRows(state, c) {
    return [
      kv('absolute pressure', `${fig(c.p / 1000)} kPa`),
      kv('atmosphere', `${fig(c.patm / 1000)} kPa`),
      kv('boiling point', `${fig(c.Tc)} °C`),
      kv('boiling point', `${fig(c.Tf)} °F`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Tsat', `${fig(c.Tc)} °C`],
      ['Tsat', `${fig(c.Tf)} °F`],
      ['absolute', `${fig(c.p / 1000)} kPa`],
      ['atmosphere', `${fig(c.patm / 1000)} kPa`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.gaugePsi < 1 ? 'Open pot' : 'The gauge is not the whole pressure',
    body: String.raw`At ${fig(state.altitudeFt)} ft the standard atmosphere is ${fig(c.patm / 1000)} kPa. A gauge reading of ${fig(state.gaugePsi)} psi adds to that, so the absolute pressure is ${fig(c.p / 1000)} kPa and water boils at ${fig(c.Tc)} °C (${fig(c.Tf)} °F). The guide states 240°F for 10.5 psi gauge at sea level. An open pot at this altitude boils at ${fig(toC(satP(c.patm).T))} °C.`,
  })),
});

/** A weighted-gauge canner: the weight lifts and steam leaves as the gauge setting rises. */
function drawCanner(ctx, rect, state, c, openC) {
  clip(ctx, rect);
  const S = fit(ctx, rect, { x0: -1.7, x1: 1.7, y0: -0.45, y1: 2.75 }, 8);
  const t = state.t || 0;
  const gauge = Math.max(0, Math.min(15, state.gaugePsi));
  const lift = gauge / 15;
  const hot = Math.max(0, Math.min(1, (c.Tc - 95) / 30));

  // A short counter and a burner under the pot.
  band(S, -1.05, 1.05, -0.28, -0.12, alpha(C.text, 0.1), null);
  ctx.fillStyle = alpha(C.red, 0.15 + 0.45 * lift);
  ctx.beginPath();
  ctx.ellipse(S.X(0), S.Y(-0.08), 0.72 * S.k, 0.1 * S.k, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = alpha(C.gold, 0.5 + 0.4 * lift);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pot wall, water, then the lid so the rim covers the water.
  rounded(S, -0.78, 0, 1.56, 1.48, 0.08, alpha(C.text, 0.14), alpha(C.text, 0.72));
  water(S, t, hot);
  rounded(S, -0.9, 1.4, 1.8, 0.16, 0.04, alpha(C.text, 0.22), C.text);
  // Dome of the lid.
  ctx.fillStyle = alpha(C.text, 0.16);
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(S.X(0), S.Y(1.56), 0.62 * S.k, 0.28 * S.k, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  // Side handles.
  rounded(S, -1.18, 0.85, 0.32, 0.16, 0.06, alpha(C.text, 0.2), alpha(C.text, 0.7));
  rounded(S, 0.86, 0.85, 0.32, 0.16, 0.06, alpha(C.text, 0.2), alpha(C.text, 0.7));

  // Vent and the weighted gauge. The weight lifts off the pipe and rocks as the setting rises.
  const rock = Math.sin(t * (3 + 6 * lift)) * lift * 0.28;
  const seat = 2.02 + lift * 0.16;
  rounded(S, 0.1, 1.68, 0.14, seat - 1.66, 0.02, alpha(C.gold, 0.45), C.gold);
  ctx.save();
  ctx.translate(S.X(0.17), S.Y(seat + 0.12));
  ctx.rotate(rock);
  const ww = 0.5 * S.k;
  const wh = 0.26 * S.k;
  ctx.fillStyle = C.gold;
  ctx.strokeStyle = alpha(C.text, 0.8);
  ctx.lineWidth = 1.5;
  roundPx(ctx, -ww / 2, -wh / 2, ww, wh, 5);
  ctx.fill();
  ctx.stroke();
  if (ww > 46) {
    ctx.fillStyle = C.bg;
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${fig(gauge)} psi`, 0, 0);
  }
  ctx.restore();

  steam(S, t, lift, 0.17, seat + 0.22);
  bubbles(S, t, hot);

  const where = state.altitudeFt < 50 ? 'sea level' : `${fig(state.altitudeFt)} ft`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.yellow;
  ctx.fillText(`${fig(c.Tc)} °C`, rect.x1 - 8, rect.y0 + 4);
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.dim;
  ctx.fillText(`open pot ${fig(openC)} °C`, rect.x1 - 8, rect.y0 + 22);
  ctx.fillStyle = C.muted;
  ctx.fillText(where, rect.x1 - 8, rect.y0 + 40);
  ctx.restore();
}

function band(S, x0, x1, y0, y1, fill, stroke) {
  const { ctx, X, Y } = S;
  ctx.beginPath();
  ctx.rect(X(x0), Y(Math.max(y0, y1)), X(x1) - X(x0), Math.abs(Y(y0) - Y(y1)));
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function rounded(S, x, y, w, h, r, fill, stroke) {
  const { ctx, X, Y, k } = S;
  roundPx(ctx, X(x), Y(y + h), w * k, h * k, r * k);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function roundPx(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function water(S, t, hot) {
  const { ctx, X, Y } = S;
  ctx.beginPath();
  ctx.moveTo(X(-0.72), Y(0.08));
  for (let i = 0; i <= 28; i++) {
    const x = -0.72 + (1.44 * i) / 28;
    const y = 0.58 + Math.sin(t * 2.4 + i * 0.45) * (0.012 + 0.02 * hot);
    ctx.lineTo(X(x), Y(y));
  }
  ctx.lineTo(X(0.72), Y(0.08));
  ctx.closePath();
  ctx.fillStyle = alpha(C.blue, 0.35 + 0.25 * hot);
  ctx.fill();
}

function bubbles(S, t, hot) {
  const n = Math.round(hot * 7);
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = alpha(C.text, 0.55);
  for (let i = 0; i < n; i++) {
    const phase = (t * 0.55 + i * 0.17) % 1;
    const x = -0.5 + ((i * 0.23) % 1);
    const y = 0.14 + phase * 0.4;
    ctx.beginPath();
    ctx.arc(X(x), Y(y), (0.025 + 0.02 * phase) * k, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function steam(S, t, lift, x0, y0) {
  if (lift < 0.04) return;
  const { ctx, X, Y, k } = S;
  const n = 6 + Math.round(lift * 4);
  for (let i = 0; i < n; i++) {
    const phase = (t * (0.4 + 0.5 * lift) + i / n) % 1;
    const side = i % 2 === 0 ? -1 : 1;
    const x = x0 + side * (0.04 + 0.1 * phase) + Math.sin(t * 2.5 + i) * 0.03;
    const y = y0 + phase * (0.28 + 0.4 * lift);
    ctx.fillStyle = alpha(C.text, 0.22 + (1 - phase) * (0.35 + 0.4 * lift));
    ctx.beginPath();
    ctx.ellipse(X(x), Y(y), (0.06 + 0.1 * phase) * k, (0.04 + 0.07 * phase) * k, 0, 0, 2 * Math.PI);
    ctx.fill();
  }
}
