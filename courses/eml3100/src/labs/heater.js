import { M3_PER_GAL_US } from '@flux/subjects/convert.js';
import { fromC, toC, waterP, waterTP } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, chart, clip, dot, fit, line, note, panes, stage } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * A tankless water heater is one steady-flow control volume: cold water in, hot water out, heat in,
 * no work. The power it must deliver is Q̇ = ṁ (h_out − h_in) and the flow it can serve at a given
 * rise follows from its rating. Cited: US DOE puts tankless heaters at roughly 2–5 gal/min, federal
 * rules cap a showerhead at 2.5 gal/min, and DOE's suggested water-heater setting is 120 °F
 * (48.9 °C). Line pressure, inlet temperatures, the electric efficiency and the ratings are assumed
 * and labelled so. Second method: ṁ ∫ c_p dT by Simpson's rule against ṁ Δh from the tables.
 */

const KW = 1e3;
const P_LINE = 400e3;
const GAL_PER_MIN = M3_PER_GAL_US / 60;
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

const OUT = 'The model holds the inlet temperature and the flow steady. A real heater lags when a tap opens, so the first seconds of water are cool. It loses a little heat through its casing, scales up with hard water, and cannot hold a set temperature when the flow changes faster than its controller. The supply pipe also limits it: the heater is rated for a rise at a flow, and a cold winter inlet cuts the flow it can serve.';

const SCENARIOS = [
  { id: 'shower', name: 'One shower', gpm: 2.5, Tin: fromC(15), Tset: fromC(48.9), rated: 27, eta: 0.98 },
  { id: 'winter', name: 'Shower in winter', gpm: 2.5, Tin: fromC(5), Tset: fromC(48.9), rated: 27, eta: 0.98 },
  { id: 'two', name: 'Two showers', gpm: 5, Tin: fromC(15), Tset: fromC(48.9), rated: 36, eta: 0.98 },
  { id: 'sink', name: 'Kitchen sink', gpm: 1.5, Tin: fromC(15), Tset: fromC(48.9), rated: 18, eta: 0.98 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, ...rest } = sc;
  Object.assign(state, { scenarioId: sc.id, ...rest });
}

const hOf = (T) => waterTP(T, P_LINE).h;

/** Heater power needed at a flow, in W of heat into the water. */
function need(gpm, Tin, Tset) {
  const rho = 1 / waterTP(Tin, P_LINE).v;
  const mdot = gpm * GAL_PER_MIN * rho;
  return { mdot, Q: mdot * (hOf(Tset) - hOf(Tin)) };
}

const CONTROLS = [
  { id: 'hw-gpm', key: 'gpm', label: 'flow (gal/min)', lo: 0.5, hi: 6, step: 0.1 },
  { id: 'hw-Tin', key: 'Tin', label: 'inlet temperature (°C)', lo: 2, hi: 30, step: 1, c: true },
  { id: 'hw-Tset', key: 'Tset', label: 'outlet setting (°C)', lo: 35, hi: 60, step: 0.5, c: true },
  { id: 'hw-rated', key: 'rated', label: 'heater rating (kW electric)', lo: 6, hi: 40, step: 1 },
];

