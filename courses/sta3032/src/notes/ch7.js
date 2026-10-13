/**
 * Chapter 7, rewritten from the teacher's notes (Ch 7, pp. 86–94), laid out like FLUX's notes. The
 * notes pose these examples and leave the working for class; every answer here is computed, by the
 * printed z table and exactly. Example numbers are the notes'; the textbook's material (Walpole §8.4,
 * the difference of two means, and §8.5, the sample variance) is marked, and its examples lettered.
 */
import { normCdf, binomCdf, chi2Sf } from '../stats/dist.js';
import { zTable as zLook, chi2Table } from '../stats/tables.js';

const zTable = (z) => zLook(z).value;
const chi = (a, df) => {
  const v = chi2Table(a, df);
  return typeof v === 'number' ? v : v.value;
};
const r2 = (x) => Math.round(x * 100) / 100;

export default {
  ch: '7',
  title: 'Fundamental sampling distributions',
  lede: String.raw`A statistic like $\bar{x}$ or $\hat{p}$ changes from sample to sample, so it has a distribution of its own: its sampling distribution. This chapter finds those distributions, above all the central limit theorem, which says the mean of a large sample is close to normal whatever the population looks like. It is the bridge from probability to the inference of Chapters 8 to 10.`,
  sections: [
    {
      id: '7.1',
      part: 'Sums of normal variables',
      title: 'Linear functions of normal random variables',
      problems: ['c7.linear-normal'],
      blocks: [
        ['p', 'Chapters 4 to 6 were about one random variable at a time. Statistics works with samples: $n$ measurements, each a random variable, combined into a single number such as their average. This chapter finds the distribution of that number. The first step is what happens when normal variables are added.'],
        ['p', String.raw`Recall from §4.3: $E(a_0 + a_1X_1 + \cdots + a_nX_n) = a_0 + a_1E(X_1) + \cdots + a_nE(X_n)$, and for INDEPENDENT $X_i$, $\sigma^2_{a_0 + a_1X_1 + \cdots + a_nX_n} = a_1^2\sigma^2_{X_1} + \cdots + a_n^2\sigma^2_{X_n}$.`],
        ['key', String.raw`A linear function of INDEPENDENT normal random variables is itself NORMAL: if $X_1, \ldots, X_n$ are independent and normal, so is $Y = a_0 + a_1X_1 + \cdots + a_nX_n$. (Most distributions lose their shape when added: a sum of uniforms is not uniform, a sum of exponentials is not exponential.)`],
        ['p', 'So the mean and variance from §4.3 are all you need to know $Y$ completely.'],
        [
          'ex',
          {
            n: '7.1',
            q: String.raw`$X_1$ and $X_2$ are independent normals: $X_1$ has mean 1 and variance 4, $X_2$ has mean $-2$ and variance 9. With $Y = 3 - X_1 + 2X_2$, find $P(Y > 8)$.`,
            a: [
              String.raw`$E(Y) = 3 - 1 + 2(-2) = -2$.`,
              String.raw`$\sigma_Y^2 = (-1)^2(4) + 2^2(9) = 40$, so $\sigma_Y = \sqrt{40} = 6.325$.`,
              String.raw`$Y$ is normal, so $P(Y > 8) = P\!\left(Z > \dfrac{8 - (-2)}{6.325}\right) = P(Z > 1.58) = 1 - 0.9429 = 0.0571$. Exact: 0.0569.`,
            ],
            answer: 'P(Y > 8) ≈ 0.057.',
            problem: 'c7.linear-normal',
            case: 0,
            checks: () => [
              ['E', 3 - 1 + 2 * -2, -2, 0],
              ['Var', 4 + 4 * 9, 40, 0],
              ['z', r2(10 / Math.sqrt(40)), 1.58, 0],
              ['table', 1 - zTable(1.58), 0.0571, 1e-9],
              ['exact', 1 - normCdf(8, -2, Math.sqrt(40)), 0.0569, 5e-5],
            ],
          },
        ],
        [
          'ex',
          {
            n: '7.2',
            q: String.raw`$X_1, \ldots, X_n$ is a random sample from a population with mean $\mu$ and variance $\sigma^2$. Find the mean and variance of the sample mean $\bar{X}$.`,
            a: [
              String.raw`$\bar{X} = \frac{1}{n}X_1 + \cdots + \frac{1}{n}X_n$: a linear combination with every $a_i = 1/n$, and the $X_i$ are independent.`,
              String.raw`$E(\bar{X}) = \frac{1}{n}\mu + \cdots + \frac{1}{n}\mu = \mu$.`,
              String.raw`$\sigma^2_{\bar{X}} = \frac{1}{n^2}\sigma^2 + \cdots + \frac{1}{n^2}\sigma^2 = n \cdot \frac{\sigma^2}{n^2} = \frac{\sigma^2}{n}$.`,
            ],
            answer: String.raw`$\mu_{\bar{X}} = \mu$, $\sigma^2_{\bar{X}} = \sigma^2/n$, so $\sigma_{\bar{X}} = \sigma/\sqrt{n}$.`,
          },
        ],
        [
          'ex',
          {
            n: '7.3',
            q: 'If the population in Example 7.2 is normal, what is the distribution of $\\bar{X}$?',
            a: ['$\\bar{X}$ is a linear function of normal random variables, so it is normal, with the mean and variance of Example 7.2.'],
            answer: String.raw`$\bar{X} \sim N\!\left(\mu, \dfrac{\sigma^2}{n}\right)$ exactly, for every $n$.`,
          },
        ],
        ['bridge', 'Examples 7.2 and 7.3 are the heart of the chapter: the average of a sample is centered on $\\mu$ and spreads less than one observation does. Part II puts numbers on it, and then drops the assumption that the population is normal.'],
      ],
    },
    {
      id: '7.2',
      part: 'The sample mean',
      title: 'The sampling distribution of x̄ and the central limit theorem',
      lab: 'clt',
      problems: ['c7.xbar-mean-sd', 'c7.xbar-prob', 'c7.clt-when'],
      blocks: [
        ['p', 'A statistic is computed from a random sample, so it is itself random: another sample would give another value. Its probability distribution is its **sampling distribution**.'],
        ['key', String.raw`From a NORMAL population with mean $\mu$ and variance $\sigma^2$: $\bar{X} \sim N\!\left(\mu, \dfrac{\sigma^2}{n}\right)$, and $Z = \dfrac{\bar{X} - \mu}{\sigma/\sqrt{n}}$.`],
        ['why', String.raw`In a sample some values fall above $\mu$ and some below, and averaging lets them partly cancel. The cancelling is only partial: the variance falls as $1/n$, so the spread $\sigma/\sqrt{n}$ falls as $1/\sqrt{n}$. Four times the data halves the spread of $\bar{X}$.`],
        [
          'ex',
          {
            n: '7.4',
            q: 'A machine fills soft-drink cans with mean 12.1 fluid ounces and standard deviation 0.5; fill volumes are independent normal random variables. What is the probability the average of 10 cans is less than 12 ounces?',
            a: [
              String.raw`$\bar{X} \sim N(12.1, 0.5^2/10)$: $\sigma_{\bar{X}} = 0.5/\sqrt{10} = 0.1581$.`,
              String.raw`$P(\bar{X} < 12) = P\!\left(Z < \dfrac{12 - 12.1}{0.1581}\right) = P(Z < -0.63) = 0.2643$. Exact: 0.2635.`,
            ],
            answer: 'About 0.264.',
            problem: 'c7.xbar-prob',
            case: 0,
            checks: () => [
              ['se', 0.5 / Math.sqrt(10), 0.1581, 5e-5],
              ['z', r2(-0.1 / (0.5 / Math.sqrt(10))), -0.63, 0],
              ['table', zTable(-0.63), 0.2643, 0],
              ['exact', normCdf(12, 12.1, 0.5 / Math.sqrt(10)), 0.2635, 5e-5],
            ],
          },
        ],
        ['warn', String.raw`Use $\sigma/\sqrt{n}$, not $\sigma$, for a question about an AVERAGE. With $\sigma = 0.5$ the answer would be $P(Z < -0.2) = 0.42$, the chance for one can.`],
        ['key', String.raw`**Central limit theorem.** From ANY population with mean $\mu$ and variance $\sigma^2$, for large enough $n$, $\bar{X}$ is approximately $N\!\left(\mu, \dfrac{\sigma^2}{n}\right)$, whatever the population's shape. The larger $n$, the better the approximation.`],
        ['p', 'How large is large? The usual rule of thumb is $n \\ge 30$. A normal population needs no rule (Example 7.3); a very skewed one may need more.'],
        [
          'ex',
          {
            n: '7.5',
            q: 'Weight gain during pregnancy has mean 30 pounds and standard deviation 12.9, and is skewed right. What is the probability that the mean weight gain of a random sample of patients is greater than 36.2 pounds, when (a) $n = 10$; (b) $n = 35$?',
            a: [
              '(a) The population is skewed and $n = 10$ is small: we cannot say $\\bar{X}$ is normal, so the normal curve cannot give this probability.',
              String.raw`(b) $n = 35 \ge 30$: by the CLT, $\bar{X}$ is approximately normal with $\sigma_{\bar{X}} = 12.9/\sqrt{35} = 2.1805$.`,
              String.raw`$P(\bar{X} > 36.2) = P\!\left(Z > \dfrac{36.2 - 30}{2.1805}\right) = P(Z > 2.84) = 1 - 0.9977 = 0.0023$. Exact: 0.0022.`,
            ],
            answer: '(a) cannot be found with the normal model; (b) about 0.002.',
            problem: 'c7.xbar-prob',
            case: 1,
            checks: () => [
              ['se', 12.9 / Math.sqrt(35), 2.1805, 5e-5],
              ['z', r2(6.2 / (12.9 / Math.sqrt(35))), 2.84, 0],
              ['table', 1 - zTable(2.84), 0.0023, 1e-9],
              ['exact', 1 - normCdf(36.2, 30, 12.9 / Math.sqrt(35)), 0.0022, 5e-5],
            ],
          },
        ],
        ['p', 'The CLT lab draws thousands of samples from a skewed population: at $n = 2$ the means are still skewed, by $n = 40$ they are close to a normal curve.'],
        [
          'book',
          'Walpole §8.4',
          [
            ['p', String.raw`Chapter 9 compares two populations through the difference of their sample means. Independent samples of sizes $n_1$ and $n_2$ give a difference $\bar{X}_1 - \bar{X}_2$ that is a linear combination (§4.3), so its mean and variance follow at once, and it is normal when both populations are (or approximately, by the CLT, when both samples are large):`],
            ['p', String.raw`$$\mu_{\bar{X}_1 - \bar{X}_2} = \mu_1 - \mu_2, \qquad \sigma^2_{\bar{X}_1 - \bar{X}_2} = \frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}.$$`],
            ['p', 'The variances add even though the means subtract, as in Ex 4.8.'],
            [
              'ex',
              {
                n: '7.A',
                title: 'two filling machines',
                q: 'Machine A fills cans with mean 12.1 oz and standard deviation 0.5; machine B with mean 12.0 oz and standard deviation 0.4. Fill volumes are normal. Take 10 cans from A and 8 from B. What is the probability that A’s sample mean beats B’s by more than 0.3 oz?',
                a: [
                  String.raw`$\bar{X}_A - \bar{X}_B$ is normal with mean $12.1 - 12.0 = 0.1$ and variance $\dfrac{0.5^2}{10} + \dfrac{0.4^2}{8} = 0.025 + 0.02 = 0.045$, so standard deviation $\sqrt{0.045} = 0.2121$.`,
                  String.raw`$P(\bar{X}_A - \bar{X}_B > 0.3) = P\!\left(Z > \dfrac{0.3 - 0.1}{0.2121}\right) = P(Z > 0.94) = 1 - 0.8264 = 0.1736$. Exact: 0.1729.`,
                ],
                answer: 'About 0.17.',
                checks: () => [
                  ['var', 0.25 / 10 + 0.16 / 8, 0.045, 1e-12],
                  ['sd', Math.sqrt(0.045), 0.2121, 5e-5],
                  ['z', r2(0.2 / Math.sqrt(0.045)), 0.94, 0],
                  ['table', 1 - zTable(0.94), 0.1736, 1e-9],
                  ['exact', 1 - normCdf(0.3, 0.1, Math.sqrt(0.045)), 0.1729, 5e-5],
                ],
              },
            ],
          ],
        ],
        ['bridge', 'A count of successes is a sum too: $n$ trials, each adding 1 or 0. So the central limit theorem applies to the binomial as well, which is Part III.'],
      ],
    },
    {
      id: '7.3',
      part: 'Counts and proportions',
      title: 'The normal approximation to the binomial',
      lab: 'clt',
      problems: ['c7.normal-approx-binomial'],
      blocks: [
        ['p', 'A binomial $\\text{Bin}(n, p)$ has $\\mu = np$ and $\\sigma^2 = np(1 - p)$, and for large $n$ its probability histogram is bell-shaped. The steps:'],
        [
          'steps',
          [
            'Identify the binomial: $n$ and $p$.',
            'Check that $n$ is large enough: $np(1 - p) \\ge 10$.',
            'Use the normal with $\\mu = np$, $\\sigma = \\sqrt{np(1-p)}$.',
            'Correct for continuity: each whole number $x$ stands for the interval $x - 0.5$ to $x + 0.5$.',
          ],
        ],
        [
          'table',
          {
            head: ['Binomial event', 'Normal area'],
            rows: [
              ['$X \\le a$', '$X < a + 0.5$'],
              ['$X < a$ (that is, $X \\le a - 1$)', '$X < a - 0.5$'],
              ['$X \\ge a$', '$X > a - 0.5$'],
              ['$X > a$ (that is, $X \\ge a + 1$)', '$X > a + 0.5$'],
              ['$X = a$', '$a - 0.5 < X < a + 0.5$'],
            ],
            note: 'Rule: include the bars the event includes, all of each bar.',
          },
        ],
        [
          'ex',
          {
            n: '7.6',
            q: 'Each of 1000 LED bulbs on a tree burns out with probability 0.05, independently. Approximate the probability that (a) at most 975 work; (b) more than 950 work.',
            a: [
              String.raw`$X$ = number working: $\text{Bin}(1000, 0.95)$. $np(1-p) = 1000(0.95)(0.05) = 47.5 \ge 10$. ✓`,
              String.raw`$\mu = 950$, $\sigma = \sqrt{47.5} = 6.892$.`,
              String.raw`(a) $P(X \le 975) \approx P(X < 975.5) = P\!\left(Z < \dfrac{975.5 - 950}{6.892}\right) = P(Z < 3.70) \approx 1$ (beyond the table; 0.9999 exact).`,
              String.raw`(b) More than 950 is $X \ge 951$: $P(X > 950.5) = P\!\left(Z > \dfrac{0.5}{6.892}\right) = P(Z > 0.07) = 1 - 0.5279 = 0.4721$. Exact $z$: 0.4711.`,
            ],
            answer: '(a) about 1 (b) about 0.47. (The exact binomial answers are 0.99998 and 0.4797.)',
            problem: 'c7.normal-approx-binomial',
            case: 0,
            checks: () => [
              ['σ', Math.sqrt(47.5), 6.892, 5e-4],
              ['(a) z', r2(25.5 / Math.sqrt(47.5)), 3.7, 0],
              ['(b) z', r2(0.5 / Math.sqrt(47.5)), 0.07, 0],
              ['(b) table', 1 - zTable(0.07), 0.4721, 1e-9],
              ['(b) exact z', 1 - normCdf(0.5 / Math.sqrt(47.5)), 0.4711, 5e-5],
              ['(a) binomial', binomCdf(975, 1000, 0.95), 0.99998, 5e-6],
              ['(b) binomial', 1 - binomCdf(950, 1000, 0.95), 0.4797, 5e-5],
            ],
          },
        ],
        ['warn', '"More than 950" does not include 950. Translate to whole numbers first ($X \\ge 951$), then take the whole bar: $X > 950.5$.'],
        ['why', 'The binomial’s probability for $x$ is a bar of width 1 centered at $x$ (§3.2). The normal curve approximates the tops of the bars, so to capture all of each bar the event includes, the area must run from half a unit below the first bar to half a unit above the last.'],
      ],
    },
    {
      id: '7.4',
      title: 'The sampling distribution of p̂',
      lab: 'clt',
      problems: ['c7.point-estimate', 'c7.phat'],
      blocks: [
        ['def', 'Sample proportion:', String.raw`$\hat{p} = \dfrac{x}{n}$, where $x$ is the number in the sample with the characteristic. It is a point estimate of the population proportion $p$.`],
        [
          'ex',
          {
            n: '7.7',
            q: 'In a Gallup poll, 558 of 1016 adult Americans said the federal income tax they pay is fair. Give a point estimate of the proportion of all adult Americans who think so.',
            a: [String.raw`$\hat{p} = \dfrac{558}{1016} = 0.5492$.`],
            answer: 'About 0.549, or 54.9%.',
            problem: 'c7.point-estimate',
            case: 0,
            checks: () => [['p̂', 558 / 1016, 0.5492, 5e-5]],
          },
        ],
        ['key', String.raw`If $np(1 - p) \ge 10$: $\hat{p}$ is approximately $N\!\left(p, \dfrac{p(1-p)}{n}\right)$, so $\mu_{\hat{p}} = p$ and $\sigma_{\hat{p}} = \sqrt{\dfrac{p(1-p)}{n}}$.`],
        ['why', String.raw`$\hat{p} = X/n$ with $X$ binomial: $E(\hat{p}) = np/n = p$ and $\text{Var}(\hat{p}) = np(1-p)/n^2 = p(1-p)/n$. The normal shape is the normal approximation to the binomial of §7.3.`],
        [
          'ex',
          {
            n: '7.8',
            q: '76% of Americans believe the state of moral values in the U.S. is getting worse. For a simple random sample of $n = 60$: (a) describe the sampling distribution of $\\hat{p}$; (b) find the probability that at most 70% of the sample hold this belief.',
            a: [
              String.raw`(a) $np(1 - p) = 60(0.76)(0.24) = 10.94 \ge 10$, so $\hat{p}$ is approximately normal with mean $0.76$ and standard deviation $\sqrt{\dfrac{0.76(0.24)}{60}} = 0.0551$.`,
              String.raw`(b) $P(\hat{p} \le 0.70) = P\!\left(Z \le \dfrac{0.70 - 0.76}{0.0551}\right) = P(Z \le -1.09) = 0.1379$. Exact: 0.1383.`,
            ],
            answer: '(a) approximately N(0.76, 0.0551²); (b) about 0.138.',
            problem: 'c7.phat',
            case: 0,
            show: 'clt:morals',
            checks: () => [
              ['np(1-p)', 60 * 0.76 * 0.24, 10.94, 5e-3],
              ['σ', Math.sqrt((0.76 * 0.24) / 60), 0.0551, 5e-5],
              ['z', r2(-0.06 / Math.sqrt((0.76 * 0.24) / 60)), -1.09, 0],
              ['table', zTable(-1.09), 0.1379, 0],
              ['exact', normCdf(0.7, 0.76, Math.sqrt((0.76 * 0.24) / 60)), 0.1383, 5e-5],
            ],
          },
        ],
        ['bridge', String.raw`Means and proportions cover most of the inference in Chapters 8 to 10. But a variance is a statistic too, and its distribution is not normal: the textbook gives it, and it is behind the variance tests of Chapter 9.`],
      ],
    },
    {
      id: '7.5',
      part: 'The sample variance',
      title: 'The sampling distribution of S²',
      source: 'Walpole §8.5',
      lab: 'dist',
      blocks: [
        ['p', String.raw`From a NORMAL population with variance $\sigma^2$, the sample variance of a random sample of size $n$, rescaled, has a **chi-squared distribution** with $n - 1$ degrees of freedom:`],
        ['key', String.raw`$\chi^2 = \dfrac{(n - 1)S^2}{\sigma^2}$ has the $\chi^2$ distribution with $\nu = n - 1$ degrees of freedom.`],
        [
          'list',
          [
            'It takes only positive values (a variance cannot be negative) and is skewed right.',
            String.raw`Its mean is $\nu$, so $S^2$ is centered on $\sigma^2$: $E(S^2) = \sigma^2$, the unbiasedness promised in §1.4.`,
            String.raw`$\chi^2_{\alpha,\nu}$ is the value with area $\alpha$ to its RIGHT (Table A.5), as for $z_\alpha$ and $t_{\alpha,\nu}$. The curve is not symmetric, so the left-tail value has to be read separately, as $\chi^2_{1-\alpha,\nu}$.`,
          ],
        ],
        ['why', String.raw`The degrees of freedom are the $n - 1$ of §1.4: the deviations $x_i - \bar{x}$ add to zero, so only $n - 1$ of them are free. The $\chi^2$ distribution is the gamma of §6.4 with $\alpha = \nu/2$ and $\beta = 2$.`],
        [
          'ex',
          {
            n: '7.B',
            title: 'how variable is a sample of 10 cans?',
            q: String.raw`Fill volumes are normal with $\sigma = 0.5$ oz. For a random sample of 10 cans, find (a) the probability that the sample variance $s^2$ exceeds 0.5, twice the population variance; (b) the value that $s^2$ exceeds with probability 0.05.`,
            a: [
              String.raw`$\dfrac{(n - 1)S^2}{\sigma^2} = \dfrac{9S^2}{0.25}$ has the $\chi^2$ distribution with 9 df.`,
              String.raw`(a) $s^2 = 0.5$ gives $\chi^2 = \dfrac{9(0.5)}{0.25} = 18.0$. Table A.5, row 9: $\chi^2_{0.05} = 16.919$ and $\chi^2_{0.025} = 19.023$, so the probability is between 0.025 and 0.05. Exact: $\chi^2$cdf$(18, 10^{99}, 9) = 0.0352$.`,
              String.raw`(b) $\chi^2_{0.05,9} = 16.919$, so $s^2 = \dfrac{0.25 \times 16.919}{9} = 0.470$ (that is, $s = 0.686$).`,
            ],
            answer: 'Even with normal data, a sample of 10 gives a variance more than twice the true one about 3.5% of the time.',
            show: 'dist:chi9',
            checks: () => [
              ['χ²', (9 * 0.5) / 0.25, 18, 1e-12],
              ['χ².05', chi(0.05, 9), 16.919, 5e-4],
              ['χ².025', chi(0.025, 9), 19.023, 5e-4],
              ['(a) exact', chi2Sf(18, 9), 0.0352, 5e-5],
              ['(b) s²', (0.25 * 16.919) / 9, 0.47, 5e-4],
              ['(b) s', Math.sqrt((0.25 * 16.919) / 9), 0.686, 5e-4],
            ],
          },
        ],
        ['ti', ['2nd VARS ▸ 8:χ²cdf(: lower, upper, df. For a right tail use upper $10^{99}$ (1E99).']],
        ['p', String.raw`Two more distributions grow out of this one, and the class meets both later. Replace $\sigma$ by $S$ in $Z = \frac{\bar{X} - \mu}{\sigma/\sqrt{n}}$ and the result has the $t$ distribution with $n - 1$ df (Walpole §8.6; Chapter 8). Divide one sample variance by another (each over its $\sigma^2$) and the ratio has the $F$ distribution (Walpole §8.7; Chapter 9).`],
        ['warn', 'Unlike the CLT for means, this needs a normal population at every sample size. Variance procedures are sensitive to skew and outliers: check the normal probability plot first.'],
        ['bridge', 'Chapter 8 turns these sampling distributions around: instead of asking how a statistic behaves when the parameter is known, it uses the statistic to estimate an unknown parameter and to test claims about it.'],
      ],
    },
  ],
  formulas: [
    ['Linear functions of independent normals', 'normal, with mean and variance from §4.3'],
    ['Sample mean', String.raw`$\mu_{\bar{X}} = \mu$, $\;\sigma_{\bar{X}} = \sigma/\sqrt{n}$`],
    ['Standardizing $\\bar{X}$', String.raw`$Z = \dfrac{\bar{X} - \mu}{\sigma/\sqrt{n}}$ (normal population, or $n \ge 30$ by the CLT)`],
    ['Normal approximation', String.raw`$X \sim \text{Bin}(n, p)$ with $np(1-p) \ge 10$: $\mu = np$, $\sigma = \sqrt{np(1-p)}$, correct by $\pm 0.5$`],
    ['Sample proportion', String.raw`$\mu_{\hat{p}} = p$, $\;\sigma_{\hat{p}} = \sqrt{p(1-p)/n}$`],
    ['Difference of means', String.raw`$\mu = \mu_1 - \mu_2$, $\;\sigma^2 = \sigma_1^2/n_1 + \sigma_2^2/n_2$`, 'Walpole §8.4'],
    ['Sample variance', String.raw`$(n-1)S^2/\sigma^2 \sim \chi^2_{n-1}$ (normal population)`, 'Walpole §8.5'],
  ],
};
