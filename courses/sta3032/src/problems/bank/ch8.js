/** Chapter 8 · One-sample inference: estimation, z and t procedures, one proportion. */
import { problem, kase, range, choice, data, num, prob, mc, tn, fx, pn, SIDE, hyp, pTex, decide, decisionPart, h1Part, conclusionPart, conclude, zTableP, zCrits, endpoint, statPart, pPart, confLabel, tLook, zCritLook } from '../kit.js';
import { zTest, zInterval, tTest, tInterval, propTest, propInterval } from '../../stats/infer.js';
import { tCrit, tCdf, zCrit, normCdf } from '../../stats/dist.js';
import { tTable } from '../../stats/tables.js';
import { createRng } from '../../stats/rng.js';
import { mean, sd } from '../../stats/describe.js';

const Z_WITH_S = 'That endpoint uses a z critical value with s. With σ unknown the critical value is t with n − 1 degrees of freedom, which is larger, so the interval is wider.';
const T_NOT_Z = 'That p-value comes from the normal curve. The statistic uses s, so the p-value comes from the t distribution with ν = n − 1 (tcdf, or T-Test).';
/** The p-value a student gets by reading a t statistic off the normal curve. */
const zSideP = (side, t) => (side === 'left' ? normCdf(t) : side === 'right' ? 1 - normCdf(t) : 2 * (1 - normCdf(Math.abs(t))));

const C8 = { ch: '8' };
const ALPHA = choice([0.01, '0.01'], [0.05, '0.05'], [0.1, '0.1']);
const CONF = choice([0.9, '90%'], [0.95, '95%'], [0.99, '99%']);
const REL = { two: 'different from', left: 'less than', right: 'greater than' };
const SYM = { two: '\\ne', left: '<', right: '>' };

/** Settings for means: what is measured, its unit, a claimed mean, σ, and decimals. */
const MEANS = [
  { value: 'sodium', what: 'sodium content of a breakfast sandwich', unit: 'mg', mu0: 920, sigma: 18, dp: 0 },
  { value: 'candy', what: 'weight of a “fun size” candy bar', unit: 'grams', mu0: 20.1, sigma: 0.6, dp: 2 },
  { value: 'bolt', what: 'diameter of a machined bolt', unit: 'mm', mu0: 10, sigma: 0.04, dp: 3 },
  { value: 'commute', what: 'commute time of employees', unit: 'minutes', mu0: 27, sigma: 8, dp: 1 },
  { value: 'song', what: 'length of the songs on a phone', unit: 'seconds', mu0: 240, sigma: 30, dp: 0 },
  { value: 'height', what: 'height of NFL players', unit: 'inches', mu0: 69.5, sigma: 2.8, dp: 2 },
];
const MEAN = choice(...MEANS.map((c) => [c.value, c.what]));
const ctxOf = (v) => MEANS.find((c) => c.value === v);
const u = (c) => (c.unit ? ` ${c.unit}` : '');

/** A normal sample of n values for a context, centered near mu0 + shift·σ. */
function sampleOf(rand, c, n, shift) {
  const r = createRng(Math.floor(rand() * 2 ** 31));
  return Array.from({ length: n }, () => Number(r.normal(c.mu0 + shift * c.sigma, c.sigma).toFixed(c.dp)));
}

/** A p-value far enough from α that the decision is not a rounding accident. */
const clear = ($) => Math.abs($.p - $.alpha) > 0.004 && $.p > 0.0005;

