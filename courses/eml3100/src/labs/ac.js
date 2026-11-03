import { J_PER_BTU } from '@flux/subjects/convert.js';
import { carnotEfficiency, copRefrigerator, fromF, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, chart, clip, dot, fit, line, note, panes, stage } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a unitary air conditioner, rated at the AHRI cooling temperatures, has a COP far
 * below the Carnot COP between the indoor and outdoor air, and that a hotter outdoor temperature
 * lowers the limit while the nameplate stays put.
 *
 * Cited: AHRI 210/240 cooling condition AFull, 95 °F outdoor dry-bulb and 80 °F indoor dry-bulb.
 * The capacity and the EER are assumed, so the lab is about the gap to the limit and not about
 * one model. The indoor wet-bulb of that test is left out.
 */

const W_PER_BTU_H = J_PER_BTU / 3600;

const OUT = 'The air temperatures are not the refrigerant temperatures. The evaporator is colder than the room and the condenser is hotter than the outdoors, so the Carnot COP between the two air streams is a generous ceiling. The test also fixes a wet-bulb temperature, and the cooling load is partly latent. Fans, cycling and a dirty coil move the power. The nameplate EER is one test point, not a constant.';

const SCENARIOS = [
  { id: 'rated', name: 'Rating condition', Tin: fromF(80), Tout: fromF(95), btu: 36000, eer: 11 },
  { id: 'hot', name: 'A hotter afternoon', Tin: fromF(80), Tout: fromF(105), btu: 36000, eer: 11 },
  { id: 'mild', name: 'A milder afternoon', Tin: fromF(80), Tout: fromF(85), btu: 36000, eer: 11 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Tin: sc.Tin, Tout: sc.Tout, btu: sc.btu, eer: sc.eer });
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

