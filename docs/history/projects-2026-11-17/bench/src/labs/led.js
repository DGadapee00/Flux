import { C, axes, begin, dot, label, line, note, plotIn, sceneIn, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { BOUNDS_NO_METER, drawBoard, drawPart, drawSupply } from './board.js';
import { bindSelect, bindSlider, put, select, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { I_MAX, I_RATED, LEDS, ledModel } from './leds.js';
import { currentAt, nextE12Up, seriesCurrent, seriesCurrentBisect, voltageAt } from '@flux/subjects/em/diode.js';

/**
 * Shows that an LED is not a resistor. Its voltage hardly changes as its current changes, so the
 * resistor in series, not the LED, sets the current: R = (V_s − V_f)/I. Without a resistor almost
 * nothing limits the current. Turned backwards, the LED blocks, and the whole supply sits across it.
 *
 * A supply feeds the top rails. A red jumper joins the + rail to row 8, the resistor runs from row 8
 * to row 12, the LED from row 12 (anode) to row 14 (cathode), and a black jumper joins row 14 to the
 * − rail. The graph is the LED's I–V curve with the resistor's load line, I = (V_s − V)/R; the
 * circuit runs where they cross.
 *
 * Recompute: Newton's method on the loop equation V_s = I R + V_LED(I), with the LED as a Shockley
 * diode with series resistance (`@flux/subjects/em/diode.js`). Check: the crossing of the load line
 * and the curve by bisection. LED forward voltages are typical values for each colour (./leds.js).
 */
const RS = [10, 47, 68, 100, 150, 220, 330, 470, 680, 1000, 2200];

const SCENARIOS = [
  { id: 'red5', name: 'A red LED on 5 V through 150 Ω', color: 'red', vs: 5, R: 150, flip: false },
  { id: 'flip', name: 'The same LED in backwards (it does not light)', color: 'red', vs: 5, R: 150, flip: true },
  { id: 'bare', name: 'Almost no resistor: 10 Ω', color: 'red', vs: 5, R: 10, flip: false },
  { id: 'red9', name: 'A red LED on a 9 V battery through 680 Ω', color: 'red', vs: 9, R: 680, flip: false },
  { id: 'blue33', name: 'A blue LED on a 3.3 V pin through 100 Ω', color: 'blue', vs: 3.3, R: 100, flip: false },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, color: sc.color, vs: sc.vs, R: sc.R, flip: sc.flip });
}

/** The loop solved: the current, and how the supply's voltage divides between the resistor and the LED. */
export function solveLed(s) {
  const d = ledModel(s.color);
  if (s.flip) {
    // Reverse biased: only the leakage flows, so the resistor drops nothing and the LED takes it all.
    const I = Math.abs(currentAt(d, -s.vs));
    return { d, I, Ib: I, Vled: -(s.vs - I * s.R), VR: I * s.R };
  }
  const I = seriesCurrent(s.vs, s.R, [d]);
  const Ib = seriesCurrentBisect(s.vs, s.R, [d]);
  return { d, I, Ib, Vled: voltageAt(d, I), VR: I * s.R };
}

