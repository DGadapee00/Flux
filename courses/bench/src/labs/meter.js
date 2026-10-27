import { C, alpha, begin, label, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { BOUNDS, drawBoard, drawMeter, drawPart, drawSupply, holeXY, lead } from './board.js';
import { bindSelect, put, select } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { netOf, relaxBoard, solveBoard } from '@flux/subjects/em/breadboard.js';

/**
 * Shows that a multimeter is part of the circuit it measures. On volts it goes across a part and
 * takes almost no current, through its 10 MΩ. On amps it goes in series, so the circuit must be
 * broken open to fit it in; put across a part instead, its 0.5 Ω shorts that part, and put across
 * the battery it blows its fuse. On ohms it drives its own small test current, so it reads true only
 * with the power off.
 *
 * A 9 V battery feeds two resistors in series through rows 10, 14 and 18. The meter is modelled as a
 * resistor between its leads (volts, amps) or a 1 V source behind 10 kΩ (ohms), solved with the
 * circuit. Recompute: modified nodal analysis. Check: Gauss–Seidel relaxation with every source as
 * its Norton equivalent (`relaxBoard`).
 *
 * Meter figures are typical of a handheld digital meter, not one maker's: 10 MΩ on volts, 0.5 Ω and a
 * 200 mA fuse on the mA jack. The 9 V battery's 1.5 Ω internal resistance is a typical figure for a
 * fresh alkaline cell.
 */
const R_VOLT = 10e6;
const R_AMP = 0.5;
const FUSE = 0.2;
const OHM_E = 1;
const OHM_R = 10e3;
const BATTERY = { E: 9, r: 1.5 };

const POINTS = {
  plus: { hole: 'T+7', name: '+ rail' },
  r10: { hole: 'e10', name: 'row 10' },
  r14: { hole: 'e14', name: 'row 14' },
  r18: { hole: 'e18', name: 'row 18' },
  minus: { hole: 'T-7', name: '− rail' },
};
const MODES = [['V', 'DC volts (V⎓)'], ['A', 'DC milliamps, mA jack (A⎓)'], ['O', 'ohms (Ω)']];
const RS = [1000, 4700, 10000, 100000, 1000000];

const SCENARIOS = [
  { id: 'volts', name: 'Volts across R₂', mode: 'V', red: 'r14', black: 'minus', jumper: true, power: true, R1: 10000, R2: 10000 },
  { id: 'amps', name: 'Amps: break the circuit and go in series', mode: 'A', red: 'plus', black: 'r10', jumper: false, power: true, R1: 10000, R2: 10000 },
  { id: 'fuse', name: 'Amps across the battery (a mistake)', mode: 'A', red: 'plus', black: 'minus', jumper: true, power: true, R1: 10000, R2: 10000 },
  { id: 'ohms', name: 'Ohms across R₂, power off', mode: 'O', red: 'r14', black: 'r18', jumper: true, power: false, R1: 10000, R2: 10000 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { ...sc, scenarioId: sc.id });
  delete state.id;
  delete state.name;
}

/** The circuit on the board, without the meter. */
function circuit(s) {
  const parts = [];
  if (s.power) parts.push({ id: 'B', type: 'V', a: 'T-2', b: 'T+2', value: BATTERY.E, r: BATTERY.r });
  if (s.jumper) parts.push({ id: 'red', type: 'W', a: 'T+10', b: 'a10', color: 'red' });
  parts.push({ id: 'R1', type: 'R', a: 'c10', b: 'c14', value: s.R1 });
  parts.push({ id: 'R2', type: 'R', a: 'd14', b: 'd18', value: s.R2 });
  parts.push({ id: 'black', type: 'W', a: 'a18', b: 'T-19', color: 'black' });
  return parts;
}

/** The meter as a part between its leads, in the mode it is set to. */
function meterPart(s, blown) {
  const a = POINTS[s.black].hole;
  const b = POINTS[s.red].hole;
  if (s.mode === 'V') return { id: 'M', type: 'R', a: b, b: a, value: R_VOLT };
  if (s.mode === 'A') return blown ? null : { id: 'M', type: 'R', a: b, b: a, value: R_AMP };
  return { id: 'M', type: 'V', a, b, value: OHM_E, r: OHM_R };
}

/** What the display shows, from a solved circuit: volts, amps red → black, or ohms. */
function reading(s, sol, blown) {
  const vr = sol.V[netOf(POINTS[s.red].hole)] ?? 0;
  const vb = sol.V[netOf(POINTS[s.black].hole)] ?? 0;
  const v = vr - vb;
  if (s.mode === 'V') return v;
  if (s.mode === 'A') return blown ? 0 : v / R_AMP;
  // An ohmmeter infers R from how far its own source is pulled down: R = R_t·V/(E − V).
  return (OHM_R * v) / (OHM_E - v);
}

function solveWith(s, solver) {
  const base = circuit(s);
  const ground = netOf('T-2');
  // On amps, solve once to see whether the fuse survives, then again without the meter if not.
  let blown = false;
  let parts = [...base, meterPart(s, false)];
  let sol = solver(parts, { ground });
  if (s.mode === 'A' && Math.abs(reading(s, sol, false)) > FUSE) {
    blown = true;
    parts = base;
    sol = solver(parts, { ground });
  }
  return { sol, blown, value: reading(s, sol, blown), fuseI: s.mode === 'A' ? Math.abs(reading(s, solver([...base, meterPart(s, false)], { ground }), false)) : 0 };
}

export default defineLab({
  id: 'meter',
  exam: 'u1',
  title: 'Multimeter',
  hint: 'Choose the dial and where each lead goes. The meter is part of the circuit too.',
  gapLimit: 1e-6,
  app: false,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('volts', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    const pts = Object.entries(POINTS).map(([k, p]) => [k, p.name]);
    const ohms = RS.map((v) => [v, si(v, 'Ω')]);
    return `
      ${select('mt-mode', 'Dial', MODES, 'V')}
      ${select('mt-red', 'Red lead (V Ω mA jack)', pts, 'r14')}
      ${select('mt-black', 'Black lead (COM jack)', pts, 'minus')}
      ${select('mt-jumper', 'Red jumper, + rail to row 10', [['in', 'in place'], ['out', 'pulled out']], 'in')}
      ${select('mt-power', 'Battery', [['on', 'connected'], ['off', 'disconnected']], 'on')}
      ${select('mt-r1', 'R₁, rows 10 to 14', ohms, 10000)}
      ${select('mt-r2', 'R₂, rows 14 to 18', ohms, 10000)}`;
  },
  bind(api) {
    bindSelect('mt-mode', (s, v) => { s.mode = v; }, api);
    bindSelect('mt-red', (s, v) => { s.red = v; }, api);
    bindSelect('mt-black', (s, v) => { s.black = v; }, api);
    bindSelect('mt-jumper', (s, v) => { s.jumper = v === 'in'; }, api);
    bindSelect('mt-power', (s, v) => { s.power = v === 'on'; }, api);
    bindSelect('mt-r1', (s, v) => { s.R1 = Number(v); }, api);
    bindSelect('mt-r2', (s, v) => { s.R2 = Number(v); }, api);
  },
  syncControls(s) {
    put('mt-mode', s.mode);
    put('mt-red', s.red);
    put('mt-black', s.black);
    put('mt-jumper', s.jumper ? 'in' : 'out');
    put('mt-power', s.power ? 'on' : 'off');
    put('mt-r1', s.R1);
    put('mt-r2', s.R2);
  },
  compute(s) {
    const m = solveWith(s, solveBoard);
    const r = solveWith(s, relaxBoard);
    // What an ideal meter would show: the circuit as it stands, with no meter in it.
    const bare = solveBoard(circuit(s), { ground: netOf('T-2') });
    const vTrue = (bare.V[netOf(POINTS[s.red].hole)] ?? 0) - (bare.V[netOf(POINTS[s.black].hole)] ?? 0);
    const iR1 = m.sol.I.R1;
    const scale = s.mode === 'V' ? BATTERY.E : s.mode === 'A' ? BATTERY.E / (s.R1 + s.R2) : Math.max(s.R1, s.R2);
    const gap = Math.abs(m.value - r.value) / Math.max(Math.abs(m.value), 1e-3 * scale);
    const live = s.mode === 'O' && s.power;
    const error = s.mode === 'V' && Math.abs(vTrue) > 1e-9 ? (m.value - vTrue) / vTrue : 0;
    return {
      parts: [...circuit(s)], value: m.value, blown: m.blown, fuseI: m.fuseI, vTrue, iR1, iR2: m.sol.I.R2, live, error, gap,
      rIn: s.mode === 'V' ? R_VOLT : s.mode === 'A' ? R_AMP : OHM_R,
      ohmsOk: s.mode === 'O' && !s.power && Math.abs(m.value - s.R2) < 0.01 * s.R2,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, BOUNDS, 10);
    drawBoard(P, {});
    for (const p of c.parts) if (p.type !== 'V') drawPart(P, p);
    if (s.power) drawSupply(P, { a: 'T-2', b: 'T+2' }, { name: 'battery', text: '9 V' });
    else label(P, 'battery disconnected', [-2.4, 12], { color: C.muted });
    const shown = s.mode === 'V' ? `${fig(c.value)} V` : s.mode === 'A' ? (c.blown ? 'fuse blown' : `${fig(c.value * 1000)} mA`) : (c.value < 0 || c.value > 1e8 ? 'OL / nonsense' : si(c.value, 'Ω'));
    const jacks = drawMeter(P, { reading: shown, mode: { V: 'V⎓', A: 'mA⎓', O: 'Ω' }[s.mode], warn: c.blown || c.live });
    lead(P, jacks.red, holeXY(POINTS[s.red].hole), C.red);
    lead(P, jacks.black, holeXY(POINTS[s.black].hole), '#2d2f33', true);
    if (c.live) label(P, 'circuit is live: an ohms reading means nothing', [15.5, -1.6], { color: C.red });
    else if (c.blown) label(P, `${fig(c.fuseI)} A tried to pass the 0.2 A fuse`, [15.5, -1.6], { color: C.red });
  },
  law: () => [String.raw`V = IR`, String.raw`R_{\parallel} = \frac{R\,R_{\text{meter}}}{R + R_{\text{meter}}}`],
  liveRows(s, c) {
    return [
      kv('meter’s own resistance', si(c.rIn, 'Ω')),
      kv('current in R₁', si(c.iR1, 'A')),
      kv('current in R₂', si(c.iR2, 'A')),
      kv('the meter’s error on volts', s.mode === 'V' ? `${fig(c.error * 100)} %` : '—'),
    ].join('');
  },
  readout(s, c) {
    const shown = s.mode === 'V' ? `${fig(c.value)} V` : s.mode === 'A' ? (c.blown ? 'fuse blown' : si(c.value, 'A')) : (c.value < 0 ? 'nonsense' : si(c.value, 'Ω'));
    return cells([
      ['meter reads', shown],
      ['with no meter', `${fig(c.vTrue)} V`],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> The meter's figures are typical, not one maker's: read your own meter's manual for its input resistance, its burden on each range, and its fuse ratings. A real display also rounds to its digits and has an accuracy of about 0.5% on volts.`;
    if (s.mode === 'A' && c.blown) {
      return { title: 'An ammeter across a source is a short', body: String.raw`On amps the meter is $0.5\ \Omega$. Across the battery that lets $${fig(c.fuseI)}$ A flow, far past the 0.2 A fuse, which melts. Amps go in series: pull a wire out and let the meter close the gap. ${out}` };
    }
    if (s.mode === 'A') {
      return { title: 'Amps in series', body: String.raw`The meter reads the current through itself. With the red jumper pulled out and the meter in its place, all the circuit's current passes through it: ${si(c.value, 'A')}. Its 0.5 Ω adds almost nothing to ${si(s.R1 + s.R2, 'Ω')}. Clipped across one resistor instead, it would short that resistor out. ${out}` };
    }
    if (s.mode === 'O') {
      return c.live
        ? { title: 'Never measure ohms on a live circuit', body: String.raw`The ohmmeter works out R from its own small test current. The battery's voltage swamps it, so the number is meaningless, and on a bigger supply it can damage the meter. Disconnect the power first. ${out}` }
        : { title: 'Ohms, power off', body: String.raw`With the battery off, the meter's own 1 V source pushes current through R₂ and reads ${si(c.value, 'Ω')}. In a circuit, it reads everything between its leads: check that no other path joins them. ${out}` };
    }
    return { title: 'Volts across a part', body: String.raw`The voltmeter's leads go across the part, red on the higher side. It takes a little current through its $10\ \text{M}\Omega$, so it reads $${fig(c.value)}$ V against $${fig(c.vTrue)}$ V with no meter. With resistors of a megohm, that loading grows to several percent. ${out}` };
  },
});
