/**
 * Extra conceptual templates for Unit 1. The measured floor is 25% conceptual per unit.
 * These keep the share well above that floor. Each wrong option carries a why.
 * Answers are choices, so there is no numeric trap to plant.
 */
import { PA_PER_PSI } from '@flux/subjects/convert.js';
import { R_WATER, covered, fromC, satP, toC, waterP, waterTP } from '@flux/subjects/thermo';
import { region2Raw } from '@flux/subjects/thermo/if97.js';
import { isaPressure } from '../../labs/canner.js';
import { celsius, choice, cite, kase, mc, problem, range } from '../kit.js';

const KPA = 1e3;
const KJ = 1e3;

/** v as ∂g/∂P in region 2, by a central difference. A second route to Z. */
function vFromGibbs(T, pPa) {
  const dp = pPa * 1e-6;
  const g = (p) => region2Raw(T, p / 1e6).g * KJ;
  return (g(pPa + dp) - g(pPa - dp)) / (2 * dp);
}

/** Compressibility of water vapour, Pv/(RT), from the property library. */
function zOf(p, T) {
  const w = waterTP(T, p);
  return (p * w.v) / (R_WATER * KJ * T);
}

/**
 * Two vapour states. `slot` decides which one is labelled A, so the closer state is not
 * always the first option. The near state sits 25 K above saturation.
 */
function vapourPair($) {
  const far = { p: $.pFar, T: fromC($.tFar) };
  const near = { p: $.pNear, T: satP($.pNear).T + 25 };
  return $.slot === 'a-far' ? { A: far, B: near } : { A: near, B: far };
}

function closer($) {
  const { A, B } = vapourPair($);
  return Math.abs(zOf(A.p, A.T) - 1) < Math.abs(zOf(B.p, B.T) - 1) ? 'A' : 'B';
}

/** Boiling temperature moves with absolute pressure: gauge plus the local atmosphere. */
function boilMove($) {
  if ($.move === 'altitude') {
    const sea = satP(isaPressure(0) + $.gaugePsi * PA_PER_PSI).T;
    const high = satP(isaPressure(5000) + $.gaugePsi * PA_PER_PSI).T;
    return high < sea ? 'falls' : 'rises';
  }
  const low = satP(isaPressure($.altFt) + 10 * PA_PER_PSI).T;
  const up = satP(isaPressure($.altFt) + 15 * PA_PER_PSI).T;
  return up > low ? 'rises' : 'falls';
}

