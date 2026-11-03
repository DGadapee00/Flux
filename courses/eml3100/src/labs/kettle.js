import { fromC, satP, toC, waterTP } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, chart, clip, dot, fit, line, panes, stage } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a covered pot on a coil burner is a constant-pressure closed system until the water
 * boils: the heat is m Δh, the boundary work is only the tiny swell of the liquid, and the time
 * is that heat divided by the power that enters the water.
 *
 * Cited: DOE's residential cooking baseline gives an open-coil cooktop two 6-inch elements at
 * 1250 W and two 8-inch elements at 2100 W, with a cooking efficiency of 73.7% (1996 TSD, restated
 * in the 2005 priority-setting appendix). DOE's Energy Saver guide says to boil water in a covered
 * kettle or pan. The 1 kg load, the 0.5 kg load and the 20°C start are assumed. Sea-level pressure
 * is 101325 Pa. Second method: m ∫ c_p dT against m Δh, and m Δu + P ΔV against m Δh.
 */

const P_ATM = 101325;
const ETA = 0.737;
const OUT = 'The 73.7% is a test-load average for the element, not a measurement on this pot. The pot\'s metal and the lid take some of the heat, and a loose lid lets vapour leave, so the water receives less than the model assigns it. The clock stops at the boiling temperature. Evaporating the water would take the latent heat as well, which is several times the warm-up. The 1 kg and 0.5 kg loads and the starting temperature are assumed.';

const SCENARIOS = [
  { id: 'six', name: '6-inch coil, 1 kg', power: 1250, m: 1, T1: fromC(20) },
  { id: 'eight', name: '8-inch coil, 1 kg', power: 2100, m: 1, T1: fromC(20) },
  { id: 'half', name: '6-inch coil, 0.5 kg', power: 1250, m: 0.5, T1: fromC(20) },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.power = sc.power;
  state.m = sc.m;
  state.T1 = sc.T1;
}

function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

const CONTROLS = [
  { id: 'kt-m', key: 'm', label: 'mass of water (kg)', lo: 0.25, hi: 2, step: 0.05 },
  { id: 'kt-T', key: 'T1', label: 'starting temperature (°C)', lo: 5, hi: 90, step: 1, c: true },
  { id: 'kt-W', key: 'power', label: 'element rating (W)', lo: 1000, hi: 2100, step: 50 },
];