export default defineLab({
  id: 'heater',
  exam: 'u3',
  title: 'Tankless water heater',
  hint: 'Cold water in, hot water out, heat in. The rating sets how much flow the heater can serve at the rise you ask for.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = { t: 0 };
    apply('shower', s);
    return s;
  },
  tick(dt, state) {
    state.t = (state.t || 0) + dt;
    return true;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'gpm', lo: 0.5, hi: 6 }),
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Cited: tankless heaters serve about 2–5 gal/min (US DOE); a showerhead is capped at 2.5 gal/min; DOE's suggested setting is 120 °F. Assumed: 400 kPa line pressure, 98 % electric efficiency, the inlet temperatures and the ratings.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = c.c ? fromC(v) : v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, true);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      el.value = String(Number((c.c ? toC(state[c.key]) : state[c.key]).toPrecision(5)));
    }
  },
  compute(state) {
    const { mdot, Q } = need(state.gpm, state.Tin, state.Tset);
    const elec = Q / state.eta;
    // Second method: ṁ ∫ c_p dT.
    const alt = mdot * simpson((T) => waterTP(T, P_LINE).cp, state.Tin, state.Tset);
    const dh = hOf(state.Tset) - hOf(state.Tin);
    // The most flow the rating serves at this rise.
    const maxMdot = (state.rated * KW * state.eta) / dh;
    const maxGpm = maxMdot / (1 / waterTP(state.Tin, P_LINE).v) / GAL_PER_MIN;
    const serves = elec <= state.rated * KW;
    const amps = elec / 240;
    // Outlet temperature when the heater is the limit.
    const Tmax = serves ? state.Tset : waterP(P_LINE, 'h', hOf(state.Tin) + (state.rated * KW * state.eta) / mdot).T;
    return {
      mdot, Q, alt, elec, dh, amps, maxGpm, serves, Tout: Tmax, gap: rel(Q, alt),
      curve: Array.from({ length: 61 }, (_, i) => {
        const g = 0.5 + (i / 60) * 5.5;
        return [g, need(g, state.Tin, state.Tset).Q / state.eta / KW];
      }),
    };
  },
  draw(canvas, state, c) {
    const top = Math.max(state.rated, c.curve.at(-1)[1], c.elec / KW) * 1.1;
    const B = stage(canvas);
    const [machine, plot] = panes(B.free, 0.62);
    drawHeater(B.ctx, machine, state, c);
    const P = chart(B.ctx, plot, { lo: 0.5, hi: 6 }, { lo: 0, hi: top }, {
      left: 46, right: 12, top: 22, bottom: 40,
    });
    clip(B.ctx, plot);
    axes(P, { xLabel: 'flow (gal/min)', yLabel: '', yCount: P.box.y1 - P.box.y0 < 130 ? 3 : 5 });
    B.ctx.font = '13px Inter, system-ui, sans-serif';
    B.ctx.fillStyle = C.muted;
    B.ctx.textAlign = 'left';
    B.ctx.textBaseline = 'top';
    B.ctx.fillText('electric power (kW)', P.box.x0, plot.y0 + 3);
    line(P, c.curve.map(([g, kw]) => [g, kw]), { color: C.teal });
    line(P, [[0.5, state.rated], [6, state.rated]], { color: C.gold, dash: [6, 4] });
    note(P, `${fig(state.rated)} kW`, 0.7, state.rated, { color: C.gold, dy: -8 });
    dot(P, state.gpm, c.elec / KW, { color: c.serves ? C.yellow : C.red, r: 4 });
    B.ctx.restore();
  },
  law: () => [String.raw`\dot Q=\dot m\,(h_{out}-h_{in})`, String.raw`\dot m=\rho\,\dot V`],
  liveRows: (state, c) => [
    kv('$\\dot m=\\rho\\dot V$', `${fig(c.mdot)} kg/s`),
    kv('$h_{out}-h_{in}$', `${fig(c.dh / KW)} kJ/kg`),
    kv('$\\dot Q$ into the water', `${fig(c.Q / KW)} kW`),
    kv('electric power', `${fig(c.elec / KW)} kW`),
    kv('current at 240 V', `${fig(c.amps)} A`),
    kv('$\\dot m\\int c_p\\,dT$, Simpson', `${fig(c.alt / KW)} kW`),
  ].join(''),
  readout: (state, c) => cells([
    ['heat to water', `${fig(c.Q / KW)} kW`],
    ['electric power', `${fig(c.elec / KW)} kW`],
    ['most flow', `${fig(c.maxGpm)} gal/min`],
    ['outlet', `${fig(toC(c.Tout))} °C`],
  ]),
  coach: leavesOut(OUT, (state, c) => {
    if (!c.serves) {
      return { title: 'The rating is the limit', body: String.raw`This flow needs ${fig(c.elec / KW)} kW and the heater has ${fig(state.rated)} kW. At this flow it can raise the water only to $${fig(toC(c.Tout))}$ °C, or it serves $${fig(c.maxGpm)}$ gal/min at the setting.` };
    }
    return { title: 'Power is flow times rise', body: String.raw`$\dot Q=\dot m(h_{out}-h_{in})=${fig(c.Q / KW)}$ kW into the water, ${fig(c.elec / KW)} kW from the wall. Halve the flow and the power halves. A colder inlet raises the rise and the power.` };
  }),
});

