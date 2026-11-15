/**
 * Unit 8 bank: mission and requirements. Original problems, with staged hints and named traps
 * (../coaching/u8.js). The budget problems are checked against the Mass margin lab (`sim`); the
 * requirement, verification and review problems against a second rule (`second`).
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { GROWTH, marginClosed } from '@flux/subjects/design/massmargin.js';
import { BUS, craftItems } from '../../labs/margin.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** The bus's basic mass, 6.5 kg, rounded so the sum of tenths prints cleanly. */
export const BUS_KG = Math.round(1000 * BUS.reduce((s, [, m]) => s + m, 0)) / 1000;
export const LIMIT = 12;

/** Predicted mass and margin for a catalog bus and a payload, with a flat allowance; `how` names the traps. */
export function budget($, how = 'right') {
  const a = Number($.allow) / 100;
  const B = BUS_KG + $.pay;
  if (how === 'basic') return { P: B, m: LIMIT - B };
  if (how === 'payloadOnly') return { P: BUS_KG + $.pay * (1 + a), m: LIMIT - BUS_KG - $.pay * (1 + a) };
  if (how === 'flipped') return { P: B * (1 + a), m: B * (1 + a) - LIMIT };
  return { P: B * (1 + a), m: LIMIT - B * (1 + a) };
}

/** Expected finished mass, in kg; `how` names the traps. */
export function expectedMass($, how = 'right') {
  const mb = GROWTH[$.busM];
  const mp = GROWTH[$.payM];
  if (how === 'growthOnly') return BUS_KG * mb + $.pay * mp;
  if (how === 'busFixed') return BUS_KG + $.pay * (1 + mp);
  return BUS_KG * (1 + mb) + $.pay * (1 + mp);
}

/** The allowance, in percent, that the expected growth needs; `how` names the traps. */
export function neededAllowance($, how = 'right') {
  const B = BUS_KG + $.pay;
  const E = expectedMass($);
  if (how === 'averaged') return 50 * (GROWTH[$.busM] + GROWTH[$.payM]);
  if (how === 'kg') return E - B;
  return 100 * (E / B - 1);
}

/** Words the NASA handbook's checklist (Appendix C) rules out of a requirement. */
const VAGUE = ['adequate', 'sufficient', 'light-weight', 'robust', 'quickly', 'maximize', 'minimize', 'easy', 'user-friendly', 'appropriate', 'fast'];
const STATEMENTS = {
  power: 'The radio shall transmit no less than 1.0 W.',
  light: 'The structure shall be light-weight.',
  battery: 'The battery shall have adequate capacity for the eclipse.',
  point: 'The attitude control shall point the magnetometer boom to within 2° of the orbit’s velocity.',
  quick: 'The flight software shall respond quickly to ground commands.',
};
/** Second rule: verifiable when it carries a number and none of the checklist's vague words. */
const verifiableByWords = (key) => {
  const s = STATEMENTS[key].toLowerCase();
  return /\d/.test(s) && !VAGUE.some((w) => s.includes(w)) ? 'yes' : 'no';
};

const REQS = {
  mass: { text: 'The flight system shall have a mass of no more than 12.0 kg at launch.', needs: 'measured data' },
  label: { text: 'Every connector shall carry a label with its harness number.', needs: 'a visible feature' },
  boom: { text: 'The magnetometer boom shall deploy and lock on command.', needs: 'operation only' },
  decay: { text: 'The craft shall re-enter within 25 years of the end of its mission.', needs: 'prediction' },
};
/** Second rule: the method from what the check needs (the handbook's definitions, 5.3 and Appendix B). */
const METHOD_FOR = { 'measured data': 'test', 'a visible feature': 'inspection', 'operation only': 'demonstration', prediction: 'analysis' };

/** The life cycle's reviews in order, each with the phase it belongs to (handbook, 3.0). */
const REVIEWS = [['MCR', 'pre-A'], ['SRR', 'A'], ['MDR', 'A'], ['PDR', 'B'], ['CDR', 'C'], ['SIR', 'C']];
const ASK = {
  preA: ['Pre-Phase A, concept studies, ends at which review?', 'pre-A', 'last'],
  srr: ['In Phase A, which review first agrees the system requirements?', 'A', 'first'],
  pdr: ['Phase B, preliminary design, ends at which review?', 'B', 'last'],
  cdr: ['In Phase C, final design, which review shows the design is complete before building?', 'C', 'first'],
};
const reviewByOrder = (key) => {
  const [, phase, which] = ASK[key];
  const list = REVIEWS.filter(([, p]) => p === phase).map(([r]) => r);
  return which === 'first' ? list[0] : list[list.length - 1];
};