export default defineLab({
  id: 'ac',
  exam: 'u4',
  title: 'Air conditioner',
  hint: 'The nameplate COP is a small fraction of the Carnot COP between the room and the outdoors.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = { t: 0 };
    apply('rated', s);
    return s;
  },
  tick(dt, state) {
    state.t = (state.t || 0) + dt;
    return true;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'Tout', lo: Math.max(fromF(82), state.Tin + 1.5), hi: fromF(115) };
  },
  controls() {
    return `${slider('ac-out', 'outdoor temperature (°F)', 95, 82, 115, 1)}
      ${slider('ac-eer', 'nameplate EER (Btu/h per W)', 11, 8, 16, 0.5)}
      ${slider('ac-btu', 'cooling capacity (Btu/h)', 36000, 12000, 60000, 1000)}
      <p class="tiny">Cited: AHRI 210/240 condition AFull is 95 °F outdoors and 80 °F indoors, dry-bulb. Assumed: 36,000 Btu/h and EER 11 at that point. The indoor temperature stays at 80 °F.</p>`;
  },
  bind(api) {
    bindSlider('ac-out', (s, v) => { s.Tout = fromF(v); }, api);
    bindSlider('ac-eer', (s, v) => { s.eer = v; }, api);
    bindSlider('ac-btu', (s, v) => { s.btu = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el || document.activeElement === el) return;
      el.value = String(Number(val.toPrecision(5)));
    };
    set('ac-out', toF(state.Tout));
    set('ac-eer', state.eer);
    set('ac-btu', state.btu);
  },
  compute(state) {
    const Tin = state.Tin;
    const Tout = Math.max(state.Tout, Tin + 0.5);
    const eer = Math.min(Math.max(state.eer, 5), 20);
    const btu = Math.min(Math.max(state.btu, 5000), 65000);
    const copK = copRefrigerator(Tin, Tout);
    const tinR = toF(Tin) + 459.67;
    const toutR = toF(Tout) + 459.67;
    const copR = tinR / (toutR - tinR);
    const copE = eer * W_PER_BTU_H;
    const coolW = btu * W_PER_BTU_H;
    const power = btu / eer;
    const copW = coolW / power;
    const eta = carnotEfficiency(Tin, Tout);
    return {
      Tin,
      Tout,
      eer,
      btu,
      copK,
      copR,
      copE,
      copW,
      coolW,
      power,
      eta,
      ratio: copE / copK,
      gap: Math.max(rel(copK, copR), rel(copE, copW)),
    };
  },
  draw(canvas, state, c) {
    const loF = 82;
    const hiF = 115;
    const samples = [];
    let peak = c.copE;
    for (let i = 0; i <= 60; i++) {
      const F = loF + ((hiF - loF) * i) / 60;
      const cop = copRefrigerator(fromF(80), fromF(F));
      samples.push([F, cop]);
      peak = Math.max(peak, cop);
    }
    const B = stage(canvas);
    const tall = B.free.y1 - B.free.y0;
    const [machine, plot] = panes(B.free, tall < 280 ? 0.54 : 0.62);
    drawUnit(B.ctx, machine, state, c);
    const plotH = plot.y1 - plot.y0;
    const P = chart(B.ctx, plot, { lo: loF, hi: hiF }, { lo: 0, hi: peak * 1.15 }, {
      left: plotH < 120 ? 36 : 48, right: 10, top: plotH < 120 ? 16 : 22, bottom: 40,
    });
    clip(B.ctx, plot);
    const boxH = P.box.y1 - P.box.y0;
    axes(P, { xLabel: 'outdoor °F', yLabel: '', yCount: boxH < 72 ? 0 : boxH < 140 ? 3 : 5 });
    B.ctx.font = '13px Inter, system-ui, sans-serif';
    B.ctx.fillStyle = C.muted;
    B.ctx.textAlign = 'left';
    B.ctx.textBaseline = 'top';
    B.ctx.fillText('COP', P.box.x0, plot.y0 + 3);
    line(P, samples, { color: C.teal, width: 2 });
    line(P, [[loF, c.copE], [hiF, c.copE]], { color: C.yellow, width: 2, dash: [5, 4] });
    dot(P, toF(c.Tout), c.copK, { color: C.teal, r: 5 });
    dot(P, toF(c.Tout), c.copE, { color: C.yellow, r: 5 });
    note(P, 'Carnot', samples[8][0], samples[8][1], { color: C.teal });
    note(P, 'nameplate', hiF - 8, c.copE, { align: 'right', color: C.yellow, dy: -8 });
    B.ctx.restore();
  },
  law: () => [String.raw`\mathrm{COP_R} = T_L/(T_H - T_L)`, String.raw`\mathrm{COP} = \mathrm{EER}\times(\mathrm{Btu/h})/\mathrm{W}`],
  liveRows(state, c) {
    return [
      kv('Carnot COP, kelvin', fig(c.copK)),
      kv('Carnot COP, rankine', fig(c.copR)),
      kv('nameplate, from EER', fig(c.copE)),
      kv('nameplate, from watts', fig(c.copW)),
      kv('cooling', `${fig(c.coolW / 1000)} kW`),
      kv('electric power', `${fig(c.power / 1000)} kW`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Carnot COP', fig(c.copK)],
      ['nameplate COP', fig(c.copE)],
      ['power', `${fig(c.power / 1000)} kW`],
      ['nameplate / Carnot', fig(c.ratio)],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Tout > fromF(100) ? 'The ceiling falls on a hot day' : 'A wide gap at the rating point',
    body: String.raw`Between ${fig(toF(c.Tin))} °F indoors and ${fig(toF(c.Tout))} °F outdoors the Carnot COP is ${fig(c.copK)}. The nameplate, EER ${fig(c.eer)}, is a COP of ${fig(c.copE)}, about ${fig(c.ratio * 100)}% of that ceiling. The electric power at ${fig(c.btu)} Btu/h is ${fig(c.power / 1000)} kW.`,
  })),
});

/** Refrigerant loop inside the window unit, in machine coordinates. */
const LOOP = { xL: -1.38, xC: 0.58, xR: 1.22, yB: 0.5, yT: 1.16 };

function drawUnit(ctx, rect, state, c) {
  clip(ctx, rect);
  const S = fit(ctx, rect, { x0: -2.7, x1: 2.75, y0: -0.2, y1: 2.2 }, 8);
  const t = state.t || 0;
  const hot = Math.max(0, Math.min(1, (toF(c.Tout) - 82) / 33));
  const cap = Math.max(0, Math.min(1, (c.btu - 12000) / 48000));
  const load = Math.max(0, Math.min(1, (c.power / 1000 - 0.6) / 6.5));
  const outdoor = hot > 0.55 ? C.red : C.gold;

  wash(S, -2.7, -0.22, 2.48, 2.15, alpha(C.blue, 0.07));
  wash(S, 0.22, -0.22, 2.53, 2.15, alpha(C.gold, 0.05));
  wash(S, 0.22, -0.22, 2.53, 2.15, alpha(C.red, 0.04 + 0.22 * hot));

  rule(S, -2.55, -0.22, 0);
  rule(S, 0.34, 2.6, 0);
  wall(S);
  sill(S);

  rounded(S, -1.92, 0.4, 1.74, 0.9, 0.08, alpha(C.blue, 0.14), alpha(C.blue, 0.85));
  rounded(S, 0.18, 0.12, 1.92, 1.28, 0.08, alpha(outdoor, 0.1 + 0.12 * hot), alpha(outdoor, 0.9));

  fins(S, -1.22, 0.58, 1.08, 5, C.blue, 0.85);
  fins(S, 0.9, 0.56, 1.08, 5, outdoor, 0.9);
  pipes(S);
  compressor(S, t, load);
  fan(S, 1.62, 0.78, 0.3, t * (4 + 9 * cap));
  louvers(S);
  coolAir(S, t, cap);
  heatAir(S, t, hot, cap, outdoor);
  dots(S, t, cap, hot);
  sticker(S, c);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.blue;
  ctx.fillText(`${fig(toF(c.Tin))} °F inside`, S.X(-2.5), S.Y(1.78));
  ctx.textAlign = 'right';
  ctx.fillStyle = outdoor;
  ctx.fillText(`${fig(toF(c.Tout))} °F outside`, S.X(2.55), S.Y(1.78));
  ctx.restore();
}

