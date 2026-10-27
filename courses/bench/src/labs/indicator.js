import { C, alpha, begin, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { BOUNDS, bandNames, drawBoard, drawPart, drawSupply } from './board.js';
import { bindSelect, bindSlider, put, select, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { I_MAX, LEDS, ledModel } from './leds.js';
import { nextE12Up, seriesCurrent, seriesCurrentBisect, voltageAt } from '@flux/subjects/em/diode.js';

/**
 * Application lab: an indicator LED, the power light on almost every gadget, on the supplies a
 * project meets: a 3.3 V microcontroller pin, 5 V USB, a 9 V battery and a 12 V adapter.
 *
 * It walks the design a builder does: pick a current, work out R = (V_s − V_f)/I, buy the next
 * standard value up so the current lands at or under the target, then check the resistor's power,
 * I²R, against its rating. It also shows that the forward voltage on the datasheet is a typical
 * value: a part at the high end of its range runs a little dimmer with the same resistor.
 *
 * Numbers. A 5 mm red indicator LED as typical datasheets give it: forward voltage 2.0 V typical at
 * 20 mA (about 1.8 V to 2.4 V across parts), 30 mA maximum continuous current, 5 V maximum reverse
 * voltage. These are typical values for the type, not one maker's part; check the datasheet of the
 * LED you buy. Resistors: through-hole carbon-film parts rated ⅛ W or ¼ W at 70 °C, in the E12 series
 * (IEC 60063). The rule of thumb to run a resistor at no more than half its rating is common practice,
 * not a standard.
 *
 * Recompute: the current with the bought resistor, by Newton's method on the course LED model. Check:
 * the same by bisection, and the resistor's power both as I²R and as V_R²/R.
 */
const SUPPLIES = [
  [3.3, '3.3 V microcontroller pin'],
  [5, '5 V USB'],
  [9, '9 V battery'],
  [12, '12 V wall adapter'],
];
const VF_CASES = [['typ', 'typical, 2.0 V'], ['low', 'low end, 1.8 V'], ['high', 'high end, 2.4 V']];
const VF_SHIFT = { typ: 0, low: -0.2, high: 0.4 };
const RATINGS = [[0.125, '⅛ W'], [0.25, '¼ W']];
const VF_TYP = LEDS.red.vf;

const SCENARIOS = [
  { id: 'usb', name: 'Power light on 5 V USB, 20 mA', vs: 5, target: 20, rating: 0.25, vf: 'typ' },
  { id: 'nine', name: 'On a 9 V battery, 20 mA', vs: 9, target: 20, rating: 0.25, vf: 'typ' },
  { id: 'twelve', name: 'On 12 V with a ⅛ W resistor', vs: 12, target: 20, rating: 0.125, vf: 'typ' },
  { id: 'dim', name: 'A modern indicator at 5 mA on 5 V', vs: 5, target: 5, rating: 0.25, vf: 'typ' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, vs: sc.vs, target: sc.target, rating: sc.rating, vf: sc.vf });
}

/** The design: the exact resistance, the part to buy, and what that part really gives. */
export function design(s) {
  const Rexact = (s.vs - VF_TYP) / (s.target / 1000);
  if (!(Rexact > 0)) return { Rexact, Rpick: null, I: 0, Ib: 0, Vled: s.vs, PR: 0, PR2: 0 };
  const Rpick = nextE12Up(Rexact);
  const d = ledModel('red', VF_SHIFT[s.vf]);
  const I = seriesCurrent(s.vs, Rpick, [d]);
  const Ib = seriesCurrentBisect(s.vs, Rpick, [d]);
  const Vled = voltageAt(d, I);
  const VR = s.vs - Vled;
  return { Rexact, Rpick, I, Ib, Vled, VR, PR: I * I * Rpick, PR2: (VR * VR) / Rpick };
}

export default defineLab({
  id: 'indicator',
  exam: 'u2',
  title: 'Indicator LED',
  app: true,
  hint: 'Pick a supply and a current. The lab buys the next standard resistor up and checks its power.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('usb', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'target', lo: 2, hi: 30 }),
  controls() {
    return `
      ${select('in-vs', 'Supply', SUPPLIES, 5)}
      ${slider('in-target', 'Current you want (mA)', 20, 2, 30, 1)}
      ${select('in-vf', 'This LED’s forward voltage', VF_CASES, 'typ')}
      ${select('in-rating', 'Resistor’s power rating', RATINGS, 0.25)}
      <p class="tiny">A 5 mm red LED: 2.0 V typical at 20 mA, 30 mA maximum. On the gauges, the dashes mark your target current and half the resistor’s rating.</p>`;
  },
  bind(api) {
    bindSelect('in-vs', (s, v) => { s.vs = Number(v); }, api);
    bindSlider('in-target', (s, v) => { s.target = v; }, api);
    bindSelect('in-vf', (s, v) => { s.vf = v; }, api);
    bindSelect('in-rating', (s, v) => { s.rating = Number(v); }, api);
  },
  syncControls(s) {
    put('in-vs', s.vs);
    put('in-target', s.target);
    put('in-vf', s.vf);
    put('in-rating', s.rating);
  },
  compute(s) {
    const r = design(s);
    const gap = r.Rpick
      ? Math.max(Math.abs(r.I - r.Ib) / Math.max(r.I, 1e-3), Math.abs(r.PR - r.PR2) / Math.max(r.PR, 1e-9))
      : 0;
    return {
      ...r, gap,
      ok: !!r.Rpick,
      mA: r.I * 1000,
      hot: r.PR > s.rating,
      half: r.PR > s.rating / 2,
      load: r.PR / s.rating,
      wrongP: s.vs * r.I,
      bands: r.Rpick ? bandNames(r.Rpick) : '',
      over: r.I > I_MAX,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, BOUNDS, 10);
    drawBoard(P, {});
    drawSupply(P, { a: 'T-2', b: 'T+2' }, { name: 'supply', text: `${fig(s.vs)} V` });
    drawPart(P, { id: 'red', type: 'W', a: 'T+8', b: 'a8', color: 'red' });
    if (c.ok) drawPart(P, { id: 'R', type: 'R', a: 'c8', b: 'c14', value: c.Rpick }, { color: c.hot ? alpha(C.red, 0.9) : null });
    drawPart(P, { id: 'D', type: 'D', a: 'd14', b: 'd16', color: LEDS.red.color, glow: c.I / 0.02 });
    drawPart(P, { id: 'black', type: 'W', a: 'a16', b: 'T-17', color: 'black' });
    label(P, c.ok ? `${si(c.Rpick, 'Ω')}: ${c.bands}` : 'supply below the LED’s 2.0 V', [11, 4.4], { color: c.ok ? C.text : C.red, bold: true });

    // Two gauges: the LED's current against its maximum, and the resistor's power against its rating.
    const gauge = (y, frac, mark, text, bad) => {
      const x0 = 3;
      const x1 = 29;
      const X = (f) => x0 + Math.min(1, Math.max(0, f)) * (x1 - x0);
      poly(P, [[x0, y - 0.6], [x1, y - 0.6], [x1, y + 0.6], [x0, y + 0.6]], { fill: alpha(C.bg, 0.9), stroke: alpha(C.text, 0.4), width: 1 });
      poly(P, [[x0, y - 0.6], [X(frac), y - 0.6], [X(frac), y + 0.6], [x0, y + 0.6]], { fill: bad ? alpha(C.red, 0.75) : alpha(C.teal, 0.75), stroke: null });
      if (mark != null) seg(P, [X(mark), y - 1.1], [X(mark), y + 1.1], { color: C.yellow, width: 2, dash: [4, 3] });
      label(P, text, [x0, y + 1.3], { color: C.muted, align: 'left' });
    };
    gauge(-3.6, c.I / I_MAX, s.target / 1000 / I_MAX, `LED ${fig(c.mA)} mA of ${fig(I_MAX * 1000)} mA max`, c.over);
    gauge(-6.6, c.load, 0.5, `resistor ${si(c.PR, 'W')} of ${RATINGS.find(([v]) => v === s.rating)[1]}`, c.hot);
  },
  law: () => [String.raw`R = \frac{V_s - V_f}{I}`, String.raw`P_R = I^2 R`],
  liveRows(s, c) {
    return [
      kv('exact resistance for your current', c.ok ? si(c.Rexact, 'Ω') : '—'),
      kv('next E12 value up', c.ok ? `${si(c.Rpick, 'Ω')} (${c.bands})` : '—'),
      kv('LED voltage with this part', `${fig(c.Vled)} V`),
      kv('resistor’s power, I²R', si(c.PR, 'W')),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['resistor', c.ok ? si(c.Rpick, 'Ω') : 'none works'],
      ['current', `${fig(c.mA)} mA`],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the course model leaves out.</b> The LED is the course model fitted to a typical 2.0 V at 20 mA; the datasheet’s spread is shown only as three cases. Resistors carry a tolerance too, ±5% for common carbon film, which moves the current by about as much. A resistor’s rating holds at 70 °C in free air and falls above that, so a resistor in a closed box needs more margin.`;
    if (!c.ok) {
      return {
        title: 'The supply cannot light this LED',
        body: [`A red LED needs about 2.0 V before it carries much current. A ${fig(s.vs)} V supply leaves nothing for a resistor. Use a higher supply.`, out],
      };
    }
    return {
      title: c.hot ? 'The resistor is over its rating' : 'Resistor, then its power',
      body: [
        `R = (${fig(s.vs)} − 2.0) V / ${fig(s.target)} mA = ${si(c.Rexact, 'Ω')}. The next E12 value up is ${si(c.Rpick, 'Ω')}, ${c.bands}, which gives ${fig(c.mA)} mA: at or a little under the target.`,
        `The resistor takes ${fig(c.VR)} V at ${fig(c.mA)} mA, so I²R = ${si(c.PR, 'W')}. ${c.hot ? `That is more than its ${RATINGS.find(([v]) => v === s.rating)[1]}; it would run hot and fail. Use a ¼ W part or a lower current.` : c.half ? 'That is under its rating but over half of it; it will run warm.' : 'That is well under half its rating, so it runs cool.'} The LED’s own power is not the resistor’s: V_s·I = ${si(c.wrongP, 'W')} is the whole circuit’s.`,
        out,
      ],
    };
  },
});
