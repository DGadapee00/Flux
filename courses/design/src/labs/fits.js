import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { fitLimits, interferenceChance, interferenceChanceNumeric, spread } from '@flux/subjects/design/tolerancing.js';

/**
 * Fits: a hole and a shaft of 50 mm basic size, each with its tolerance band, in micrometres from
 * the basic size.
 *
 * Shows that the limits decide the fit: the smallest hole against the largest shaft gives the
 * tightest pair. With each part made by a normal process whose band is ±3σ/Cp, the chance of an
 * interfering pair is found two ways: the closed form for the difference of two normals, and a binned
 * convolution of the two size distributions (packages/subjects/src/design/tolerancing.js). `gap` is
 * the difference in that chance.
 */
const SCENARIOS = [
  { id: 'close-running', name: 'H8/f7 close running', holeLo: 0, holeHi: 39, shaftLo: -50, shaftHi: -25 },
  { id: 'sliding', name: 'H7/g6 sliding', holeLo: 0, holeHi: 25, shaftLo: -25, shaftHi: -9 },
  { id: 'location', name: 'H7/h6 location', holeLo: 0, holeHi: 25, shaftLo: -16, shaftHi: 0 },
  { id: 'transition', name: 'H7/k6 transition', holeLo: 0, holeHi: 25, shaftLo: 2, shaftHi: 18 },
  { id: 'press', name: 'H7/p6 press', holeLo: 0, holeHi: 25, shaftLo: 26, shaftHi: 42 },
  { id: 'wide', name: 'Wide bands, roomy on average', holeLo: 0, holeHi: 60, shaftLo: -50, shaftHi: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, holeLo: sc.holeLo, holeHi: sc.holeHi, shaftLo: sc.shaftLo, shaftHi: sc.shaftHi, cp: 1 });
}

/** A share as a percentage, or per million when it is under 0.1%. */
const share = (x) => (x < 0.001 ? `${fig(x * 1e6)} per million` : `${fig(x * 100)}%`);

const band = (a, b) => [Math.min(a, b), Math.max(a, b)];

