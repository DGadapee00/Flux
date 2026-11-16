import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { missionChecked } from '@flux/subjects/design/mission.js';
import { SENSORS } from '@flux/subjects/mechanics/pointingbudget.js';
import { FINISHES } from '@flux/subjects/heat/spacecraft.js';
import { BUS } from './margin.js';
import { STATIONS } from './coverage.js';

/**
 * Mission design: the whole craft at once. Every subsystem's budget for one design, and the one that
 * limits it.
 *
 * Shows that a choice made for one subsystem lands in the others. A slower radio saves power and
 * mass but leaves the data on board. A higher orbit sees the stations longer and breaks the disposal
 * rule. A camera needs a pointing budget a magnetometer never did, and more data than the passes can
 * carry. The closed forms average the loads over the day; the day in the life flies the craft for
 * twenty days and must agree on the eclipse, the contacts and the day's energy, and finds the deepest
 * discharge, which the averages cannot (packages/subjects/src/design/mission.js).
 *
 * The craft is Unit 8's 6U magnetometer craft. Its bus masses are Unit 8's; the power system's mass
 * follows the array and battery, the radio's its type. The loads, the radios' powers and antennas,
 * the payloads and the 30% depth of discharge are this course's own round figures. Radio rates are
 * NASA's small spacecraft report's (Table 9-3, as in the data budget lab). The 0 to 50 °C limits are
 * MIT 16.851 Lecture 23's operating range for digital electronics. The life must cover the one-year
 * mission and end within the FCC's five years (NASA's small spacecraft report, 13.2). The pointing
 * errors are the pointing budget lab's.
 */
export const PAYLOADS = Object.freeze({
  mag: { name: 'Magnetometer on a boom', kg: 3, maturity: 'new', W: 1.5, rate: 20, R: null },
  cam: { name: 'Camera', kg: 2.5, maturity: 'modified', W: 8, rate: 2000, R: 0.2 },
});

export const RADIOS = Object.freeze({
  uhf: { name: 'UHF, 9.6 kbit/s', kg: 0.3, tx: 4, link: { band: 'uhf', Pt: 1, GtdBi: 0, Dr: 1.5, T: 500, Rb: 9600 } },
  s1: { name: 'S-band, 1 Mbit/s', kg: 0.5, tx: 10, link: { band: 's', Pt: 2, GtdBi: 6, Dr: 3, T: 300, Rb: 1e6 } },
  s4: { name: 'S-band, 4 Mbit/s', kg: 0.6, tx: 16, link: { band: 's', Pt: 4, GtdBi: 6, Dr: 3, T: 300, Rb: 4e6 } },
});

const BUS_W = 8; // W: flight computer, attitude control, receiver, all the time
const HOUSE = 2; // kbit/s of housekeeping telemetry
const LIMIT = 12; // kg, 2 kg a unit
const DOD = 0.3;
const K0 = 273.15;

/** The craft's mass items: Unit 8's bus, with the power system and radio set by the design. */
export function missionItems(state) {
  const pay = PAYLOADS[state.pay];
  const bus = BUS.filter(([name]) => name !== 'Power' && name !== 'Radio').map(([name, basic]) => ({ name, basic, maturity: 'catalog' }));
  return [
    ...bus,
    { name: 'Power', basic: 0.8 + state.Ebatt / 100 + state.Ppeak / 50, maturity: 'catalog' },
    { name: 'Radio', basic: RADIOS[state.radio].kg, maturity: 'catalog' },
    { name: 'Payload', basic: pay.kg, maturity: pay.maturity },
  ];
}

/** A lab state as a design for the mission model. */
export function missionDesign(state) {
  const pay = PAYLOADS[state.pay];
  const radio = RADIOS[state.radio];
  const keys = [state.s1, state.s2].filter((k, i, a) => k !== 'none' && a.indexOf(k) === i);
  return {
    items: missionItems(state),
    limit: LIMIT,
    h: state.h,
    eps: 10,
    incl: state.incl,
    stations: keys.map((k) => STATIONS[k]),
    Ppeak: state.Ppeak,
    Ebatt: state.Ebatt,
    loads: { bus: BUS_W, payload: pay.W, tx: radio.tx },
    duty: state.duty / 100,
    rate: pay.rate,
    house: HOUSE,
    radio: radio.link,
    finish: state.finish,
    area: 0.06,
    surface: 0.27,
    f107: 147,
    lifeMin: 1,
    lifeMax: 5,
    dodMax: DOD,
    Tlimits: [K0, K0 + 50],
    pointing: { sensor: state.sensor, jitter: 0.02, misalign: 0.03, thermal: 0.01, R: pay.R },
  };
}

