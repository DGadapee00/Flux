import {
  fromC, gas, mixP, tFromH, throttleByJouleThomson, toC, waterP, waterTP,
} from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, layout, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that every steady-flow device is the same balance, Σ ṁh in + Q̇ = Σ ṁh out + Ẇ, with a
 * different term switched on: a turbine turns enthalpy into work, a compressor does the reverse, a
 * throttle moves nothing but pressure (so h stays put, and steam cools slightly while an ideal gas
 * does not change at all), a mixing chamber averages enthalpy by mass flow, and a heat exchanger
 * hands enthalpy from one stream to the other. Two columns of stacked energy flows, in and out, are
 * always the same height. Second method, per device: h = u + Pv, ∫c_p dT by Simpson's rule, the
 * Joule–Thomson coefficient integrated along the isenthalp, or a bisection on the outlet T.
 */

const AIR = gas('air');
const KW = 1e3;
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
/** Air's enthalpy is measured from 0 °C so the bars start near zero. */
const H_AIR_REF = AIR.h(273.15);
const hAir = (T) => AIR.h(T) - H_AIR_REF;

/** ∫ f dx by Simpson's rule. */
function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

const SCENARIOS = [
  { id: 'turbine', name: 'Steam turbine', device: 'turbine', m: 2, p1: 3e6, T1: fromC(400), p2: 10e3, x2: 0.9 },
  { id: 'compressor', name: 'Air compressor', device: 'compressor', m: 1, T1: fromC(27), T2: fromC(247) },
  { id: 'throttle', name: 'Throttling steam', device: 'throttle', fluid: 'steam', m: 1, p1: 2e6, T1: fromC(300), p2: 100e3 },
  { id: 'throttle-air', name: 'Throttling air', device: 'throttle', fluid: 'air', m: 1, p1: 500e3, T1: fromC(27), p2: 100e3 },
  { id: 'flash', name: 'Throttling hot liquid water', device: 'throttle', fluid: 'liquid', m: 1, p1: 1.5e6, T1: fromC(180), p2: 100e3 },
  { id: 'mixer', name: 'Mixing hot and cold water', device: 'mixer', mh: 1, Th: fromC(60), mc: 2, Tc: fromC(15), p: 200e3 },
  { id: 'exchanger', name: 'Heat exchanger', device: 'exchanger', mh: 1, Thi: fromC(90), Tho: fromC(50), mc: 1.5, Tci: fromC(15), p: 300e3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, ...rest } = sc;
  for (const k of ['m', 'p1', 'T1', 'p2', 'x2', 'T2', 'mh', 'mc', 'Th', 'Tc', 'Thi', 'Tho', 'Tci', 'p', 'fluid']) delete state[k];
  Object.assign(state, { scenarioId: sc.id, ...rest });
}

const seg = (label, value, kind) => ({ label, value, kind });

function turbine(s) {
  const one = waterTP(s.T1, s.p1);
  const two = mixP(s.p2, s.x2);
  const W = s.m * (one.h - two.h);
  const alt = s.m * ((one.u + s.p1 * one.v) - (two.u + s.p2 * two.v));
  return {
    key: { name: 'shaft power', value: W, unit: 'kW' },
    ins: [seg('steam in', s.m * one.h, 'stream')],
    outs: [seg('steam out', s.m * two.h, 'stream'), seg('shaft work', W, 'work')],
    W, Q: 0, T2: two.T, x2: s.x2, dh: two.h - one.h,
    gap: rel(W, alt),
    rows: [kv('$h_1 - h_2$', `${fig((one.h - two.h) / KW)} kJ/kg`), kv('$\\dot W = \\dot m(h_1-h_2)$', `${fig(W / KW)} kW`), kv('$h = u + Pv$ route', `${fig(alt / KW)} kW`)],
  };
}

function compressor(s) {
  const W = s.m * (AIR.h(s.T2) - AIR.h(s.T1));
  const alt = s.m * simpson((T) => AIR.cp(T), s.T1, s.T2);
  return {
    key: { name: 'shaft power in', value: W, unit: 'kW' },
    ins: [seg('air in', s.m * hAir(s.T1), 'stream'), seg('shaft work in', W, 'work')],
    outs: [seg('air out', s.m * hAir(s.T2), 'stream')],
    W: -W, Q: 0, T2: s.T2, x2: null, dh: AIR.h(s.T2) - AIR.h(s.T1),
    gap: rel(W, alt),
    rows: [kv('$h_2 - h_1$', `${fig((AIR.h(s.T2) - AIR.h(s.T1)) / KW)} kJ/kg`), kv('$\\dot W_{in} = \\dot m(h_2-h_1)$', `${fig(W / KW)} kW`), kv('$\\dot m\\int c_p\\,dT$, Simpson', `${fig(alt / KW)} kW`)],
  };
}