const concepts = [
  problem({
    id: 'u1.2.hold',
    title: 'Temperature while heat is added',
    kind: 'conceptual',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('phase-diagrams'),
    topics: ['phase'],
    variety: ['configuration'],
    level: 1,
    vars: {
      p: range(100, 2000, 50, 'kPa', KPA),
      stage: choice(
        ['wet', 'a saturated mixture, and liquid is still present'],
        ['dry', 'superheated vapour'],
      ),
    },
    valid: ($) => $.stage === 'wet' || covered(satP($.p).T + 80, $.p),
    text: (T, $) => ($.stage === 'wet'
      ? String.raw`Water at $${T.p}$ kPa is a saturated mixture. Heat is added at constant pressure, and some liquid remains. The temperature`
      : String.raw`Water at $${T.p}$ kPa is superheated vapour. More heat is added at constant pressure. The temperature`),
    parts: [mc('move', [
      ['stays', 'stays at the saturation temperature', 'Inside the dome, heat changes the quality. Pressure fixes the temperature until the liquid is gone.'],
      ['rises', 'rises', 'Superheated vapour has no liquid left to boil. Added heat at constant pressure raises the temperature.'],
      ['falls', 'falls', 'Heat added to the system does not cool it. The temperature holds on the dome and rises past it.'],
    ], ($) => ($.stage === 'wet' ? 'stays' : 'rises'), { label: 'the temperature' })],
    hints: [
      'On the saturation dome, pressure and temperature are not independent.',
      'Ask whether liquid is still present. If it is, the state stays on the boiling line.',
    ],
    steps: ($, sig) => {
      const Ts = toC(satP($.p).T);
      return $.stage === 'wet'
        ? [String.raw`At $${sig($.p / KPA)}$ kPa the saturation temperature is $${sig(Ts)}$ °C. Liquid remains, so the temperature stays there while the quality rises.`]
        : [String.raw`The vapour is already above $${sig(Ts)}$ °C. Further heat at this pressure moves it farther above the dome, so the temperature rises.`];
    },
    second: ($) => {
      const sat = satP($.p);
      const h = $.stage === 'wet' ? sat.hf + 0.4 * sat.hfg : waterTP(sat.T + 80, $.p).h;
      const st = waterP($.p, 'h', h);
      return { move: st.phase === 'saturated mixture' ? 'stays' : 'rises' };
    },
    sim: {
      scenario: 'boil',
      setup(s, $) {
        s.p = $.p;
        const sat = satP($.p);
        s.h = $.stage === 'wet' ? sat.hf + 0.4 * sat.hfg : waterTP(sat.T + 80, $.p).h;
      },
      read: (c) => ({ move: c.x != null ? 'stays' : 'rises' }),
    },
    cases: [
      kase(cite('phase-diagrams'), { p: 500, stage: 'wet' }, { move: 'stays' }),
      kase(cite('phase-diagrams'), { p: 500, stage: 'dry' }, { move: 'rises' }),
    ],
  }),

  problem({
    id: 'u1.2.scale',
    title: 'What doubles when the mass doubles',
    kind: 'conceptual',
    exam: 'u1',
    ch: '2',
    lab: null,
    src: cite('properties'),
    topics: ['quality'],
    variety: ['unknown'],
    level: 2,
    vars: {
      p: range(100, 1500, 50, 'kPa', KPA),
      x: range(0.2, 0.8, 0.1),
      m: range(0.5, 4, 0.5, 'kg'),
      qty: choice(
        ['V', 'the total volume'],
        ['v', 'the specific volume'],
        ['U', 'the total internal energy'],
        ['T', 'the temperature'],
      ),
    },
    text: (T) => String.raw`A vessel holds $${T.m}$ kg of a saturated water mixture at $${T.p}$ kPa with quality $${T.x}$. The mass is doubled. Pressure and quality stay the same. Then ${T.qty}`,
    parts: [mc('scale', [
      ['doubles', 'doubles', 'Total volume and total internal energy are extensive: they scale with the mass.'],
      ['same', 'stays the same', 'Specific volume and temperature are intensive. They are fixed by pressure and quality.'],
      ['halves', 'halves', 'Adding mass at the same pressure and quality does not shrink a property.'],
    ], ($) => ($.qty === 'V' || $.qty === 'U' ? 'doubles' : 'same'), { label: 'that quantity' })],
    hints: [
      'Split the quantity into extensive, which grows with the system, and intensive, which does not.',
      'Specific volume is total volume per mass. Temperature on the dome is fixed by pressure alone.',
    ],
    steps: ($) => {
      const extensive = $.qty === 'V' || $.qty === 'U';
      const name = { V: 'Total volume', v: 'Specific volume', U: 'Total internal energy', T: 'Temperature' }[$.qty];
      return [
        extensive
          ? `${name} is extensive, so doubling the mass at the same state doubles it.`
          : `${name} is intensive. Pressure and quality fix it, so it stays the same.`,
      ];
    },
    second: ($) => ({ scale: $.qty === 'V' || $.qty === 'U' ? 'doubles' : 'same' }),
    cases: [
      kase(cite('properties'), { p: 400, x: 0.5, m: 1, qty: 'V' }, { scale: 'doubles' }),
      kase(cite('properties'), { p: 400, x: 0.5, m: 1, qty: 'v' }, { scale: 'same' }),
      kase(cite('properties'), { p: 400, x: 0.5, m: 1, qty: 'T' }, { scale: 'same' }),
    ],
  }),

  problem({
    id: 'u1.3.scale-v',
    title: 'What doubles the specific volume',
    kind: 'conceptual',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas'],
    variety: ['configuration'],
    level: 2,
    vars: {
      p: range(100, 500, 20, 'kPa', KPA),
      tC: celsius(10, 80, 5),
      change: choice(
        ['kelvin', 'the absolute temperature is doubled and the pressure is held fixed'],
        ['celsius', 'the Celsius reading is doubled and the pressure is held fixed'],
        ['pressure', 'the absolute pressure is doubled and the temperature is held fixed'],
      ),
    },
    text: (T) => String.raw`Air is treated as an ideal gas at $${T.p}$ kPa and ${T.tC} °C. Next, ${T.change}. The specific volume`,
    parts: [mc('scale', [
      ['doubles', 'doubles', 'At fixed pressure, specific volume is proportional to absolute temperature. Doubling the kelvin temperature doubles it.'],
      ['halves', 'halves', 'At fixed temperature, specific volume is inversely proportional to absolute pressure.'],
      ['neither', 'does neither', 'A Celsius reading is not the absolute temperature. Doubling it does not double or halve v.'],
    ], ($) => ($.change === 'kelvin' ? 'doubles' : $.change === 'pressure' ? 'halves' : 'neither'), { label: 'specific volume' })],
    hints: [
      'The ideal-gas law uses absolute pressure and absolute temperature: v = RT/P.',
      'A change of one degree Celsius is one kelvin. A reading of t °C is not t kelvin.',
    ],
    steps: ($, sig) => {
      const T = fromC($.tC);
      if ($.change === 'kelvin') return [String.raw`$v = RT/P$. Doubling $${sig(T)}$ K at fixed $P$ doubles $v$.`];
      if ($.change === 'pressure') return [String.raw`$v = RT/P$. Doubling $P$ at fixed $T$ halves $v$.`];
      const ratio = (2 * $.tC + 273.15) / T;
      return [String.raw`Doubling the Celsius reading takes the gas from $${sig(T)}$ K to $${sig(2 * $.tC + 273.15)}$ K. The volume ratio is $${sig(ratio)}$, not 2 and not $1/2$.`];
    },
    second: ($) => {
      const T = fromC($.tC);
      const ratio = $.change === 'kelvin' ? 2 : $.change === 'pressure' ? 0.5 : (2 * $.tC + 273.15) / T;
      return { scale: Math.abs(ratio - 2) < 1e-9 ? 'doubles' : Math.abs(ratio - 0.5) < 1e-9 ? 'halves' : 'neither' };
    },
    cases: [
      kase(cite('ideal-gas'), { p: 200, tC: 25, change: 'kelvin' }, { scale: 'doubles' }),
      kase(cite('ideal-gas'), { p: 200, tC: 25, change: 'celsius' }, { scale: 'neither' }),
      kase(cite('ideal-gas'), { p: 200, tC: 25, change: 'pressure' }, { scale: 'halves' }),
    ],
  }),

  problem({
    id: 'u1.3.closer',
    title: 'Which vapour is closer to ideal',
    kind: 'conceptual',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('compressibility'),
    topics: ['compressibility'],
    variety: ['representation'],
    level: 3,
    vars: {
      pFar: range(50, 200, 10, 'kPa', KPA),
      tFar: celsius(380, 480, 10),
      pNear: range(2000, 6000, 200, 'kPa', KPA),
      slot: choice(['a-far', 'A is the low-pressure state'], ['b-far', 'A is the high-pressure state']),
    },
    valid: ($) => {
      let pair;
      try {
        pair = vapourPair($);
      } catch {
        return false;
      }
      const { A, B } = pair;
      if (!(covered(A.T, A.p) && covered(B.T, B.p))) return false;
      if (A.T < satP(A.p).T + 8 || B.T < satP(B.p).T + 8) return false;
      const gap = Math.abs(Math.abs(zOf(A.p, A.T) - 1) - Math.abs(zOf(B.p, B.T) - 1));
      return gap > 0.02;
    },
    text: (T, $, sig) => {
      const { A, B } = vapourPair($);
      return String.raw`Two states of water vapour. State A is $${sig(A.p / KPA)}$ kPa and $${sig(toC(A.T))}$ °C. State B is $${sig(B.p / KPA)}$ kPa and $${sig(toC(B.T))}$ °C. The state closer to an ideal gas, meaning $Z$ nearer 1, is`;
    },
    parts: [mc('which', [
      ['A', 'state A', 'The closer state is the one whose compressibility is nearer 1. Low pressure and high temperature pull steam that way.'],
      ['B', 'state B', 'The closer state is the one whose compressibility is nearer 1. A state near the dome at high pressure is farther from 1.'],
      ['tie', 'the two are equally close', 'The two compressibilities differ by more than a rounding error. One state is nearer 1.'],
    ], ($) => closer($), { label: 'the closer state' })],
    hints: [
      'Compressibility is Z = Pv/(RT). An ideal gas has Z = 1.',
      'Steam is nearest that limit at low pressure and high temperature, and farthest near the dome.',
    ],
    steps: ($, sig) => {
      const { A, B } = vapourPair($);
      const zA = zOf(A.p, A.T);
      const zB = zOf(B.p, B.T);
      return [
        String.raw`$Z_A = ${sig(zA)}$ and $Z_B = ${sig(zB)}$.`,
        Math.abs(zA - 1) < Math.abs(zB - 1) ? 'State A is nearer 1.' : 'State B is nearer 1.',
      ];
    },
    second: ($) => {
      const { A, B } = vapourPair($);
      const z = (st) => Math.abs((st.p * vFromGibbs(st.T, st.p)) / (R_WATER * KJ * st.T) - 1);
      return { which: z(A) < z(B) ? 'A' : 'B' };
    },
    cases: [
      kase(cite('compressibility'), { pFar: 100, tFar: 400, pNear: 4000, slot: 'a-far' }, { which: 'A' }),
      kase(cite('compressibility'), { pFar: 100, tFar: 400, pNear: 4000, slot: 'b-far' }, { which: 'B' }),
    ],
  }),

  problem({
    id: 'u1.2.boil-move',
    title: 'Which way the boiling temperature moves',
    kind: 'conceptual',
    exam: 'u1',
    ch: '2',
    lab: 'canner',
    src: cite('phase-diagrams'),
    topics: ['phase'],
    variety: ['configuration'],
    level: 2,
    vars: {
      gaugePsi: range(5, 15, 0.5, 'psi'),
      altFt: range(0, 6000, 500, 'ft'),
      move: choice(
        ['altitude', 'is carried from sea level to 5,000 ft with the gauge left alone'],
        ['gauge', 'has its gauge raised from 10 psi to 15 psi at the same place'],
      ),
    },
    text: (T, $) => ($.move === 'altitude'
      ? String.raw`A pressure canner reads $${T.gaugePsi}$ psi on its gauge. It is carried from sea level to 5,000 ft, and the gauge setting is not changed. The boiling temperature`
      : String.raw`A pressure canner at $${T.altFt}$ ft reads 10 psi on its gauge. The gauge is then raised to 15 psi. The boiling temperature`),
    parts: [mc('dir', [
      ['rises', 'rises', 'A higher absolute pressure boils water hotter. Raising the gauge, at a fixed altitude, does that.'],
      ['falls', 'falls', 'A higher altitude lowers the atmosphere under the same gauge reading, so the absolute pressure falls.'],
      ['stays', 'stays the same', 'The gauge reading is not the absolute pressure. The atmosphere under it, and the gauge setting, both move the boiling temperature.'],
    ], ($) => boilMove($), { label: 'the boiling temperature' })],
    hints: [
      'The saturation temperature follows the absolute pressure, not the gauge reading by itself.',
      'Absolute pressure is the gauge reading plus the atmosphere at that altitude.',
    ],
    steps: ($, sig) => {
      if ($.move === 'altitude') {
        const sea = toC(satP(isaPressure(0) + $.gaugePsi * PA_PER_PSI).T);
        const high = toC(satP(isaPressure(5000) + $.gaugePsi * PA_PER_PSI).T);
        return [
          String.raw`At sea level the boil is $${sig(sea)}$ °C. At 5,000 ft, with the same gauge, it is $${sig(high)}$ °C.`,
          'The boiling temperature falls.',
        ];
      }
      const low = toC(satP(isaPressure($.altFt) + 10 * PA_PER_PSI).T);
      const up = toC(satP(isaPressure($.altFt) + 15 * PA_PER_PSI).T);
      return [
        String.raw`At 10 psi the boil is $${sig(low)}$ °C. At 15 psi it is $${sig(up)}$ °C.`,
        'The boiling temperature rises.',
      ];
    },
    second: ($) => ({ dir: boilMove($) }),
    sim: {
      scenario: 'sea',
      setup(s, $) {
        if ($.move === 'altitude') {
          s.altitudeFt = 5000;
          s.gaugePsi = $.gaugePsi;
        } else {
          s.altitudeFt = $.altFt;
          s.gaugePsi = 15;
        }
      },
      read: (c, state, $) => {
        if ($.move === 'altitude') {
          const sea = toC(satP(isaPressure(0) + state.gaugePsi * PA_PER_PSI).T);
          return { dir: c.Tc < sea - 0.05 ? 'falls' : 'rises' };
        }
        const low = toC(satP(c.patm + 10 * PA_PER_PSI).T);
        return { dir: c.Tc > low + 0.05 ? 'rises' : 'falls' };
      },
    },
    cases: [
      kase(cite('phase-diagrams'), { gaugePsi: 10, altFt: 0, move: 'altitude' }, { dir: 'falls' }),
      kase(cite('phase-diagrams'), { gaugePsi: 10, altFt: 0, move: 'gauge' }, { dir: 'rises' }),
    ],
  }),

  problem({
    id: 'u1.3.interval',
    title: 'A change of temperature, and a reading',
    kind: 'conceptual',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('temperature'),
    topics: ['ideal-gas'],
    variety: ['representation'],
    level: 1,
    vars: {
      tC: celsius(0, 80, 5),
      rise: range(5, 40, 5, '°C'),
      ask: choice(['change', 'a temperature change'], ['reading', 'a thermometer reading']),
    },
    text: (T, $) => ($.ask === 'change'
      ? String.raw`The temperature of a gas rises by $${T.rise}$ °C. That same rise, measured in kelvin, is`
      : String.raw`A thermometer reads $${T.tC}$ °C. The absolute temperature used in the ideal-gas law, in kelvin, is`),
    parts: [mc('form', [
      ['same', 'the same number', 'A Celsius degree and a kelvin are the same size, so a change has the same number in both scales.'],
      ['plus', 'that Celsius number plus 273', 'A reading of t °C is about t + 273 K. Adding 273 to a temperature change double-counts the offset.'],
      ['fahr', 'that Celsius number times 9/5, plus 32', 'That conversion makes a Fahrenheit reading. A change in °F is 9/5 of the Celsius change, with no added 32.'],
    ], ($) => ($.ask === 'change' ? 'same' : 'plus'), { label: 'the kelvin value' })],
    hints: [
      'The ideal-gas law needs absolute temperature. A change and a reading convert differently.',
      'One degree Celsius equals one kelvin. The offset 273.15 is added only to a reading, not to a difference.',
    ],
    steps: ($, sig) => ($.ask === 'change'
      ? [String.raw`A rise of $${sig($.rise)}$ °C is a rise of $${sig($.rise)}$ K.`]
      : [String.raw`$${sig($.tC)}$ °C is $${sig(fromC($.tC))}$ K, which is the Celsius reading plus 273.15.`]),
    second: ($) => ({ form: $.ask === 'change' ? 'same' : 'plus' }),
    cases: [
      kase(cite('temperature'), { tC: 20, rise: 10, ask: 'change' }, { form: 'same' }),
      kase(cite('temperature'), { tC: 20, rise: 10, ask: 'reading' }, { form: 'plus' }),
    ],
  }),
];

export default concepts;