function wash(S, x, y, w, h, fill) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = fill;
  ctx.fillRect(X(x), Y(y + h), w * k, h * k);
}

function rule(S, x0, x1, y) {
  const { ctx, X, Y } = S;
  ctx.strokeStyle = alpha(C.text, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(x0), Y(y));
  ctx.lineTo(X(x1), Y(y));
  ctx.stroke();
}

function wall(S) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = alpha(C.text, 0.22);
  ctx.fillRect(X(-0.28), Y(1.62), 0.56 * k, 1.62 * k);
  ctx.strokeStyle = alpha(C.text, 0.28);
  ctx.lineWidth = 1;
  for (const span of [[0.08, 0.36], [1.36, 1.54]]) {
    for (let y = span[0]; y <= span[1]; y += 0.08) {
      ctx.beginPath();
      ctx.moveTo(X(-0.28), Y(y));
      ctx.lineTo(X(0.28), Y(y));
      ctx.stroke();
    }
  }
}

function sill(S) {
  rounded(S, -2.05, 0.32, 2.35, 0.1, 0.02, alpha(C.text, 0.2), alpha(C.text, 0.45));
}

function fins(S, x, y0, y1, n, color, a) {
  const { ctx, X, Y, k } = S;
  ctx.strokeStyle = alpha(color, a);
  ctx.lineWidth = Math.max(1.5, 0.02 * k);
  for (let i = 0; i < n; i++) {
    const xx = x + i * 0.05;
    ctx.beginPath();
    ctx.moveTo(X(xx), Y(y0));
    ctx.lineTo(X(xx), Y(y1));
    ctx.stroke();
  }
}

function pipes(S) {
  const { ctx, X, Y, k } = S;
  const { xL, xC, xR, yB, yT } = LOOP;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = alpha(C.blue, 0.95);
  ctx.lineWidth = Math.max(3, 0.07 * k);
  ctx.beginPath();
  ctx.moveTo(X(xL), Y(yB));
  ctx.lineTo(X(xL), Y(yT));
  ctx.lineTo(X(xC - 0.12), Y(yT));
  ctx.stroke();
  ctx.strokeStyle = alpha(C.gold, 0.95);
  ctx.lineWidth = Math.max(2.5, 0.05 * k);
  ctx.beginPath();
  ctx.moveTo(X(xC + 0.12), Y(yT));
  ctx.lineTo(X(xR), Y(yT));
  ctx.lineTo(X(xR), Y(yB));
  ctx.lineTo(X(xL), Y(yB));
  ctx.stroke();
}

function compressor(S, t, load) {
  const { ctx, X, Y, k } = S;
  const x = LOOP.xC;
  const y = LOOP.yT;
  const pulse = 1 + 0.05 * Math.sin(t * 16) * (0.3 + load);
  ctx.fillStyle = alpha(C.red, 0.08 + 0.62 * load);
  ctx.beginPath();
  ctx.arc(X(x), Y(y), (0.2 + 0.08 * load) * k * pulse, 0, 2 * Math.PI);
  ctx.fill();
  rounded(S, x - 0.16, y - 0.13, 0.32, 0.26, 0.04, load > 0.25 ? C.gold : alpha(C.text, 0.45), alpha(C.text, 0.9));
  ctx.fillStyle = alpha(C.bg, 0.85);
  ctx.beginPath();
  ctx.arc(X(x), Y(y), 0.045 * k, 0, 2 * Math.PI);
  ctx.fill();
}

