import { J_PER_BTU, K_PER_R, M_PER_FT } from '@flux/subjects/convert.js';
import { fromC, reservoirGeneration, toC, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, chart, clip, dot, fit, line, note, panes, stage } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that heat crossing a wall from a warm room to cold air generates entropy, and that the
 * generation shrinks as the two temperatures approach each other.
 *
 * Cited: US DOE, from the 2021 IECC, climate zone 4 except marine. An uninsulated attic ceiling
 * is R-60. An uninsulated 2×4 wood-frame wall is met by R-20 plus R-5 continuous insulation,
 * or by R-13 plus R-10 continuous, or by R-20 continuous alone.
 * https://www.energy.gov/cmei/buildings/articles/energy-efficient-home-improvement-credit-insulation-and-air-sealing
 * The indoor temperature, the outdoor temperature and the area are assumed.
 */

/** R in h·ft²·°F/Btu, returned as m²·K/W, from the exact foot, Btu and rankine. */
export function rIpToSi(rIp) {
  return rIp * M_PER_FT ** 2 * K_PER_R * 3600 / J_PER_BTU;
}

const OUT = 'The R-value is a layer sum. Studs, plates and a window are a parallel path with a lower R, so the real heat loss is larger. Air leaks through the same wall and carry enthalpy the conduction model never sees. The outdoor temperature also moves through the day, and the wall itself stores heat while it does.';

const LAYERS = {
  ceiling: 60,
  wall: 25,
  fill: 23,
  board: 20,
};

const SCENARIOS = [
  { id: 'ceiling', name: 'Attic ceiling, R-60', layer: 'ceiling', Tin: fromC(21), Tout: fromC(0), area: 80 },
  { id: 'wall', name: 'Wood-frame wall, R-20 + R-5', layer: 'wall', Tin: fromC(21), Tout: fromC(0), area: 40 },
  { id: 'mild', name: 'The same wall on a milder day', layer: 'wall', Tin: fromC(21), Tout: fromC(10), area: 40 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, layer: sc.layer, Tin: sc.Tin, Tout: sc.Tout, area: sc.area,
  });
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