function throttle(s) {
  if (s.fluid === 'air') {
    const h1 = AIR.h(s.T1);
    const T2 = tFromH(AIR, h1);
    return {
      key: { name: 'temperature change', value: T2 - s.T1, unit: 'K' },
      ins: [seg('air in', s.m * hAir(s.T1), 'stream')],
      outs: [seg('air out', s.m * hAir(T2), 'stream')],
      W: 0, Q: 0, T2, x2: null, dh: 0, dT: T2 - s.T1,
      gap: Math.abs(T2 - s.T1) / s.T1,
      rows: [kv('$h_2 = h_1$ gives $T_2$', `${fig(toC(T2))} °C`), kv('$\\Delta T$', `${fig(T2 - s.T1)} K`)],
    };
  }
  const one = waterTP(s.T1, s.p1);
  const two = waterP(s.p2, 'h', one.h);
  const wet = two.x != null;
  // Second method: a single-phase exit, by integrating the Joule–Thomson coefficient along the isenthalp; a flash, by rebuilding h from the mixture.
  const gap = wet ? rel(mixP(s.p2, two.x).h, one.h) : rel(throttleByJouleThomson(s.T1, s.p1, s.p2), two.T);
  return {
    key: wet ? { name: 'vapour fraction', value: two.x, unit: '' } : { name: 'temperature change', value: two.T - s.T1, unit: 'K' },
    ins: [seg('water in', s.m * one.h, 'stream')],
    outs: [seg('water out', s.m * two.h, 'stream')],
    W: 0, Q: 0, T2: two.T, x2: wet ? two.x : null, dh: 0, dT: two.T - s.T1,
    gap,
    rows: [
      kv('$h_2 = h_1$', `${fig(one.h / KW)} kJ/kg`),
      kv('exit', wet ? `$x = ${fig(two.x)}$, ${fig(toC(two.T))} °C` : `${fig(toC(two.T))} °C`),
      kv(wet ? '$h_f + x h_{fg}$' : '$\\int\\mu_{JT}\\,dp$ route, $T_2$', wet ? `${fig(mixP(s.p2, two.x).h / KW)} kJ/kg` : `${fig(toC(throttleByJouleThomson(s.T1, s.p1, s.p2)))} °C`),
    ],
  };
}

function mixer(s) {
  const h = (T) => waterTP(T, s.p).h;
  const hh = h(s.Th);
  const hc = h(s.Tc);
  const m3 = s.mh + s.mc;
  const h3 = (s.mh * hh + s.mc * hc) / m3;
  const T3 = waterP(s.p, 'h', h3).T;
  // Second method: solve Σ ṁ (h(T) − h_in) = 0 for T by bisection.
  let lo = Math.min(s.Th, s.Tc);
  let hi = Math.max(s.Th, s.Tc);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (s.mh * (h(mid) - hh) + s.mc * (h(mid) - hc) < 0) lo = mid;
    else hi = mid;
  }
  return {
    key: { name: 'outlet temperature', value: toC(T3), unit: '°C' },
    ins: [seg('hot in', s.mh * hh, 'stream'), seg('cold in', s.mc * hc, 'stream')],
    outs: [seg('mixed out', m3 * h3, 'stream')],
    W: 0, Q: 0, T2: T3, x2: null, dh: 0,
    gap: rel(T3, (lo + hi) / 2),
    rows: [kv('$\\dot m_3 = \\dot m_h + \\dot m_c$', `${fig(m3)} kg/s`), kv('$h_3 = \\dfrac{\\dot m_hh_h + \\dot m_ch_c}{\\dot m_3}$', `${fig(h3 / KW)} kJ/kg`), kv('$T_3$', `${fig(toC(T3))} °C`)],
  };
}

function exchanger(s) {
  const hOf = (T) => waterTP(T, s.p).h;
  const cpOf = (T) => waterTP(T, s.p).cp;
  const Q = s.mh * (hOf(s.Thi) - hOf(s.Tho));
  const hCo = hOf(s.Tci) + Q / s.mc;
  const Tco = waterP(s.p, 'h', hCo).T;
  // Second method: each stream's enthalpy change as ∫ cp dT.
  const QhNum = s.mh * simpson(cpOf, s.Tho, s.Thi);
  const QcNum = s.mc * simpson(cpOf, s.Tci, Tco);
  return {
    key: { name: 'cold outlet', value: toC(Tco), unit: '°C' },
    ins: [seg('hot in', s.mh * hOf(s.Thi), 'stream'), seg('cold in', s.mc * hOf(s.Tci), 'stream')],
    outs: [seg('hot out', s.mh * hOf(s.Tho), 'stream'), seg('cold out', s.mc * hCo, 'stream')],
    W: 0, Q: 0, T2: Tco, x2: null, dh: 0, Qx: Q,
    gap: Math.max(rel(QhNum, Q), rel(QcNum, Q)),
    rows: [kv('heat handed over, $\\dot Q = \\dot m_h\\Delta h_h$', `${fig(Q / KW)} kW`), kv('$\\dot m_c\\int c_p\\,dT$, cold side', `${fig(QcNum / KW)} kW`), kv('$T_{c,out}$', `${fig(toC(Tco))} °C`)],
  };
}

