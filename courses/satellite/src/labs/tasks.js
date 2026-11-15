import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { scheduleChecked } from '@flux/subjects/design/scheduling.js';

/**
 * Flight software: five periodic tasks on one processor, scheduled rate-monotonic.
 *
 * Shows that the utilization bound is a safe test, not the last word: a task set can load the
 * processor past the Liu–Layland bound and still meet every deadline, until one more millisecond
 * tips the lowest-priority task over. It also shows why projects keep a 100% margin at launch
 * (MIT 16.851, Lecture 16): the load a slower processor or a heavier payload adds lands on the
 * tasks least able to absorb it. Response-time analysis is checked against an event-driven run of
 * the scheduler (packages/subjects/src/design/scheduling.js).
 *
 * The tasks and their run times are this course's round figures for a small craft.
 */
export const TASKS = Object.freeze([
  { id: 'adcs', name: 'Attitude control', C: 18 },
  { id: 'cmd', name: 'Commands', T: 250, C: 20 },
  { id: 'pay', name: 'Payload processing', T: 500 },
  { id: 'tlm', name: 'Telemetry', T: 1000, C: 120 },
  { id: 'hk', name: 'Housekeeping', T: 2000, C: 150 },
]);

/** The task set for a lab state, in microseconds. */
export function taskSet({ speed, payMs, adcsHz }) {
  return TASKS.map((t) => {
    const T = t.id === 'adcs' ? 1000 / adcsHz : t.T;
    const Cms = t.id === 'pay' ? payMs : t.C;
    return { id: t.id, name: t.name, T: Math.round(T * 1000), C: Math.round((Cms * 1000) / speed) };
  });
}

const SCENARIOS = [
  { id: 'nominal', name: 'The baseline processor', speed: 1, payMs: 90, adcsHz: 10 },
  { id: 'slow', name: 'A processor two-thirds as fast', speed: 2 / 3, payMs: 90, adcsHz: 10 },
  { id: 'overload', name: 'A processor at 0.625 of the speed', speed: 0.625, payMs: 90, adcsHz: 10 },
  { id: 'loop', name: 'Attitude control at 20 Hz', speed: 1, payMs: 90, adcsHz: 20 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, speed: sc.speed, payMs: sc.payMs, adcsHz: sc.adcsHz });
}

const KEYS = [['tk-s', 'speed'], ['tk-p', 'payMs']];
const ms = (us) => `${fig(us / 1000)} ms`;
const COLORS = { adcs: C.teal, cmd: C.gold, pay: C.pink, tlm: C.blue, hk: C.purple };
const SHORT = { adcs: 'attitude', cmd: 'commands', pay: 'payload', tlm: 'telemetry', hk: 'housekeep' };