function fan(S, x, y, r, angle) {
  const { ctx, X, Y, k } = S;
  ctx.fillStyle = alpha(C.text, 0.06);
  ctx.beginPath();
  ctx.arc(X(x), Y(y), r * k, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = alpha(C.text, 0.7);
  ctx.lineWidth = Math.max(1.5, 0.025 * k);
  ctx.beginPath();
  ctx.arc(X(x), Y(y), r * k, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X(x), Y(y), r * 0.55 * k, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = alpha(C.text, 0.92);
  ctx.lineWidth = Math.max(2, 0.04 * k);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * 2 * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(X(x), Y(y));
    ctx.lineTo(X(x + Math.cos(a) * r * 0.82), Y(y + Math.sin(a) * r * 0.82));
    ctx.stroke();
  }
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(X(x), Y(y), 0.045 * k, 0, 2 * Math.PI);
  ctx.fill();
}

function louvers(S) {
  const { ctx, X, Y, k } = S;
  ctx.strokeStyle = alpha(C.blue, 0.8);
  ctx.lineWidth = Math.max(1.5, 0.025 * k);
  for (let i = 0; i < 4; i++) {
    const y = 0.58 + i * 0.14;
    ctx.beginPath();
    ctx.moveTo(X(-1.82), Y(y));
    ctx.lineTo(X(-1.58), Y(y + 0.05));
    ctx.stroke();
  }
}

function coolAir(S, t, cap) {
  const { ctx, X, Y } = S;
  const reach = 0.18 + cap * 0.6;
  ctx.fillStyle = alpha(C.blue, 0.1 + 0.22 * cap);
  ctx.beginPath();
  ctx.moveTo(X(-1.92), Y(0.58));
  ctx.lineTo(X(-1.92 - reach), Y(0.86));
  ctx.lineTo(X(-1.92), Y(1.16));
  ctx.closePath();
  ctx.fill();
  const n = 2 + Math.round(cap * 4);
  for (let i = 0; i < n; i++) {
    const phase = (t * (0.35 + cap * 0.45) + i / n) % 1;
    chevron(S, -2.0 - phase * reach, 0.72 + (i % 2) * 0.22, 0.1, C.blue, 0.45 + 0.5 * (1 - phase));
  }
}

function heatAir(S, t, hot, cap, color) {
  const reach = 0.16 + hot * 0.38 + cap * 0.08;
  const { ctx, X, Y } = S;
  ctx.fillStyle = alpha(color, 0.1 + 0.22 * hot);
  ctx.beginPath();
  ctx.moveTo(X(2.1), Y(0.4));
  ctx.lineTo(X(2.1 + reach), Y(0.95));
  ctx.lineTo(X(2.1), Y(1.2));
  ctx.closePath();
  ctx.fill();
  const n = 2 + Math.round(hot * 5);
  for (let i = 0; i < n; i++) {
    const phase = (t * (0.28 + hot * 0.4) + i / n) % 1;
    ctx.fillStyle = alpha(color, 0.2 + 0.55 * (1 - phase));
    ctx.beginPath();
    ctx.ellipse(
      X(2.12 + phase * reach),
      Y(0.48 + phase * 0.7 + (i % 3) * 0.04),
      (0.05 + phase * 0.07) * S.k,
      (0.035 + phase * 0.04) * S.k,
      0, 0, 2 * Math.PI,
    );
    ctx.fill();
  }
}

function chevron(S, x, y, s, color, a) {
  const { ctx, X, Y, k } = S;
  ctx.strokeStyle = alpha(color, a);
  ctx.lineWidth = Math.max(1.5, 0.03 * k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(X(x + s), Y(y + s * 0.6));
  ctx.lineTo(X(x), Y(y));
  ctx.lineTo(X(x + s), Y(y - s * 0.6));
  ctx.stroke();
}

function dots(S, t, cap, hot) {
  const { ctx, X, Y, k } = S;
  const n = 8;
  const speed = 0.1 + 0.22 * cap;
  for (let i = 0; i < n; i++) {
    const u = (t * speed + i / n) % 1;
    const p = loopPoint(u);
    const color = p.hot ? (hot > 0.55 ? C.red : C.gold) : C.blue;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), 0.045 * k, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function loopPoint(u) {
  const { xL, xC, xR, yB, yT } = LOOP;
  const up = yT - yB;
  const top = xR - xL;
  const per = 2 * up + 2 * top;
  let d = u * per;
  if (d < up) return { x: xL, y: yB + d, hot: false };
  d -= up;
  if (d < top) return { x: xL + d, y: yT, hot: xL + d > xC };
  d -= top;
  if (d < up) return { x: xR, y: yT - d, hot: true };
  d -= up;
  return { x: xR - d, y: yB, hot: xR - d > xL + 0.15 };
}

function sticker(S, c) {
  const { ctx, X, Y } = S;
  const x = 0.32;
  const y = 0.18;
  rounded(S, x, y, 1.22, 0.2, 0.03, alpha(C.bg, 0.8), alpha(C.yellow, 0.85));
  ctx.fillStyle = C.yellow;
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`EER ${fig(c.eer)}`, X(x + 0.61), Y(y + 0.1));
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