export default defineLab({
  id: 'kettle',
  exam: 'u2',
  title: 'Boiling on a coil',
  hint: 'Heat at constant pressure is m Δh. The element rating and the cooking efficiency set how long the warm-up takes.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = { t: 0 };
    apply('six', s);
    return s;
  },
  tick(dt, state) {
    state.t = (state.t || 0) + dt;
    return true;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'm', lo: 0.25, hi: 2 }),
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Cited: DOE coil elements, 6-inch 1250 W and 8-inch 2100 W, cooking efficiency 73.7%. A covered kettle is the DOE Energy Saver advice. Assumed: 1 kg or 0.5 kg of water, 20°C start, 101325 Pa, heat stops at the boil.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = c.c ? fromC(v) : v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, true);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      const v = c.c ? toC(state[c.key]) : state[c.key];
      el.value = String(v);
    }
  },
  compute(state) {
    const T2 = satP(P_ATM).T;
    const T1 = Math.min(state.T1, T2 - 2);
    const a = waterTP(T1, P_ATM);
    const b = waterTP(T2, P_ATM);
    const q = state.m * (b.h - a.h);
    const byCp = state.m * simpson((T) => waterTP(T, P_ATM).cp, T1, T2);
    const byU = state.m * (b.u - a.u) + P_ATM * state.m * (b.v - a.v);
    const into = state.power * ETA;
    return {
      T1, T2, q, dh: b.h - a.h, time: q / into, into, Wb: P_ATM * state.m * (b.v - a.v),
      gap: Math.max(rel(q, byCp), rel(q, byU)),
    };
  },
  draw(canvas, state, c) {
    const samples = [];
    let peak = c.time;
    for (let i = 0; i <= 40; i++) {
      const m = 0.25 + ((2 - 0.25) * i) / 40;
      const t = (m * c.dh) / c.into;
      samples.push([m, t]);
      peak = Math.max(peak, t);
    }
    const B = stage(canvas);
    const [machine, plot] = panes(B.free, 0.64);
    drawKettle(B.ctx, machine, state, c);
    const P = chart(B.ctx, plot, { lo: 0.25, hi: 2 }, { lo: 0, hi: peak * 1.08 }, {
      left: 48, right: 12, top: 22, bottom: 40,
    });
    clip(B.ctx, plot);
    axes(P, { xLabel: 'mass (kg)', yLabel: '', yCount: P.box.y1 - P.box.y0 < 130 ? 3 : 5 });
    B.ctx.font = '13px Inter, system-ui, sans-serif';
    B.ctx.fillStyle = C.muted;
    B.ctx.textAlign = 'left';
    B.ctx.textBaseline = 'top';
    B.ctx.fillText('time (s)', P.box.x0, plot.y0 + 3);
    line(P, samples, { color: C.teal, width: 2.5 });
    line(P, [[0.25, c.time], [2, c.time]], { color: alpha(C.gold, 0.85), width: 2, dash: [5, 4] });
    dot(P, state.m, c.time, { color: C.yellow, r: 4 });
    B.ctx.restore();
  },
  law: () => [String.raw`Q = m(h_2 - h_1)`, String.raw`t = Q/(\eta \dot W)`],
  liveRows(state, c) {
    return [
      kv('heat into the water', `${fig(c.q / 1000)} kJ`),
      kv('power into the water', `${fig(c.into)} W`),
      kv('time to the boil', `${fig(c.time)} s`),
      kv('boundary work', `${fig(c.Wb)} J`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['heat', `${fig(c.q / 1000)} kJ`],
      ['time', `${fig(c.time)} s`],
      ['into the water', `${fig(c.into)} W`],
      ['boil', `${fig(toC(c.T2))} °C`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Wb < 10 ? 'Almost no boundary work' : 'Constant pressure',
    body: String.raw`The element is rated ${fig(state.power)} W. At 73.7% cooking efficiency, ${fig(c.into)} W enters the water. Heating ${fig(state.m)} kg from ${fig(toC(c.T1))} °C to ${fig(toC(c.T2))} °C takes ${fig(c.q / 1000)} kJ and ${fig(c.time)} s. The liquid swells a little, and that boundary work is only ${fig(c.Wb)} J, so Q and m Δu agree to a fraction of a percent. The heat at constant pressure is m Δh.`,
  })),
});

