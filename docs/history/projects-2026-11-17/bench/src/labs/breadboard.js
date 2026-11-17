import { C, alpha, begin, label, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { BOUNDS_NO_METER, drawBoard, drawPart, drawSupply } from './board.js';
import { bindSelect, put, select } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { netOf, relaxBoard, solveBoard } from '@flux/subjects/em/breadboard.js';

/**
 * Shows that a breadboard is a set of hidden strips: holes in one row on one side of the channel are
 * one connection, so a part with both legs in one row is bypassed; a stray jumper across a part
 * shorts it out; and a rail split in the middle leaves the far half dead.
 *
 * A 5 V supply feeds the top rails. Two resistors go in series from the + rail to the − rail through
 * rows 10, 14 and 18. Every hole is coloured by its strip's voltage, so a strip lights up as one.
 * Recompute: modified nodal analysis on the nets. Check: Gauss–Seidel relaxation of the node
 * voltages, with jumpers merged into single nodes (`relaxBoard`).
 */
const E12 = [100, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000];

const SCENARIOS = [
  { id: 'series', name: 'Two resistors in series, placed right', R1: 1000, R2: 2200, fault: 'none', split: false },
  { id: 'along', name: 'R₂ turned along one row', R1: 1000, R2: 2200, fault: 'along', split: false },
  { id: 'jumper', name: 'A stray jumper across R₂', R1: 1000, R2: 2200, fault: 'jumper', split: false },
  { id: 'split', name: 'Split rails, circuit on the far half', R1: 1000, R2: 2200, fault: 'none', split: true },
];

const FAULTS = [
  ['none', 'none: placed right'],
  ['along', 'R₂ with both legs in row 14'],
  ['jumper', 'a jumper from row 14 to row 18'],
];

/** The parts, from the state. With split rails the circuit sits on rows 20–28, past the split. */
export function partsFor(s) {
  const r0 = s.split ? 20 : 10;
  const rows = [r0, r0 + 4, r0 + 8];
  const parts = [
    { id: 'V', type: 'V', a: 'T-2', b: 'T+2', value: 5 },
    { id: 'red', type: 'W', a: `T+${rows[0]}`, b: `a${rows[0]}`, color: 'red' },
    { id: 'R1', type: 'R', a: `c${rows[0]}`, b: `c${rows[1]}`, value: s.R1 },
    s.fault === 'along'
      ? { id: 'R2', type: 'R', a: `b${rows[1]}`, b: `e${rows[1]}`, value: s.R2 }
      : { id: 'R2', type: 'R', a: `d${rows[1]}`, b: `d${rows[2]}`, value: s.R2 },
    { id: 'black', type: 'W', a: `a${rows[2]}`, b: `T-${rows[2] + 1}`, color: 'black' },
  ];
  if (s.fault === 'jumper') parts.push({ id: 'J', type: 'W', a: `e${rows[1]}`, b: `e${rows[2]}`, color: 'green' });
  if (s.split && s.bridge) {
    parts.push({ id: 'b+', type: 'W', a: 'T+14', b: 'T+17', color: 'red' });
    parts.push({ id: 'b-', type: 'W', a: 'T-14', b: 'T-17', color: 'black' });
  }
  return parts;
}

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, R1: sc.R1, R2: sc.R2, fault: sc.fault, split: sc.split, bridge: false });
}