export default defineLab({
  id: 'wall',
  exam: 'u5',
  title: 'Heat through a wall',
  hint: 'A temperature difference pushes heat through the wall, and that heat generates entropy in the two rooms.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = { t: 0 };
    apply('wall', s);
    return s;
  },
  tick(dt, state) {
    state.t = (state.t || 0) + dt;
    return true;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'Tout', lo: fromC(-10), hi: state.Tin - 2 };
  },
  controls() {
    return `${slider('wl-out', 'outdoor temperature (°C)', 0, -10, 18, 1)}
      ${slider('wl-area', 'area (m²)', 40, 10, 120, 5)}
      <p class="tiny">Cited: DOE, from the 2021 IECC, climate zone 4 except marine. Ceiling R-60 for an uninsulated attic. Wall options for an uninsulated 2×4 frame: R-20 + R-5 continuous, R-13 + R-10 continuous, or R-20 continuous. Assumed: 21 °C indoors, and the areas above.</p>`;
  },
  bind(api) {
    bindSlider('wl-out', (s, v) => { s.Tout = fromC(v); }, api);
    bindSlider('wl-area', (s, v) => { s.area = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el || document.activeElement === el) return;
      el.value = String(Number(val.toPrecision(5)));
    };
    set('wl-out', toC(state.Tout));
    set('wl-area', state.area);
  },
  compute(state) {
    const Tin = state.Tin;
    const Tout = Math.min(state.Tout, Tin - 0.5);
    const area = Math.min(Math.max(state.area, 1), 200);
    const rIp = LAYERS[state.layer] || 25;
    const rSi = rIpToSi(rIp);
    const q = (area * (Tin - Tout)) / rSi;
    const areaFt = area / M_PER_FT ** 2;
    const dTf = (Tin - Tout) / K_PER_R;
    const qIp = (areaFt * dTf / rIp) * (J_PER_BTU / 3600);
    const sgen = reservoirGeneration(q, Tin, Tout);
    const tinR = toF(Tin) + 459.67;
    const toutR = toF(Tout) + 459.67;
    const sgenR = q * (1 / (toutR * K_PER_R) - 1 / (tinR * K_PER_R));
    return {
      Tin, Tout, area, rIp, rSi, q, qIp, sgen, sgenR,
      lost: Tin * sgen,
      gap: Math.max(rel(q, qIp), rel(sgen, sgenR)),
    };
  },
  draw(canvas, state, c) {
    const lo = -10;
    const hi = 18;
    const samples = [];
    let peak = 1;
    for (let i = 0; i <= 40; i++) {
      const tC = lo + ((hi - lo) * i) / 40;
      const Tout = fromC(tC);
      const q = (c.area * (c.Tin - Tout)) / c.rSi;
      samples.push([tC, q]);
      peak = Math.max(peak, q);
    }
    const B = stage(canvas);
    const tall = B.free.y1 - B.free.y0;
    const [machine, plot] = panes(B.free, tall < 280 ? 0.56 : 0.62);
    drawHouse(B.ctx, machine, state, c);
    const plotH = plot.y1 - plot.y0;
    const P = chart(B.ctx, plot, { lo, hi }, { lo: 0, hi: peak * 1.15 }, {
      left: plotH < 120 ? 44 : 52, right: 10, top: plotH < 120 ? 16 : 22, bottom: 40,
    });
    clip(B.ctx, plot);
    const boxH = P.box.y1 - P.box.y0;
    axes(P, { xLabel: 'outdoor °C', yLabel: '', yCount: boxH < 72 ? 0 : boxH < 140 ? 3 : 5 });
    B.ctx.font = '13px Inter, system-ui, sans-serif';
    B.ctx.fillStyle = C.muted;
    B.ctx.textAlign = 'left';
    B.ctx.textBaseline = 'top';
    B.ctx.fillText('heat loss (W)', P.box.x0, plot.y0 + 3);
    line(P, samples, { color: C.teal, width: 2 });
    dot(P, toC(c.Tout), c.q, { color: C.yellow, r: 5 });
    note(P, `R-${c.rIp}`, lo + 4, peak * 0.72, { color: C.teal });
    B.ctx.restore();
  },
  law: () => [String.raw`\dot Q = A\,\Delta T / R`, String.raw`\dot S_\mathrm{gen} = \dot Q(1/T_L - 1/T_H)`],
  liveRows(state, c) {
    return [
      kv('R, SI', `${fig(c.rSi)} m²·K/W`),
      kv('heat, from R in SI', `${fig(c.q)} W`),
      kv('heat, from R in IP', `${fig(c.qIp)} W`),
      kv('S_gen', `${fig(c.sgen)} W/K`),
      kv('S_gen from rankine', `${fig(c.sgenR)} W/K`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['R', `R-${c.rIp}`],
      ['Q', `${fig(c.q)} W`],
      ['S_gen', `${fig(c.sgen)} W/K`],
      ['lost work', `${fig(c.lost)} W`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Tout < fromC(5) ? 'A cold day makes more entropy' : 'A smaller difference wastes less',
    body: String.raw`R-${c.rIp} is ${fig(c.rSi)} m²·K/W. Across ${fig(c.area)} m² the heat loss is ${fig(c.q)} W. That heat leaves ${fig(toC(c.Tin))} °C and arrives at ${fig(toC(c.Tout))} °C, generating ${fig(c.sgen)} W/K. The work that generation makes unavailable, against the room, is ${fig(c.lost)} W.`,
  })),
});

function drawHouse(ctx, rect, state, c) {
  clip(ctx, rect);
  const S = fit(ctx, rect, { x0: -2.6, x1: 2.7, y0: -0.2, y1: 2.2 }, 8);
  const t = state.t || 0;
  const outC = toC(c.Tout);
  const cold = Math.max(0, Math.min(1, (toC(c.Tin) - outC) / 31));
  const flow = Math.max(0, Math.min(1, c.q / 650));
  if (state.layer === 'ceiling') drawCeiling(S, t, cold, flow, c);
  else drawWall(S, t, cold, flow, c);
  ctx.restore();
}

