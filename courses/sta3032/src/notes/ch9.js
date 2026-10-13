/**
 * Chapter 9, rewritten from the teacher's notes (Ch 9, pp. 129–170), laid out like FLUX's notes. The
 * notes pose these examples and work them on the TI-84 in class; every answer here is computed.
 * Example numbers are the notes'; the textbook's material (Walpole §10.7, comparing samples by their
 * box plots) is marked, and its example is lettered (9.A).
 */
import { fCrit } from '../stats/dist.js';
import { boxPlot } from '../stats/describe.js';
import {
  twoPropTest,
  twoPropInterval,
  twoZTest,
  twoZInterval,
  fTest,
  fInterval,
  pooledTest,
  pooledInterval,
  welchTest,
  welchInterval,
  pairedTest,
  pairedInterval,
  mean,
  sd,
} from '../stats/infer.js';

const METRO = [3, 7, 25, 10, 15, 6, 12, 25, 15, 7];
const RURAL = [78, 44, 40, 38, 33, 12, 1, 18];
const M1 = [1.186, 0.992, 1.322, 1.339, 1.065, 1.402, 1.365, 1.537, 1.559];
const M2 = [1.061, 1.151, 1.063, 1.062, 1.2, 1.178, 1.037, 1.086, 1.052];
const DOM = [0.177, 0.21, 0.186, 0.189, 0.198, 0.194, 0.16, 0.163, 0.166, 0.152, 0.19, 0.172];
const NON = [0.179, 0.202, 0.208, 0.184, 0.215, 0.193, 0.194, 0.16, 0.209, 0.164, 0.21, 0.197];

const r2 = (x) => Math.round(x * 100) / 100;
const PAIN = { n1: 13, n2: 10, x1: 16.2, x2: 14.9, v1: 12.7, v2: 26.4 };

