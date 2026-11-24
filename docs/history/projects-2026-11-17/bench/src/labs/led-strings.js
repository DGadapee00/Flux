import { C, begin, label, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { battery, led, resistor, wire } from './schematic.js';
import { bindSelect, bindSlider, put, select, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { I_MAX, I_RATED, LEDS, ledModel } from './leds.js';
import { parallelShare, parallelShareBisect, seriesCurrent, seriesCurrentBisect, voltageAt } from '@flux/subjects/em/diode.js';

/**
 * Shows that LEDs in series share one current, so they match whatever their forward voltages, and
 * that LEDs in parallel on one resistor do not: they share one voltage, and the LED with the lowest
 * forward voltage takes most of the current. Each parallel LED needs its own resistor. It also shows
 * what happens when one LED fails open: a series string goes dark, a shared resistor pushes the
 * failed LED's current into the others, and LEDs with their own resistors carry on.
 *
 * Real LEDs of one type differ in forward voltage by a tenth of a volt or more; the spread slider
 * sets that difference across the string.
 *
 * Recompute: Newton's method, on the loop current for a series string and on the shared voltage for
 * a parallel group (`@flux/subjects/em/diode.js`). Check: the same equations by bisection, and the
 * energy balance: the supply's power equals the LEDs' plus the resistors'.
 */
const RS = [47, 68, 100, 150, 180, 220, 330, 390, 470, 680, 1000];
const MODES = [['series', 'in series, one resistor'], ['shared', 'in parallel, one shared resistor'], ['own', 'in parallel, a resistor each']];

const SCENARIOS = [
  { id: 'series', name: 'Three red LEDs in series on 9 V', mode: 'series', n: 3, vs: 9, R: 150, spread: 0.1, open: -1 },
  { id: 'shared', name: 'Two red LEDs in parallel on one resistor', mode: 'shared', n: 2, vs: 9, R: 180, spread: 0.1, open: -1 },
  { id: 'own', name: 'Two red LEDs, a resistor each', mode: 'own', n: 2, vs: 9, R: 390, spread: 0.1, open: -1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mode: sc.mode, n: sc.n, vs: sc.vs, R: sc.R, spread: sc.spread, open: sc.open, color: 'red' });
}

/** LED k's offset from the typical forward voltage: the spread, shared evenly about zero. */
const offset = (s, k) => (s.n > 1 ? s.spread * (k / (s.n - 1) - 0.5) : 0);

/** Every LED's current, the supply's current, and the power each part takes, by both methods. */
export function solveStrings(s) {
  const ds = Array.from({ length: s.n }, (_, k) => ledModel(s.color || 'red', offset(s, k)));
  const on = ds.map((_, k) => k !== s.open);
  const I = ds.map(() => 0);
  const Ib = ds.map(() => 0);
  let Pres = 0;
  if (s.mode === 'series') {
    // One failed LED breaks the only path.
    if (s.open < 0) {
      const i = seriesCurrent(s.vs, s.R, ds);
      I.fill(i);
      Ib.fill(seriesCurrentBisect(s.vs, s.R, ds));
      Pres = i * i * s.R;
    }
  } else if (s.mode === 'shared') {
    const live = ds.filter((_, k) => on[k]);
    const a = parallelShare(s.vs, s.R, live);
    const b = parallelShareBisect(s.vs, s.R, live);
    let j = 0;
    ds.forEach((_, k) => {
      if (!on[k]) return;
      I[k] = a.currents[j];
      Ib[k] = b.currents[j];
      j += 1;
    });
    const tot = I.reduce((x, y) => x + y, 0);
    Pres = tot * tot * s.R;
  } else {
    ds.forEach((d, k) => {
      if (!on[k]) return;
      I[k] = seriesCurrent(s.vs, s.R, [d]);
      Ib[k] = seriesCurrentBisect(s.vs, s.R, [d]);
      Pres += I[k] * I[k] * s.R;
    });
  }
  const Itot = s.mode === 'series' ? I[0] : I.reduce((x, y) => x + y, 0);
  const Pled = ds.reduce((sum, d, k) => sum + voltageAt(d, I[k]) * I[k], 0);
  return { ds, on, I, Ib, Itot, Pled, Pres, Psupply: s.vs * Itot };
}

export default defineLab({
  id: 'led-strings',
  exam: 'u2',
  title: 'LED strings',
  hint: 'Raise the spread, then fail one LED. Compare series, a shared resistor and a resistor each.',
  gapLimit: 1e-6,
  app: false,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('series', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'spread', lo: 0, hi: 0.3 }),
  controls() {
    return `
      ${select('ls-mode', 'How the LEDs connect', MODES, 'series')}
      ${select('ls-n', 'How many LEDs', [[2, 'two'], [3, 'three']], 3)}
      ${slider('ls-vs', 'Supply (V)', 9, 3, 12, 0.1)}
      ${select('ls-r', 'Resistor (each, when each has one)', RS.map((r) => [r, si(r, 'Ω')]), 150)}
      ${slider('ls-spread', 'Spread in forward voltage (V)', 0.1, 0, 0.3, 0.01)}
      ${select('ls-open', 'A failed LED', [[-1, 'none'], [0, 'LED 1 fails open'], [1, 'LED 2 fails open']], -1)}
      <p class="tiny">Red LEDs, about 2.0 V at 20 mA. LED 1 has the lowest forward voltage.</p>`;
  },
  bind(api) {
    bindSelect('ls-mode', (s, v) => { s.mode = v; }, api);
    bindSelect('ls-n', (s, v) => { s.n = Number(v); }, api);
    bindSlider('ls-vs', (s, v) => { s.vs = v; }, api);
    bindSelect('ls-r', (s, v) => { s.R = Number(v); }, api);
    bindSlider('ls-spread', (s, v) => { s.spread = v; }, api);
    bindSelect('ls-open', (s, v) => { s.open = Number(v); }, api);
  },
  syncControls(s) {
    put('ls-mode', s.mode);
    put('ls-n', s.n);
    put('ls-vs', s.vs);
    put('ls-r', s.R);
    put('ls-spread', s.spread);
    put('ls-open', s.open);
  },
  compute(s) {
    const r = solveStrings(s);
    const scale = Math.max(r.Itot, 1e-3);
    let gap = 0;
    r.I.forEach((i, k) => { gap = Math.max(gap, Math.abs(i - r.Ib[k]) / scale); });
    // Energy balance: what the supply gives, the LEDs and resistors take.
    if (r.Psupply > 1e-9) gap = Math.max(gap, Math.abs(r.Psupply - r.Pled - r.Pres) / r.Psupply);
    const live = r.I.filter((_, k) => r.on[k]);
    const Imax = Math.max(...r.I);
    const Imin = live.length ? Math.min(...live) : 0;
    return {
      ...r, gap,
      I1: r.I[0], I2: r.I[1], Imax, Imin,
      flows: r.Itot > 1e-4,
      hog: Imin > 1e-6 ? Imax / Imin : null,
      over: Imax > I_MAX,
      eff: r.Psupply > 1e-9 ? r.Pled / r.Psupply : 0,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -5, x1: 21, y0: -2.5, y1: 12.5 }, 14);
    const col = LEDS.red.color;
    const glow = (k) => c.I[k] / I_RATED;
    const top = 10;
    const bot = 0;
    battery(P, [0, bot], [0, top], { text: `${fig(s.vs)} V` });
    if (s.mode === 'series') {
      resistor(P, [0, top], [7, top], { text: si(s.R, 'Ω') });
      wire(P, [[7, top], [10, top]]);
      const h = (top - bot) / s.n;
      for (let k = 0; k < s.n; k += 1) {
        const a = [10, top - k * h];
        const b = [10, top - (k + 1) * h];
        led(P, a, b, { color: col, glow: glow(k), open: k === s.open });
        label(P, `LED ${k + 1}: ${si(c.I[k], 'A')}`, [10, top - (k + 0.5) * h], { color: C.text, dx: 18, align: 'left' });
      }
      wire(P, [[10, bot], [0, bot]]);
      return;
    }
    const xs = Array.from({ length: s.n }, (_, k) => 6 + k * 5);
    const last = xs[xs.length - 1];
    if (s.mode === 'shared') {
      resistor(P, [0, top], [5, top], { text: si(s.R, 'Ω') });
      wire(P, [[5, top], [last, top]], { dots: xs.slice(0, -1).map((x) => [x, top]) });
    } else {
      wire(P, [[0, top], [last, top]], { dots: xs.slice(0, -1).map((x) => [x, top]) });
    }
    xs.forEach((x, k) => {
      if (s.mode === 'own') {
        resistor(P, [x, top], [x, 6.5], { text: si(s.R, 'Ω'), side: 1 });
        led(P, [x, 6.5], [x, 2], { color: col, glow: glow(k), open: k === s.open });
        wire(P, [[x, 2], [x, bot]]);
      } else {
        wire(P, [[x, top], [x, 7.5]]);
        led(P, [x, 7.5], [x, 2.5], { color: col, glow: glow(k), open: k === s.open });
        wire(P, [[x, 2.5], [x, bot]]);
      }
      label(P, `LED ${k + 1}`, [x, -0.9], { color: C.muted });
      label(P, si(c.I[k], 'A'), [x, -2], { color: c.I[k] > I_MAX ? C.red : C.text, bold: true });
    });
    wire(P, [[last, bot], [0, bot]], { dots: xs.slice(0, -1).map((x) => [x, bot]) });
  },
  law: () => [String.raw`\text{series: } I = \frac{V_s - \sum V_f}{R}`, String.raw`\text{parallel: } I_k = \frac{V_s - V_{f}}{R_k}`],
  liveRows(s, c) {
    return [
      kv('current from the supply', si(c.Itot, 'A')),
      kv('largest over smallest LED current', c.hog ? `${fig(c.hog)}×` : '—'),
      kv('power from the supply', si(c.Psupply, 'W')),
      kv('share that reaches the LEDs', `${fig(c.eff * 100)}%`),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['LED 1', si(c.I1, 'A')],
      ['LED 2', si(c.I2, 'A')],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> Each LED is the course model with its forward voltage shifted by the spread. A real LED’s forward voltage also falls about 2 mV for each degree it warms, so in parallel the LED that takes more current heats, drops further, and takes more still.`;
    if (s.mode === 'series') {
      if (!c.flows) {
        return {
          title: s.open >= 0 ? 'One LED open, the whole string dark' : 'Not enough supply for the string',
          body: [s.open >= 0 ? 'A series string has one path. When one LED fails open, that path is broken and every LED goes out.' : `${s.n} red LEDs need about ${fig(2 * s.n)} V between them before much current flows. ${fig(s.vs)} V is not enough.`, out],
        };
      }
      return {
        title: 'In series, one current for all',
        body: [`The LEDs sit in one path, so each carries ${si(c.I1, 'A')}, whatever their spread. Their forward voltages add: about ${fig(2 * s.n)} V. The resistor takes the rest, so I = (V_s − ΣV_f)/R.`, `Of the ${si(c.Psupply, 'W')} the supply gives, ${fig(c.eff * 100)}% reaches the LEDs. Series wastes the least in the resistor.`, out],
      };
    }
    if (s.mode === 'shared') {
      return {
        title: s.open >= 0 ? 'The failed LED’s current goes to the others' : 'One resistor, badly shared',
        body: [
          s.open >= 0
            ? `With one LED gone, the resistor still sets nearly the same total, and the survivors take all of it: ${si(c.Imax, 'A')}${c.over ? `, past the ${fig(I_MAX * 1000)} mA maximum` : ''}.`
            : s.spread < 0.005
              ? 'With no spread the LEDs share evenly. Real LEDs of one type differ by 0.1 V or more: raise the spread and watch one take over.'
              : `The LEDs share one voltage, not one current. A ${fig(s.spread)} V spread makes LED 1 carry ${c.hog ? fig(c.hog) : '—'} times what LED ${s.n} carries. The LED’s curve is so steep that a small voltage difference is a large current difference.`,
          'Give each LED its own resistor. Then each resistor sets its own LED’s current.',
          out,
        ],
      };
    }
    return {
      title: 'A resistor each: each LED on its own',
      body: [`Each LED and its resistor are their own loop across the supply. The spread changes each current a little, not a lot, because the resistor takes most of the voltage. ${s.open >= 0 ? 'The failed LED takes nothing; the others do not notice.' : ''}`, `This uses more current from the supply than a series string: ${si(c.Itot, 'A')}.`, out],
    };
  },
});