function drawWall(S, t, cold, flow, c) {
  const { ctx, X, Y } = S;
  wash(S, 0.5, -0.2, 2.2, 2.15, alpha(C.blue, 0.05 + 0.3 * cold));
  wash(S, -2.5, 0, 1.7, 1.7, alpha(C.gold, 0.07));
  wash(S, -2.5, 0, 1.7, 1.7, alpha(C.red, 0.05));
  rule(S, -2.45, -0.85, 0);
  rule(S, 0.55, 2.55, 0);

  block(S, -0.84, 0, 0.14, 1.72, alpha(C.text, 0.28), alpha(C.text, 0.55));
  block(S, -0.7, 0.08, 1.02, 1.56, alpha(C.pink, 0.38), null);
  batts(S, -0.66, 0.28, 0.16, 1.6);
  for (const x of [-0.7, -0.22, 0.22]) block(S, x, 0, 0.1, 1.72, alpha(C.gold, 0.55), alpha(C.gold, 0.85));
  block(S, -0.7, 0, 1.02, 0.1, alpha(C.gold, 0.6), null);
  block(S, -0.7, 1.62, 1.02, 0.1, alpha(C.gold, 0.6), null);
  block(S, 0.32, 0, 0.12, 1.72, alpha(C.text, 0.2), alpha(C.text, 0.4));
  siding(S, 0.44, 0.16, 1.72);

  if (cold > 0.4) snow(S, t, cold);
  drift(S, t, flow, 'right');

  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.gold;
  ctx.fillText(`${fig(toC(c.Tin))} °C inside`, X(-2.4), Y(2.02));
  ctx.textAlign = 'right';
  ctx.fillStyle = cold > 0.4 ? C.blue : C.teal;
  ctx.fillText(`${fig(toC(c.Tout))} °C outside`, X(2.5), Y(2.02));
  pill(S, -1.55, 1.15, `${fig(c.q)} W`, C.yellow);
  pill(S, -0.15, 0.9, `R-${c.rIp}`, C.pink);
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${fig(c.area)} m²`, X(-1.55), Y(0.42));
}

function drawCeiling(S, t, cold, flow, c) {
  const { ctx, X, Y } = S;
  ctx.fillStyle = alpha(C.blue, 0.06 + 0.28 * cold);
  ctx.beginPath();
  ctx.moveTo(X(-2.35), Y(1.15));
  ctx.lineTo(X(0), Y(2.05));
  ctx.lineTo(X(2.35), Y(1.15));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = alpha(C.text, 0.65);
  ctx.lineWidth = 2;
  ctx.stroke();

  wash(S, -2.2, 0, 4.4, 0.58, alpha(C.gold, 0.08));
  wash(S, -2.2, 0, 4.4, 0.58, alpha(C.red, 0.05));
  rule(S, -2.2, 2.2, 0);
  block(S, -2.15, 0.58, 4.3, 0.1, alpha(C.text, 0.28), alpha(C.text, 0.5));
  block(S, -2.15, 0.68, 4.3, 0.55, alpha(C.pink, 0.4), null);
  for (const x of [-1.7, -0.7, 0.3, 1.3]) block(S, x, 0.68, 0.1, 0.55, alpha(C.gold, 0.55), alpha(C.gold, 0.8));
  batts(S, -2.05, 2.05, 0.74, 1.16);

  if (cold > 0.4) snow(S, t, cold, true);
  drift(S, t, flow, 'up');

  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.gold;
  ctx.fillText(`${fig(toC(c.Tin))} °C inside`, X(-2.15), Y(0.48));
  ctx.textAlign = 'center';
  ctx.fillStyle = cold > 0.4 ? C.blue : C.teal;
  ctx.fillText(`${fig(toC(c.Tout))} °C attic`, X(0), Y(1.72));
  pill(S, -1.3, 0.28, `${fig(c.q)} W`, C.yellow);
  pill(S, 0.5, 0.95, `R-${c.rIp}`, C.pink);
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${fig(c.area)} m²`, X(0.15), Y(0.28));
}

function wash(S, x, y, w, h, fill) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = fill;
  ctx.fillRect(X(x), Y(y + h), w * k, h * k);
}

function rule(S, x0, x1, y) {
  const { ctx, X, Y } = S;
  ctx.strokeStyle = alpha(C.text, 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(x0), Y(y));
  ctx.lineTo(X(x1), Y(y));
  ctx.stroke();
}