export default {
  ch: '9',
  title: 'Two-sample inference',
  lede: String.raw`Most real questions compare: a new method against the old, one group against another. This chapter extends Chapter 8’s intervals and tests to the difference between two proportions or two means, and to the ratio of two variances, and separates independent samples from paired ones, which need a different analysis.`,
  sections: [
    {
      id: '9.1',
      part: 'Two kinds of comparison',
      title: 'Independent versus dependent samples',
      lab: 'paired',
      problems: ['c9.independent-or-paired'],
      blocks: [
        ['p', 'Chapter 8 compared one sample with a number someone claimed. Most real questions compare two groups with each other: a new drug and the old one, metropolitan and rural water, two machines. The procedures are Chapter 8’s, applied to a difference (or, for variances, a ratio). The first decision is how the two samples were collected.'],
        ['def', 'Independent samples:', 'choosing an individual for one sample says nothing about who is in the other. Drug A patients vs Drug B patients; customers in City A vs City B.'],
        ['def', 'Dependent (matched-pairs) samples:', 'each individual in one sample determines one in the other, and an individual can be matched with itself. The same patients before and after treatment; pre-test and post-test; identical twins; husbands and wives.'],
        ['key', 'Ask: does each value in sample 1 have a partner in sample 2? If yes, the samples are paired, and you analyze the differences (§9.6).'],
        ['bridge', 'Parts II and III handle independent samples, parameter by parameter: proportions, then means and variances. Part IV returns to pairs.'],
      ],
    },
    {
      id: '9.2',
      part: 'Two proportions',
      title: 'Comparing two proportions',
      lab: 'tests',
      problems: ['c9.two-prop-test', 'c9.two-prop-interval'],
      blocks: [
        ['p', 'Assumptions: independent samples, each large enough: $n_1\\hat{p}_1(1-\\hat{p}_1) \\ge 10$ and $n_2\\hat{p}_2(1-\\hat{p}_2) \\ge 10$.'],
        ['key', String.raw`**Two-proportion z-test**: $z_0 = \dfrac{\hat{p}_1 - \hat{p}_2}{\sqrt{\hat{p}(1 - \hat{p})\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}}$, with the pooled $\hat{p} = \dfrac{x_1 + x_2}{n_1 + n_2}$.`],
        ['why', 'The test assumes $H_0: p_1 = p_2$, so it estimates that one common $p$ from both samples together. The interval below does not assume that, so it uses each $\\hat{p}$ separately.'],
        [
          'ex',
          {
            n: '9.1',
            q: 'Of 300 lenses polished with solution 1, 253 had no defects; of 300 with solution 2, 246. Is there evidence the two solutions differ? Use $\\alpha = 0.05$.',
            a: [
              '$H_0: p_1 = p_2$, $H_1: p_1 \\ne p_2$.',
              String.raw`$\hat{p}_1 = 253/300 = 0.8433$, $\hat{p}_2 = 246/300 = 0.82$, pooled $\hat{p} = 499/600 = 0.8317$.`,
              String.raw`$z_0 = \dfrac{0.8433 - 0.82}{\sqrt{0.8317(0.1683)(2/300)}} = 0.76$; p-value $= 0.4450$.`,
              '$0.4450 \\ge 0.05$: fail to reject $H_0$.',
            ],
            answer: 'There is not sufficient evidence that the two solutions differ.',
            problem: 'c9.two-prop-test',
            case: 0,
            checks: () => {
              const T = twoPropTest({ x1: 253, n1: 300, x2: 246, n2: 300, side: 'two' });
              return [
                ['pool', T.pool, 0.8317, 5e-5],
                ['z', r2(T.z), 0.76, 0],
                ['p', T.p, 0.445, 5e-4],
              ];
            },
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ 6:2-PropZTest: $x_1$, $n_1$, $x_2$, $n_2$, the alternative; Calculate or Draw.']],
        [
          'ex',
          {
            n: '9.2',
            q: 'Of 2103 patients given Nasonex, 547 reported headaches; of 1671 given a placebo, 368 did. Is the proportion with headaches greater for Nasonex? Use $\\alpha = 0.05$.',
            a: [
              '$H_0: p_1 = p_2$, $H_1: p_1 > p_2$ (1 = Nasonex).',
              String.raw`$\hat{p}_1 = 0.2601$, $\hat{p}_2 = 0.2202$, pooled $\hat{p} = 915/3774 = 0.2424$.`,
              '$z_0 = 2.84$, p-value $= 0.0023 < 0.05$: reject $H_0$.',
            ],
            answer: 'There is sufficient evidence that a larger proportion of Nasonex users get headaches.',
            problem: 'c9.two-prop-test',
            case: 1,
            checks: () => {
              const T = twoPropTest({ x1: 547, n1: 2103, x2: 368, n2: 1671, side: 'right' });
              return [
                ['z', r2(T.z), 2.84, 0],
                ['p', T.p, 0.0023, 5e-5],
              ];
            },
          },
        ],
        ['key', String.raw`**Two-proportion z-interval**: $(\hat{p}_1 - \hat{p}_2) \pm z_{\alpha/2}\sqrt{\dfrac{\hat{p}_1(1-\hat{p}_1)}{n_1} + \dfrac{\hat{p}_2(1-\hat{p}_2)}{n_2}}$.`],
        [
          'ex',
          {
            n: '9.3',
            q: 'Use a confidence interval to check the conclusion of Example 9.1.',
            a: [String.raw`95%: $0.0233 \pm 1.96\sqrt{\dfrac{0.8433(0.1567)}{300} + \dfrac{0.82(0.18)}{300}} = 0.0233 \pm 0.0599$, which is $(-0.0365,\ 0.0832)$.`, 'It contains 0.'],
            answer: 'No evidence of a difference, as the test found.',
            problem: 'c9.two-prop-interval',
            case: 0,
            checks: () => {
              const I = twoPropInterval({ x1: 253, n1: 300, x2: 246, n2: 300, conf: 0.95 });
              return [
                ['lo', I.lo, -0.0365, 5e-5],
                ['hi', I.hi, 0.0832, 5e-5],
              ];
            },
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ B:2-PropZInt: $x_1$, $n_1$, $x_2$, $n_2$, C-Level; Calculate.']],
      ],
    },
    {
      id: '9.3',
      part: 'Two means, two variances',
      title: 'Comparing two means, variances known',
      lab: 'tests',
      problems: ['c9.two-z-test', 'c9.two-z-interval'],
      blocks: [
        ['p', 'Assumptions: independent samples; both populations normal, or $n_1 \\ge 30$ and $n_2 \\ge 30$. Hypotheses compare $\\mu_1 - \\mu_2$ with an assumed difference $\\Delta_0$, usually 0.'],
        ['key', String.raw`**Two-sample z-test**: $z_0 = \dfrac{(\bar{x}_1 - \bar{x}_2) - \Delta_0}{\sqrt{\sigma_1^2/n_1 + \sigma_2^2/n_2}}$. **Interval**: $(\bar{x}_1 - \bar{x}_2) \pm z_{\alpha/2}\sqrt{\sigma_1^2/n_1 + \sigma_2^2/n_2}$.`],
        ['why', String.raw`The samples are independent, so the variance of $\bar{X}_1 - \bar{X}_2$ is the SUM $\sigma_1^2/n_1 + \sigma_2^2/n_2$ (§4.3, and Ex 7.A): the uncertainty of both means adds, even though the means subtract. $\Delta_0$ is the difference claimed by $H_0$, usually 0.`],
        [
          'ex',
          {
            n: '9.4',
            q: 'Two fuel formulations: $\\sigma_1^2 = 1.5$, $\\sigma_2^2 = 1.2$; samples of $n_1 = 15$ and $n_2 = 20$ give mean octane numbers $\\bar{x}_1 = 88.85$, $\\bar{x}_2 = 89.54$. Both populations are normal. Do the mean octane numbers differ? Use $\\alpha = 0.05$.',
            a: [
              '$H_0: \\mu_1 - \\mu_2 = 0$, $H_1: \\mu_1 - \\mu_2 \\ne 0$.',
              String.raw`$z_0 = \dfrac{88.85 - 89.54}{\sqrt{1.5/15 + 1.2/20}} = \dfrac{-0.69}{0.4} = -1.73$ (exactly $-1.725$).`,
              'p-value $= 2P(Z < -1.725) = 0.0845 \\ge 0.05$: fail to reject $H_0$.',
            ],
            answer: 'There is not sufficient evidence that the mean octane numbers differ.',
            problem: 'c9.two-z-test',
            case: 0,
            checks: () => {
              const T = twoZTest({ x1: 88.85, x2: 89.54, v1: 1.5, v2: 1.2, n1: 15, n2: 20, side: 'two' });
              return [
                ['se', T.se, 0.4, 1e-9],
                ['z', T.z, -1.725, 1e-9],
                ['p', T.p, 0.0845, 5e-5],
              ];
            },
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ 3:2-SampZTest: $\\sigma_1$, $\\sigma_2$ (standard deviations, not variances: enter $\\sqrt{1.5}$), $\\bar{x}_1$, $n_1$, $\\bar{x}_2$, $n_2$, the alternative.']],
        [
          'ex',
          {
            n: '9.5',
            q: 'Burning rates of two propellants: $\\sigma_1 = \\sigma_2 = 3$ cm/s; samples of 35 each give $\\bar{x}_1 = 24.37$, $\\bar{x}_2 = 18.02$. Propellant 1 is chosen only if its mean exceeds propellant 2’s by MORE than 4 cm/s. Should it be chosen? Use $\\alpha = 0.05$.',
            a: [
              '$H_0: \\mu_1 - \\mu_2 = 4$, $H_1: \\mu_1 - \\mu_2 > 4$. Here $\\Delta_0 = 4$.',
              String.raw`$z_0 = \dfrac{(24.37 - 18.02) - 4}{\sqrt{9/35 + 9/35}} = \dfrac{2.35}{0.7171} = 3.28$.`,
              'p-value $= P(Z > 3.28) = 0.0005 < 0.05$: reject $H_0$.',
            ],
            answer: 'Yes: there is sufficient evidence its mean burning rate exceeds propellant 2’s by more than 4 cm/s.',
            problem: 'c9.two-z-test',
            case: 1,
            checks: () => {
              const T = twoZTest({ x1: 24.37, x2: 18.02, v1: 9, v2: 9, n1: 35, n2: 35, d0: 4, side: 'right' });
              return [
                ['z', r2(T.z), 3.28, 0],
                ['p', T.p, 0.0005, 5e-5],
              ];
            },
          },
        ],
        [
          'ex',
          {
            n: '9.6',
            q: 'Use a confidence interval to check Example 9.4.',
            a: [String.raw`95%: $-0.69 \pm 1.96(0.4) = -0.69 \pm 0.784$, which is $(-1.474,\ 0.094)$.`, 'It contains 0.'],
            answer: 'Fail to reject $H_0$, as the test found.',
            problem: 'c9.two-z-interval',
            case: 0,
            checks: () => {
              const I = twoZInterval({ x1: 88.85, x2: 89.54, v1: 1.5, v2: 1.2, n1: 15, n2: 20, conf: 0.95 });
              return [
                ['lo', I.lo, -1.474, 5e-4],
                ['hi', I.hi, 0.094, 5e-4],
              ];
            },
          },
        ],
      ],
    },
    {
      id: '9.4',
      title: 'Comparing two variances: the F distribution',
      lab: 'dist',
      problems: ['c9.f-critical', 'c9.f-interval', 'c9.f-test'],
      blocks: [
        ['p', String.raw`Chapter 8 tested one variance with $\chi^2$ (§8.6). Two variances are compared through their ratio $s_1^2/s_2^2$: near 1 if the population variances are equal. From normal populations, $\dfrac{S_1^2/\sigma_1^2}{S_2^2/\sigma_2^2}$ has the $F$ distribution, and under $H_0: \sigma_1^2 = \sigma_2^2$ the $\sigma$’s cancel, leaving $f_0 = s_1^2/s_2^2$.`],
        [
          'list',
          [
            'The $F$ distribution is continuous and positive, skewed right.',
            'It has two degrees of freedom: $u$ (numerator) and $v$ (denominator), written $F_{u,v}$.',
            String.raw`Table A.6 gives only upper points $f_{\alpha}(u, v)$. Lower points come from the reciprocal rule: $f_{1-\alpha}(u, v) = \dfrac{1}{f_\alpha(v, u)}$ (swap the degrees of freedom).`,
          ],
        ],
        [
          'ex',
          {
            n: '9.7',
            q: String.raw`(a) Find $f_{0.05,3,10}$. (b) Find $f_{0.95,3,10}$.`,
            a: ['(a) Table A.6, $\\alpha = 0.05$, column 3, row 10: 3.71.', String.raw`(b) $f_{0.95,3,10} = \dfrac{1}{f_{0.05,10,3}} = \dfrac{1}{8.79} = 0.1138$.`],
            answer: '(a) 3.71 (b) 0.1138.',
            problem: 'c9.f-critical',
            case: 0,
            show: 'dist:f',
            checks: () => [
              ['(a)', fCrit(0.05, 3, 10), 3.71, 5e-3],
              ['(b)', 1 / fCrit(0.05, 10, 3), 0.1138, 5e-4],
            ],
          },
        ],
        ['why', String.raw`If $F$ has $(u, v)$ df, then $1/F$ is the same ratio upside down, with $(v, u)$ df. So $P(F < c) = P(1/F > 1/c)$: a lower-tail point of $F_{u,v}$ is one over an upper-tail point of $F_{v,u}$.`],
        ['key', String.raw`**F-interval** for $\sigma_1^2/\sigma_2^2$ (normal populations, independent samples): lower bound $\dfrac{s_1^2/s_2^2}{f_{\alpha/2}(n_1-1,\,n_2-1)}$, upper bound $\dfrac{s_1^2}{s_2^2}\,f_{\alpha/2}(n_2-1,\,n_1-1)$.`],
        ['p', 'Table A.6 prints only $\\alpha = 0.05$ and $0.01$, so table intervals are 90% or 98%.'],
        [
          'ex',
          {
            n: '9.8',
            q: 'Pain thresholds to electric shock: males $n_1 = 13$, $s_1^2 = 12.7$; females $n_2 = 10$, $s_2^2 = 26.4$ (both normal, independent). Find a 90% confidence interval for $\\sigma_1^2/\\sigma_2^2$.',
            a: [
              String.raw`$s_1^2/s_2^2 = 12.7/26.4 = 0.4811$; $\alpha/2 = 0.05$.`,
              String.raw`$f_{0.05}(12, 9) = 3.07$ and $f_{0.05}(9, 12) = 2.80$.`,
              String.raw`$\left(\dfrac{0.4811}{3.07},\ 0.4811 \times 2.80\right) = (0.1567,\ 1.347)$.`,
            ],
            answer: 'The interval contains 1, so equal variances are plausible.',
            problem: 'c9.f-interval',
            case: 0,
            checks: () => {
              const I = fInterval({ s1sq: 12.7, s2sq: 26.4, n1: 13, n2: 10, conf: 0.9 });
              return [
                ['ratio', I.ratio, 0.4811, 5e-5],
                ['f(12,9)', I.fa, 3.07, 5e-3],
                ['f(9,12)', I.fb, 2.8, 5e-3],
                ['lo', I.lo, 0.1567, 5e-4],
                ['hi', I.hi, 1.347, 5e-3],
              ];
            },
          },
        ],
        ['key', String.raw`**F-test**: $H_0: \sigma_1^2 = \sigma_2^2$; $f_0 = s_1^2/s_2^2$ on $(n_1 - 1, n_2 - 1)$ df. p-value: $P(F > f_0)$ for $H_1: \sigma_1^2 > \sigma_2^2$; $P(F < f_0)$ for $<$; twice the smaller tail for $\ne$.`],
        [
          'ex',
          {
            n: '9.9',
            q: 'For the pain-threshold data of Example 9.8, is there a difference in the variability for men and women? Use $\\alpha = 0.1$.',
            a: ['$H_0: \\sigma_1^2 = \\sigma_2^2$, $H_1: \\sigma_1^2 \\ne \\sigma_2^2$.', '$f_0 = 0.4811$ on (12, 9) df; p-value $= 2P(F < 0.4811) = 0.2368$.', '$0.2368 \\ge 0.1$: fail to reject $H_0$.'],
            answer: 'There is not sufficient evidence the variances differ (consistent with the interval of Example 9.8 containing 1).',
            problem: 'c9.f-test',
            case: 1,
            checks: () => [['p', fTest({ s1sq: 12.7, s2sq: 26.4, n1: 13, n2: 10, side: 'two' }).p, 0.2368, 5e-4]],
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ E:2-SampFTest. Inpt: Stats asks for $Sx_1$ and $Sx_2$, the standard deviations: enter $\\sqrt{12.7}$ and $\\sqrt{26.4}$.']],
        [
          'ex',
          {
            n: '9.10',
            q: 'Arsenic concentrations in 10 metropolitan Phoenix communities and 8 rural Arizona communities (below; both normal, independent). Do the two have equal variances? Use $\\alpha = 0.05$.',
            data: { head: ['Metro', 'Rural'], rows: METRO.map((x, i) => [x, RURAL[i] ?? '']) },
            a: [
              '$\\bar{x}_1 = 12.5$, $s_1 = 7.63$; $\\bar{x}_2 = 31.75$, $s_2 = 23.63$.',
              String.raw`$f_0 = (7.63/23.63)^2 = 0.1043$ on (9, 7) df; p-value $= 2P(F < 0.1043) = 0.0030$.`,
              '$0.0030 < 0.05$: reject $H_0$.',
            ],
            answer: 'The variances differ, so compare the means with the unequal-variance t test (Example 9.13).',
            problem: 'c9.f-test',
            case: 0,
            checks: () => [
              ['s1', sd(METRO), 7.63, 5e-3],
              ['s2', sd(RURAL), 23.63, 5e-3],
              ['f', (sd(METRO) / sd(RURAL)) ** 2, 0.1043, 5e-4],
              ['p', fTest({ s1sq: sd(METRO) ** 2, s2sq: sd(RURAL) ** 2, n1: 10, n2: 8, side: 'two' }).p, 0.003, 5e-4],
            ],
          },
        ],
      ],
    },
    {
      id: '9.5',
      title: 'Comparing two means, variances unknown',
      lab: 'tests',
      problems: ['c9.pooled-t-test', 'c9.pooled-t-interval', 'c9.welch-t-test', 'c9.welch-t-interval', 'c9.which-test'],
      blocks: [
        ['p', 'With $\\sigma_1$, $\\sigma_2$ unknown there are two cases. Which one? Run the F-test of §9.4 (or check the F-interval for 1): if the variances could be equal, pool; if they differ, do not.'],
        ['p', String.raw`With $\sigma_1$ and $\sigma_2$ unknown, replace them with $s_1$ and $s_2$ and use $t$, as in Chapter 8. There are two versions, and the F test of §9.4 (or the problem statement) chooses between them.`],
        ['key', String.raw`**Pooled** ($\sigma_1^2 = \sigma_2^2$): $t_0 = \dfrac{(\bar{x}_1 - \bar{x}_2) - \Delta_0}{\sqrt{s_p^2\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}}$, $s_p^2 = \dfrac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}$, df $= n_1 + n_2 - 2$. Interval: $(\bar{x}_1 - \bar{x}_2) \pm t_{\alpha/2}\sqrt{s_p^2\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}$.`],
        [
          'ex',
          {
            n: '9.11',
            q: 'For the pain thresholds (males $n = 13$, $\\bar{x} = 16.2$, $s^2 = 12.7$; females $n = 10$, $\\bar{x} = 14.9$, $s^2 = 26.4$), do the mean thresholds differ? Use $\\alpha = 0.05$; the F-test (Ex 9.9) allows equal variances.',
            a: [
              '$H_0: \\mu_1 - \\mu_2 = 0$, $H_1: \\mu_1 - \\mu_2 \\ne 0$.',
              String.raw`$s_p^2 = \dfrac{12(12.7) + 9(26.4)}{21} = 18.57$.`,
              String.raw`$t_0 = \dfrac{16.2 - 14.9}{\sqrt{18.57(1/13 + 1/10)}} = \dfrac{1.3}{1.813} = 0.72$, df $= 21$; p-value $= 0.4812$.`,
              '$0.4812 \\ge 0.05$: fail to reject $H_0$.',
            ],
            answer: 'There is not sufficient evidence the mean pain thresholds differ.',
            problem: 'c9.pooled-t-test',
            case: 0,
            checks: () => {
              const T = pooledTest({ x1: PAIN.x1, x2: PAIN.x2, s1: Math.sqrt(PAIN.v1), s2: Math.sqrt(PAIN.v2), n1: 13, n2: 10, side: 'two' });
              return [
                ['sp²', T.sp2, 18.57, 5e-3],
                ['t', r2(T.t), 0.72, 0],
                ['p', T.p, 0.4812, 5e-4],
              ];
            },
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ 4:2-SampTTest (or 0:2-SampTInt for the interval). Inpt: Stats needs $Sx_1$, $Sx_2$ (standard deviations). Pooled: Yes.']],
        [
          'ex',
          {
            n: '9.12',
            q: 'Check Example 9.11 with a 95% confidence interval.',
            a: [String.raw`$t_{0.025,21} = 2.080$: $1.3 \pm 2.080(1.813) = 1.3 \pm 3.77$, which is $(-2.47,\ 5.07)$.`, 'It contains 0.'],
            answer: 'Fail to reject $H_0$, as the test found.',
            problem: 'c9.pooled-t-interval',
            case: 0,
            checks: () => {
              const I = pooledInterval({ x1: PAIN.x1, x2: PAIN.x2, s1: Math.sqrt(PAIN.v1), s2: Math.sqrt(PAIN.v2), n1: 13, n2: 10, conf: 0.95 });
              return [
                ['lo', I.lo, -2.47, 5e-3],
                ['hi', I.hi, 5.07, 5e-3],
              ];
            },
          },
        ],
        ['why', String.raw`If the two populations share one variance, both samples estimate it. $s_p^2$ combines them, weighting each $s^2$ by its degrees of freedom, so the larger sample counts for more; and its df are the two samples’ together, $n_1 + n_2 - 2$.`],
        ['key', String.raw`**Unpooled** ($\sigma_1^2 \ne \sigma_2^2$): $t_0 = \dfrac{(\bar{x}_1 - \bar{x}_2) - \Delta_0}{\sqrt{s_1^2/n_1 + s_2^2/n_2}}$ with $\text{df} = \dfrac{(s_1^2/n_1 + s_2^2/n_2)^2}{\frac{(s_1^2/n_1)^2}{n_1 - 1} + \frac{(s_2^2/n_2)^2}{n_2 - 1}}$. Interval: $(\bar{x}_1 - \bar{x}_2) \pm t_{\alpha/2}\sqrt{s_1^2/n_1 + s_2^2/n_2}$.`],
        ['p', 'The calculator uses the fractional df; with the table, round df DOWN (a smaller df is the cautious choice).'],
        [
          'ex',
          {
            n: '9.13',
            q: 'For the arsenic data of Example 9.10, is there a difference in mean concentration between metropolitan and rural communities? Use $\\alpha = 0.1$. (Example 9.10 found unequal variances.)',
            a: [
              '$H_0: \\mu_1 - \\mu_2 = 0$, $H_1: \\mu_1 - \\mu_2 \\ne 0$.',
              String.raw`$t_0 = \dfrac{12.5 - 31.75}{\sqrt{7.63^2/10 + 23.63^2/8}} = \dfrac{-19.25}{8.155} = -2.36$, df $= 8.17$.`,
              'p-value $= 0.0455 < 0.1$: reject $H_0$.',
            ],
            answer: 'There is sufficient evidence the mean arsenic concentrations differ (rural is higher).',
            problem: 'c9.welch-t-test',
            case: 0,
            checks: () => {
              const T = welchTest({ x1: mean(METRO), x2: mean(RURAL), s1: sd(METRO), s2: sd(RURAL), n1: 10, n2: 8, side: 'two' });
              return [
                ['df', T.df, 8.17, 5e-3],
                ['t', r2(T.t), -2.36, 0],
                ['p', T.p, 0.0455, 5e-4],
              ];
            },
          },
        ],
        [
          'ex',
          {
            n: '9.14',
            q: 'Check Example 9.13 with a 90% confidence interval.',
            a: [String.raw`$-19.25 \pm t_{0.05,\,8.17}(8.155)$: $(-36.63,\ -4.37)$.`, 'It does not contain 0.'],
            answer: 'Reject $H_0$, as the test found.',
            problem: 'c9.welch-t-interval',
            case: 0,
            checks: () => {
              const I = welchInterval({ x1: mean(METRO), x2: mean(RURAL), s1: sd(METRO), s2: sd(RURAL), n1: 10, n2: 8, conf: 0.9 });
              return [
                ['lo', I.lo, -36.63, 5e-3],
                ['hi', I.hi, -4.37, 5e-3],
              ];
            },
          },
        ],
        ['ti', ['Data in L1 and L2. STAT ▸ TESTS ▸ 4:2-SampTTest (or 0:2-SampTInt), Inpt: Data, Pooled: No.']],
        [
          'book',
          'Walpole §10.7',
          [
            ['p', 'Before any two-sample test, look at the two samples side by side. Box plots on one axis (§1.5) show at a glance whether the centers differ, whether the spreads are similar (pooled or not), and whether an outlier or strong skew makes a t procedure doubtful.'],
            [
              'ex',
              {
                n: '9.A',
                title: 'arsenic, side by side',
                q: 'Give the five-number summaries of the metropolitan and rural arsenic samples of Example 9.10. What do they say before any test is run?',
                data: {
                  head: ['', 'min', '$Q_1$', 'median', '$Q_3$', 'max', 'IQR'],
                  rows: [
                    ['Metro', 3, 7, 11, 15, 25, 8],
                    ['Rural', 1, 15, 35.5, 42, 78, 27],
                  ],
                },
                a: [
                  'Sort each sample and take TI-84 quartiles (the medians of the lower and upper halves).',
                  'Centers: the rural median, 35.5, is above every metropolitan value (the largest is 25), and more than three times the metropolitan median.',
                  String.raw`Spreads: the rural IQR is more than three times the metropolitan one (27 against 8). That is the unequal variance the F test of Example 9.10 detects.`,
                  String.raw`Outliers: none by the 1.5 × IQR rule (rural fences $-25.5$ and $82.5$), so the t procedure is reasonable.`,
                ],
                answer: 'The box plots already suggest what Examples 9.10 and 9.13 conclude: different spreads, and a higher rural center.',
                checks: () => {
                  const M = boxPlot(METRO);
                  const R = boxPlot(RURAL);
                  return [
                    ['metro Q1', M.q1, 7, 0],
                    ['metro median', M.median, 11, 0],
                    ['metro Q3', M.q3, 15, 0],
                    ['rural Q1', R.q1, 15, 0],
                    ['rural median', R.median, 35.5, 0],
                    ['rural Q3', R.q3, 42, 0],
                    ['rural IQR', R.iqr, 27, 0],
                    ['rural lower fence', R.lowerFence, -25.5, 0],
                    ['rural upper fence', R.upperFence, 82.5, 0],
                    ['outliers', M.outliers.length + R.outliers.length, 0, 0],
                  ];
                },
              },
            ],
          ],
        ],
        ['bridge', 'Everything so far assumed two independent samples. When the same subjects are measured twice, the samples are linked, and treating them as independent throws information away.'],
      ],
    },
    {
      id: '9.6',
      part: 'Pairs',
      title: 'Paired samples',
      lab: 'paired',
      problems: ['c9.paired-t-test', 'c9.paired-t-interval', 'c9.independent-or-paired'],
      blocks: [
        ['p', 'With matched pairs, analyze the DIFFERENCES $d_i = x_{1i} - x_{2i}$: one sample of $n$ differences, and a one-sample t procedure on them. Assumption: the differences are roughly normal.'],
        ['key', String.raw`**Paired t-test**: $t_0 = \dfrac{\bar{d} - \Delta_0}{s_d/\sqrt{n}}$, df $= n - 1$. **Interval**: $\bar{d} \pm t_{\alpha/2,\,n-1}\,\dfrac{s_d}{\sqrt{n}}$.`],
        ['why', 'Differencing cancels each pair’s own level (each machine, each student), so only the effect and the measurement noise are left. The paired vs independent lab shows how much that can matter.'],
        [
          'ex',
          {
            n: '9.15',
            q: 'Two methods of producing metal bars are compared on 9 randomly chosen machines (strengths below). Do the methods give the same mean strength? Use $\\alpha = 0.01$.',
            data: { head: ['Machine', 'Method 1', 'Method 2', '$d$'], rows: M1.map((x, i) => [i + 1, x.toFixed(3), M2[i].toFixed(3), (x - M2[i]).toFixed(3)]) },
            a: [
              '$H_0: \\mu_d = 0$, $H_1: \\mu_d \\ne 0$.',
              String.raw`From the differences: $\bar{d} = 0.2086$, $s_d = 0.2318$.`,
              String.raw`$t_0 = \dfrac{0.2086}{0.2318/\sqrt{9}} = 2.70$, df $= 8$; p-value $= 0.0271$.`,
              '$0.0271 \\ge 0.01$: fail to reject $H_0$.',
            ],
            answer: 'There is not sufficient evidence (at the 0.01 level) that the two methods differ in mean strength.',
            problem: 'c9.paired-t-test',
            case: 0,
            checks: () => {
              const T = pairedTest({ xs: M1, ys: M2, side: 'two' });
              return [
                ['d̄', T.dbar, 0.2086, 5e-5],
                ['s_d', T.sd, 0.2318, 5e-5],
                ['t', r2(T.t), 2.7, 0],
                ['p', T.p, 0.0271, 5e-4],
              ];
            },
          },
        ],
        ['fix', 'The notes’ difference column lists machine 4 as 0.337; it is 1.339 − 1.062 = 0.277. With the slip, d̄ = 0.2152, t₀ = 2.75 and p = 0.0251, and the decision at α = 0.01 is the same. The table above is recomputed from the method columns.'],
        ['ti', ['Method 1 in L1, method 2 in L2. Highlight the L3 heading and enter L1 − L2.', 'STAT ▸ TESTS ▸ 2:T-Test on L3 (Inpt: Data, List: L3), $\\mu_0 = 0$.']],
        [
          'ex',
          {
            n: '9.16',
            q: 'Reaction times (seconds) of 12 students’ dominant and non-dominant hands (below). Is the dominant hand faster, that is, its mean time less? Use $\\alpha = 0.05$.',
            data: { head: ['Dominant', 'Non-dominant', '$d$'], rows: DOM.map((x, i) => [x, NON[i], (x - NON[i]).toFixed(3)]) },
            a: [
              '$d$ = dominant − non-dominant. $H_0: \\mu_d = 0$, $H_1: \\mu_d < 0$.',
              String.raw`$\bar{d} = -0.0132$, $s_d = 0.0164$; $t_0 = \dfrac{-0.0132}{0.0164/\sqrt{12}} = -2.78$, df $= 11$.`,
              'p-value $= P(T < -2.78) = 0.0090 < 0.05$: reject $H_0$.',
            ],
            answer: 'There is sufficient evidence that the dominant hand reacts faster.',
            problem: 'c9.paired-t-test',
            case: 1,
            checks: () => {
              const T = pairedTest({ xs: DOM, ys: NON, side: 'left' });
              return [
                ['d̄', T.dbar, -0.0132, 5e-5],
                ['s_d', T.sd, 0.0164, 5e-5],
                ['t', r2(T.t), -2.78, 0],
                ['p', T.p, 0.009, 5e-4],
              ];
            },
          },
        ],
        [
          'ex',
          {
            n: '9.17',
            q: 'Check Example 9.15 with a 99% confidence interval.',
            a: [String.raw`$t_{0.005,8} = 3.355$: $0.2086 \pm 3.355\,\dfrac{0.2318}{3} = 0.2086 \pm 0.2592$, which is $(-0.0507,\ 0.4678)$.`, 'It contains 0.'],
            answer: 'Fail to reject $H_0$, as the test found. (TI-84: 8:TInterval on L3.)',
            problem: 'c9.paired-t-interval',
            case: 0,
            checks: () => {
              const I = pairedInterval({ xs: M1, ys: M2, conf: 0.99 });
              return [
                ['lo', I.lo, -0.0507, 5e-4],
                ['hi', I.hi, 0.4678, 5e-4],
              ];
            },
          },
        ],
        ['warn', 'Running a two-sample test on paired data is a common mistake: it ignores the pairing and usually hides the effect under the variation between pairs.'],
        ['bridge', 'Every comparison in this chapter asked whether two groups differ. Chapter 10 asks a different question of two variables measured on the same individuals: as one goes up, does the other move with it, and along what line?'],
      ],
    },
  ],
  formulas: [
    ['Two proportions, test', String.raw`$z_0 = \dfrac{\hat{p}_1 - \hat{p}_2}{\sqrt{\hat{p}(1-\hat{p})(1/n_1 + 1/n_2)}}$, $\;\hat{p} = \dfrac{x_1 + x_2}{n_1 + n_2}$`],
    ['Two proportions, interval', String.raw`$(\hat{p}_1 - \hat{p}_2) \pm z_{\alpha/2}\sqrt{\dfrac{\hat{p}_1(1-\hat{p}_1)}{n_1} + \dfrac{\hat{p}_2(1-\hat{p}_2)}{n_2}}$`],
    ['Two means, $\\sigma$’s known', String.raw`$z_0 = \dfrac{(\bar{x}_1 - \bar{x}_2) - \Delta_0}{\sqrt{\sigma_1^2/n_1 + \sigma_2^2/n_2}}$`],
    ['Two variances', String.raw`$f_0 = s_1^2/s_2^2$ on $(n_1 - 1, n_2 - 1)$ df; $\;f_{1-\alpha}(u, v) = 1/f_\alpha(v, u)$`],
    ['Pooled t', String.raw`$s_p^2 = \dfrac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}$, $\;$df $= n_1 + n_2 - 2$`],
    ['Unpooled t', String.raw`$t_0 = \dfrac{(\bar{x}_1 - \bar{x}_2) - \Delta_0}{\sqrt{s_1^2/n_1 + s_2^2/n_2}}$, Welch df (fractional)`],
    ['Paired t', String.raw`$t_0 = \dfrac{\bar{d} - \Delta_0}{s_d/\sqrt{n}}$, $\;n - 1$ df`],
  ],
};