const BASE = { pay: 'mag', duty: 100, h: 500, incl: 97.4, radio: 's1', s1: 'utq', s2: 'none', Ppeak: 20, Ebatt: 30, finish: 'black', sensor: 'horizon' };
const SCENARIOS = [
  { id: 'base', name: 'The magnetometer craft, one Arctic station', ...BASE },
  { id: 'uhf', name: 'The same craft with a UHF radio', ...BASE, radio: 'uhf' },
  { id: 'mojave', name: 'Its one station moved to Mojave', ...BASE, s1: 'moj' },
  { id: 'camera', name: 'A camera, a star tracker and the faster radio', ...BASE, pay: 'cam', duty: 5, sensor: 'star', radio: 's4' },
];
const FIELDS = Object.keys(BASE);

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  for (const k of FIELDS) state[k] = sc[k];
}

const SLIDERS = [['ms-d', 'duty'], ['ms-h', 'h'], ['ms-p', 'Ppeak'], ['ms-e', 'Ebatt']];
const SELECTS = [['ms-pay', 'pay'], ['ms-i', 'incl'], ['ms-r', 'radio'], ['ms-1', 's1'], ['ms-2', 's2'], ['ms-f', 'finish'], ['ms-s', 'sensor']];
const opt = (entries) => entries.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
const select = (id, text, entries) => `<label class="field"><span>${text}</span><select id="${id}">${opt(entries)}</select></label>`;
const pct = (x) => `${fig(100 * x)}%`;
const degC = (T) => `${fig(T - K0)} °C`;
const gbit = (mbit) => (mbit >= 1000 ? `${fig(mbit / 1000)} Gbit` : `${fig(mbit)} Mbit`);

/** What each budget says, in words, for the readings and the coach. */
function detail(id, c) {
  switch (id) {
    case 'mass': return `${fig(c.mass.mean)} kg predicted, of ${LIMIT} kg`;
    case 'power': return `the load needs ${fig(c.loadWh)} Wh an orbit, the array gives ${fig(c.arrayWh)}`;
    case 'battery': return `deepest discharge ${pct(c.sim.deepest)}, allowed ${pct(DOD)}`;
    case 'thermal': return `${degC(c.thermal.Tmin)} to ${degC(c.thermal.Tmax)}, limits 0 to 50 °C`;
    case 'pointing': return c.point ? `bias + 3σ = ${fig(c.point.threeSigma)}° in a ${fig(c.pointR)}° cone` : 'the payload needs no pointing';
    case 'link': return `${fig(c.link.margin)} dB above the ${fig(c.requiredDb)} dB needed, at ${fig(c.range / 1e3)} km`;
    case 'data': return c.capacity > 0 ? `${gbit(c.made)} made a day, ${gbit(c.capacity)} can go down` : 'no station ever sees the craft';
    case 'life': return `${fig(c.life)} years; needs 1 to 5`;
    default: return '';
  }
}

const FIX = {
  mass: 'Take mass out, or move parts to a more mature design so they grow less.',
  power: 'Add array, or cut the load: a lower payload duty or a less hungry radio.',
  battery: 'Add battery, or keep the transmitter and payload out of eclipse.',
  thermal: 'Change the finish: the ratio of absorbed sunlight to emitted infrared sets the temperature.',
  pointing: 'Use a better attitude sensor, or loosen what the payload needs.',
  link: 'Add transmit power or antenna gain, or send more slowly.',
  data: 'Send faster, add or move stations, or record less.',
  life: 'Change the altitude: lower falls sooner, higher lasts longer.',
};