function block(S, x, y, w, h, fill, stroke) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = fill;
  ctx.fillRect(X(x), Y(y + h), w * k, h * k);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(X(x), Y(y + h), w * k, h * k);
  }
}

function batts(S, x0, x1, y0, y1) {
  const { ctx, X, Y } = S;
  ctx.strokeStyle = alpha(C.pink, 0.75);
  ctx.lineWidth = 1.25;
  const bays = 4;
  for (let b = 0; b < bays; b++) {
    const mid = x0 + ((x1 - x0) * (b + 0.5)) / bays;
    const amp = (x1 - x0) / bays * 0.18;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const y = y0 + ((y1 - y0) * i) / 14;
      const x = mid + Math.sin(i * 1.15 + b) * amp;
      if (i === 0) ctx.moveTo(X(x), Y(y));
      else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();
  }
}

function siding(S, x, w, h) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = alpha(C.text, 0.1);
  ctx.fillRect(X(x), Y(h), w * k, h * k);
  ctx.strokeStyle = alpha(C.text, 0.45);
  ctx.lineWidth = 1;
  for (let y = 0.08; y < h; y += 0.14) {
    ctx.beginPath();
    ctx.moveTo(X(x), Y(y));
    ctx.lineTo(X(x + w), Y(y));
    ctx.stroke();
  }
}

function snow(S, t, cold, attic = false) {
  const { ctx, X, Y, k } = S;
  const n = 5 + Math.round(cold * 6);
  for (let i = 0; i < n; i++) {
    const phase = (t * (0.08 + cold * 0.12) + i / n) % 1;
    const x = attic ? -1.4 + (i * 0.41) % 2.8 : 0.85 + (i * 0.29) % 1.5;
    const y = (attic ? 1.62 : 1.65) - phase * (attic ? 0.32 : 1.4);
    if (attic && y > 2.02 - Math.abs(x) * 0.38) continue;
    ctx.fillStyle = alpha(C.text, 0.35 + 0.5 * (1 - phase));
    ctx.beginPath();
    ctx.arc(X(x), Y(y), (0.025 + (i % 2) * 0.012) * k, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drift(S, t, flow, dir) {
  const n = 1 + Math.round(flow * 9);
  const speed = 0.12 + flow * 0.4;
  const len = 0.2 + flow * 0.2;
  for (let i = 0; i < n; i++) {
    const phase = (t * speed + i / n) % 1;
    const fade = 0.72 + 0.28 * Math.sin(phase * Math.PI);
    if (dir === 'right') {
      const x = -2.15 + phase * 3.5;
      const y = 0.32 + (i % 4) * 0.32;
      arrow(S, x, y, len, C.yellow, fade, 'right');
    } else {
      const x = -1.5 + (i % 5) * 0.7;
      const y = 0.12 + phase * 1.35;
      arrow(S, x, y, len, C.yellow, fade, 'up');
    }
  }
}

function arrow(S, x, y, len, color, a, dir) {
  const { ctx, X, Y, k } = S;
  ctx.strokeStyle = alpha(color, a);
  ctx.fillStyle = alpha(color, a);
  ctx.lineWidth = Math.max(1.5, 0.035 * k);
  ctx.lineCap = 'round';
  const head = 0.09;
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(X(x), Y(y));
    ctx.lineTo(X(x + len), Y(y));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X(x + len + 0.02), Y(y));
    ctx.lineTo(X(x + len - head), Y(y + head * 0.6));
    ctx.lineTo(X(x + len - head), Y(y - head * 0.6));
  } else {
    ctx.moveTo(X(x), Y(y));
    ctx.lineTo(X(x), Y(y + len));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X(x), Y(y + len + 0.02));
    ctx.lineTo(X(x - head * 0.6), Y(y + len - head));
    ctx.lineTo(X(x + head * 0.6), Y(y + len - head));
  }
  ctx.closePath();
  ctx.fill();
}

function pill(S, x, y, text, color) {
  const { ctx, X, Y } = S;
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  const px = X(x);
  const py = Y(y);
  ctx.fillStyle = alpha(C.bg, 0.82);
  ctx.beginPath();
  ctx.roundRect(px - w / 2 - 7, py - 10, w + 14, 20, 4);
  ctx.fill();
  ctx.strokeStyle = alpha(color, 0.95);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, px, py);
}