export default [
  problem({
    id: 'u8.1.budget',
    title: 'Predicted mass and margin',
    exam: 'u8',
    ch: '8',
    lab: 'margin',
    src: 'Flux, written for the Mass margin lab',
    topics: ['margin'],
    principles: ['margin'],
    vars: { pay: range(2.2, 4.2, 0.4, 'kg'), allow: choice(['10', '10%'], ['20', '20%'], ['30', '30%']) },
    text: (T) => `A 6U craft's bus parts have basic masses summing to ${BUS_KG} kg. Its payload's basic mass is ${T.pay} kg. The budget carries a flat ${T.allow} growth allowance on every item, and the launch allocation is ${LIMIT} kg. What mass does the budget predict, and what margin does it show?`,
    parts: [num('P', ($) => budget($).P, 'kg', { label: 'predicted mass' }), num('m', ($) => budget($).m, 'kg', { label: 'margin' })],
    level: 1,
    hints: ['Add the basic masses first.', 'The predicted mass is the basic mass times (1 + allowance); the margin is the allocation minus that.'],
    steps: ($) => {
      const B = BUS_KG + $.pay;
      return [String.raw`$B = ${BUS_KG} + ${$.pay} = ${fmt(B)}$ kg`, String.raw`$P = ${fmt(B)}(1 + ${Number($.allow) / 100}) = ${fmt(budget($).P)}$ kg, margin $= ${LIMIT} - ${fmt(budget($).P)} = ${fmt(budget($).m)}$ kg`];
    },
    sim: {
      scenario: 'catalog',
      setup(s, $) {
        Object.assign(s, { pay: $.pay, allow: Number($.allow), limit: LIMIT });
      },
      read: (c) => ({ P: c.predicted, m: c.margin }),
    },
    cases: [kase('3 kg at 20%', { pay: 3, allow: '20' }, { P: 11.4, m: 0.6 })],
  }),

  problem({
    id: 'u8.2.expected',
    title: 'What will it weigh?',
    exam: 'u8',
    ch: '8',
    lab: 'margin',
    src: 'Flux, written for the Mass margin lab',
    topics: ['margin'],
    principles: ['margin'],
    vars: {
      busM: choice(['catalog', 'bought from catalogs'], ['new', 'new designs']),
      payM: choice(['measured', 'built and weighed'], ['modified', 'modified from a flown design']),
      pay: range(2, 4, 1, 'kg'),
    },
    variety: ['maturity of bus and payload'],
    text: (T, $) => `A craft's bus parts total ${BUS_KG} kg of basic mass and are ${T.busM}. Its ${T.pay} kg payload is ${T.payM}. Take the mean growth as ${Math.round(100 * GROWTH[$.busM])}% for the bus and ${Math.round(100 * GROWTH[$.payM])}% for the payload. What is the craft's expected finished mass, in kg?`,
    parts: [num('E', ($) => expectedMass($), 'kg', { label: 'expected mass' })],
    level: 2,
    hints: ['Each part grows by its own mean, so treat the bus and the payload apart.', 'E = b_bus(1 + μ_bus) + b_payload(1 + μ_payload).'],
    steps: ($) => [String.raw`$E = ${BUS_KG}(1 + ${GROWTH[$.busM]}) + ${$.pay}(1 + ${GROWTH[$.payM]}) = ${fmt(expectedMass($), 4)}$ kg`],
    sim: {
      scenario: 'catalog',
      setup(s, $) {
        Object.assign(s, { busM: $.busM, payM: $.payM, pay: $.pay });
      },
      read: (c) => ({ E: c.mean }),
    },
    cases: [kase('new bus, 3 kg modified payload', { busM: 'new', payM: 'modified', pay: 3 }, { E: 11.9 })],
  }),

  problem({
    id: 'u8.3.needed',
    title: 'The allowance the growth needs',
    exam: 'u8',
    ch: '8',
    lab: 'margin',
    src: 'Flux, written for the Mass margin lab',
    topics: ['margin'],
    principles: ['margin'],
    vars: {
      busM: choice(['catalog', 'bought from catalogs'], ['modified', 'modified from flown designs']),
      payM: choice(['new', 'a new design'], ['measured', 'built and weighed']),
    },
    derive: () => ({ pay: 3 }),
    variety: ['maturity of bus and payload'],
    text: (T, $) => `A craft's ${BUS_KG} kg of bus parts are ${T.busM}, with a mean growth of ${Math.round(100 * GROWTH[$.busM])}%. Its 3 kg payload is ${T.payM}, with a mean growth of ${Math.round(100 * GROWTH[$.payM])}%. What flat allowance, in percent of the basic mass, covers the expected growth of the whole craft?`,
    parts: [num('a', ($) => neededAllowance($), '%', { label: 'allowance' })],
    level: 2,
    hints: ['Find the expected finished mass, part by part.', 'The allowance is the expected mass over the basic mass, less one: a mass-weighted mean of the growths.'],
    steps: ($) => [String.raw`$E = ${fmt(expectedMass($), 4)}$ kg on $B = ${BUS_KG + 3}$ kg`, String.raw`$a = E/B - 1 = ${fmt(neededAllowance($))}\%$`],
    sim: {
      scenario: 'catalog',
      setup(s, $) {
        Object.assign(s, { busM: $.busM, payM: $.payM, pay: 3 });
      },
      read: (c) => ({ a: 100 * c.needed }),
    },
    cases: [kase('catalog bus, new payload', { busM: 'catalog', payM: 'new' }, { a: 12.89 })],
  }),

  problem({
    id: 'u8.4.allowance',
    title: 'Does a bigger allowance help?',
    exam: 'u8',
    ch: '8',
    kind: 'conceptual',
    lab: 'margin',
    src: 'Flux, written for the Mass margin lab',
    topics: ['margin'],
    principles: ['margin'],
    vars: { busM: choice(['new', 'new designs'], ['modified', 'modified from flown designs']), to: choice(['30', '30%'], ['40', '40%']) },
    text: (T) => `A 6U craft's parts are all ${T.busM}, and its budget carries a flat 20% allowance against a 12 kg allocation. The team raises the allowance to ${T.to}. What happens to the chance that the finished craft comes in over 12 kg?`,
    parts: [
      pick('p', 'the chance it comes in over', [
        ['falls', 'it falls', 'The allowance changes the budget, not the parts. The craft weighs what its designs grow to.'],
        ['same', 'it stays the same', 'The allowance is bookkeeping: the margin shrinks on paper, and the craft is unchanged.'],
        ['rises', 'it rises', 'Nothing about the craft changed, so nothing makes it heavier.'],
      ], () => 'same'),
    ],
    level: 1,
    hints: ['What does the allowance change: the parts, or the numbers in the budget?', 'The chance depends on the parts’ growth and the allocation only.'],
    steps: () => ['The margin falls; the expected mass and its spread do not, so the chance stays the same.'],
    second: ($) => {
      const items = craftItems({ busM: $.busM, payM: $.busM, pay: 3 });
      const before = marginClosed(items, 0.2, LIMIT).pNormal;
      const after = marginClosed(items, Number($.to) / 100, LIMIT).pNormal;
      return { p: Math.abs(after - before) < 1e-12 ? 'same' : after > before ? 'rises' : 'falls' };
    },
    cases: [kase('new designs, to 30%', { busM: 'new', to: '30' }, { p: 'same' })],
  }),

  problem({
    id: 'u8.5.method',
    title: 'Choose the verification method',
    exam: 'u8',
    ch: '8',
    kind: 'conceptual',
    src: 'Flux, after the NASA Systems Engineering Handbook, 5.3',
    topics: ['verification'],
    principles: ['verification'],
    vars: { req: choice(['mass', 'mass'], ['label', 'label'], ['boom', 'boom'], ['decay', 'decay']) },
    variety: ['which requirement'],
    text: (T, $) => `Requirement: “${REQS[$.req].text}” Which verification method fits it best?`,
    parts: [
      pick('m', 'method', [
        ['test', 'test', 'Test uses the item to get measured data under controlled conditions, such as a mass on a calibrated scale.'],
        ['inspection', 'inspection', 'Inspection looks at the item, or its drawings and records, for a physical feature.'],
        ['demonstration', 'demonstration', 'Demonstration operates the item and confirms it works, without collecting detailed data.'],
        ['analysis', 'analysis', 'Analysis predicts with models where the item cannot be tested, such as years of orbital decay.'],
      ], ($) => ({ mass: 'test', label: 'inspection', boom: 'demonstration', decay: 'analysis' })[$.req]),
    ],
    level: 1,
    hints: ['What does the check need: measured numbers, a look, an operation, or a prediction?', 'A check that cannot be run before flight has to be an analysis.'],
    steps: ($) => [`It needs ${REQS[$.req].needs}, so the method is ${METHOD_FOR[REQS[$.req].needs]}.`],
    second: ($) => ({ m: METHOD_FOR[REQS[$.req].needs] }),
    cases: [kase('the boom', { req: 'boom' }, { m: 'demonstration' })],
  }),

  problem({
    id: 'u8.6.verifiable',
    title: 'Can it be verified?',
    exam: 'u8',
    ch: '8',
    kind: 'conceptual',
    src: 'Flux, after the NASA Systems Engineering Handbook, Appendix C',
    topics: ['requirements'],
    principles: ['requirement'],
    vars: { s: choice(['power', 'power'], ['light', 'light'], ['battery', 'battery'], ['point', 'point'], ['quick', 'quick']) },
    variety: ['which statement'],
    text: (T, $) => `“${STATEMENTS[$.s]}” Is this a requirement that can be verified as written?`,
    parts: [
      pick('v', 'verifiable', [
        ['yes', 'yes', 'It states one thing with a number and a unit, so a check can pass or fail it.'],
        ['no', 'no', 'It uses a word no check can pass or fail, and gives no number.'],
      ], ($) => ({ power: 'yes', light: 'no', battery: 'no', point: 'yes', quick: 'no' })[$.s]),
    ],
    level: 1,
    hints: ['Could two engineers disagree about whether it was met?', 'Look for a number with a unit, and for words such as adequate or light-weight.'],
    steps: ($) => [verifiableByWords($.s) === 'yes' ? 'It carries a number and a unit and no vague word: it can be verified.' : 'It has no number, and its key word cannot be measured: rewrite it with a value.'],
    second: ($) => ({ v: verifiableByWords($.s) }),
    cases: [kase('light-weight', { s: 'light' }, { v: 'no' })],
  }),

  problem({
    id: 'u8.7.review',
    title: 'Which review?',
    exam: 'u8',
    ch: '8',
    kind: 'conceptual',
    src: 'Flux, after the NASA Systems Engineering Handbook, 3.0',
    topics: ['reviews'],
    principles: ['life-cycle'],
    vars: { q: choice(['preA', 'pre-A'], ['srr', 'A'], ['pdr', 'B'], ['cdr', 'C']) },
    variety: ['which phase'],
    text: (T, $) => ASK[$.q][0],
    parts: [
      pick('r', 'review', [
        ['MCR', 'Mission Concept Review', 'It closes the concept studies of Pre-Phase A.'],
        ['SRR', 'System Requirements Review', 'In Phase A it agrees the system requirements.'],
        ['PDR', 'Preliminary Design Review', 'It closes Phase B, when the preliminary design meets the requirements.'],
        ['CDR', 'Critical Design Review', 'In Phase C it shows the design is complete and ready to build.'],
      ], ($) => ({ preA: 'MCR', srr: 'SRR', pdr: 'PDR', cdr: 'CDR' })[$.q]),
    ],
    level: 1,
    hints: ['The reviews run in order: MCR, SRR, MDR or SDR, PDR, CDR, SIR.', 'Match each to its phase: Pre-A, A, A, B, C, C.'],
    steps: ($) => [`The phase’s ${ASK[$.q][2]} review is the ${reviewByOrder($.q)}.`],
    second: ($) => ({ r: reviewByOrder($.q) }),
    cases: [kase('Phase B', { q: 'pdr' }, { r: 'PDR' })],
  }),
];

