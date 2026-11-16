import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { dataChecked, passSchedule } from '@flux/subjects/design/databudget.js';

/**
 * Data budget: what the craft records against what its passes over one station can send down.
 *
 * Shows that the radio, the passes and the store trade against each other. A craft that sends more
 * than it records each day empties its store in every group of passes; one that sends less fills it
 * by a fixed amount a day until it is full, however large. A higher elevation mask or fewer passes
 * cuts the time to send more than it seems, because the low edges of a pass carry much of its
 * length. The pass-by-pass account is checked by stepping the store second by second
 * (packages/subjects/src/design/databudget.js).
 *
 * Radio rates are from NASA's small spacecraft report (Table 9-3): UHF transceivers at 9.6 kbit/s,
 * S-band at 1 to 4 Mbit/s. The payload rate is this course's round figure.
 */
export const RADIOS = Object.freeze({ uhf: { name: 'UHF, 9.6 kbit/s', rate: 9.6 }, s1: { name: 'S-band, 1 Mbit/s', rate: 1000 }, s4: { name: 'S-band, 4 Mbit/s', rate: 4000 } });
export const HOUSE = 2; // kbit/s of housekeeping telemetry

const SCENARIOS = [
  { id: 'sband', name: 'S-band, three passes a group, 25 kbit/s recorded', hkm: 500, eps: 10, k: 3, payload: 25, radio: 's1', storeGB: 2 },
  { id: 'uhf', name: 'The same craft on a UHF radio', hkm: 500, eps: 10, k: 3, payload: 25, radio: 'uhf', storeGB: 2 },
  { id: 'onepass', name: 'One pass a group', hkm: 500, eps: 10, k: 1, payload: 25, radio: 's1', storeGB: 2 },
  { id: 'mask', name: 'A station that sees only above 30°', hkm: 500, eps: 30, k: 3, payload: 25, radio: 's1', storeGB: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, hkm: sc.hkm, eps: sc.eps, k: sc.k, payload: sc.payload, radio: sc.radio, storeGB: sc.storeGB });
}

const KEYS = [['dt-h', 'hkm'], ['dt-e', 'eps'], ['dt-p', 'payload'], ['dt-s', 'storeGB']];
const gbit = (mbit) => (mbit >= 1000 ? `${fig(mbit / 1000)} Gbit` : `${fig(mbit)} Mbit`);
const bytes = (mbit) => (mbit / 8 >= 1000 ? `${fig(mbit / 8000)} GB` : `${fig(mbit / 8)} MB`);