export default [
  // ----------------------------------------------------------------- language of tests
  problem({
    ...C8, id: 'c8.hypotheses', title: 'Setting up the hypotheses', kind: 'conceptual', topics: ['hypotheses'], src: 'Notes Ex 8.3',
    vars: {
      s: choice(
        ['p-right', 'Two percent of children taking competing antibiotics get headaches as a side effect. A researcher wants to know if the percentage of children taking a new antibiotic who get headaches is more than 2%.'],
        ['mu-two', 'The Blue Book price of a used three-year-old Corvette ZR1 is 86,012 dollars. Grant wonders if the mean price of such cars in the Miami area is different from 86,012 dollars.'],
        ['sigma-left', 'The standard deviation of the contents of a 64-ounce detergent bottle filled by an old machine is 0.23 ounce. The manufacturer wants to know if a new filling machine has less variability.'],
        ['mu-right', 'A restaurant claims its breakfast sandwich has 920 mg of sodium on average. Some people believe the actual mean is higher.'],
        ['mu-left', 'A battery maker claims its batteries last 500 hours on average. A consumer group suspects they last less.'],
        ['p-two', 'A city once had 40% college graduates among its adults. A planner wants to know if that percentage has changed.'],
        ['p-left', 'A customer requires a defective rate below 5%. The manufacturer wants evidence that its defective rate is less than 0.05.'],
      ),
    },
    derive: ($) => {
      const [param, tail] = $.s.split('-');
      return { param, tail };
    },
    text: (T) => T.s,
    parts: [
      mc('param', [['mu', 'A population mean μ'], ['p', 'A population proportion p'], ['sigma', 'A population standard deviation σ']], ($) => $.param, { label: 'The hypotheses are about…' }),
      mc('tail', [['two', 'Two-tailed (≠)'], ['left', 'Left-tailed (<)'], ['right', 'Right-tailed (>)']], ($) => $.tail, { label: 'The test is…' }),
    ],
    hints: ['H₀ is the statement of no change: the parameter equals the stated value.', 'H₁ is what we want evidence for. “More than” is right-tailed, “less than” left-tailed, “different from” (or “changed”) two-tailed.'],
    steps: ($) => {
      const P = { mu: String.raw`\mu`, p: 'p', sigma: String.raw`\sigma` }[$.param];
      const v = { 'p-right': '0.02', 'mu-two': '86{,}012', 'sigma-left': '0.23', 'mu-right': '920', 'mu-left': '500', 'p-two': '0.40', 'p-left': '0.05' }[$.s];
      const [h0, h1] = [String.raw`H_0: ${P} = ${v}`, String.raw`H_1: ${P} ${SYM[$.tail]} ${v}`];
      return [String.raw`$${h0}$ versus $${h1}$`, `${{ two: 'Two', left: 'Left', right: 'Right' }[$.tail]}-tailed: H₁ is what the researcher is trying to find evidence for.`];
    },
    cases: [kase('Notes Ex 8.3(a)', { s: 'p-right' }, { param: 'p', tail: 'right' }), kase('Notes Ex 8.3(b)', { s: 'mu-two' }, { param: 'mu', tail: 'two' }), kase('Notes Ex 8.3(c)', { s: 'sigma-left' }, { param: 'sigma', tail: 'left' })],
  }),

  problem({
    ...C8, id: 'c8.errors', title: 'Type I and Type II errors', kind: 'conceptual', topics: ['errors'], src: 'Notes Ex 8.4',
    vars: { which: choice(['I', 'Type I'], ['II', 'Type II']), ctx: choice(['sodium', 'sodium'], ['drug', 'drug'], ['machine', 'machine']) },
    derive: ($) => ({ key: $.which === 'I' ? 'rt' : 'fa' }),
    text: (T, $) =>
      ({
        sodium: 'A restaurant claims the mean sodium content of a sandwich is 920 mg. We test H₀: μ = 920 against H₁: μ > 920.',
        drug: 'A new drug is tested. H₀: the drug is no better than the old one; H₁: the new drug is better.',
        machine: 'A filling machine is supposed to fill 20.1 grams on average. H₀: μ = 20.1; H₁: μ ≠ 20.1, in which case the machine is shut down.',
      })[$.ctx] + ` Which describes a ${T.which} error?`,
    parts: [
      mc('e', ($) => {
        const say = {
          sodium: { rt: 'Concluding the mean is higher than 920 mg when it really is 920 mg', fa: 'Not concluding the mean is higher than 920 mg when it really is higher', rf: 'Concluding the mean is higher than 920 mg when it really is higher', ft: 'Not concluding the mean is higher when it really is 920 mg' },
          drug: { rt: 'Concluding the new drug is better when it is not', fa: 'Failing to conclude the new drug is better when it is', rf: 'Concluding the new drug is better when it is', ft: 'Failing to conclude the new drug is better when it is not' },
          machine: { rt: 'Shutting the machine down when it is filling correctly', fa: 'Leaving the machine running when it is off target', rf: 'Shutting the machine down when it is off target', ft: 'Leaving the machine running when it is filling correctly' },
        }[$.ctx];
        return [
          ['rt', say.rt, 'That rejects a true H₀: a Type I error.'],
          ['fa', say.fa, 'That fails to reject a false H₀: a Type II error.'],
          ['rf', say.rf, 'That is a correct decision: rejecting a false H₀.'],
          ['ft', say.ft, 'That is a correct decision: not rejecting a true H₀.'],
        ];
      }, ($) => $.key),
    ],
    hints: ['Type I: reject H₀ when H₀ is true. Its probability is α.', 'Type II: fail to reject H₀ when H₀ is false. Its probability is β.'],
    steps: ($) => [$.which === 'I' ? 'A Type I error rejects H₀ although H₀ is true. Here that means acting on H₁ when nothing has changed.' : 'A Type II error fails to reject H₀ although H₀ is false. Here that means missing a real difference.'],
    cases: [kase('Notes Ex 8.4(a)', { which: 'I', ctx: 'sodium' }, { e: 'rt' }), kase('Notes Ex 8.4(b)', { which: 'II', ctx: 'sodium' }, { e: 'fa' })],
  }),

  // ----------------------------------------------------------------- z procedures (σ known)
  problem({
    ...C8, id: 'c8.z-interval', title: 'Z-interval for μ (σ known)', kind: 'numeric', level: 2, topics: ['z-interval', 'confidence-interval'], src: 'Notes Ex 8.2',
    vars: { ctx: MEAN, n: range(30, 120, 1), conf: CONF, shift: range(-1.5, 1.5, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const xbar = Number((c.mu0 + ($.shift * c.sigma) / 2).toFixed(c.dp + 1));
      const r = zInterval({ xbar, sigma: c.sigma, n: $.n, conf: $.conf });
      const zs = zCrits(r.alpha);
      return { c, xbar, ...r, los: zs.map((z) => xbar - z * r.se), his: zs.map((z) => xbar + z * r.se), zt: zCritLook(r.alpha / 2) };
    },
    text: (T, $) => `A random sample of ${$.n} has a mean ${$.c.what} of ${$.xbar}${u($.c)}. The population standard deviation is ${$.c.sigma}${u($.c)}. Find a ${confLabel($.conf)} confidence interval for the population mean μ.`,
    parts: [endpoint('lo', ($) => $.lo, { alt: ($) => $.los, margin: ($) => $.E }), endpoint('hi', ($) => $.hi, { alt: ($) => $.his, margin: ($) => $.E })],
    hints: [String.raw`$\bar x \pm z_{\alpha/2}\dfrac{\sigma}{\sqrt{n}}$`, String.raw`For ${'90%'}, ${'95%'}, ${'99%'}: $z_{\alpha/2}$ = 1.645, 1.96, 2.575.`, 'Check the assumption: n ≥ 30 (or a normal population). On the TI-84: STAT → TESTS → 7:ZInterval.'],
    steps: ($) => [
      String.raw`$n = ${$.n} \ge 30$, so the z-interval applies. $\alpha = ${fx($.alpha, 2)}$, $\alpha/2 = ${fx($.alpha / 2, 3)}$.`,
      $.zt.line,
      String.raw`$$E = z_{\alpha/2}\dfrac{\sigma}{\sqrt n} = ${$.zt.value}\cdot\dfrac{${$.c.sigma}}{\sqrt{${$.n}}} = ${tn($.zt.value * $.se, 4)}$$`,
      String.raw`$$(${$.xbar} - ${tn($.zt.value * $.se, 4)},\ ${$.xbar} + ${tn($.zt.value * $.se, 4)}) = (${tn($.xbar - $.zt.value * $.se, 6)},\ ${tn($.xbar + $.zt.value * $.se, 6)})$$`,
      `We are ${confLabel($.conf)} confident the population mean ${$.c.what} is between these bounds. (TI-84 ZInterval: ${tn($.lo, 6)} to ${tn($.hi, 6)}.)`,
    ],
    cases: [kase('Notes Ex 8.2', { ctx: 'sodium', n: 44, conf: 0.9, shift: 5 / 9 }, { lo: 920.54, hi: 929.46 })],
  }),

  problem({
    ...C8, id: 'c8.z-test', title: 'Z-test for μ (σ known)', kind: 'numeric', level: 2, topics: ['z-test', 'hypothesis-test'], src: 'Notes Ex 8.5',
    vars: { ctx: MEAN, n: range(30, 100, 1), side: SIDE, alpha: ALPHA, shift: range(-0.6, 0.6, 0.01) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const xbar = Number((c.mu0 + $.shift * c.sigma).toFixed(c.dp + 1));
      const r = zTest({ xbar, sigma: c.sigma, n: $.n, mu0: c.mu0, side: $.side });
      return { c, xbar, ...r, dec: decide(r.p, $.alpha) };
    },
    valid: clear,
    text: (T, $) => `A company claims the mean ${$.c.what} is ${$.c.mu0}${u($.c)}. A random sample of ${$.n} has mean ${$.xbar}${u($.c)}; the population standard deviation is ${$.c.sigma}${u($.c)}. At α = ${$.alpha}, is there evidence that the mean is ${REL[$.side]} ${$.c.mu0}${u($.c)}?`,
    parts: [h1Part(), statPart('z', ($) => $.z, '$z_0$'), pPart(($) => $.p, { alt: ($) => [zTableP($.side, $.z)], traps: [[($) => ($.side === 'two' ? $.p / 2 : Math.min(1, 2 * $.p)), 'Check the tails: a two-tailed test doubles the one-tail area; a one-tailed test does not.']] }), decisionPart(), conclusionPart()],
    hints: [String.raw`$z_0 = \dfrac{\bar x - \mu_0}{\sigma/\sqrt n}$`, 'The p-value is the area beyond z₀ in the direction of H₁ (both tails for ≠).', 'Reject H₀ when p-value < α. TI-84: STAT → TESTS → 1:Z-Test.'],
    steps: ($) => {
      const [h0, h1] = hyp(String.raw`\mu`, $.c.mu0, $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$; $n = ${$.n} \ge 30$, so the z-test applies.`,
        String.raw`$$z_0 = \dfrac{${$.xbar} - ${$.c.mu0}}{${$.c.sigma}/\sqrt{${$.n}}} = ${fx($.z, 4)}$$`,
        String.raw`p-value $= ${pTex($.side, 'Z', $.z)} = ${fx($.p, 4)}$`,
        ...conclude($, `the mean ${$.c.what} is ${REL[$.side]} ${$.c.mu0}${u($.c)}`),
      ];
    },
    twin: { part: 'p', n: 30000, draw: (r, $) => { const zz = r.normal(); return $.side === 'right' ? zz >= $.z : $.side === 'left' ? zz <= $.z : Math.abs(zz) >= Math.abs($.z); } },
    cases: [kase('Notes Ex 8.5', { ctx: 'sodium', n: 44, side: 'right', alpha: 0.1, shift: 5 / 18 }, { z: 1.84, p: 0.0327, dec: 'reject' })],
  }),

  problem({
    ...C8, id: 'c8.z-test-data', title: 'Z-test from data', kind: 'numeric', level: 3, topics: ['z-test', 'hypothesis-test'], src: 'Notes Ex 8.6',
    vars: { n: range(8, 15, 1), side: SIDE, alpha: ALPHA, shift: range(-1.2, 1.2, 0.05), xs: data((rand, v) => sampleOf(rand, ctxOf('candy'), v.n, v.shift)) },
    derive: ($) => {
      const c = ctxOf('candy');
      const xbar = mean($.xs);
      const r = zTest({ xbar, sigma: c.sigma, n: $.n, mu0: c.mu0, side: $.side });
      return { c, xbar, ...r, dec: decide(r.p, $.alpha) };
    },
    valid: clear,
    text: (T, $) => `A “fun size” candy bar should weigh 20 grams, so the machine is calibrated to a mean of 20.1 grams. Weights are normal with σ = 0.6 gram. A quality engineer weighs ${$.n} bars: ${$.xs.map((x) => x.toFixed(2)).join(', ')}. At α = ${$.alpha}, test whether the mean is ${REL[$.side]} 20.1 grams.`,
    parts: [h1Part(), num('xbar', ($) => $.xbar, { label: String.raw`$\bar x$`, tol: 0, abs: 0.006 }), statPart('z', ($) => $.z, '$z_0$'), pPart(($) => $.p, { alt: ($) => [zTableP($.side, $.z)] }), decisionPart(), conclusionPart()],
    hints: ['Find x̄ first (TI-84: 1-Var Stats).', String.raw`$z_0 = \dfrac{\bar x - 20.1}{0.6/\sqrt n}$. The population is normal, so the z-test applies even for small n.`, 'TI-84: data in L1, then STAT → TESTS → 1:Z-Test with Inpt: Data.'],
    steps: ($) => {
      const [h0, h1] = hyp(String.raw`\mu`, 20.1, $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$. The weights are normal with σ known, so use a z-test.`,
        String.raw`$\bar x = ${fx($.xbar, 4)}$`,
        String.raw`$$z_0 = \dfrac{${fx($.xbar, 4)} - 20.1}{0.6/\sqrt{${$.n}}} = ${fx($.z, 4)}$$`,
        String.raw`p-value $= ${pTex($.side, 'Z', $.z)} = ${fx($.p, 4)}$`,
        ...conclude($, `the machine's mean weight is ${REL[$.side]} 20.1 grams${$.dec === 'reject' && $.side === 'two' ? ' (shut it down and recalibrate)' : ''}`),
      ];
    },
    cases: [kase('Notes Ex 8.6', { n: 11, side: 'two', alpha: 0.01, shift: 0.3, xs: [19.68, 20.66, 19.56, 19.98, 20.65, 19.61, 20.55, 20.36, 21.02, 21.5, 19.74] }, { xbar: 20.3, z: 1.11, p: 0.2668, dec: 'fail' })],
  }),

  problem({
    ...C8, id: 'c8.ci-and-test', title: 'Deciding a two-tailed test with an interval', kind: 'conceptual', topics: ['confidence-interval', 'hypothesis-test', 'duality'], src: 'Notes Ex 8.7, 8.12, 8.17',
    vars: { ctx: MEAN, conf: CONF, lo: range(-2, 1, 0.05), w: range(0.4, 2, 0.05), pos: range(-0.5, 1.5, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const L = Number((c.mu0 + $.lo * c.sigma).toFixed(c.dp + 1));
      const H = Number((L + $.w * c.sigma).toFixed(c.dp + 1));
      const v0 = Number((L + $.pos * (H - L)).toFixed(c.dp + 1));
      return { c, L, H, v0, alpha: Number((1 - $.conf).toFixed(2)), dec: v0 >= L && v0 <= H ? 'fail' : 'reject' };
    },
    valid: ($) => Math.abs($.v0 - $.L) > 0.02 * ($.H - $.L) && Math.abs($.v0 - $.H) > 0.02 * ($.H - $.L),
    text: (T, $) => `A ${confLabel($.conf)} confidence interval for the mean ${$.c.what} is (${$.L}, ${$.H})${u($.c)}. Test H₀: μ = ${$.v0} against H₁: μ ≠ ${$.v0} at α = ${$.alpha}.`,
    parts: [decisionPart({ label: 'Decision' })],
    hints: [String.raw`A two-tailed test at level α matches a $100(1-\alpha)\%$ confidence interval.`, 'If the interval contains μ₀, do not reject H₀; if it does not, reject.'],
    steps: ($) => [
      `The ${confLabel($.conf)} interval matches a two-tailed test at α = ${$.alpha}.`,
      $.dec === 'fail' ? `${$.v0} is inside (${$.L}, ${$.H}), so it is a plausible value of μ: fail to reject H₀.` : `${$.v0} is outside (${$.L}, ${$.H}), so it is not a plausible value of μ: reject H₀.`,
    ],
    cases: [kase('Notes Ex 8.7', { ctx: 'candy', conf: 0.99, lo: (19.83 - 20.1) / 0.6, w: 0.94 / 0.6, pos: 0.27 / 0.94 }, { dec: 'fail' }, { note: 'The 99% z-interval from Ex 8.6 is (19.83, 20.77), which contains 20.1.' }),
      kase('Notes Ex 8.12', { ctx: 'song', conf: 0.99, lo: (188.12 - 240) / 30, w: (259.44 - 188.12) / 30, pos: (240 - 188.1) / 71.3 }, { dec: 'fail' }, { note: 'The 99% t-interval from Ex 8.9, (188.1, 259.4), contains 240.' }),
    ],
  }),

  // ----------------------------------------------------------------- t procedures (σ unknown)
  problem({
    ...C8, id: 'c8.t-critical', title: 'Critical values of t', kind: 'numeric', topics: ['t-distribution', 't-table'], src: 'Notes Ex 8.8(a)–(b)',
    vars: { alpha: choice(...[0.1, 0.05, 0.025, 0.01, 0.005].map((a) => [a, String(a)])), df: range(1, 32, 1) },
    derive: ($) => {
      const df = $.df > 30 ? [40, 60, 120][$.df - 31] : $.df;
      return { v: df, t: tCrit($.alpha, df), look: tLook($.alpha, df) };
    },
    text: (T, $) => String.raw`For a t distribution with ν = ${$.v} degrees of freedom, find $t_{${$.alpha},\,${$.v}}$, the value with area ${$.alpha} to its right.`,
    parts: [num('t', ($) => $.t, { alt: ($) => $.look.values, tol: 0, abs: 0.002, label: String.raw`$t_{\alpha,\nu}$`, traps: [[($) => tCrit($.alpha / 2, $.v), 'That is t with α/2 in the tail. t_α puts all of α in one tail.'], [($) => -$.t, 't_α has area α to its RIGHT, so it is positive.']] })],
    hints: ['Table A.4: row ν, column α (the area to the right).', 'TI-84: invT(1 − α, ν).'],
    steps: ($) => [$.look.line, String.raw`Exact (TI-84 invT(${fx(1 - $.alpha, 3)}, ${$.v})): $${fx($.t, 4)}$`],
    cases: [kase('Notes Ex 8.8(a)', { alpha: 0.025, df: 17 }, { t: 2.11 }), kase('Notes Ex 8.8(b)', { alpha: 0.005, df: 13 }, { t: 3.012 })],
  }),

  problem({
    ...C8, id: 'c8.t-prob', title: 'Probabilities for t', kind: 'numeric', topics: ['t-distribution'], src: 'Notes Ex 8.8(c)',
    vars: { df: range(2, 30, 1), x: range(-2.5, 2.5, 0.1), side: choice(['left', 'less than'], ['right', 'greater than']) },
    derive: ($) => ({ p: $.side === 'left' ? tCdf($.x, $.df) : 1 - tCdf($.x, $.df) }),
    valid: ($) => Math.abs($.x) > 0.05,
    text: (T, $) => `T has a t distribution with ν = ${$.df}. Find P(T ${$.side === 'left' ? '<' : '>'} ${$.x}).`,
    parts: [prob('p', ($) => $.p, { label: ($T, $) => String.raw`$P(T ${$.side === 'left' ? '<' : '>'} ${$.x})$`, traps: [[($) => 1 - $.p, 'That is the other tail.']] })],
    hints: ['Table A.4 gives only a few upper-tail areas, so use the calculator: tcdf(lower, upper, ν).', 'For P(T < x) use tcdf(−1E99, x, ν); for P(T > x) use tcdf(x, 1E99, ν).'],
    steps: ($) => [String.raw`TI-84: tcdf(${$.side === 'left' ? `-1E99, ${$.x}` : `${$.x}, 1E99`}, ${$.df}) = $${fx($.p, 4)}$`, 'The t curve is symmetric about 0, like z, but with heavier tails.'],
    cases: [kase('Notes Ex 8.8(c)', { df: 10, x: 0.7, side: 'left' }, { p: 0.7501 })],
  }),

  problem({
    ...C8, id: 'c8.t-interval', title: 'T-interval for μ from data', kind: 'numeric', level: 3, topics: ['t-interval', 'confidence-interval'], src: 'Notes Ex 8.9',
    vars: { n: range(6, 15, 1), conf: CONF, shift: range(-1, 1, 0.1), xs: data((rand, v) => sampleOf(rand, ctxOf('song'), v.n, v.shift)) },
    derive: ($) => {
      const xbar = mean($.xs);
      const s = sd($.xs);
      const r = tInterval({ xbar, s, n: $.n, conf: $.conf });
      const look = tLook(r.alpha / 2, $.n - 1);
      return { xbar, s, ...r, look, los: look.values.map((t) => xbar - (t * s) / Math.sqrt($.n)), his: look.values.map((t) => xbar + (t * s) / Math.sqrt($.n)) };
    },
    text: (T, $) => `Marissa has over 500 songs on her phone. She takes a random sample of ${$.n} of them; their lengths in seconds are ${$.xs.join(', ')}. Song lengths are normally distributed. Find a ${confLabel($.conf)} confidence interval for the mean song length.`,
    parts: [num('xbar', ($) => $.xbar, { label: String.raw`$\bar x$`, tol: 0.0005 }), num('s', ($) => $.s, { label: '$s$', tol: 0.002 }), endpoint('lo', ($) => $.lo, { alt: ($) => $.los, margin: ($) => $.E, traps: [[($) => $.xbar - (zCrit((1 - $.conf) / 2) * $.s) / Math.sqrt($.n), Z_WITH_S]] }), endpoint('hi', ($) => $.hi, { alt: ($) => $.his, margin: ($) => $.E, traps: [[($) => $.xbar + (zCrit((1 - $.conf) / 2) * $.s) / Math.sqrt($.n), Z_WITH_S]] })],
    hints: ['σ is unknown, so use s and a t critical value with ν = n − 1.', String.raw`$\bar x \pm t_{\alpha/2,\,n-1}\dfrac{s}{\sqrt n}$`, 'TI-84: STAT → TESTS → 8:TInterval with Inpt: Data.'],
    steps: ($) => [
      String.raw`$\bar x = ${fx($.xbar, 3)}$, $s = ${fx($.s, 3)}$ (TI-84 1-Var Stats: x̄ and Sx)`,
      $.look.line,
      String.raw`$$E = ${fx($.look.value, 3)}\cdot\dfrac{${fx($.s, 3)}}{\sqrt{${$.n}}} = ${tn(($.look.value * $.s) / Math.sqrt($.n), 5)}$$`,
      String.raw`$$(${fx($.xbar, 3)} \pm ${tn(($.look.value * $.s) / Math.sqrt($.n), 5)}) = (${fx($.xbar - ($.look.value * $.s) / Math.sqrt($.n), 2)},\ ${fx($.xbar + ($.look.value * $.s) / Math.sqrt($.n), 2)})$$`,
      `We are ${confLabel($.conf)} confident the mean length of the songs on her phone is between these bounds.`,
    ],
    cases: [kase('Notes Ex 8.9', { n: 9, conf: 0.99, shift: 0, xs: [201, 257, 284, 208, 179, 222, 217, 206, 240] }, { xbar: 223.78, s: 31.88, lo: 188.12, hi: 259.44 })],
  }),

  problem({
    ...C8, id: 'c8.t-test', title: 'One-sample t-test', kind: 'numeric', level: 2, topics: ['t-test', 'hypothesis-test'], src: 'Notes Ex 8.10',
    vars: { ctx: MEAN, n: range(8, 60, 1), side: SIDE, alpha: ALPHA, shift: range(-0.8, 0.8, 0.01), sfac: range(0.7, 1.3, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const xbar = Number((c.mu0 + $.shift * c.sigma).toFixed(c.dp + 1));
      const s = Number(($.sfac * c.sigma).toFixed(c.dp + 2));
      const r = tTest({ xbar, s, n: $.n, mu0: c.mu0, side: $.side });
      return { c, xbar, s, ...r, dec: decide(r.p, $.alpha) };
    },
    valid: clear,
    text: (T, $) => `The mean ${$.c.what} is supposed to be ${$.c.mu0}${u($.c)}. A random sample of ${$.n} has mean ${$.xbar} and standard deviation ${$.s}${u($.c)}. Assume the population is normal. At α = ${$.alpha}, is there evidence that the mean is ${REL[$.side]} ${$.c.mu0}${u($.c)}?`,
    parts: [h1Part(), statPart('t', ($) => $.t, '$t_0$'), pPart(($) => $.p, { traps: [[($) => zSideP($.side, $.t), T_NOT_Z]] }), decisionPart(), conclusionPart()],
    hints: [String.raw`σ is unknown: $t_0 = \dfrac{\bar x - \mu_0}{s/\sqrt n}$ with $\nu = n - 1$.`, 'The p-value comes from the t distribution (TI-84: tcdf, or STAT → TESTS → 2:T-Test).'],
    steps: ($) => {
      const [h0, h1] = hyp(String.raw`\mu`, $.c.mu0, $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$`,
        String.raw`$$t_0 = \dfrac{${$.xbar} - ${$.c.mu0}}{${$.s}/\sqrt{${$.n}}} = ${fx($.t, 4)}, \qquad \nu = ${$.df}$$`,
        String.raw`p-value $= ${pTex($.side, 'T', $.t, $.df)} = ${fx($.p, 4)}$`,
        ...conclude($, `the mean ${$.c.what} is ${REL[$.side]} ${$.c.mu0}${u($.c)}`),
      ];
    },
    twin: { part: 'p', n: 30000, draw: (r, $) => { const tt = r.t($.df); return $.side === 'right' ? tt >= $.t : $.side === 'left' ? tt <= $.t : Math.abs(tt) >= Math.abs($.t); } },
    cases: [kase('Notes Ex 8.10', { ctx: 'height', n: 43, side: 'right', alpha: 0.05, shift: 1.28 / 2.8, sfac: 2.77 / 2.8 }, { t: 3.03, p: 0.0021, dec: 'reject' })],
  }),

  problem({
    ...C8, id: 'c8.t-test-data', title: 'One-sample t-test from data', kind: 'numeric', level: 3, topics: ['t-test', 'hypothesis-test'], src: 'Notes Ex 8.11',
    vars: { n: range(6, 14, 1), side: SIDE, alpha: ALPHA, shift: range(-1.2, 1.2, 0.05), xs: data((rand, v) => sampleOf(rand, ctxOf('song'), v.n, v.shift)) },
    derive: ($) => {
      const xbar = mean($.xs);
      const s = sd($.xs);
      const r = tTest({ xbar, s, n: $.n, mu0: 240, side: $.side });
      return { xbar, s, ...r, dec: decide(r.p, $.alpha) };
    },
    valid: clear,
    text: (T, $) => `Marissa believes the average length of the songs on her phone is 240 seconds. A random sample of ${$.n} songs has lengths ${$.xs.join(', ')} seconds. Song lengths are normal. At α = ${$.alpha}, test whether the mean length is ${REL[$.side]} 240 seconds.`,
    parts: [h1Part(), statPart('t', ($) => $.t, '$t_0$'), pPart(($) => $.p), decisionPart(), conclusionPart()],
    hints: ['Find x̄ and s first.', String.raw`$t_0 = \dfrac{\bar x - 240}{s/\sqrt n}$, $\nu = n - 1$.`, 'TI-84: data in L1, STAT → TESTS → 2:T-Test with Inpt: Data.'],
    steps: ($) => {
      const [h0, h1] = hyp(String.raw`\mu`, 240, $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$`,
        String.raw`$\bar x = ${fx($.xbar, 3)}$, $s = ${fx($.s, 3)}$`,
        String.raw`$$t_0 = \dfrac{${fx($.xbar, 3)} - 240}{${fx($.s, 3)}/\sqrt{${$.n}}} = ${fx($.t, 4)}, \qquad \nu = ${$.df}$$`,
        String.raw`p-value $= ${pTex($.side, 'T', $.t, $.df)} = ${fx($.p, 4)}$`,
        ...conclude($, `the mean song length is ${REL[$.side]} 240 seconds`),
      ];
    },
    cases: [kase('Notes Ex 8.11', { n: 9, side: 'two', alpha: 0.01, shift: 0, xs: [201, 257, 284, 208, 179, 222, 217, 206, 240] }, { t: -1.53, p: 0.1654, dec: 'fail' })],
  }),

  // ----------------------------------------------------------------- one proportion
  problem({
    ...C8, id: 'c8.prop-test', title: 'One-proportion z-test', kind: 'numeric', level: 2, topics: ['proportion', 'z-test', 'hypothesis-test'], src: 'Notes Ex 8.14–8.15',
    vars: { ctx: choice(['grads', 'grads'], ['defects', 'defects'], ['voters', 'voters']), n: range(100, 1000, 10), p0: range(0.1, 0.9, 0.05), side: SIDE, alpha: ALPHA, shift: range(-2.5, 2.5, 0.05) },
    derive: ($) => {
      const x = Math.round($.n * ($.p0 + $.shift * Math.sqrt(($.p0 * (1 - $.p0)) / $.n)));
      const r = propTest({ x, n: $.n, p0: $.p0, side: $.side });
      return { x, ...r, dec: decide(r.p, $.alpha) };
    },
    valid: ($) => clear($) && $.x > 0 && $.x < $.n,
    sampleValid: ($) => $.check >= 10,
    text: (T, $) =>
      ({
        grads: `Someone claims ${Math.round($.p0 * 100)}% of the adults in a city are college graduates. In a random sample of ${$.n} adults, ${$.x} are college graduates.`,
        defects: `A manufacturer's defective rate is supposed to be ${$.p0}. In a random sample of ${$.n} devices, ${$.x} are defective.`,
        voters: `Last year ${Math.round($.p0 * 100)}% of voters supported a measure. In a new random sample of ${$.n} voters, ${$.x} support it.`,
      })[$.ctx] + ` At α = ${$.alpha}, is there evidence that the population proportion is ${REL[$.side]} ${$.p0}?`,
    parts: [h1Part(), num('phat', ($) => $.phat, { label: String.raw`$\hat p$`, tol: 0, abs: 0.0006 }), statPart('z', ($) => $.z, '$z_0$', { traps: [[($) => ($.phat - $.p0) / Math.sqrt(($.phat * (1 - $.phat)) / $.n), String.raw`The test uses $p_0$ in the standard error: $\sqrt{p_0(1-p_0)/n}$, not $\hat p$.`]] }), pPart(($) => $.p, { alt: ($) => [zTableP($.side, $.z)] }), decisionPart(), conclusionPart()],
    hints: [String.raw`Check $np_0(1-p_0) \ge 10$.`, String.raw`$z_0 = \dfrac{\hat p - p_0}{\sqrt{p_0(1-p_0)/n}}$`, 'TI-84: STAT → TESTS → 5:1-PropZTest.'],
    steps: ($) => {
      const [h0, h1] = hyp('p', $.p0, $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$; $np_0(1-p_0) = ${tn($.check, 5)} \ge 10$.`,
        String.raw`$\hat p = \dfrac{${$.x}}{${$.n}} = ${fx($.phat, 4)}$`,
        String.raw`$$z_0 = \dfrac{${fx($.phat, 4)} - ${$.p0}}{\sqrt{${$.p0}(${fx(1 - $.p0, 2)})/${$.n}}} = ${fx($.z, 4)}$$`,
        String.raw`p-value $= ${pTex($.side, 'Z', $.z)} = ${fx($.p, 4)}$`,
        ...conclude($, `the population proportion is ${REL[$.side]} ${$.p0}`),
      ];
    },
    cases: [
      kase('Notes Ex 8.15', { ctx: 'grads', n: 100, p0: 0.4, side: 'two', alpha: 0.1, shift: 0.03 / Math.sqrt(0.0024) }, { phat: 0.43, z: 0.61, p: 0.5403, dec: 'fail' }),
      kase('Notes Ex 8.14', { ctx: 'defects', n: 200, p0: 0.05, side: 'left', alpha: 0.05, shift: -0.03 / Math.sqrt(0.05 * 0.95 / 200) }, { phat: 0.02, z: -1.95, p: 0.0258, dec: 'reject' }, { note: 'Here np₀(1 − p₀) = 200(0.05)(0.95) = 9.5, just under the notes’ own condition of 10. The notes carry out the test anyway; strictly, the normal approximation is not justified.' }),
    ],
  }),

  problem({
    ...C8, id: 'c8.prop-interval', title: 'One-proportion z-interval', kind: 'numeric', level: 2, topics: ['proportion', 'confidence-interval'], src: 'Notes Ex 8.16',
    vars: { n: range(100, 1500, 10), f: range(0.1, 0.9, 0.01), conf: CONF },
    derive: ($) => {
      const x = Math.round($.n * $.f);
      const r = propInterval({ x, n: $.n, conf: $.conf });
      const zs = zCrits(r.alpha);
      return { x, ...r, los: zs.map((z) => r.phat - z * r.se), his: zs.map((z) => r.phat + z * r.se), zt: zCritLook(r.alpha / 2) };
    },
    valid: ($) => $.check >= 10,
    text: (T, $) => `In a random sample of ${$.n} adults in a city, ${$.x} are college graduates. Find a ${confLabel($.conf)} confidence interval for the proportion of college graduates in the city.`,
    parts: [endpoint('lo', ($) => $.lo, { alt: ($) => $.los, margin: ($) => $.E }), endpoint('hi', ($) => $.hi, { alt: ($) => $.his, margin: ($) => $.E })],
    hints: [String.raw`$\hat p \pm z_{\alpha/2}\sqrt{\dfrac{\hat p(1-\hat p)}{n}}$`, String.raw`The interval uses $\hat p$ in the standard error (the test used $p_0$). Check $n\hat p(1 - \hat p) \ge 10$.`, 'TI-84: STAT → TESTS → A:1-PropZInt.'],
    steps: ($) => [
      String.raw`$\hat p = ${$.x}/${$.n} = ${fx($.phat, 4)}$; $n\hat p(1-\hat p) = ${tn($.check, 5)} \ge 10$.`,
      $.zt.line,
      String.raw`$$E = ${$.zt.value}\sqrt{\dfrac{${fx($.phat, 4)}(${fx(1 - $.phat, 4)})}{${$.n}}} = ${fx($.zt.value * $.se, 4)}$$`,
      String.raw`$$(${fx($.phat - $.zt.value * $.se, 4)},\ ${fx($.phat + $.zt.value * $.se, 4)})$$`,
    ],
    cases: [kase('Notes Ex 8.16', { n: 100, f: 0.43, conf: 0.9 }, { lo: 0.3486, hi: 0.5114 }, { note: 'The notes state the condition as np̂(1 − p̂) ≤ 10; it should read ≥ 10 (a large enough sample).' })],
  }),
  problem({
    ...C8, id: 'c8.ci-meaning', title: 'What a confidence interval means', kind: 'conceptual', topics: ['confidence-interval', 'interpretation'], src: 'Notes §8.1',
    vars: { ctx: choice(['song', 'mean'], ['grads', 'proportion'], ['sodium', 'mean']), conf: choice([0.9, '90%'], [0.95, '95%']), c: range(-1, 1, 0.1), w: range(0.4, 1.2, 0.05) },
    derive: ($) => {
      const C = Math.round($.conf * 100);
      if ($.ctx === 'grads') {
        const mid = Number((0.42 + 0.05 * $.c).toFixed(3));
        const E = Number((0.04 + 0.04 * $.w).toFixed(3));
        return { C, what: 'the proportion of the city’s adults who are college graduates', par: 'p', L: Number((mid - E).toFixed(3)), H: Number((mid + E).toFixed(3)) };
      }
      const c = ctxOf($.ctx);
      const mid = c.mu0 + $.c * c.sigma * 0.5;
      const E = $.w * c.sigma * 0.4;
      return { C, what: `the mean ${c.what}`, par: 'μ', L: Number((mid - E).toFixed(c.dp + 1)), H: Number((mid + E).toFixed(c.dp + 1)) };
    },
    text: (T, $) => `From one random sample, a ${$.C}% confidence interval for ${$.what} is (${$.L}, ${$.H}).`,
    parts: [
      mc(
        'm',
        ($) => [
          ['method', `If we took many random samples and built an interval from each in the same way, about ${$.C}% of those intervals would contain the true ${$.par}.`],
          ['prob', `There is a ${$.C}% probability that the true ${$.par} is between ${$.L} and ${$.H}.`, `The true ${$.par} is a fixed number: this particular interval either contains it or not. The ${$.C}% describes the method, over many samples.`],
          ['data', `${$.C}% of the individual values in the population lie between ${$.L} and ${$.H}.`, 'The interval estimates a parameter (a mean or a proportion), not where individual values fall.'],
          ['sample', `${$.C}% of samples would give a statistic between ${$.L} and ${$.H}.`, 'Other samples give other intervals, centered on their own statistics; the confidence level is about how often those intervals capture the parameter.'],
        ],
        'method',
        { label: ($T, $) => `What does “${$.C}% confident” mean here?` },
      ),
      mc('wider', [['wider', 'wider'], ['same', 'the same width', 'More confidence needs a larger critical value, so a wider interval.'], ['narrower', 'narrower', 'To catch the parameter more often, the interval must reach further, not less far.']], 'wider', { label: 'A 99% interval from the same data would be…' }),
    ],
    hints: ['The confidence level is a property of the method: how often it succeeds over many samples.', 'Higher confidence: larger z or t, larger margin of error.'],
    steps: ($) => [
      `The ${$.C}% is the long-run success rate of the method: build intervals this way from many samples, and about ${$.C}% of them contain the true ${$.par}. This one either does or does not; we are "${$.C}% confident" that it does.`,
      `For 99% the critical value grows (z from ${$.C === 90 ? '1.645' : '1.96'} to 2.576), so the same data give a wider interval.`,
    ],
    cases: [kase('Notes Ex 8.16', { ctx: 'grads', conf: 0.9, c: 0.2, w: 1.0355 }, { m: 'method', wider: 'wider' }, { note: 'The 90% interval for the proportion of college graduates, (0.3486, 0.5114), rounded.' })],
  }),
];