export default defineLab({
  id: 'fits',
  exam: 'u1',
  title: 'Fits',
  hint: 'Slide the shaft’s band up into the hole’s: the fit goes from clearance through transition to interference. Tighten the process to see how often a pair actually interferes.',
  gapLimit: 5e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('sliding', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'shaftHi', lo: -60, hi: 60 }),
  controls() {
    return `
      ${slider('fi-hl', 'hole lower deviation (μm)', 0, -60, 60, 1)}
      ${slider('fi-hh', 'hole upper deviation (μm)', 25, -60, 60, 1)}
      ${slider('fi-sl', 'shaft lower deviation (μm)', -25, -60, 60, 1)}
      ${slider('fi-sh', 'shaft upper deviation (μm)', -9, -60, 60, 1)}
      ${slider('fi-cp', 'process capability Cp', 1, 0.67, 2, 0.01)}
      <p class="tiny">50 mm basic size. Deviations from Wikipedia’s Engineering fit article. Each part’s sizes spread as a normal curve with its band as ±3σ/Cp.</p>`;
  },
  bind(api) {
    bindSlider('fi-hl', (s, v) => { s.holeLo = v; }, api);
    bindSlider('fi-hh', (s, v) => { s.holeHi = v; }, api);
    bindSlider('fi-sl', (s, v) => { s.shaftLo = v; }, api);
    bindSlider('fi-sh', (s, v) => { s.shaftHi = v; }, api);
    bindSlider('fi-cp', (s, v) => { s.cp = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['fi-hl', state.holeLo], ['fi-hh', state.holeHi], ['fi-sl', state.shaftLo], ['fi-sh', state.shaftHi], ['fi-cp', state.cp]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const [holeLo, holeHi] = band(state.holeLo, state.holeHi);
    const [shaftLo, shaftHi] = band(state.shaftLo, state.shaftHi);
    // A band of zero width is a perfect part; give it a hair of width so the spread stays defined.
    const hole = spread(holeLo, Math.max(holeHi, holeLo + 0.5), { cp: state.cp });
    const shaft = spread(shaftLo, Math.max(shaftHi, shaftLo + 0.5), { cp: state.cp });
    const lim = fitLimits({ holeLo, holeHi, shaftLo, shaftHi });
    const a = interferenceChance(hole, shaft);
    const h = Math.min(hole.sd, shaft.sd) / 50;
    const n = interferenceChanceNumeric(hole, shaft, h);
    const gap = Math.max(Math.abs(n.p - a.p), Math.abs(Math.sqrt(Math.max(n.variance, 0)) - a.sd) / a.sd);
    return { ...lim, holeLo, holeHi, shaftLo, shaftHi, hole, shaft, chance: a.p, mean: a.mean, sdC: a.sd, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const lo = Math.min(-60, c.cMin - 10, c.shaftLo - 10, c.holeLo - 10);
    const hi = Math.max(70, c.cMax + 10, c.holeHi + 10, c.shaftHi + 10);
    const P = plotIn(B, B.free, { lo: 0, hi: 3 }, { lo, hi }, { left: 56, right: 14, top: 30, bottom: 30 });
    axes(P, { yLabel: 'μm from 50 mm', xFmt: () => '' });
    seg(P, [0, 0], [3, 0], { color: alpha(C.text, 0.6), width: 1.5 });
    const col = (x0, a, b, color, name, s) => {
      poly(P, [[x0 + 0.15, a], [x0 + 0.85, a], [x0 + 0.85, b], [x0 + 0.15, b]], { fill: alpha(color, 0.25), stroke: color, width: 1.5 });
      if (s) {
        const pts = [];
        const peak = 1 / (s.sd * Math.sqrt(2 * Math.PI));
        for (let i = 0; i <= 80; i++) {
          const y = s.mid - 4 * s.sd + (i / 80) * 8 * s.sd;
          const f = Math.exp(-0.5 * ((y - s.mid) / s.sd) ** 2) / (s.sd * Math.sqrt(2 * Math.PI));
          pts.push([x0 + 0.15 + 0.6 * (f / peak), y]);
        }
        line(P, pts, { color, width: 1.5 });
      }
      label(P, name, [x0 + 0.5, hi], { color, dy: -12, bold: true });
    };
    col(0, c.holeLo, c.holeHi, C.blue, 'hole', c.hole);
    col(1, c.shaftLo, c.shaftHi, C.gold, 'shaft', c.shaft);
    // Clearance: hole minus shaft, its limits and its spread.
    const cs = { mid: c.mean, sd: c.sdC };
    poly(P, [[2.15, c.cMin], [2.85, c.cMin], [2.85, c.cMax], [2.15, c.cMax]], { fill: alpha(C.teal, 0.12), stroke: C.teal, width: 1.5 });
    if (c.cMin < 0) {
      const top = Math.min(0, c.cMax);
      poly(P, [[2.15, c.cMin], [2.85, c.cMin], [2.85, top], [2.15, top]], { fill: alpha(C.red, 0.3), stroke: null });
    }
    const pts = [];
    const peak = 1 / (cs.sd * Math.sqrt(2 * Math.PI));
    for (let i = 0; i <= 80; i++) {
      const y = cs.mid - 4 * cs.sd + (i / 80) * 8 * cs.sd;
      const f = Math.exp(-0.5 * ((y - cs.mid) / cs.sd) ** 2) / (cs.sd * Math.sqrt(2 * Math.PI));
      pts.push([2.15 + 0.6 * (f / peak), y]);
    }
    line(P, pts, { color: C.teal, width: 1.5 });
    label(P, 'clearance', [2.5, hi], { color: C.teal, dy: -12, bold: true });
    label(P, 'basic size', [3, 0], { color: C.muted, align: 'right', dy: 10 });
  },
  law: () => [String.raw`c_{\min} = D_{\min} - d_{\max},\qquad c_{\max} = D_{\max} - d_{\min}`, String.raw`P(c < 0) = \Phi\!\left(\frac{-\bar c}{\sqrt{\sigma_D^2 + \sigma_d^2}}\right)`],
  liveRows(state, c) {
    return [
      kv('hole band', `${fig(c.holeLo)} to ${fig(c.holeHi)} μm`),
      kv('shaft band', `${fig(c.shaftLo)} to ${fig(c.shaftHi)} μm`),
      kv('mean clearance $\\bar c$', `${fig(c.mean)} μm`),
      kv('spread of clearance $\\sigma_c$', `${fig(c.sdC)} μm`),
      kv('closed form against convolution', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['fit', c.type],
      ['tightest pair', `${fig(c.cMin)} μm`],
      ['loosest pair', `${fig(c.cMax)} μm`],
      ['pairs that interfere', share(c.chance)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Size is not shape: a hole can be within its limits and still be out of round or tapered. Temperature changes the fit too, since steel grows about 12 μm per metre per kelvin.`;
    let title = 'A clearance fit';
    let body = String.raw`The smallest hole is still ${fig(c.cMin)} μm bigger than the largest shaft, so every pair slides, whatever the process.`;
    if (c.type === 'interference') {
      title = 'An interference fit';
      body = String.raw`The largest hole is ${fig(-c.cMax)} μm smaller than the smallest shaft, so every pair must be pressed or shrunk together.`;
    } else if (c.type === 'transition') {
      title = c.mean > 3 * c.sdC ? 'Roomy on average, tight at the extremes' : 'A transition fit';
      body = c.mean > 3 * c.sdC
        ? String.raw`On average there is ${fig(c.mean)} μm of room, but the worst pair interferes by ${fig(-c.cMin)} μm. With these processes that happens in ${share(c.chance)} of pairs: rarely, but not never.`
        : String.raw`The worst pairs interfere and the best ones slide. With these processes ${share(c.chance)} of pairs interfere. A tighter process (higher Cp) changes that share, not the limits.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