/** Colours for a strip's voltage: blue at 0 V to orange at the supply; grey for a strip that floats. */
function voltColor(v, top) {
  const t = Math.max(0, Math.min(1, v / top));
  const a = [0x3f, 0x8f, 0xd6];
  const b = [0xf4, 0xb9, 0x42];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default defineLab({
  id: 'breadboard',
  exam: 'u1',
  title: 'Breadboard',
  hint: 'Each hole is coloured by its strip’s voltage. Holes in one strip always match.',
  gapLimit: 1e-6,
  app: false,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('series', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    const ohms = E12.map((v) => [v, si(v, 'Ω')]);
    return `
      ${select('bb-r1', 'R₁, rows 10 to 14', ohms, 1000)}
      ${select('bb-r2', 'R₂, rows 14 to 18', ohms, 2200)}
      ${select('bb-fault', 'What is wrong', FAULTS, 'none')}
      ${select('bb-split', 'Power rails', [['whole', 'one strip end to end'], ['split', 'split in the middle']], 'whole')}
      ${select('bb-bridge', 'Jumpers across the split', [['no', 'none'], ['yes', 'bridge both rails']], 'no')}
      <p class="tiny">A half-size board: 30 rows, five holes a side. The supply is 5 V.</p>`;
  },
  bind(api) {
    bindSelect('bb-r1', (s, v) => { s.R1 = Number(v); }, api);
    bindSelect('bb-r2', (s, v) => { s.R2 = Number(v); }, api);
    bindSelect('bb-fault', (s, v) => { s.fault = v; }, api);
    bindSelect('bb-split', (s, v) => { s.split = v === 'split'; }, api);
    bindSelect('bb-bridge', (s, v) => { s.bridge = v === 'yes'; }, api);
  },
  syncControls(s) {
    put('bb-r1', s.R1);
    put('bb-r2', s.R2);
    put('bb-fault', s.fault);
    put('bb-split', s.split ? 'split' : 'whole');
    put('bb-bridge', s.bridge ? 'yes' : 'no');
  },
  compute(s) {
    const parts = partsFor(s);
    const opts = { split: s.split, ground: netOf('T-2', { split: s.split }) };
    const m = solveBoard(parts, opts);
    const r = relaxBoard(parts, opts);
    // The two methods, compared on every resistor current and every strip voltage.
    let gap = 0;
    // A current is compared against the circuit's own scale, so a shorted part's picoamps do not count.
    const scale = 5 / Math.min(s.R1, s.R2);
    for (const id of ['R1', 'R2']) gap = Math.max(gap, Math.abs(m.I[id] - r.I[id]) / Math.max(Math.abs(m.I[id]), 1e-3 * scale));
    for (const n of m.nodes) gap = Math.max(gap, Math.abs(m.V[n] - r.V[n]) / 5);
    const I1 = m.I.R1;
    const I2 = m.I.R2;
    const mid = netOf(`c${s.split ? 24 : 14}`, s);
    const bypassed = netOf(partsFor(s).find((p) => p.id === 'R2').a, s) === netOf(partsFor(s).find((p) => p.id === 'R2').b, s);
    return {
      parts, V: m.V, floating: m.floating, nets: m.nodes.filter((n) => !n.includes(':int')).length,
      I1, I2, Ijumper: s.fault === 'jumper' ? I1 - I2 : 0, Vmid: m.V[mid], midFloats: m.floating.includes(mid), flows: Math.abs(I1) > 1e-9, bypassed, gap,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, BOUNDS_NO_METER, 12);
    const lit = {};
    for (const [net, v] of Object.entries(c.V)) lit[net] = c.floating.includes(net) ? alpha(C.muted, 0.6) : voltColor(v, 5);
    drawBoard(P, { split: s.split, lit });
    for (const p of c.parts) if (p.type !== 'V') drawPart(P, p);
    drawSupply(P, c.parts[0], { name: 'supply', text: '5.00 V' });
    label(P, '0 V', [9, -1.9], { color: voltColor(0, 5) });
    label(P, '5 V', [12, -1.9], { color: voltColor(5, 5) });
    label(P, 'strip colour = its voltage', [21, -1.9], { color: C.muted });
  },
  law: () => [String.raw`I = \frac{V}{R_1 + R_2}`, String.raw`V_{14} = V\,\frac{R_2}{R_1 + R_2}`],
  liveRows(s, c) {
    return [
      kv('strips in use', String(c.nets)),
      kv('current in R₂', si(c.I2, 'A')),
      kv('current in the stray jumper', si(c.Ijumper, 'A')),
      kv('R₂ bypassed (both legs in one strip)', c.bypassed ? 'yes' : 'no'),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['current', si(c.I1, 'A')],
      ['middle row', c.midFloats ? 'not connected' : `${fig(c.Vmid)} V`],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> The strips are ideal: no resistance and no capacitance between them. A real strip has a few milliohms and a few picofarads, which matter only for large currents or fast signals.`;
    if (!c.flows) {
      return {
        title: 'No path, no current',
        body: String.raw`Follow the current from the + rail. ${s.fault === 'along' ? 'R₂ has both legs in row 14, so it joins that strip to itself. Nothing joins row 14 to row 18, and the chain is broken.' : 'The circuit sits past the split in the rails. The far half of each rail touches nothing, so it is not at 5 V or 0 V.'} Every strip that touches the supply side sits at 5 V: there is no current to make a drop. ${out}`,
      };
    }
    if (s.fault === 'jumper') {
      return {
        title: 'A jumper shorts R₂ out',
        body: String.raw`The green jumper joins row 14 to row 18. Current takes the wire, which has almost no resistance, so R₂ carries nothing and R₁ alone sets the current: ${fig((5 / s.R1) * 1000)} mA. Rows 14 and 18 are now one node at 0 V. ${out}`,
      };
    }
    return {
      title: 'Strips are the nodes',
      body: String.raw`Rows ${s.split ? '20, 24 and 28' : '10, 14 and 18'} each hold five joined holes. R₁ bridges the first two, R₂ the last two, so the two are in series: I = 5 V/(${si(s.R1, 'Ω')} + ${si(s.R2, 'Ω')}) = ${si(c.I1, 'A')}. The middle row sits at ${fig(c.Vmid)} V, the share of 5 V that R₂ takes. ${out}`,
    };
  },
});