/** A covered kettle on an open coil. One visual cycle stands for the whole warm-up. */
function drawKettle(ctx, rect, state, c) {
  clip(ctx, rect);
  const S = fit(ctx, rect, { x0: -1.9, x1: 1.9, y0: -0.55, y1: 2.15 }, 8);
  const t = state.t || 0;
  const frac = (t % 8) / 8;
  const glow = Math.max(0, Math.min(1, (state.power - 800) / 1400));
  const level = 0.28 + ((Math.min(2, Math.max(0.25, state.m)) - 0.25) / 1.75) * 0.72;
  const Tnow = c.T1 + frac * (c.T2 - c.T1);
  const hot = Math.max(0, Math.min(1, (toC(Tnow) - 20) / 80));

  // Coil: two rings, brighter as the element rating rises.
  for (const rad of [0.85, 0.55]) {
    ctx.strokeStyle = alpha(C.red, 0.25 + 0.65 * glow);
    ctx.lineWidth = 4 + 2 * glow;
    ctx.beginPath();
    ctx.ellipse(S.X(0), S.Y(-0.05), rad * S.k, 0.14 * S.k, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = alpha(C.gold, 0.15 + 0.45 * glow);
  ctx.beginPath();
  ctx.ellipse(S.X(0), S.Y(-0.02), 0.35 * S.k, 0.08 * S.k, 0, 0, 2 * Math.PI);
  ctx.fill();

  rounded(S, -0.85, 0.08, 1.7, 1.35, 0.16, alpha(C.text, 0.12), alpha(C.text, 0.75));
  // Water, higher when the mass slider rises, warmer as the cycle approaches the boil.
  ctx.beginPath();
  ctx.moveTo(S.X(-0.78), S.Y(0.16));
  for (let i = 0; i <= 24; i++) {
    const x = -0.78 + (1.56 * i) / 24;
    const y = 0.16 + level + Math.sin(t * 3 + i * 0.5) * (0.01 + 0.015 * hot);
    ctx.lineTo(S.X(x), S.Y(y));
  }
  ctx.lineTo(S.X(0.78), S.Y(0.16));
  ctx.closePath();
  ctx.fillStyle = alpha(C.blue, 0.28 + 0.4 * hot);
  ctx.fill();

  const n = Math.round(hot * 8);
  ctx.fillStyle = alpha(C.text, 0.6);
  for (let i = 0; i < n; i++) {
    const phase = (t * 0.6 + i * 0.13) % 1;
    const x = -0.55 + ((i * 0.22) % 1.1);
    const y = 0.22 + phase * level * 0.85;
    ctx.beginPath();
    ctx.arc(S.X(x), S.Y(y), (0.03 + 0.02 * phase) * S.k, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Lid, spout, handle. Steam leaves the spout near the end of the warm-up.
  rounded(S, -0.98, 1.32, 1.96, 0.14, 0.05, alpha(C.text, 0.22), C.text);
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(S.X(0), S.Y(1.5), 0.07 * S.k, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = alpha(C.text, 0.16);
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(S.X(0.7), S.Y(0.9));
  ctx.lineTo(S.X(1.22), S.Y(1.12));
  ctx.lineTo(S.X(1.22), S.Y(1.26));
  ctx.lineTo(S.X(0.74), S.Y(1.08));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(S.X(-1.02), S.Y(0.72), 0.34 * S.k, Math.PI * 0.55, Math.PI * 1.5);
  ctx.stroke();

  if (hot > 0.55) {
    const puff = 3 + Math.round(hot * 3);
    for (let i = 0; i < puff; i++) {
      const phase = (t * 0.7 + i / puff) % 1;
      ctx.fillStyle = alpha(C.text, 0.15 + (1 - phase) * 0.45 * hot);
      ctx.beginPath();
      ctx.ellipse(
        S.X(1.28 + Math.sin(t * 2 + i) * 0.06),
        S.Y(1.4 + phase * 0.45),
        (0.05 + 0.06 * phase) * S.k,
        (0.035 + 0.04 * phase) * S.k,
        0, 0, 2 * Math.PI,
      );
      ctx.fill();
    }
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.yellow;
  ctx.fillText(`${fig(toC(Tnow))} °C`, rect.x1 - 8, rect.y0 + 4);
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.muted;
  ctx.fillText(`${fig(frac * c.time)} s of ${fig(c.time)} s`, rect.x1 - 8, rect.y0 + 24);
  ctx.fillText(`${fig(state.power)} W coil`, rect.x1 - 8, rect.y0 + 42);
  ctx.restore();
}

function rounded(S, x, y, w, h, r, fill, stroke) {
  const { ctx, X, Y, k } = S;
  const px = X(x);
  const py = Y(y + h);
  const pw = w * k;
  const ph = h * k;
  const radius = Math.min(r * k, Math.abs(pw) / 2, Math.abs(ph) / 2);
  ctx.beginPath();
  ctx.moveTo(px + radius, py);
  ctx.arcTo(px + pw, py, px + pw, py + ph, radius);
  ctx.arcTo(px + pw, py + ph, px, py + ph, radius);
  ctx.arcTo(px, py + ph, px, py, radius);
  ctx.arcTo(px, py, px + pw, py, radius);
  ctx.closePath();
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