const SOLVERS = { turbine, compressor, throttle, mixer, exchanger };

/** Which sliders each device shows, and what they move. */
const CONTROLS = [
  { id: 'dv-m', key: 'm', label: 'mass flow ṁ (kg/s)', show: ['turbine', 'compressor', 'throttle'], lo: 0.1, hi: 10, step: 0.1 },
  { id: 'dv-x2', key: 'x2', label: 'exit quality x₂', show: ['turbine'], lo: 0.7, hi: 1, step: 0.005 },
  { id: 'dv-T1', key: 'T1', label: 'inlet temperature T₁ (°C)', show: ['compressor'], lo: -20, hi: 100, step: 1, c: true },
  { id: 'dv-T2', key: 'T2', label: 'exit temperature T₂ (°C)', show: ['compressor'], lo: 40, hi: 400, step: 1, c: true },
  { id: 'dv-p2', key: 'p2', label: 'exit pressure P₂ (kPa)', show: ['throttle'], lo: 20, hi: 400, step: 1, k: 1e3 },
  { id: 'dv-mh', key: 'mh', label: 'hot flow ṁ_h (kg/s)', show: ['mixer', 'exchanger'], lo: 0.1, hi: 5, step: 0.05 },
  { id: 'dv-mc', key: 'mc', label: 'cold flow ṁ_c (kg/s)', show: ['mixer', 'exchanger'], lo: 0.1, hi: 6, step: 0.05 },
  { id: 'dv-Tho', key: 'Tho', label: 'hot outlet T (°C)', show: ['exchanger'], lo: 20, hi: 85, step: 1, c: true },
];

/** The slider's range for this state: the exit pressure of a throttle stays below its inlet. */
function rangeOf(ctl, state) {
  if (ctl.key === 'p2') return [20, Math.floor((state.p1 / 1e3) * 0.95)];
  if (ctl.key === 'mc' && state.device === 'exchanger') {
    // The cold stream cannot leave hotter than the hot stream enters.
    return [0.35, 6];
  }
  return [ctl.lo, ctl.hi];
}

function sweepKey(state) {
  return { turbine: 'x2', compressor: 'T2', throttle: 'p2', mixer: 'mc', exchanger: 'Tho' }[state.device];
}