export default defineLab({
  id: 'tasks',
  exam: 'u10',
  title: 'Flight software',
  hint: 'Slow the processor until the load passes the Liu–Layland bound, and watch every deadline still hold. Keep going until housekeeping misses.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('nominal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'speed', lo: 0.5, hi: 2 }),
  controls() {
    return `
      <label class="field"><span>Attitude control loop</span><select id="tk-hz"><option value="5">5 Hz</option><option value="10">10 Hz</option><option value="20">20 Hz</option></select></label>
      ${slider('tk-s', 'Processor speed (× the baseline)', 1, 0.5, 2, 0.005)}
      ${slider('tk-p', 'Payload processing at baseline speed (ms)', 90, 0, 250, 1)}
      <p class="tiny">${TASKS.map((t) => `${t.name.toLowerCase()} ${t.C ?? 'set below'}${t.C ? ' ms' : ''}${t.T ? ` every ${t.T} ms` : ''}`).join('; ')}. Shorter period, higher priority; a higher task interrupts a lower one.</p>`;
  },
  bind(api) {
    document.getElementById('tk-hz')?.addEventListener('change', (e) => {
      api.slice().adcsHz = Number(e.target.value);
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('tk-hz');
    if (el) el.value = String(state.adcsHz);
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const tasks = taskSet(state);
    const c = scheduleChecked(tasks);
    const worst = Math.max(...c.order.map((t) => c.response[t.id] / t.T));
    return { ...c, tasks, worst, meets: c.misses.length === 0, hkResponse: c.response.hk };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.55) : [B.free, null];
    // The first second of the run, one row per task, highest priority at the top.
    const rows = c.order.length;
    const P = plotIn(B, top, { lo: 0, hi: 1000 }, { lo: 0, hi: rows }, { left: 84, right: 14, top: 14, bottom: 40 });
    axes(P, { xLabel: 'time (ms)', yFmt: () => '' });
    c.order.forEach((t, i) => {
      const y = rows - i - 0.5;
      label(P, SHORT[t.id], [0, y], { color: C.text, align: 'right', dx: -6 });
      for (let r = 0; r * t.T < 1e6; r++) seg(P, [(r * t.T) / 1000, y - 0.42], [(r * t.T) / 1000, y + 0.42], { color: alpha(C.muted, 0.6), width: 1 });
    });
    for (const [a, b, id] of c.segments) {
      if (a >= 1e6) break;
      const i = c.order.findIndex((t) => t.id === id);
      const y = rows - i - 0.5;
      poly(P, [[a / 1000, y - 0.32], [Math.min(b, 1e6) / 1000, y - 0.32], [Math.min(b, 1e6) / 1000, y + 0.32], [a / 1000, y + 0.32]], { fill: alpha(COLORS[id], 0.85), stroke: null });
    }
    if (!bottom) return;
    // Each task's worst response as a share of its period: past 1, a missed deadline.
    const Q = plotIn(B, bottom, { lo: 0, hi: Math.max(1.2, Math.min(2, c.worst * 1.1)) }, { lo: 0, hi: rows }, { left: 84, right: 14, top: 14, bottom: 40 });
    axes(Q, { xLabel: 'worst response ÷ period', yFmt: () => '' });
    c.order.forEach((t, i) => {
      const y = rows - i - 0.5;
      const v = Math.min(c.response[t.id] / t.T, 2);
      poly(Q, [[0, y - 0.3], [v, y - 0.3], [v, y + 0.3], [0, y + 0.3]], { fill: alpha(v > 1 ? C.red : COLORS[t.id], 0.8), stroke: null });
      label(Q, SHORT[t.id], [0, y], { color: C.text, align: 'right', dx: -6 });
    });
    seg(Q, [1, 0], [1, rows], { color: C.red, width: 2, dash: [5, 4] });
    label(Q, 'deadline', [1, rows], { color: C.red, align: 'left', dx: 4, dy: 10 });
  },
  law: () => [
    String.raw`U = \sum \frac{C_i}{T_i} \le n\left(2^{1/n} - 1\right)`,
    String.raw`R_i = C_i + \sum_{j < i} \left\lceil \frac{R_i}{T_j} \right\rceil C_j \le T_i`,
  ],
  liveRows(state, c) {
    return [
      kv('Processor load U', `${fig(100 * c.U)}%`),
      kv('Liu–Layland bound for 5 tasks', `${fig(100 * c.bound)}%`),
      kv('Housekeeping worst response, analysis', c.response.hk > 2e6 ? 'past its 2 s deadline' : ms(c.response.hk)),
      kv('Housekeeping first response, simulated', Number.isFinite(c.simFirst.hk) ? ms(c.simFirst.hk) : 'past its 2 s deadline'),
      kv('Tasks missing a deadline', c.misses.length ? c.misses.join(', ') : 'none'),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['load', `${fig(100 * c.U)}%`],
      ['bound', `${fig(100 * c.bound)}%`],
      ['deadlines', c.meets ? 'all met' : `${c.misses.length} missed`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Tasks that share data and wait on each other's locks, which can let a low task block a high one (Mars Pathfinder's resets in 1997), interrupts above every task, run times that vary from one cycle to the next, and the operating system's own overhead.`;
    if (!c.meets) {
      return { title: 'A deadline is missed', body: `At ${fig(100 * c.U)}% load, ${c.misses.join(' and ')} cannot finish before ${c.misses.length > 1 ? 'their' : 'its'} next release. The lowest-priority tasks take every delay the others cause. A faster processor, a lighter payload task or a slower loop would bring it back. ${leavesOut}` };
    }
    if (c.U > c.bound) {
      return { title: 'Past the bound, still on time', body: `The load, ${fig(100 * c.U)}%, is above the ${fig(100 * c.bound)}% Liu–Layland bound, yet response-time analysis shows every task finishes in time. The bound is a safe test, not a limit. But there is no margin: MIT 16.851 advises launching at no more than half the processor's capacity. ${leavesOut}` };
    }
    if (c.U > 0.5) {
      return { title: 'On time, short of the margin', body: `Every deadline holds at ${fig(100 * c.U)}% load, under the ${fig(100 * c.bound)}% bound. Software grows after launch, so a project keeps a 100% margin: the load at launch should be at most 50%. ${leavesOut}` };
    }
    return { title: 'Room to grow', body: `At ${fig(100 * c.U)}% load the processor keeps the 100% margin MIT 16.851 asks for at launch, and every task finishes well inside its period. ${leavesOut}` };
  },
  app: false,
});