/** A tankless heater: cold pipe in, element, hot pipe out to a shower. */
function drawHeater(ctx, rect, state, c) {
  clip(ctx, rect);
  const S = fit(ctx, rect, { x0: -2.3, x1: 2.3, y0: -0.15, y1: 1.7 }, 8);
  const t = state.t || 0;
  const flow = Math.max(0.3, state.gpm);
  const hot = Math.max(0, Math.min(1, (toC(c.Tout) - toC(state.Tin)) / 40));
  const load = Math.max(0, Math.min(1, (c.elec / KW) / Math.max(state.rated, 1)));

  pipe(S, -2.15, -0.72, 0.72, C.blue, 0.55);
  pipe(S, 0.72, 1.85, 0.72, hot > 0.35 ? C.gold : C.blue, 0.45 + 0.4 * hot);
  droplets(S, t, flow, -2.05, -0.72, 0.72, C.blue);
  droplets(S, t, flow, 0.8, 1.75, 0.72, hot > 0.35 ? C.gold : C.blue);

  rounded(S, -0.72, 0.28, 1.44, 0.95, 0.06, alpha(C.text, 0.1), alpha(C.text, 0.75));
  // The element glows harder as the heater uses more of its rating.
  ctx.strokeStyle = alpha(C.red, 0.25 + 0.7 * load);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const x = -0.5 + (1 * i) / 16;
    const y = 0.72 + Math.sin(i * 1.4 + t * 6) * 0.08 * (0.4 + load);
    const px = S.X(x);
    const py = S.Y(y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Shower head and a stream whose spacing follows the flow.
  ctx.fillStyle = alpha(C.text, 0.8);
  ctx.fillRect(S.X(1.72), S.Y(0.82), 0.22 * S.k, 0.1 * S.k);
  const drops = 3 + Math.round(flow);
  for (let i = 0; i < drops; i++) {
    const phase = (t * (0.4 + flow * 0.15) + i / drops) % 1;
    ctx.fillStyle = alpha(hot > 0.35 ? C.gold : C.blue, 0.35 + 0.45 * (1 - phase));
    ctx.beginPath();
    ctx.arc(S.X(1.82 + (i % 3 - 1) * 0.06), S.Y(0.62 - phase * 0.55), 0.025 * S.k, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.blue;
  ctx.fillText(`${fig(toC(state.Tin))} °C in`, rect.x0 + 8, rect.y0 + 4);
  ctx.textAlign = 'right';
  ctx.fillStyle = c.serves ? C.yellow : C.red;
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillText(`${fig(toC(c.Tout))} °C`, rect.x1 - 8, rect.y0 + 4);
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillStyle = C.muted;
  ctx.fillText(c.serves ? `${fig(state.gpm)} gal/min` : `limited to ${fig(c.maxGpm)} gal/min`, rect.x1 - 8, rect.y0 + 24);
  ctx.restore();
}

function pipe(S, x0, x1, y, color, a) {
  const { ctx, X, Y, k } = S;
  ctx.strokeStyle = alpha(color, a);
  ctx.lineWidth = Math.max(6, 0.1 * k);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(x0), Y(y));
  ctx.lineTo(X(x1), Y(y));
  ctx.stroke();
}

function droplets(S, t, flow, x0, x1, y, color) {
  const { ctx, X, Y, k } = S;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const phase = (t * (0.25 + flow * 0.08) + i / n) % 1;
    const x = x0 + (x1 - x0) * phase;
    ctx.fillStyle = alpha(color, 0.85);
    ctx.beginPath();
    ctx.arc(X(x), Y(y), 0.035 * k, 0, 2 * Math.PI);
    ctx.fill();
  }
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