export default defineLab({
  id: 'devices',
  exam: 'u3',
  title: 'Steady-flow devices',
  hint: 'Two columns, energy in and energy out, always the same height. Change a device and see which term moves.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('turbine', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    const key = sweepKey(state);
    const ctl = CONTROLS.find((c) => c.key === key);
    const [lo, hi] = rangeOf(ctl, state);
    const k = ctl.k ?? 1;
    return { key, lo: ctl.c ? fromC(lo) : lo * k, hi: ctl.c ? fromC(hi) : hi * k };
  },
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Steady flow, kinetic and potential energy neglected. Enthalpy is measured from 0 °C for air and from liquid water at 0.01 °C for water. Work out of the fluid is positive.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) {
      bindSlider(c.id, (s, v) => { s[c.key] = c.c ? fromC(v) : v * (c.k ?? 1); }, api);
    }
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      const on = c.show.includes(state.device);
      showField(c.id, on);
      const el = document.getElementById(c.id);
      if (!el || !on) continue;
      const [lo, hi] = rangeOf(c, state);
      el.min = String(lo);
      el.max = String(hi);
      el.step = String(c.step);
      const raw = state[c.key];
      const shown = c.c ? toC(raw) : raw / (c.k ?? 1);
      if (document.activeElement !== el) el.value = String(Number(shown.toPrecision(5)));
    }
  },
  compute(state) {
    const r = SOLVERS[state.device](state);
    const inTotal = r.ins.reduce((a, x) => a + x.value, 0);
    const outTotal = r.outs.reduce((a, x) => a + x.value, 0);
    return { device: state.device, fluid: state.fluid ?? null, ...r, inTotal, outTotal, balance: Math.abs(inTotal - outTotal) / Math.max(Math.abs(inTotal), 1) };
  },
  draw(canvas, state, c) {
    const top = Math.max(c.inTotal, c.outTotal) / KW;
    const lo = Math.min(0, ...[...c.ins, ...c.outs].map((x) => x.value / KW));
    const P = layout(canvas, { lo: 0, hi: 3, log: false }, { lo: lo * 1.1, hi: top * 1.12, log: false }, { left: 56, right: 14, top: 26, bottom: 30 });
    const { ctx, box, X, Y } = P;
    ctx.save();
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(box.x0, box.y0);
    ctx.lineTo(box.x0, box.y1);
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = "italic 12px Inter, system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('energy flow (kW)', box.x0 - 46, box.y0 - 8);
    ctx.restore();
    const colour = { stream: C.teal, work: C.yellow, heat: C.gold };
    const column = (parts, x0, x1, title) => {
      let acc = 0;
      parts.forEach((p, i) => {
        const a = acc;
        acc += p.value / KW;
        ctx.fillStyle = alpha(colour[p.kind], i % 2 ? 0.55 : 0.8);
        const y0 = Y(Math.max(a, acc));
        ctx.fillRect(X(x0), y0, X(x1) - X(x0), Math.abs(Y(a) - Y(acc)));
        ctx.fillStyle = C.bg;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const mid = Y((a + acc) / 2);
        if (Math.abs(Y(a) - Y(acc)) > 16) ctx.fillText(`${p.label}: ${fig(p.value / KW)}`, (X(x0) + X(x1)) / 2, mid);
      });
      ctx.fillStyle = C.text;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${title} ${fig(acc)} kW`, (X(x0) + X(x1)) / 2, box.y1 + 6);
    };
    column(c.ins, 0.25, 1.25, 'in');
    column(c.outs, 1.75, 2.75, 'out');
    // A thin bridge across the tops: the two columns are the same height.
    ctx.save();
    ctx.strokeStyle = alpha(C.text, 0.5);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(X(1.25), Y(c.inTotal / KW));
    ctx.lineTo(X(1.75), Y(c.outTotal / KW));
    ctx.stroke();
    ctx.restore();
    note(P, 'in = out', 1.5, Math.max(c.inTotal, c.outTotal) / KW, { align: 'center', dx: 0, dy: -8, color: C.muted });
  },
  law: () => [String.raw`\sum\dot m\,h_{in}+\dot Q=\sum\dot m\,h_{out}+\dot W`, String.raw`\textstyle\sum\dot m_{in}=\sum\dot m_{out}`],
  liveRows: (state, c) => c.rows.join(''),
  readout(state, c) {
    const k = c.key;
    const first = { name: k.name, value: `${fig(k.unit === 'kW' ? k.value / KW : k.value)} ${k.unit}`.trim() };
    return cells([
      [first.name, first.value],
      ['energy in', `${fig(c.inTotal / KW)} kW`],
      ['energy out', `${fig(c.outTotal / KW)} kW`],
      ['balance', c.balance < 1e-9 ? 'closes' : `${fig(c.balance)}`],
    ]);
  },
  coach(state, c) {
    if (c.device === 'turbine') {
      return { title: 'Work from enthalpy', body: String.raw`With no heat and little kinetic energy, $\dot W = \dot m(h_1 - h_2)$. The drier the exhaust, the higher $h_2$ and the less work: ${fig(c.W / KW)} kW here.` };
    }
    if (c.device === 'compressor') {
      return { title: 'Work in, enthalpy up', body: String.raw`The compressor is the turbine run backward: $\dot W_{in} = \dot m(h_2 - h_1)$. For air the enthalpy rise is $\int c_p\,dT$, ${fig(c.dh / KW)} kJ/kg.` };
    }
    if (c.device === 'throttle') {
      if (c.fluid === 'air') return { title: 'Nothing changes but the pressure', body: 'An ideal gas’s enthalpy depends on temperature only. With $h_2 = h_1$ the temperature does not move, however large the pressure drop.' };
      if (c.x2 != null) return { title: 'The liquid flashes', body: String.raw`The pressure falls below the liquid's saturation pressure, so part of it boils. $h$ is unchanged, and the vapour fraction rises to $${fig(c.x2)}$.` };
      return { title: 'Steam cools a little', body: String.raw`$h_2 = h_1$, but steam is not an ideal gas, so the temperature falls by $${fig(-c.dT)}$ K. The Joule–Thomson coefficient says by how much.` };
    }
    if (c.device === 'mixer') {
      return { title: 'An average by mass flow', body: String.raw`The outlet enthalpy is the flow-weighted mean of the inlets, so the outlet temperature sits nearer the larger stream: $${fig(toC(c.T2))}$ °C.` };
    }
    return { title: 'Enthalpy changes hands', body: String.raw`No heat leaves the exchanger and no work enters it. What the hot stream gives up, $${fig(c.Qx / KW)}$ kW, the cold stream takes.` };
  },
});
