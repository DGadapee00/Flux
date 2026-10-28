/**
 * Chapter 6: cycles and the second law. Heat engines, refrigerators, the Carnot limit,
 * a claim that may be impossible, and the Brayton cycle. 16.050 posts no solutions, so every
 * worked case is a Flux computation, cited to OpenStax or to Yan Ch 6, and checked a second way:
 * rankine temperatures, the Clausius sum against the efficiency test, ∫P dv against R T ln(v2/v1),
 * and ∫c_p dT against the enthalpy polynomials.
 */
import { J_PER_BTU } from '@flux/subjects/convert.js';
import {
  brayton,
  braytonColdAir,
  carnotWorkIntegral,
  classifyByLimit,
  classifyClaim,
  fromC,
  fromF,
  gas,
  heatByCp,
} from '@flux/subjects/thermo';
import { celsius, choice, cite, fahrenheit, kase, mc, num, problem, range } from '../kit.js';

const AIR = gas('air');
const KJ = 1e3;
const P_INLET = 1e5;

/** True when every pair differs by more than 2%, so a trap cannot be graded as right or as another trap. */
function spread(values) {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const scale = Math.max(Math.abs(values[i]), Math.abs(values[j]), 1e-6);
      if (Math.abs(values[i] - values[j]) <= 0.02 * scale) return false;
    }
  }
  return true;
}

function isothermHeat(T, v1, v2, n = 80) {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (v2 - v1) / steps;
  const f = (v) => (AIR.R * T) / v;
  let sum = f(v1) + f(v2);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(v1 + i * h);
  return (sum * h) / 3;
}