export default defineLab({
  id: 'led',
  exam: 'u2',
  title: 'LED and resistor',
  hint: 'Change the resistor and the supply. The LED’s voltage hardly moves; its current follows the resistor.',
  gapLimit: 1e-6,
  app: false,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('red5', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'vs', lo: 0, hi: 12 }),
  controls() {
    return `
      ${select('led-color', 'LED colour', Object.entries(LEDS).map(([k, v]) => [k, `${v.name}, about ${v.vf.toFixed(1)} V at 20 mA`]), 'red')}
      ${slider('led-vs', 'Supply (V)', 5, 0, 12, 0.1)}
      ${select('led-r', 'Resistor', RS.map((r) => [r, si(r, 'Ω')]), 150)}
      ${select('led-flip', 'LED direction', [['fwd', 'anode (long leg) to the resistor'], ['rev', 'backwards']], 'fwd')}`;
  },
  bind(api) {
    bindSelect('led-color', (s, v) => { s.color = v; }, api);
    bindSlider('led-vs', (s, v) => { s.vs = v; }, api);
    bindSelect('led-r', (s, v) => { s.R = Number(v); }, api);
    bindSelect('led-flip', (s, v) => { s.flip = v === 'rev'; }, api);
  },
  syncControls(s) {
    put('led-color', s.color);
    put('led-vs', s.vs);
    put('led-r', s.R);
    put('led-flip', s.flip ? 'rev' : 'fwd');
  },
  compute(s) {
    const { I, Ib, Vled, VR } = solveLed(s);
    // The two methods agree to a part in a million, or to a nanoamp when the LED is all but off.
    const gap = Math.abs(I - Ib) / Math.max(I, 1e-3);
    const vf = LEDS[s.color].vf;
    const Rneed = (s.vs - vf) / I_RATED;
    return {
      I, Vled, VR, gap, vf,
      lit: I > 1e-4,
      glow: I / I_RATED,
      over: I > I_MAX,
      PR: I * I * s.R,
      Pled: Math.max(0, Vled) * I,
      naive: s.vs / s.R,
      Rneed,
      Rpick: Rneed > 0 ? nextE12Up(Rneed) : null,
      reverseOver: s.flip && s.vs > 5,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.46);
    // The circuit sits above the channel, so only that half of the board is shown.
    const P = sceneIn(B, top, { ...BOUNDS_NO_METER, y0: 6.6 }, 8);
    B.ctx.save();
    B.ctx.beginPath();
    B.ctx.rect(top.x0, top.y0, top.x1 - top.x0, top.y1 - top.y0);
    B.ctx.clip();
    drawBoard(P, {});
    drawSupply(P, { a: 'T-2', b: 'T+2' }, { name: 'supply', text: `${fig(s.vs)} V` });
    drawPart(P, { id: 'red', type: 'W', a: 'T+8', b: 'a8', color: 'red' });
    drawPart(P, { id: 'R', type: 'R', a: 'c8', b: 'c12', value: s.R });
    const [an, ca] = s.flip ? ['d14', 'd12'] : ['d12', 'd14'];
    drawPart(P, { id: 'D', type: 'D', a: an, b: ca, color: LEDS[s.color].color, glow: c.glow });
    drawPart(P, { id: 'black', type: 'W', a: 'a14', b: 'T-15', color: 'black' });
    label(P, s.flip ? 'LED backwards' : `${si(c.I, 'A')}`, [18, 11.4], { color: c.over ? C.red : C.text, bold: true, align: 'left' });
    label(P, c.over ? `over the ${fig(I_MAX * 1000)} mA max` : `long leg (anode) in row ${s.flip ? 14 : 12}`, [18, 9.2], { color: c.over ? C.red : C.dim, align: 'left' });
    B.ctx.restore();

    // The I–V curve and the load line.
    const vHi = Math.max(s.vs, c.vf + 0.8);
    const iHi = Math.max(40, Math.min(160, 1.3 * c.I * 1000));
    const Q = plotIn(B, bottom, { lo: 0, hi: vHi }, { lo: 0, hi: iHi }, { left: 46, right: 14, top: 22, bottom: 40 });
    axes(Q, { xLabel: 'V across the LED (V)', yLabel: 'I (mA)' });
    const d = ledModel(s.color);
    const pts = [];
    for (let k = 0; k <= 240; k += 1) {
      const v = (vHi * k) / 240;
      pts.push([v, currentAt(d, v) * 1000]);
    }
    line(Q, pts, { color: LEDS[s.color].color === '#f2f4ff' ? C.text : LEDS[s.color].color, width: 2.5 });
    if (!s.flip) {
      line(Q, [[0, (s.vs / s.R) * 1000], [s.vs, 0]], { color: C.yellow, width: 2, dash: [6, 4] });
      dot(Q, c.Vled, c.I * 1000, { color: C.yellow, r: 5, ring: c.over ? C.red : null });
      note(Q, `${fig(c.Vled)} V, ${fig(c.I * 1000)} mA`, c.Vled, c.I * 1000, { color: C.yellow });
      note(Q, `load line, ${si(s.R, 'Ω')}`, Math.min(s.vs, vHi) * 0.08, Math.min(iHi * 0.92, (s.vs / s.R) * 1000), { color: C.yellow, dy: -4 });
    } else {
      note(Q, 'Backwards, the LED blocks: 0 mA.', c.vf + 0.45, iHi * 0.6, { color: C.red });
      note(Q, `All ${fig(s.vs)} V sits across it.`, c.vf + 0.45, iHi * 0.48, { color: C.red });
    }
    note(Q, `${LEDS[s.color].name} LED`, c.vf + 0.12, iHi * 0.1, { color: C.muted });
  },
  law: () => [String.raw`I = \frac{V_s - V_f}{R}`, String.raw`P_R = I^2 R`],
  liveRows(s, c) {
    return [
      kv('across the resistor', `${fig(c.VR)} V`),
      kv('resistor’s power, I²R', si(c.PR, 'W')),
      kv('LED’s power', si(c.Pled, 'W')),
      kv('V_s/R, leaving out the LED', si(c.naive, 'A')),
      kv('resistor for 20 mA', c.Rneed > 0 ? `${si(c.Rneed, 'Ω')}, buy ${si(c.Rpick, 'Ω')}` : 'supply too low'),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['current', `${si(c.I, 'A')}${c.over ? ', too much' : ''}`],
      ['LED voltage', `${fig(c.Vled)} V`],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> The LED is a Shockley diode with 10 Ω in series, fitted to a typical forward voltage at 20 mA. A real LED’s forward voltage varies by about ±0.2 V from part to part, falls as it warms, and the light it gives is only roughly proportional to its current.`;
    if (s.flip) {
      return {
        title: 'Backwards, an LED blocks',
        body: [
          `The LED’s anode, the long leg, must face the + side. Turned round, it carries only a leakage current, far below a microamp. The resistor then drops nothing, so a meter across the LED reads the whole supply, ${fig(s.vs)} V.`,
          c.reverseOver ? `An LED is rated for about 5 V in reverse. ${fig(s.vs)} V is past that, and a real one may be damaged.` : 'An LED is rated for about 5 V in reverse, so this does no harm. Turn it round and it lights.',
          out,
        ],
      };
    }
    if (!c.lit) {
      return {
        title: 'Not enough supply to turn it on',
        body: [`A ${LEDS[s.color].name} LED needs about ${fig(c.vf)} V before much current flows. With ${fig(s.vs)} V and ${si(s.R, 'Ω')}, it carries ${si(c.I, 'A')}, too little to see.`, out],
      };
    }
    return {
      title: c.over ? 'Too little resistance: the current runs away' : 'The resistor sets the current',
      body: [
        `The LED takes ${fig(c.Vled)} V, close to its ${fig(c.vf)} V at 20 mA. The resistor gets the rest, ${fig(c.VR)} V, so I = ${fig(c.VR)} V / ${si(s.R, 'Ω')} = ${si(c.I, 'A')}.`,
        c.over
          ? `That is over the LED’s ${fig(I_MAX * 1000)} mA maximum. With ${si(s.R, 'Ω')} almost nothing limits the current; it would burn the LED out. For 20 mA use (V_s − V_f)/I = ${si(c.Rneed, 'Ω')}, or the next standard value up, ${si(c.Rpick, 'Ω')}.`
          : `Leaving the LED out gives V_s/R = ${si(c.naive, 'A')}, which is wrong: the LED’s ${fig(c.Vled)} V is not available to the resistor.`,
        out,
      ],
    };
  },
});