export default defineLab({
  id: 'mission',
  exam: 'u7',
  title: 'Mission design',
  hint: 'Swap the S-band radio for UHF and watch the data budget fail by a factor of a hundred while power and mass improve. Then raise the orbit to 550 km and watch the life break the five-year rule.',
  gapLimit: 0.01,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('base', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'h', lo: 400, hi: 600 }),
  controls() {
    const stations = Object.entries(STATIONS).map(([k, s]) => [k, s ? `${s.name}, ${fig(Math.abs(s.lat))}°${s.lat >= 0 ? 'N' : 'S'}` : 'No station']);
    return `
      ${select('ms-pay', 'Payload', Object.entries(PAYLOADS).map(([k, p]) => [k, p.name]))}
      ${slider('ms-d', 'Payload duty, share of each orbit (%)', 100, 5, 100, 5)}
      ${select('ms-i', 'Orbit', [['97.4', 'Sun-synchronous, 97.4°'], ['51.6', 'Inclined 51.6°']])}
      ${slider('ms-h', 'Altitude (km)', 500, 400, 600, 5)}
      ${select('ms-r', 'Radio', Object.entries(RADIOS).map(([k, r]) => [k, r.name]))}
      ${select('ms-1', 'Station 1', stations)}
      ${select('ms-2', 'Station 2', stations)}
      ${slider('ms-p', 'Solar array, sun-tracking (W)', 20, 10, 40, 1)}
      ${slider('ms-e', 'Battery (Wh)', 30, 10, 80, 1)}
      ${select('ms-f', 'Surface finish', Object.entries(FINISHES).map(([k, f]) => [k, f.name]))}
      ${select('ms-s', 'Attitude sensor', Object.entries(SENSORS).map(([k, s]) => [k, s.name]))}
      <p class="tiny">A 6U craft, 12 kg allowed. The Sun lies in the orbit's plane, the longest eclipses. Stations use the craft above 10°. Bars show the share of what each budget has that the design uses; past the line it fails.</p>`;
  },
  bind(api) {
    for (const [id, key] of SELECTS) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = key === 'incl' ? Number(e.target.value) : e.target.value;
        api.bump();
      });
    }
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [...SELECTS, ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = missionChecked(missionDesign(state));
    const use = Object.fromEntries(c.budgets.map((b) => [b.id, b.use]));
    const ok = Object.fromEntries(c.budgets.map((b) => [b.id, b.ok]));
    return {
      ...c,
      pointR: PAYLOADS[state.pay].R,
      use,
      ok,
      dataUse: use.data ?? 0,
      lifeYears: c.life,
      minutes: c.share * 1440,
      deepest: c.sim.deepest,
      massKg: c.mass.mean,
      limitingId: c.limiting.id,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 420 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.58) : [B.free, null];
    // Each budget's use, against the line at 1.
    const rows = c.budgets;
    const hi = 2;
    const P = plotIn(B, top, { lo: 0, hi }, { lo: 0, hi: rows.length }, { left: 92, right: 16, top: 12, bottom: 40 });
    axes(P, { xLabel: 'share of the budget used', yFmt: () => '' });
    rows.forEach((b, i) => {
      const y = rows.length - i - 0.5;
      const lim = b.id === c.limiting.id;
      const color = b.ok ? (lim ? C.gold : C.green) : C.red;
      label(P, b.name, [0, y], { color: lim ? C.gold : C.text, align: 'right', dx: -6, bold: lim });
      if (b.use === null) {
        label(P, b.never ? 'never in view' : 'no need', [0, y], { color: b.never ? C.red : C.muted, align: 'left', dx: 6 });
        return;
      }
      const v = Math.min(b.use, hi);
      poly(P, [[0, y - 0.3], [v, y - 0.3], [v, y + 0.3], [0, y + 0.3]], { fill: alpha(color, 0.8), stroke: null });
      const text = b.use > hi ? `${fig(b.use)} ›` : b.use.toFixed(2);
      label(P, text, [v, y], { color: C.text, align: b.use > 1.6 ? 'right' : 'left', dx: b.use > 1.6 ? -6 : 6 });
    });
    seg(P, [1, 0], [1, rows.length], { color: alpha(C.text, 0.7), width: 1.5, dash: [5, 4] });
    if (!bottom) return;
    // The last day of the twenty: battery charge, the data store, eclipses and contacts.
    const Q = plotIn(B, bottom, { lo: 0, hi: 24 }, { lo: 0, hi: 1 }, { left: 52, right: 16, top: 30, bottom: 40 });
    axes(Q, { xLabel: 'hours, the twentieth day', yFmt: (v) => `${Math.round(100 * v)}%` });
    const tr = c.sim.trace;
    const step = tr.length > 1 ? tr[1][0] - tr[0][0] : 0;
    // Runs of samples in shadow and in contact, each drawn as one band at least 0.1 h wide.
    const runs = (test) => {
      const out = [];
      let start = null;
      tr.forEach((p, i) => {
        if (test(p) && start === null) start = p[0];
        if ((!test(p) || i === tr.length - 1) && start !== null) {
          out.push([start, Math.max(p[0] + (test(p) ? step : 0), start + 0.1)]);
          start = null;
        }
      });
      return out;
    };
    for (const [a, b] of runs((p) => !p[3])) poly(Q, [[a, 0], [b, 0], [b, 1], [a, 1]], { fill: alpha(C.muted, 0.18), stroke: null });
    for (const [a, b] of runs((p) => p[4])) poly(Q, [[a, 0], [b, 0], [b, 1], [a, 1]], { fill: alpha(C.green, 0.35), stroke: null });
    const peak = Math.max(...tr.map((p) => p[2]), 1e-9);
    line(Q, tr.map(([t, , s]) => [t, s / peak]), { color: C.teal, width: 2 });
    line(Q, tr.map(([t, e]) => [t, e]), { color: C.gold, width: 2.5 });
    label(Q, 'battery charge', [0, 1], { color: C.gold, align: 'left', dy: -14 });
    label(Q, `data store, of ${gbit(peak)} · green: in contact`, [24, 1], { color: C.teal, align: 'right', dy: -14 });
  },
  law: () => [
    String.raw`\bar P = P_\text{bus} + d\,P_\text{payload} + s\,P_\text{radio}`,
    String.raw`\text{use} = \frac{\text{need}}{\text{what it has}} \le 1`,
  ],
  liveRows(state, c) {
    const short = {
      mass: `${fig(c.mass.mean)} of ${LIMIT} kg`,
      power: `${c.loadWh.toFixed(1)} of ${c.arrayWh.toFixed(1)} Wh/orbit`,
      battery: `${Math.round(100 * c.sim.deepest)}% of ${Math.round(100 * DOD)}% deep`,
      thermal: `${Math.round(c.thermal.Tmin - K0)} to ${Math.round(c.thermal.Tmax - K0)} °C`,
      pointing: c.point ? `${fig(c.point.threeSigma)}° of ${fig(c.pointR)}°` : 'not needed',
      link: `${c.link.margin.toFixed(1)} dB margin`,
      data: c.capacity > 0 ? `${gbit(c.made)} of ${gbit(c.capacity)}/day` : 'never in view',
      life: `${c.life.toFixed(1)} yr, 1 to 5`,
    };
    return [
      ...c.budgets.map((b) => kv(b.use === null ? b.name : `${b.name}, ${b.use.toFixed(2)}`, short[b.id])),
      kv('Average load', `${fig(c.Pavg)} W`),
      kv('Contacts a day', c.capacity > 0 ? fig(c.sim.contactsPerDay) : 'none'),
      kv('Longest wait', c.sim.longestGapH === null ? 'never in view' : `${fig(c.sim.longestGapH)} h`),
      kv('Eclipse discharge, average', pct(c.dod)),
      kv('In view, average and flown', `${fig(c.share * 1440)}, ${fig(c.sim.shareSpread * 1440)} min/day`),
      kv('In view, these twenty days', `${fig(c.sim.share * 1440)} min/day`),
      kv('Array, average and flown', `${fig(c.arrayDay)}, ${fig(c.sim.arrayWhDay)} Wh/day`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['design', c.closes ? 'closes' : 'fails'],
      ['limited by', c.limiting.name.toLowerCase()],
      ['its use', c.limiting.use === null ? 'never' : fig(c.limiting.use)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Orbits whose Sun angle changes through the year, end-of-life array and battery loss, a craft with hot and cold faces, a radio that sends only when there is data, passes shared with other missions, and the dose budget, which Unit 9 checks.`;
    // An orbit that nearly repeats its ground track meets the stations the same way day after day.
    const repeats = c.share > 0 && Math.abs(c.sim.share / c.share - 1) > 0.05
      ? ` At this altitude the orbit nearly repeats its ground track each day, so these twenty days see the stations ${fig(c.sim.share * 1440)} minutes a day, not the long-run ${fig(c.share * 1440)}.`
      : '';
    const failing = c.budgets.filter((b) => !b.ok);
    if (failing.length) {
      const list = failing.map((b) => `<b>${b.name}</b>: ${detail(b.id, c)}.`).join(' ');
      return { title: failing.length === 1 ? `${failing[0].name} fails` : `${failing.length} budgets fail`, body: `${list} ${FIX[c.limiting.id]} A fix for one budget lands on the others: watch the bars move together.${repeats} ${leavesOut}` };
    }
    const l = c.limiting;
    return { title: `Every budget closes; ${l.name.toLowerCase()} limits`, body: `${l.name} uses ${pct(l.use)} of what it has: ${detail(l.id, c)}. That is the margin the design spends first. ${FIX[l.id]}${repeats} ${leavesOut}` };
  },
  app: false,
});