const ch6 = [
  problem({
    id: 'u4.6.engine',
    title: 'Efficiency of a heat engine',
    exam: 'u4',
    ch: '6',
    lab: 'claims',
    src: cite('heat-engines'),
    topics: ['heat-engine', 'second-law'],
    principles: ['cycle-balance'],
    variety: ['unknown'],
    level: 1,
    vars: {
      QH: range(200, 800, 20, 'kJ', KJ),
      f: range(0.15, 0.45, 0.05, ''),
    },
    derive: ($) => ({ W: $.f * $.QH, QL: $.QH * (1 - $.f) }),
    text: (T, $, sig) => String.raw`A heat engine draws ${T.QH} kJ from a hot reservoir and produces $${sig($.W / KJ)}$ kJ of work in one cycle. Find the thermal efficiency and the heat rejected.`,
    parts: [
      num('eta', ($) => $.W / $.QH, '', {
        label: 'thermal efficiency',
        traps: [
          [($) => $.QL / $.W, 'That is the heat rejected per unit of work. Efficiency is the work divided by the heat drawn from the hot reservoir.'],
          [($) => $.W / $.QL, 'That divides the work by the heat rejected. The denominator is the heat absorbed, Q_H.'],
        ],
      }),
      num('QL', ($) => $.QL, 'kJ', {
        scale: KJ,
        label: 'heat rejected',
        traps: [
          [($) => $.QH, 'That is the heat absorbed. A cycle rejects Q_H − W.'],
          [($) => $.W, 'That is the work. The rejected heat is what is left after the work is delivered.'],
        ],
      }),
    ],
    hints: [
      'A cycle returns every property to its starting value, so the first law relates the two heats and the work.',
      String.raw`With magnitudes positive, $Q_H = Q_L + W$. The efficiency is $\eta = W/Q_H$.`,
    ],
    steps: ($, sig) => [
      String.raw`$Q_L = Q_H - W = ${sig($.QH / KJ)} - ${sig($.W / KJ)} = ${sig($.QL / KJ)}$ kJ.`,
      String.raw`$\eta = W/Q_H = ${sig($.W / KJ)}/${sig($.QH / KJ)} = ${sig($.W / $.QH)}$.`,
    ],
    second: ($) => ({ eta: 1 - $.QL / $.QH, QL: ($.QH - $.W) / KJ }),
    sim: {
      scenario: 'fair',
      setup(s, $) {
        s.QH = $.QH / KJ;
        s.QL = $.QL / KJ;
        s.W = $.W / KJ;
      },
      read: (c) => ({ eta: c.eta, QL: c.QL }),
    },
    cases: [kase(cite('heat-engines'), { QH: 500, f: 0.4 }, { eta: 0.4, QL: 300 })],
  }),

  problem({
    id: 'u4.6.fridge',
    title: 'COP of a refrigerator',
    exam: 'u4',
    ch: '6',
    lab: 'claims',
    src: cite('refrigerators'),
    topics: ['refrigerator'],
    principles: ['cycle-balance'],
    variety: ['unknown'],
    level: 1,
    vars: {
      QL: range(100, 800, 20, 'kJ', KJ),
      W: range(40, 200, 10, 'kJ', KJ),
    },
    derive: ($) => ({ QH: $.QL + $.W }),
    text: (T) => String.raw`A refrigerator removes ${T.QL} kJ from a cold space. The work input for that cycle is ${T.W} kJ. Find the coefficient of performance.`,
    parts: [
      num('cop', ($) => $.QL / $.W, '', {
        label: 'COP_R',
        traps: [
          [($) => $.QH / $.W, 'That is Q_H/W, the heat-pump COP. A refrigerator is charged with the heat it removes.'],
          [($) => $.QL / $.QH, 'That is the share of the rejected heat that came from the cold space. The COP divides by the work.'],
        ],
      }),
    ],
    hints: [
      'The first law still closes the cycle. The coefficient of performance divides the desired heat by the work that had to be supplied.',
      String.raw`For a refrigerator, $\mathrm{COP_R} = Q_L/W$. The heat dumped to the kitchen is $Q_H = Q_L + W$.`,
    ],
    steps: ($, sig) => [
      String.raw`$Q_H = Q_L + W = ${sig($.QL / KJ)} + ${sig($.W / KJ)} = ${sig($.QH / KJ)}$ kJ.`,
      String.raw`$\mathrm{COP_R} = Q_L/W = ${sig($.QL / KJ)}/${sig($.W / KJ)} = ${sig($.QL / $.W)}$.`,
    ],
    second: ($) => ({ cop: ($.QH - $.W) / $.W }),
    sim: {
      scenario: 'fridge',
      setup(s, $) {
        s.QH = $.QH / KJ;
        s.QL = $.QL / KJ;
        s.W = $.W / KJ;
      },
      read: (c) => ({ cop: c.copR }),
    },
    cases: [kase(cite('refrigerators'), { QL: 400, W: 80 }, { cop: 5 })],
  }),

  problem({
    id: 'u4.6.carnot',
    title: 'Carnot efficiency between two temperatures',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    src: cite('carnot'),
    topics: ['carnot'],
    principles: ['carnot-limit'],
    variety: ['representation'],
    level: 2,
    vars: {
      tH: celsius(200, 700, 25),
      tL: celsius(15, 45, 5),
      QH: range(100, 500, 20, 'kJ', KJ),
    },
    derive: ($) => ({ TH: fromC($.tH), TL: fromC($.tL) }),
    valid: ($) => {
      if (!($.TH > $.TL + 50)) return false;
      const eta = 1 - $.TL / $.TH;
      const ratio = $.TL / $.TH;
      const cels = 1 - $.tL / $.tH;
      return spread([eta, ratio, cels, 1]);
    },
    text: (T) => String.raw`A Carnot engine operates between ${T.tH} °C and ${T.tL} °C and absorbs ${T.QH} kJ from the hot reservoir. Find the thermal efficiency and the work.`,
    parts: [
      num('eta', ($) => 1 - $.TL / $.TH, '', {
        label: 'thermal efficiency',
        traps: [
          [($) => 1 - $.tL / $.tH, 'Those temperatures are in Celsius. The ratio uses kelvin, or rankine. Zero on either scale is not absolute zero.'],
          [($) => $.TL / $.TH, 'That is the heat rejected per unit of heat absorbed. The efficiency is one minus that ratio.'],
        ],
      }),
      num('W', ($) => $.QH * (1 - $.TL / $.TH), 'kJ', {
        scale: KJ,
        label: 'work',
        traps: [
          [($) => $.QH, 'That is the heat absorbed. Only the fraction η of it leaves as work.'],
          [($) => $.QH * (1 - $.tL / $.tH), 'The Celsius efficiency was used. Convert both temperatures before subtracting the ratio from one.'],
        ],
      }),
    ],
    hints: [
      'The Carnot limit depends on the two reservoir temperatures only, and only after they are absolute.',
      String.raw`$\eta = 1 - T_L/T_H$ with both temperatures in kelvin. Then $W = \eta Q_H$.`,
    ],
    steps: ($, sig) => {
      const eta = 1 - $.TL / $.TH;
      return [
        String.raw`$T_H = ${sig($.TH)}$ K and $T_L = ${sig($.TL)}$ K.`,
        String.raw`$\eta = 1 - ${sig($.TL)}/${sig($.TH)} = ${sig(eta)}$.`,
        String.raw`$W = \eta Q_H = ${sig(eta)}\times ${sig($.QH / KJ)} = ${sig((eta * $.QH) / KJ)}$ kJ.`,
      ];
    },
    second: ($) => {
      const RH = ($.tH + 273.15) * (9 / 5);
      const RL = ($.tL + 273.15) * (9 / 5);
      const eta = 1 - RL / RH;
      return { eta, W: ($.QH * eta) / KJ };
    },
    sim: {
      scenario: 'engine',
      setup(s, $) {
        s.TH = $.TH;
        s.TL = $.TL;
      },
      read: (c) => ({ eta: c.eta }),
    },
    cases: [kase(cite('carnot'), { tH: 550, tL: 30, QH: 200 }, { eta: 0.63172, W: 126.34 })],
  }),

  problem({
    id: 'u4.6.heat-pump',
    title: 'Carnot refrigerator and heat pump',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    src: cite('refrigerators'),
    topics: ['refrigerator', 'carnot'],
    principles: ['carnot-limit'],
    variety: ['unknown'],
    level: 2,
    vars: {
      tH: celsius(25, 80, 5),
      tL: celsius(-25, 15, 5),
    },
    derive: ($) => ({ TH: fromC($.tH), TL: fromC($.tL) }),
    valid: ($) => {
      if (!($.TH > $.TL + 20)) return false;
      const copR = $.TL / ($.TH - $.TL);
      const copHP = $.TH / ($.TH - $.TL);
      const cR = $.tL / ($.tH - $.tL);
      const cH = $.tH / ($.tH - $.tL);
      return spread([copR, copHP, cR, cH]);
    },
    text: (T) => String.raw`A reversible refrigerator and the heat pump made from the same cycle run between ${T.tL} °C and ${T.tH} °C. Find both Carnot coefficients of performance.`,
    parts: [
      num('copR', ($) => $.TL / ($.TH - $.TL), '', {
        label: 'COP_R',
        traps: [
          [($) => $.TH / ($.TH - $.TL), 'That is the heat-pump COP. The refrigerator puts the cold temperature in the numerator.'],
          [($) => $.tL / ($.tH - $.tL), 'The temperature difference was taken in Celsius. Both temperatures have to be absolute before the division.'],
        ],
      }),
      num('copHP', ($) => $.TH / ($.TH - $.TL), '', {
        label: 'COP_HP',
        traps: [
          [($) => $.TL / ($.TH - $.TL), 'That misses the work in the numerator. The heat delivered is Q_L + W, so the heat-pump COP is one larger.'],
          [($) => $.tH / ($.tH - $.tL), 'Those are Celsius readings. A span of 40 °C is not a span of 40 K when it is divided into a Celsius temperature.'],
        ],
      }),
    ],
    hints: [
      'One reversible cycle, read two ways. The temperatures in the formulas are absolute.',
      String.raw`$\mathrm{COP_R} = T_L/(T_H - T_L)$ and $\mathrm{COP_{HP}} = \mathrm{COP_R} + 1$.`,
    ],
    steps: ($, sig) => {
      const copR = $.TL / ($.TH - $.TL);
      return [
        String.raw`$T_L = ${sig($.TL)}$ K and $T_H = ${sig($.TH)}$ K, so the span is ${sig($.TH - $.TL)} K.`,
        String.raw`$\mathrm{COP_R} = ${sig($.TL)}/${sig($.TH - $.TL)} = ${sig(copR)}$.`,
        String.raw`$\mathrm{COP_{HP}} = \mathrm{COP_R} + 1 = ${sig(copR + 1)}$.`,
      ];
    },
    second: ($) => {
      const RH = ($.tH + 273.15) * (9 / 5);
      const RL = ($.tL + 273.15) * (9 / 5);
      const copHP = RH / (RH - RL);
      return { copR: copHP - 1, copHP };
    },
    sim: {
      scenario: 'fridge',
      setup(s, $) {
        s.TH = $.TH;
        s.TL = $.TL;
      },
      read: (c) => ({ copR: c.copR, copHP: c.copHP }),
    },
    cases: [kase(cite('refrigerators'), { tH: 22, tL: -18 }, { copR: 6.37875, copHP: 7.37875 })],
  }),

  problem({
    id: 'u4.6.brayton-cold',
    title: 'Cold-air Brayton efficiency',
    exam: 'u4',
    ch: '6',
    lab: null,
    src: cite('brayton'),
    topics: ['brayton'],
    principles: ['brayton'],
    variety: ['configuration'],
    level: 2,
    vars: {
      k: choice([1.4, '1.40, as for cold air'], [1.33, '1.33, as for a hot combustion gas']),
      rp: range(4, 16, 0.5, ''),
      T1: range(280, 320, 5, 'K'),
    },
    valid: ($) => {
      const ratio = $.rp ** (($.k - 1) / $.k);
      const eta = 1 - 1 / ratio;
      const T2 = $.T1 * ratio;
      return spread([eta, ratio, 1 / ratio]) && spread([T2, $.T1 / ratio, $.T1 * $.rp]);
    },
    text: (T) => String.raw`A cold-air Brayton cycle uses ${T.k}. The pressure ratio is ${T.rp} and the compressor inlet is ${T.T1} K. Take $c_p$ as constant. Find the efficiency and the compressor exit temperature.`,
    parts: [
      num('eta', ($) => braytonColdAir($.rp, $.k), '', {
        label: 'thermal efficiency',
        traps: [
          [($) => $.rp ** (($.k - 1) / $.k), 'That is the isentropic temperature ratio T_2/T_1, which is greater than one. The efficiency is one minus its reciprocal.'],
          [($) => $.T1 / ($.T1 * $.rp ** (($.k - 1) / $.k)), 'That is T_1/T_2, the fraction of the heat that is rejected. The efficiency is one minus it.'],
        ],
      }),
      num('T2', ($) => $.T1 * $.rp ** (($.k - 1) / $.k), 'K', {
        label: 'compressor exit temperature',
        traps: [
          [($) => $.T1 / $.rp ** (($.k - 1) / $.k), 'The exponent was inverted. Compression raises the temperature, so T_2 is larger than T_1.'],
          [($) => $.T1 * $.rp, 'The whole pressure ratio was used as a temperature ratio. The isentropic exponent is (k − 1)/k, not 1.'],
        ],
      }),
    ],
    hints: [
      'With constant specific heats the four ideal Brayton processes collapse to a pressure ratio and one k.',
      String.raw`$T_2 = T_1\, r_p^{(k-1)/k}$ and $\eta = 1 - T_1/T_2$. The turbine inlet does not appear.`,
    ],
    steps: ($, sig) => {
      const ratio = $.rp ** (($.k - 1) / $.k);
      const T2 = $.T1 * ratio;
      return [
        String.raw`$T_2/T_1 = ${sig($.rp)}^{(${sig($.k)} - 1)/${sig($.k)}} = ${sig(ratio)}$.`,
        String.raw`$T_2 = ${sig($.T1)}\times ${sig(ratio)} = ${sig(T2)}$ K.`,
        String.raw`$\eta = 1 - T_1/T_2 = 1 - 1/${sig(ratio)} = ${sig(1 - 1 / ratio)}$.`,
      ];
    },
    second: ($) => {
      const T2 = $.T1 * $.rp ** (($.k - 1) / $.k);
      return { eta: 1 - $.T1 / T2, T2 };
    },
    cases: [kase(cite('brayton'), { k: 1.4, rp: 8, T1: 300 }, { eta: 0.447955, T2: 543.434 })],
  }),

  problem({
    id: 'u4.6.brayton',
    title: 'Brayton cycle with variable specific heat',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    src: cite('brayton'),
    topics: ['brayton'],
    principles: ['brayton'],
    variety: ['representation'],
    level: 3,
    vars: {
      T1: range(280, 310, 5, 'K'),
      rp: range(6, 14, 1, ''),
      tC3: celsius(1100, 1500, 50),
    },
    derive: ($) => ({ T3: fromC($.tC3) }),
    valid: ($) => {
      let b;
      try {
        b = brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 });
      } catch {
        return false;
      }
      const cold = braytonColdAir($.rp, AIR.gamma($.T1));
      const carnot = 1 - $.T1 / $.T3;
      return b.T3 > b.T2 + 50 && spread([b.eta, cold, carnot]) && spread([b.wnet, b.wt, b.qin]);
    },
    text: (T) => String.raw`Air enters the compressor of an ideal Brayton cycle at ${T.T1} K and 100 kPa. The pressure ratio is ${T.rp} and the turbine inlet is ${T.tC3} °C. Use the air tables, so $c_p$ varies. Find the efficiency and the net work per kilogram.`,
    parts: [
      num('eta', ($) => brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 }).eta, '', {
        label: 'thermal efficiency',
        traps: [
          [($) => braytonColdAir($.rp, AIR.gamma($.T1)), 'That holds c_p at the inlet value. Across this temperature rise c_p increases, and the efficiency comes out lower.'],
          [($) => 1 - $.T1 / $.T3, 'That is the Carnot limit between the coldest and hottest temperatures. The Brayton cycle rejects heat well above T_1, so it stays under that limit.'],
        ],
      }),
      num('w', ($) => brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 }).wnet, 'kJ/kg', {
        scale: KJ,
        label: 'net work',
        traps: [
          [($) => brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 }).wt, 'That is the turbine work alone. The compressor uses part of it, so the net work is smaller.'],
          [($) => brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 }).qin, 'That is the heat added in the combustor. The cycle also rejects heat, and the net work is what remains.'],
        ],
      }),
    ],
    hints: [
      'The two isentropic machines fix T_2 and T_4. The heat transfers are enthalpy changes of air at those temperatures.',
      String.raw`$q_{in} = h_3 - h_2$, $q_{out} = h_4 - h_1$, and $\eta = 1 - q_{out}/q_{in}$. The net work equals $q_{in} - q_{out}$.`,
    ],
    steps: ($, sig) => {
      const b = brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 });
      return [
        String.raw`Isentropic compression to ${sig($.rp)} times the inlet pressure gives $T_2 = ${sig(b.T2)}$ K. Expansion back gives $T_4 = ${sig(b.T4)}$ K.`,
        String.raw`$q_{in} = h_3 - h_2 = ${sig(b.qin / KJ)}$ kJ/kg and $q_{out} = h_4 - h_1 = ${sig(b.qout / KJ)}$ kJ/kg.`,
        String.raw`$\eta = 1 - q_{out}/q_{in} = ${sig(b.eta)}$, and $w_{net} = q_{in} - q_{out} = ${sig(b.wnet / KJ)}$ kJ/kg.`,
      ];
    },
    second: ($) => {
      const b = brayton(AIR, { T1: $.T1, p1: P_INLET, rp: $.rp, T3: $.T3 });
      const qin = heatByCp(AIR, b.T2, b.T3, 160);
      const qout = heatByCp(AIR, b.T1, b.T4, 160);
      return { eta: 1 - qout / qin, w: (qin - qout) / KJ };
    },
    sim: {
      scenario: 'brayton',
      setup(s, $) {
        s.T1 = $.T1;
        s.rp = $.rp;
        s.T3 = $.T3;
        s.p1 = P_INLET;
      },
      read: (c) => ({ eta: c.etaB, w: c.wB }),
    },
    cases: [kase(cite('brayton'), { T1: fromC(15), rp: 12, tC3: 1200 }, { eta: 0.481217, w: 489.355 })],
  }),

  problem({
    id: 'u4.6.cycle',
    title: 'Ideal-gas Carnot cycle',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    src: cite('carnot'),
    topics: ['carnot'],
    principles: ['carnot-limit'],
    variety: ['unknown'],
    level: 3,
    vars: {
      m: range(0.2, 2, 0.2, 'kg'),
      TH: range(500, 900, 50, 'K'),
      TL: range(280, 320, 10, 'K'),
      rv: range(2, 6, 0.5, ''),
    },
    valid: ($) => {
      if (!($.TH > $.TL + 40 && $.TH < AIR.T_high && $.TL > AIR.T_low)) return false;
      const ln = Math.log($.rv);
      const log10 = Math.log10($.rv);
      const qH = $.m * AIR.R * $.TH * ln;
      const qTrap = $.m * AIR.R * $.TH * log10;
      const qCold = $.m * AIR.R * $.TL * ln;
      const w = $.m * AIR.R * ($.TH - $.TL) * ln;
      const wLog = $.m * AIR.R * ($.TH - $.TL) * log10;
      return spread([qH, qTrap, qCold]) && spread([w, qH, wLog]);
    },
    text: (T) => String.raw`Air in a Carnot cycle has mass ${T.m} kg. The hot isotherm is ${T.TH} K and the cold isotherm is ${T.TL} K. On the hot isotherm the volume expands by a factor of ${T.rv}. Find the heat absorbed and the net work.`,
    parts: [
      num('qH', ($) => $.m * AIR.R * $.TH * Math.log($.rv), 'kJ', {
        scale: KJ,
        label: 'heat absorbed',
        traps: [
          [($) => $.m * AIR.R * $.TH * Math.log10($.rv), 'The logarithm in q = m R T ln(v2/v1) is natural. A common log is smaller by ln(10).'],
          [($) => $.m * AIR.R * $.TL * Math.log($.rv), 'The heat absorbed is taken from the hot reservoir, so the temperature in that expression is T_H.'],
        ],
      }),
      num('w', ($) => $.m * AIR.R * ($.TH - $.TL) * Math.log($.rv), 'kJ', {
        scale: KJ,
        label: 'net work',
        traps: [
          [($) => $.m * AIR.R * $.TH * Math.log($.rv), 'That is the heat absorbed. The net work is that heat times (T_H − T_L)/T_H.'],
          [($) => $.m * AIR.R * ($.TH - $.TL) * Math.log10($.rv), 'The volume ratio enters as a natural log, because ∫ dv/v = ln(v2/v1).'],
        ],
      }),
    ],
    hints: [
      'On an isotherm the internal energy of an ideal gas does not change, so the heat equals the boundary work.',
      String.raw`$q_H = m R T_H \ln(v_2/v_1)$. The cold isotherm has the same volume ratio, and $w_{net} = q_H - q_L$.`,
    ],
    steps: ($, sig) => {
      const qH = $.m * AIR.R * $.TH * Math.log($.rv);
      const w = $.m * AIR.R * ($.TH - $.TL) * Math.log($.rv);
      return [
        String.raw`$\ln(${sig($.rv)}) = ${sig(Math.log($.rv))}$.`,
        String.raw`$Q_H = m R T_H \ln(v_2/v_1) = ${sig($.m)}\times ${sig(AIR.R / KJ)}\times ${sig($.TH)}\times ${sig(Math.log($.rv))} = ${sig(qH / KJ)}$ kJ.`,
        String.raw`$W_{net} = m R (T_H - T_L)\ln(v_2/v_1) = ${sig(w / KJ)}$ kJ.`,
      ];
    },
    second: ($) => {
      const v1 = 0.5;
      const v2 = 0.5 * $.rv;
      const qH = isothermHeat($.TH, v1, v2);
      const integ = carnotWorkIntegral(AIR, { TH: $.TH, TL: $.TL, v1, v2 }, 48);
      return { qH: ($.m * qH) / KJ, w: ($.m * integ.wNet) / KJ };
    },
    sim: {
      scenario: 'engine',
      setup(s, $) {
        s.m = $.m;
        s.TH = $.TH;
        s.TL = $.TL;
        s.v1 = 0.5;
        s.v2 = 0.5 * $.rv;
      },
      read: (c) => ({ qH: c.qH, w: c.wNet }),
    },
    cases: [kase(cite('carnot'), { m: 1, TH: 600, TL: 300, rv: 2 }, { qH: 119.383, w: 59.6913 })],
  }),

  problem({
    id: 'u4.6.english',
    title: 'Carnot efficiency in Fahrenheit',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    src: cite('carnot'),
    topics: ['carnot', 'english'],
    principles: ['carnot-limit'],
    variety: ['representation'],
    level: 2,
    vars: {
      tFH: fahrenheit(200, 600, 20),
      tFL: fahrenheit(40, 140, 10),
      Q: range(50, 400, 10, 'Btu', J_PER_BTU),
    },
    derive: ($) => ({ TH: fromF($.tFH), TL: fromF($.tFL) }),
    valid: ($) => {
      if (!($.TH > $.TL + 80)) return false;
      const eta = 1 - $.TL / $.TH;
      const etaF = 1 - $.tFL / $.tFH;
      return spread([eta, etaF, 1]);
    },
    text: (T) => String.raw`A Carnot engine absorbs ${T.Q} Btu from a source at ${T.tFH} °F and rejects heat to a sink at ${T.tFL} °F. Find the efficiency and the work in Btu.`,
    parts: [
      num('eta', ($) => 1 - $.TL / $.TH, '', {
        label: 'thermal efficiency',
        traps: [
          [($) => 1 - $.tFL / $.tFH, 'Fahrenheit degrees are not absolute. Add 459.67 and use rankine, or convert to kelvin, before writing the ratio.'],
          [($) => $.TL / $.TH, 'That is Q_L/Q_H for a reversible engine. The efficiency is one minus it.'],
        ],
      }),
      num('W', ($) => $.Q * (1 - $.TL / $.TH), 'Btu', {
        scale: J_PER_BTU,
        label: 'work',
        traps: [
          [($) => $.Q, 'That counts every Btu absorbed as work. The engine rejects heat, so the work is smaller.'],
          [($) => $.Q * (1 - $.tFL / $.tFH), 'The Fahrenheit readings were treated as absolute temperatures. The ratio has to be in rankine.'],
        ],
      }),
    ],
    hints: [
      'The Carnot formula is the same in English units once both temperatures are rankine.',
      String.raw`$T_R = T_F + 459.67$. Then $\eta = 1 - T_{L,R}/T_{H,R}$ and $W = \eta Q$.`,
    ],
    steps: ($, sig) => {
      const RH = $.tFH + 459.67;
      const RL = $.tFL + 459.67;
      const eta = 1 - RL / RH;
      return [
        String.raw`$T_H = ${sig($.tFH)} + 459.67 = ${sig(RH)}$ R and $T_L = ${sig(RL)}$ R.`,
        String.raw`$\eta = 1 - ${sig(RL)}/${sig(RH)} = ${sig(eta)}$.`,
        String.raw`$W = \eta Q = ${sig(eta)}\times ${sig($.Q / J_PER_BTU)} = ${sig((eta * $.Q) / J_PER_BTU)}$ Btu.`,
      ];
    },
    second: ($) => {
      const RH = $.tFH + 459.67;
      const RL = $.tFL + 459.67;
      const eta = 1 - RL / RH;
      return { eta, W: eta * ($.Q / J_PER_BTU) };
    },
    sim: {
      scenario: 'engine',
      setup(s, $) {
        s.TH = $.TH;
        s.TL = $.TL;
      },
      read: (c) => ({ eta: c.eta }),
    },
    cases: [kase(cite('carnot'), { tFH: 500, tFL: 100, Q: 200 }, { eta: 0.41681, W: 83.362 })],
  }),

  problem({
    id: 'u4.6.device',
    title: 'Which limit belongs to this device?',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    kind: 'conceptual',
    src: cite('heat-engines'),
    topics: ['heat-engine', 'refrigerator'],
    principles: ['carnot-limit'],
    variety: ['configuration'],
    level: 1,
    vars: {
      device: choice(
        ['engine', 'a heat engine, producing work from heat'],
        ['fridge', 'a refrigerator, lifting heat out of a cold space'],
        ['heatpump', 'a heat pump, delivering heat to a warm space'],
      ),
      tH: celsius(100, 400, 50),
      tL: celsius(0, 40, 10),
    },
    derive: ($) => ({ TH: fromC($.tH), TL: fromC($.tL) }),
    valid: ($) => $.TH > $.TL + 30,
    text: (T) => String.raw`The device is ${T.device}. It runs between ${T.tL} °C and ${T.tH} °C. Which expression is its reversible limit?`,
    parts: [
      mc('form', [
        ['engine', String.raw`$1 - T_L/T_H$`, 'This is the engine. Its limit is a thermal efficiency below one. A refrigerator or a heat pump is judged by a COP, and that number is larger than one.'],
        ['fridge', String.raw`$T_L/(T_H - T_L)$`, 'This is the refrigerator. The numerator is the heat lifted from the cold space. The heat pump puts the hot temperature there, and the engine is not a COP.'],
        ['heatpump', String.raw`$T_H/(T_H - T_L)$`, 'This is the heat pump. It counts the heat delivered, so its COP is the refrigerator COP plus one. The engine limit stays below one.'],
      ], ($) => $.device, { label: 'the reversible limit' }),
    ],
    hints: [
      'Name the quantity the device is supposed to produce, and divide it by what you have to pay.',
      'An engine is paid in heat and produces work. A refrigerator is paid in work and produces a cooling effect. A heat pump is paid in work and produces heating.',
    ],
    steps: ($) => [
      {
        engine: String.raw`Work over heat absorbed is $W/Q_H$. For a reversible engine that ratio is $1 - T_L/T_H$.`,
        fridge: String.raw`Heat lifted over work is $Q_L/W$. For a reversible refrigerator that ratio is $T_L/(T_H - T_L)$.`,
        heatpump: String.raw`Heat delivered over work is $Q_H/W$. For a reversible heat pump that ratio is $T_H/(T_H - T_L)$.`,
      }[$.device],
    ],
    second: ($) => {
      const kind = { engine: 'work-over-heat', fridge: 'cold-over-work', heatpump: 'hot-over-work' }[$.device];
      const back = { 'work-over-heat': 'engine', 'cold-over-work': 'fridge', 'hot-over-work': 'heatpump' };
      return { form: back[kind] };
    },
    sim: {
      scenario: 'engine',
      setup(s, $) {
        s.mode = $.device === 'engine' ? 'engine' : 'fridge';
        s.TH = $.TH;
        s.TL = $.TL;
      },
      read: () => ({}),
    },
    cases: [
      kase(cite('heat-engines'), { device: 'engine', tH: 200, tL: 20 }, { form: 'engine' }),
      kase(cite('heat-engines'), { device: 'heatpump', tH: 200, tL: 20 }, { form: 'heatpump' }),
    ],
  }),

  problem({
    id: 'u4.6.verdict',
    title: 'Reversible, irreversible or impossible?',
    exam: 'u4',
    ch: '6',
    lab: 'claims',
    kind: 'conceptual',
    src: cite('second-law'),
    topics: ['claim', 'second-law'],
    principles: ['clausius'],
    variety: ['configuration'],
    level: 2,
    vars: {
      slip: choice(
        ['rev', 'built so the efficiency sits on the Carnot line'],
        ['irr', 'built so the efficiency is under the Carnot line'],
        ['imp', 'built so the efficiency is over the Carnot line'],
      ),
      tH: celsius(150, 400, 50),
      tL: celsius(0, 40, 10),
      QH: range(200, 800, 100, 'kJ', KJ),
    },
    derive: ($) => {
      const TH = fromC($.tH);
      const TL = fromC($.tL);
      const carnot = 1 - TL / TH;
      const frac = $.slip === 'rev' ? carnot : $.slip === 'irr' ? 0.45 * carnot : carnot + 0.15;
      const W = frac * $.QH;
      return { TH, TL, W, QL: $.QH - W, carnot };
    },
    valid: ($) => $.QL > 0.05 * $.QH && $.W > 0 && $.TH > $.TL + 40 && $.carnot + 0.15 < 0.98,
    text: (T, $, sig) => String.raw`An inventor's engine takes $${sig($.QH / KJ)}$ kJ from a reservoir at ${T.tH} °C, rejects $${sig($.QL / KJ)}$ kJ to a reservoir at ${T.tL} °C, and claims $${sig($.W / KJ)}$ kJ of work. The three magnitudes already satisfy the first law. How is the claim classed?`,
    parts: [
      mc('call', [
        ['reversible', 'Reversible', 'The efficiency equals 1 − T_L/T_H, so the Clausius sum is zero. Anything less is irreversible, and anything more cannot exist.'],
        ['irreversible', 'Irreversible', 'The first law holds and the efficiency is below the Carnot limit, so the Clausius sum is negative. The device can exist, and it wastes some of the heat.'],
        ['impossible', 'Impossible', 'The efficiency is above 1 − T_L/T_H, so the Clausius sum is positive. No cycle can do that, even though the heats and the work add up.'],
      ], ($) => classifyClaim({ kind: 'engine', TH: $.TH, TL: $.TL, QH: $.QH, QL: $.QL, W: $.W }).verdict, { label: 'the claim' }),
    ],
    hints: [
      'The first law is already satisfied. The second law compares the efficiency with the limit set by the two absolute temperatures.',
      String.raw`Compute $\eta = W/Q_H$ and $\eta_C = 1 - T_L/T_H$. Equal is reversible, under is irreversible, over is impossible.`,
    ],
    steps: ($, sig) => {
      const eta = $.W / $.QH;
      const verdict = classifyClaim({ kind: 'engine', TH: $.TH, TL: $.TL, QH: $.QH, QL: $.QL, W: $.W }).verdict;
      return [
        String.raw`$\eta = ${sig($.W / KJ)}/${sig($.QH / KJ)} = ${sig(eta)}$. The Carnot limit is $1 - ${sig($.TL)}/${sig($.TH)} = ${sig($.carnot)}$.`,
        String.raw`Since $\eta$ is ${verdict === 'reversible' ? 'equal to' : verdict === 'irreversible' ? 'below' : 'above'} the limit, the claim is ${verdict}.`,
      ];
    },
    second: ($) => ({
      call: classifyByLimit({ kind: 'engine', TH: $.TH, TL: $.TL, QH: $.QH, QL: $.QL, W: $.W }),
    }),
    sim: {
      scenario: 'fair',
      setup(s, $) {
        s.kind = 'engine';
        s.TH = $.TH;
        s.TL = $.TL;
        s.QH = $.QH / KJ;
        s.QL = $.QL / KJ;
        s.W = $.W / KJ;
      },
      read: (c) => ({ call: c.verdict }),
    },
    cases: [
      kase(cite('second-law'), { slip: 'irr', tH: 250, tL: 20, QH: 400 }, { call: 'irreversible' }),
      kase(cite('second-law'), { slip: 'imp', tH: 250, tL: 20, QH: 400 }, { call: 'impossible' }),
      kase(cite('second-law'), { slip: 'rev', tH: 250, tL: 20, QH: 400 }, { call: 'reversible' }),
    ],
  }),

  problem({
    id: 'u4.6.which-cop',
    title: 'Which formula is this?',
    exam: 'u4',
    ch: '6',
    lab: 'carnot',
    kind: 'conceptual',
    src: cite('carnot'),
    topics: ['carnot'],
    principles: ['carnot-limit'],
    variety: ['configuration'],
    level: 2,
    vars: {
      which: choice(
        ['hp', 'the heat delivered per unit of work'],
        ['ref', 'the heat removed per unit of work'],
        ['eng', 'the work produced per unit of heat absorbed'],
      ),
      tH: celsius(100, 250, 25),
      tL: celsius(0, 40, 5),
    },
    derive: ($) => ({ TH: fromC($.tH), TL: fromC($.tL) }),
    valid: ($) => $.TH > $.TL + 20,
    text: (T) => String.raw`A reversible device operates between ${T.tL} °C and ${T.tH} °C. You want ${T.which}. Which expression gives that limit?`,
    parts: [
      mc('form', [
        ['hp', String.raw`$T_H/(T_H - T_L)$`, 'This counts heat delivered per unit of work, which is the heat-pump COP. It is one more than the refrigerator COP. The engine limit is smaller than one.'],
        ['ref', String.raw`$T_L/(T_H - T_L)$`, 'This counts heat removed per unit of work, which is the refrigerator COP. The heat pump uses T_H on top, and the engine is not a COP.'],
        ['eng', String.raw`$1 - T_L/T_H$`, 'This counts work per unit of heat absorbed, which is an efficiency. Both COPs are larger than one for the temperatures in this course.'],
      ], ($) => $.which, { label: 'the expression' }),
    ],
    hints: [
      'Match the numerator to the quantity you want, and the denominator to what you pay.',
      'Work over heat is an efficiency and stays below one. Heat over work is a COP. Delivered heat is the removed heat plus the work.',
    ],
    steps: ($) => [
      {
        hp: String.raw`Heat delivered per unit of work is $Q_H/W = T_H/(T_H - T_L)$ for a reversible heat pump.`,
        ref: String.raw`Heat removed per unit of work is $Q_L/W = T_L/(T_H - T_L)$ for a reversible refrigerator.`,
        eng: String.raw`Work per unit of heat absorbed is $W/Q_H = 1 - T_L/T_H$ for a reversible engine.`,
      }[$.which],
    ],
    second: ($) => {
      const TH = $.TH;
      const TL = $.TL;
      const value = { hp: TH / (TH - TL), ref: TL / (TH - TL), eng: 1 - TL / TH }[$.which];
      const form = value < 1 ? 'eng' : Math.abs(value - (TL / (TH - TL) + 1)) < 1e-9 ? 'hp' : 'ref';
      return { form };
    },
    sim: {
      scenario: 'fridge',
      setup(s, $) {
        s.TH = $.TH;
        s.TL = $.TL;
      },
      read: () => ({}),
    },
    cases: [
      kase(cite('carnot'), { which: 'eng', tH: 200, tL: 20 }, { form: 'eng' }),
      kase(cite('carnot'), { which: 'ref', tH: 200, tL: 20 }, { form: 'ref' }),
    ],
  }),

  problem({
    id: 'u4.6.brayton-change',
    title: 'What moves the cold-air efficiency?',
    exam: 'u4',
    ch: '6',
    lab: null,
    kind: 'conceptual',
    src: cite('brayton'),
    topics: ['brayton'],
    principles: ['brayton'],
    variety: ['configuration'],
    level: 2,
    vars: {
      change: choice(
        ['rp', 'the pressure ratio is raised by 2'],
        ['T1', 'the compressor inlet is made 20 K warmer'],
        ['T3', 'the turbine inlet is made 100 K hotter'],
      ),
      rp: range(4, 14, 0.5, ''),
      k: choice([1.4, '1.40'], [1.33, '1.33']),
      T1: range(280, 320, 10, 'K'),
    },
    text: (T) => String.raw`A cold-air Brayton cycle has $k = ${T.k}$, a pressure ratio of ${T.rp} and a compressor inlet of ${T.T1} K. The turbine inlet is hot enough that the combustor adds heat. What happens to the efficiency if ${T.change}?`,
    parts: [
      mc('move', [
        ['rises', 'It rises', 'The cold-air efficiency is 1 − r_p^{(1−k)/k}. Only a higher pressure ratio raises it. Neither inlet temperature appears in the formula.'],
        ['falls', 'It falls', 'Nothing here lowers the pressure ratio. Warming an inlet, or heating the turbine inlet further, does not change the cold-air result.'],
        ['stays', 'It stays the same', 'Compressor and turbine temperatures drop out once c_p is constant. The efficiency moves only when the pressure ratio moves.'],
      ], ($) => ($.change === 'rp' ? 'rises' : 'stays'), { label: 'the cold-air efficiency' }),
    ],
    hints: [
      'Write the cold-air efficiency and see which of the stated changes is in that expression.',
      String.raw`$\eta = 1 - r_p^{(1-k)/k}$. With k fixed, only r_p remains.`,
    ],
    steps: ($) => [
      String.raw`$\eta = 1 - r_p^{(1-k)/k}$. Temperatures do not appear.`,
      $.change === 'rp'
        ? String.raw`Raising $r_p$ from ${$.rp} to ${$.rp + 2} lowers $r_p^{(1-k)/k}$, so the efficiency rises.`
        : String.raw`Changing ${$.change === 'T1' ? 'the compressor inlet' : 'the turbine inlet'} leaves $r_p$ and $k$ alone, so the efficiency stays the same.`,
    ],
    second: ($) => {
      const before = braytonColdAir($.rp, $.k);
      const after = $.change === 'rp' ? braytonColdAir($.rp + 2, $.k) : before;
      const move = Math.abs(after - before) < 1e-12 ? 'stays' : after > before ? 'rises' : 'falls';
      return { move };
    },
    cases: [
      kase(cite('brayton'), { change: 'rp', rp: 8, k: 1.4, T1: 300 }, { move: 'rises' }),
      kase(cite('brayton'), { change: 'T3', rp: 8, k: 1.4, T1: 300 }, { move: 'stays' }),
    ],
  }),
];

export default ch6;