export default defineLab({
  id: 'data',
  exam: 'u10',
  title: 'Data budget',
  hint: 'Swap the S-band radio for UHF and watch the store climb every day. Then, back on S-band, raise the elevation mask to 30° and see how much sending time it costs.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('sband', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'payload', lo: 0, hi: 200 }),
  controls() {
    return `
      <label class="field"><span>Radio</span><select id="dt-r">${Object.entries(RADIOS).map(([k, r]) => `<option value="${k}">${r.name}</option>`).join('')}</select></label>
      <label class="field"><span>Passes in each group</span><select id="dt-k"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
      ${slider('dt-h', 'Altitude (km)', 500, 300, 800, 10)}
      ${slider('dt-e', 'Lowest elevation the station uses (°)', 10, 0, 40, 1)}
      ${slider('dt-p', 'Payload data, day average (kbit/s)', 25, 0, 200, 1)}
      ${slider('dt-s', 'Onboard store (GB)', 2, 0.5, 16, 0.5)}
      <p class="tiny">One station sees the craft in two groups of passes a day, twelve hours apart, on consecutive orbits. Each pass is taken as overhead, the longest it can be. Housekeeping adds ${HOUSE} kbit/s. Grey bands: passes.</p>`;
  },
  bind(api) {
    document.getElementById('dt-r')?.addEventListener('change', (e) => {
      api.slice().radio = e.target.value;
      api.bump();
    });
    document.getElementById('dt-k')?.addEventListener('change', (e) => {
      api.slice().k = Number(e.target.value);
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['dt-r', 'radio'], ['dt-k', 'k'], ...KEYS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = dataChecked({ hkm: state.hkm, eps: state.eps, k: state.k, payload: state.payload, house: HOUSE, down: RADIOS[state.radio].rate });
    const store = state.storeGB * 8000; // Mbit
    const daysToFill = c.growing ? Math.max(0, store / c.perDay) : null; // null: it never fills
    return { ...c, store, daysToFill, sendMin: (2 * state.k * c.tp) / 60 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.62) : [B.free, null];
    const hi = Math.max(c.peak, c.stepPeak, 1) * 1.15 / 8; // MB
    const P = plotIn(B, top, { lo: 0, hi: 96 }, { lo: 0, hi: hi });
    axes(P, { xLabel: 'hours', yLabel: 'store (MB)' });
    // Pass bands, in the run's clock, which starts at the end of a group's last pass.
    const { T, tp, starts } = passSchedule(state);
    const offset = (state.k - 1) * T + tp;
    for (let m = 0; m <= 8; m++) {
      for (const s of starts) {
        const a = (s + m * 43200 - offset) / 3600;
        const b = a + tp / 3600;
        if (b < 0 || a > 96) continue;
        poly(P, [[a, 0], [b, 0], [b, hi], [a, hi]], { fill: alpha(C.muted, 0.22), stroke: null });
      }
    }
    line(P, c.trace.map(([t, mb]) => [t, mb / 8]), { color: c.growing ? C.red : C.teal, width: 2.5 });
    label(P, c.growing ? `grows ${bytes(c.perDay)} a day` : `peaks at ${bytes(c.peak)}`, [96, hi], { color: c.growing ? C.red : C.teal, align: 'right', dy: 12 });
    if (!bottom) return;
    // A day's data made against what the passes can send.
    const top2 = Math.max(c.made, c.sent) * 1.15 / 1000;
    const Q = plotIn(B, bottom, { lo: 0, hi: top2 }, { lo: 0, hi: 2 }, { left: 92, right: 14, top: 10, bottom: 40 });
    axes(Q, { xLabel: 'Gbit a day', yFmt: () => '' });
    const bar = (y, v, color) => poly(Q, [[0, y - 0.32], [v, y - 0.32], [v, y + 0.32], [0, y + 0.32]], { fill: alpha(color, 0.8), stroke: null });
    bar(1.4, c.made / 1000, C.pink);
    bar(0.5, c.sent / 1000, c.growing ? C.red : C.green);
    label(Q, 'recorded', [0, 1.4], { color: C.text, align: 'right', dx: -6 });
    label(Q, 'can send', [0, 0.5], { color: C.text, align: 'right', dx: -6 });
  },
  law: () => [
    String.raw`t_p = T\,\frac{\lambda}{\pi}, \qquad \lambda = \arccos\!\left(\tfrac{R}{r}\cos\varepsilon\right) - \varepsilon`,
    String.raw`\text{made} = 86\,400\,g, \qquad \text{sent} = 2k\,t_p D`,
  ],
  liveRows(state, c) {
    return [
      kv('Pass length, overhead', `${fig(c.tp / 60)} min`),
      kv('Sending time a day', `${fig(c.sendMin)} min in ${2 * state.k} passes`),
      kv('Recorded a day, can send a day', `${gbit(c.made)}, ${gbit(c.sent)}`),
      kv('Margin on the downlink', `${fig(100 * c.margin)}%`),
      kv('Peak store, pass by pass', bytes(c.peak)),
      kv('Peak store, second by second', bytes(c.stepPeak)),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['margin', `${fig(100 * c.margin)}%`],
      [c.growing ? 'store full in' : 'peak store', c.growing ? `${fig(c.daysToFill)} days` : bytes(c.peak)],
      ['send time', `${fig(c.sendMin)} min/day`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Passes that are not overhead and so are shorter, the time to lock the link at the start of each pass, protocol overhead and retransmissions, a payload that records in bursts rather than evenly, and more stations.`;
    if (c.growing) {
      return { title: 'The store fills every day', body: `The craft records ${gbit(c.made)} a day and its ${2 * state.k} passes can send ${gbit(c.sent)}. The ${gbit(c.perDay)} left over each day piles up, and the ${fig(state.storeGB)} GB store is full in ${fig(c.daysToFill)} days; a larger store only takes longer to fill. Record less, send faster, or add passes or stations. ${leavesOut}` };
    }
    if (c.margin < 0.25) {
      return { title: 'It keeps up, with little to spare', body: `${gbit(c.sent)} of sending a day against ${gbit(c.made)} recorded: a ${fig(100 * c.margin)}% margin. The store empties in each group of passes and peaks at ${bytes(c.peak)} just before one. A missed pass would leave a backlog the next ones can barely clear. ${leavesOut}` };
    }
    return { title: 'The passes clear the store', body: `${gbit(c.sent)} of sending a day against ${gbit(c.made)} recorded: a ${fig(100 * c.margin)}% margin. The store peaks at ${bytes(c.peak)}, after the twelve-hour gap between groups of passes. ${leavesOut}` };
  },
  app: false,
});
