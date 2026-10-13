/**
 * Chapter 4, rewritten from the teacher's notes (Ch 4, pp. 47–57), laid out like FLUX's notes.
 * Example numbers are the notes'; the textbook's material (Walpole §4.2–4.4: covariance,
 * correlation, Chebyshev's theorem) is marked, and its examples are lettered (4.A, 4.B, …).
 */
import { WELDS } from './ch3.js';

const integrate = (f, a, b, n = 4000) => {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
};

const XS = [0, 1, 2, 3, 4, 5];
const PS = [0.35, 0.25, 0.2, 0.1, 0.05, 0.05];
const E = (g) => XS.reduce((t, x, i) => t + g(x) * PS[i], 0);
/** E[g(X, Y)] over the welds table of Ex 3.B. */
const EW = (g) => WELDS.reduce((t, row, y) => t + row.reduce((u, p, x) => u + g(x, y) * p, 0), 0);
const COV = () => EW((x, y) => x * y) - EW((x) => x) * EW((x, y) => y);

export default {
  ch: '4',
  title: 'Mathematical expectation',
  lede: 'A distribution is a whole table or curve; most questions want it in two numbers. The mean says where the distribution is centered, the long-run average of the variable; the variance says how far it spreads around that center. This chapter computes both, then the rules that make them easy to carry through sums and rescalings, which Chapter 7 uses to find the distribution of a sample mean.',
  sections: [
    {
      id: '4.1',
      part: 'The center of a distribution',
      title: 'The mean (expected value) of a random variable',
      lab: 'dist',
      problems: ['c4.mean-variance-pmf', 'c4.commission', 'c4.expected-life', 'c4.expected-value', 'c4.pmf-missing', 'c4.density-k'],
      blocks: [
        ['p', 'The **mean** or **expected value** of a random variable is the center of its distribution: the long-run average of its values if the experiment were repeated many times.'],
        ['p', 'For a data set, the mean adds the values and divides by $n$. Group equal values together and that is the same as weighting each value by its relative frequency. A distribution gives the long-run relative frequencies directly, as probabilities, so the mean weights each value by its probability.'],
        ['key', String.raw`$\mu = E(X) = \sum_x x\,f(x)$ if $X$ is discrete; $\mu = E(X) = \int_{-\infty}^{\infty} x\,f(x)\,dx$ if $X$ is continuous.`],
        [
          'ex',
          {
            n: '4.1',
            q: 'Daily interruptions in a large computer network have the distribution below. How many interruptions can we expect each day?',
            data: { head: ['$x$', 0, 1, 2, 3, 4, 5], rows: [['$f(x)$', ...PS]] },
            a: [String.raw`$\mu = \sum x f(x) = 0(0.35) + 1(0.25) + 2(0.20) + 3(0.10) + 4(0.05) + 5(0.05)$`, '$= 0 + 0.25 + 0.4 + 0.3 + 0.2 + 0.25 = 1.4$.'],
            answer: '1.4 interruptions per day, as a long-run average (no single day has 1.4).',
            problem: 'c4.mean-variance-pmf',
            case: 0,
            checks: () => [['μ', E((x) => x), 1.4, 1e-12]],
          },
        ],
        ['ti', ['STAT ▸ 1:Edit: the values $x$ in L1, the probabilities in L2.', 'STAT ▸ CALC ▸ 1:1-Var Stats, List: L1, FreqList: L2, Calculate.', String.raw`$\bar{x}$ is $\mu$ (1.4) and $\sigma x$ is $\sigma$ (1.428). Ignore $Sx$ and $n$: the "data" here are probabilities.`]],
        [
          'ex',
          {
            n: '4.2',
            q: 'A salesperson has two appointments. At the first there is a 70% chance of a deal worth 1000 dollars commission; at the second, a 40% chance of a deal worth 1500 dollars. The results are independent. What is the expected commission?',
            a: [
              'Let $X$ be the total commission. List its values and use independence to multiply:',
              String.raw`$f(0) = (0.3)(0.6) = 0.18$; $f(1000) = (0.7)(0.6) = 0.42$; $f(1500) = (0.3)(0.4) = 0.12$; $f(2500) = (0.7)(0.4) = 0.28$.`,
              String.raw`$E(X) = 0(0.18) + 1000(0.42) + 1500(0.12) + 2500(0.28) = 0 + 420 + 180 + 700 = 1300$.`,
            ],
            answer: '1300 dollars (a long-run average: on any one day the commission is 0, 1000, 1500 or 2500).',
            problem: 'c4.commission',
            case: 0,
            checks: () => [
              ['sum f', 0.18 + 0.42 + 0.12 + 0.28, 1, 1e-12],
              ['E', 1000 * 0.7 * 0.6 + 1500 * 0.3 * 0.4 + 2500 * 0.7 * 0.4, 1300, 1e-9],
              ['by linearity', 1000 * 0.7 + 1500 * 0.4, 1300, 1e-9],
            ],
          },
        ],
        ['why', 'Shortcut by §4.3: the total is the sum of the two commissions, so $E(X) = 0.7(1000) + 0.4(1500) = 700 + 600 = 1300$. Same answer, no table.'],
        [
          'ex',
          {
            n: '4.3',
            q: String.raw`The life $X$ in hours of an electronic device has density $f(x) = \dfrac{20{,}000}{x^3}$ for $x > 100$, and 0 elsewhere. Find the expected life.`,
            a: [
              String.raw`$E(X) = \int_{100}^{\infty} x \cdot \dfrac{20{,}000}{x^3}\,dx = \int_{100}^{\infty} 20{,}000\,x^{-2}\,dx$`,
              String.raw`$= \left[-\dfrac{20{,}000}{x}\right]_{100}^{\infty} = 0 - \left(-\dfrac{20{,}000}{100}\right) = 200$.`,
            ],
            answer: '200 hours.',
            problem: 'c4.expected-life',
            case: 0,
            // The tail beyond 10^6 contributes 20000/10^6 = 0.02, added back exactly.
            checks: () => [['E', integrate((x) => 20000 / (x * x), 100, 1e6, 400000) + 20000 / 1e6, 200, 1e-3]],
          },
        ],
        ['key', String.raw`The expected value of a function $g(X)$: $E[g(X)] = \sum_x g(x)\,f(x)$, or $\int g(x)\,f(x)\,dx$. Apply $g$ to each value; keep the probabilities.`],
        [
          'ex',
          {
            n: '4.4',
            q: 'For the interruptions of Example 4.1, the cost, in thousands of dollars, is $g(X) = 2X + 1$. Find the expected daily cost.',
            a: [
              'The values of $g$: $2x + 1 = 1, 3, 5, 7, 9, 11$, with the same probabilities.',
              String.raw`$E(2X + 1) = 1(0.35) + 3(0.25) + 5(0.20) + 7(0.10) + 9(0.05) + 11(0.05) = 0.35 + 0.75 + 1 + 0.7 + 0.45 + 0.55 = 3.8$.`,
            ],
            answer: '3.8 thousand dollars per day.',
            problem: 'c4.expected-g',
            case: 0,
            checks: () => [
              ['E(2X+1)', E((x) => 2 * x + 1), 3.8, 1e-12],
              ['2E(X)+1', 2 * 1.4 + 1, 3.8, 1e-12],
            ],
          },
        ],
        ['p', 'The same idea works for a density: replace the sum by an integral and the probability $f(x)$ by $f(x)\\,dx$.'],
        ['fix', String.raw`The handwritten answer to Ex 4.4 reads "$E(X) = 3.8$". It is $E[g(X)] = E(2X + 1) = 3.8$; $E(X)$ itself is 1.4. (Check with §4.3: $2(1.4) + 1 = 3.8$.)`],
        ['ti', ['Values in L1, probabilities in L2. Highlight the L3 heading, type 2*L1+1, ENTER: L3 holds the values of $g$.', '1-Var Stats with List: L3, FreqList: L2 gives $\\bar{x} = 3.8$.']],
        [
          'ex',
          {
            n: '4.5',
            q: String.raw`$X$ has density $f(x) = \frac{x^2}{3}$ for $-1 < x < 2$, and 0 elsewhere. Find $E(4X + 3)$.`,
            a: [String.raw`$E(4X + 3) = \int_{-1}^{2} (4x + 3)\,\frac{x^2}{3}\,dx = \int_{-1}^{2} \left(\frac{4x^3}{3} + x^2\right) dx = \left[\frac{x^4}{3} + \frac{x^3}{3}\right]_{-1}^{2} = \frac{24}{3} - 0 = 8$.`],
            answer: '8.',
            problem: 'c4.expected-g-continuous',
            case: 0,
            checks: () => [
              ['E(4X+3)', integrate((x) => ((4 * x + 3) * x * x) / 3, -1, 2), 8, 1e-9],
              ['via E(X)', 4 * integrate((x) => (x * x * x) / 3, -1, 2) + 3, 8, 1e-9],
            ],
          },
        ],
        ['bridge', 'The mean says where a distribution is centered, not how much it varies: a variable that is always 1.4 and one that swings from 0 to 5 can share a mean. Part II measures the spread.'],
      ],
    },
    {
      id: '4.2',
      part: 'The spread of a distribution',
      title: 'Variance and standard deviation of a random variable',
      lab: 'dist',
      problems: ['c4.mean-variance-pmf', 'c4.pdf-mean'],
      blocks: [
        ['p', 'Two distributions can share a mean and differ in spread. The **variance** measures the spread about $\\mu$.'],
        ['key', String.raw`$\sigma^2 = E[(X - \mu)^2] = \sum_x (x - \mu)^2 f(x)$ (discrete), or $\int (x - \mu)^2 f(x)\,dx$ (continuous). The standard deviation $\sigma$ is its positive square root.`],
        ['p', 'It is the population variance of Chapter 1 with probabilities in place of the $1/N$: the average squared distance from the mean, weighted by how often each distance happens. The square root brings it back to the units of $X$.'],
        ['p', String.raw`A shortcut, often quicker by hand: $\sigma^2 = E(X^2) - \mu^2$.`],
        ['why', String.raw`Expand the square: $(X - \mu)^2 = X^2 - 2\mu X + \mu^2$. Take expectations term by term (§4.3): $E(X^2) - 2\mu E(X) + \mu^2 = E(X^2) - 2\mu^2 + \mu^2 = E(X^2) - \mu^2$.`, 'Derivation'],
        [
          'ex',
          {
            n: '4.6',
            q: 'Find the variance and standard deviation of the daily interruptions of Example 4.1 ($\\mu = 1.4$).',
            a: [
              String.raw`$x - \mu$: $-1.4, -0.4, 0.6, 1.6, 2.6, 3.6$; squared: $1.96, 0.16, 0.36, 2.56, 6.76, 12.96$.`,
              String.raw`$\sigma^2 = \sum (x - \mu)^2 f(x) = 1.96(0.35) + 0.16(0.25) + 0.36(0.20) + 2.56(0.10) + 6.76(0.05) + 12.96(0.05) = 2.04$.`,
              String.raw`Check by the shortcut: $E(X^2) = 0 + 0.25 + 0.8 + 0.9 + 0.8 + 1.25 = 4$, and $4 - 1.4^2 = 2.04$.`,
              String.raw`$\sigma = \sqrt{2.04} = 1.43$.`,
            ],
            answer: 'σ² = 2.04, σ = 1.43 interruptions.',
            problem: 'c4.mean-variance-pmf',
            case: 0,
            checks: () => [
              ['σ²', E((x) => (x - 1.4) ** 2), 2.04, 1e-12],
              ['E(X²)', E((x) => x * x), 4, 1e-12],
              ['σ', Math.sqrt(2.04), 1.43, 5e-3],
            ],
          },
        ],
        [
          'ex',
          {
            n: '4.7',
            q: 'Weekly demand $X$ for a drinking-water product, in thousands of liters, has density $f(x) = 2(x - 1)$ for $1 < x < 2$, and 0 elsewhere. Find the mean and variance.',
            a: [
              String.raw`$\mu = \int_1^2 x \cdot 2(x - 1)\,dx = \left[\frac{2x^3}{3} - x^2\right]_1^2 = \frac{4}{3} - \left(-\frac{1}{3}\right) = \frac{5}{3}$.`,
              String.raw`$\sigma^2 = \int_1^2 \left(x - \frac{5}{3}\right)^2 2(x - 1)\,dx = \frac{1}{18}$. (Or: $E(X^2) = \int_1^2 x^2 \cdot 2(x-1)\,dx = \frac{17}{6}$, and $\frac{17}{6} - \frac{25}{9} = \frac{1}{18}$.)`,
            ],
            answer: 'μ = 5/3 ≈ 1.667 thousand liters; σ² = 1/18 ≈ 0.0556.',
            problem: 'c4.pdf-mean',
            case: 1,
            checks: () => [
              ['μ', integrate((x) => x * 2 * (x - 1), 1, 2), 5 / 3, 1e-9],
              ['σ²', integrate((x) => (x - 5 / 3) ** 2 * 2 * (x - 1), 1, 2), 1 / 18, 1e-9],
              ['E(X²)', integrate((x) => x * x * 2 * (x - 1), 1, 2), 17 / 6, 1e-9],
            ],
          },
        ],
        [
          'book',
          'Walpole §4.2',
          [
            ['p', String.raw`With two variables on the same outcome (a joint distribution, §3.4) there is a third number to ask for: do they move together? The **covariance** averages the product of the two deviations from the means. When large $X$ tends to go with large $Y$, both deviations have the same sign, the products are positive, and so is the covariance; when large $X$ goes with small $Y$, it is negative.`],
            ['def', 'Covariance.', String.raw`$\sigma_{XY} = E[(X - \mu_X)(Y - \mu_Y)] = E(XY) - \mu_X\mu_Y$, where $E(XY) = \sum_x \sum_y xy\,f(x, y)$.`],
            ['def', 'Correlation coefficient.', String.raw`$\rho_{XY} = \dfrac{\sigma_{XY}}{\sigma_X\,\sigma_Y}$, always between $-1$ and $1$. It is the covariance with the units taken out: $\pm 1$ means $Y$ is exactly a straight-line function of $X$, and 0 means no linear relation.`],
            [
              'ex',
              {
                n: '4.A',
                title: 'welds and machines again',
                q: 'For the welds table of Ex 3.B ($X$ = welds needing rework, $Y = 1$ for the old machine), find the covariance and the correlation of $X$ and $Y$.',
                data: {
                  head: ['$f(x, y)$', '$x = 0$', '$x = 1$', '$x = 2$', '$h(y)$'],
                  rows: [
                    ['$y = 0$', '0.30', '0.20', '0.10', '0.60'],
                    ['$y = 1$', '0.10', '0.20', '0.10', '0.40'],
                    ['$g(x)$', '0.40', '0.40', '0.20', '1'],
                  ],
                },
                a: [
                  String.raw`Means from the margins: $\mu_X = 0(0.40) + 1(0.40) + 2(0.20) = 0.8$ and $\mu_Y = 0(0.60) + 1(0.40) = 0.4$.`,
                  String.raw`$E(XY)$: only cells with $x$ and $y$ both nonzero count, $(1)(1)(0.20) + (2)(1)(0.10) = 0.4$.`,
                  String.raw`$\sigma_{XY} = E(XY) - \mu_X\mu_Y = 0.4 - (0.8)(0.4) = 0.08$.`,
                  String.raw`Variances: $E(X^2) = 0.40 + 4(0.20) = 1.2$, so $\sigma_X^2 = 1.2 - 0.8^2 = 0.56$; $E(Y^2) = 0.4$, so $\sigma_Y^2 = 0.4 - 0.4^2 = 0.24$.`,
                  String.raw`$\rho = \dfrac{0.08}{\sqrt{0.56}\,\sqrt{0.24}} = \dfrac{0.08}{0.3666} = 0.218$.`,
                ],
                answer: String.raw`$\sigma_{XY} = 0.08$ and $\rho = 0.218$: a weak positive relation. Old-machine parts tend to need more rework, as Ex 3.B found.`,
                checks: () => [
                  ['μX', EW((x) => x), 0.8, 1e-12],
                  ['μY', EW((x, y) => y), 0.4, 1e-12],
                  ['E(XY)', EW((x, y) => x * y), 0.4, 1e-12],
                  ['σXY', COV(), 0.08, 1e-12],
                  ['σX²', EW((x) => x * x) - 0.64, 0.56, 1e-12],
                  ['σY²', EW((x, y) => y * y) - 0.16, 0.24, 1e-12],
                  ['σXσY', Math.sqrt(0.56 * 0.24), 0.3666, 5e-5],
                  ['ρ', COV() / Math.sqrt(0.56 * 0.24), 0.218, 5e-4],
                ],
              },
            ],
            ['key', String.raw`If $X$ and $Y$ are independent, $E(XY) = E(X)\,E(Y)$ and so $\sigma_{XY} = 0$. The converse fails: covariance 0 only rules out a LINEAR relation.`],
          ],
        ],
        ['bridge', 'Means and variances of single variables are the raw material. The payoff is being able to find them for a sum, a difference or a rescaling without building a new distribution: Part III.'],
      ],
    },
    {
      id: '4.3',
      part: 'Combining random variables',
      title: 'Means and variances of linear combinations',
      problems: ['c4.linear-transform', 'c4.linear-combination'],
      blocks: [
        ['p', String.raw`A **linear combination** of random variables adds them up with constant weights: $Y = a_0 + a_1 X_1 + a_2 X_2 + \cdots + a_n X_n$, where the $a_i$ are constants (possibly negative). $2X - 4$ is linear; $X^2 + \log X$ is not.`],
        ['key', String.raw`$E(aX + b) = aE(X) + b$. So $E(b) = b$ (a constant's expectation is itself) and $E(aX) = aE(X)$ (constants come out).`],
        ['key', String.raw`$E[g(X) \pm h(X)] = E[g(X)] \pm E[h(X)]$, and in general $E(a_0 + a_1X_1 + \cdots + a_nX_n) = a_0 + a_1E(X_1) + \cdots + a_nE(X_n)$.`],
        ['key', String.raw`$\sigma^2_{aX + c} = a^2\sigma^2_X$. Adding a constant shifts without spreading; multiplying by $a$ scales the spread by $|a|$, the variance by $a^2$.`],
        ['key', String.raw`If $X_1, \ldots, X_n$ are INDEPENDENT: $\sigma^2_{a_0 + a_1X_1 + \cdots + a_nX_n} = a_1^2\sigma^2_{X_1} + \cdots + a_n^2\sigma^2_{X_n}$.`],
        ['why', 'The squares make every term positive: subtracting a variable still ADDS its variance. $X - Y$ is at least as uncertain as $X$ and $Y$ each.'],
        [
          'ex',
          {
            n: '4.8',
            q: String.raw`$X$ and $Y$, amounts of two impurities in a chemical product, are independent with $E(X) = -1$, $E(Y) = 2$, $\sigma^2_X = 2$, $\sigma^2_Y = 3$. Find the mean and variance of $Z = 3X - 2Y + 5$.`,
            a: [
              String.raw`$E(Z) = 3E(X) - 2E(Y) + 5 = 3(-1) - 2(2) + 5 = -2$.`,
              String.raw`$\sigma^2_Z = \text{Var}(3X + (-2)Y) = 3^2\sigma^2_X + (-2)^2\sigma^2_Y = 9(2) + 4(3) = 30$. (The $+5$ does not spread anything.)`,
            ],
            answer: 'E(Z) = −2, σ²_Z = 30.',
            problem: 'c4.linear-combination',
            case: 0,
            checks: () => [
              ['E', 3 * -1 - 2 * 2 + 5, -2, 0],
              ['Var', 9 * 2 + 4 * 3, 30, 0],
            ],
          },
        ],
        ['warn', String.raw`The notes mark this wrong on purpose: $\text{Var}(3X - 2Y) = 9\text{Var}(X) - 4\text{Var}(Y) = 6$. ✗ Coefficients are squared, so the minus sign disappears: the variances add.`],
        ['key', String.raw`Together these give the fact Chapter 7 is built on. If $X_1, \ldots, X_n$ are independent, each with mean $\mu$ and variance $\sigma^2$, then $\bar{X} = \tfrac1n X_1 + \cdots + \tfrac1n X_n$ has mean $\mu$ and variance $n \cdot \tfrac{1}{n^2}\sigma^2 = \sigma^2/n$.`],
        [
          'book',
          'Walpole §4.3',
          [
            ['p', String.raw`The variance rule above needs independence. Without it, the cross term that independence kills stays in, and it is the covariance:`],
            ['p', String.raw`$$\sigma^2_{aX + bY} = a^2\sigma_X^2 + b^2\sigma_Y^2 + 2ab\,\sigma_{XY}.$$`],
            ['why', String.raw`$\text{Var}(aX + bY) = E\{[a(X - \mu_X) + b(Y - \mu_Y)]^2\}$. Expanding the square gives $a^2(X - \mu_X)^2 + b^2(Y - \mu_Y)^2 + 2ab(X - \mu_X)(Y - \mu_Y)$, and the expectations of the three terms are $a^2\sigma_X^2$, $b^2\sigma_Y^2$ and $2ab\,\sigma_{XY}$.`, 'Derivation'],
            [
              'ex',
              {
                n: '4.B',
                title: 'the cost of a part',
                q: String.raw`In the welds table, each rework costs 10 dollars and an old-machine part carries a 5-dollar surcharge, so a part costs $C = 10X + 5Y$ dollars beyond the base price. Find the mean and variance of $C$, using $\mu_X = 0.8$, $\mu_Y = 0.4$, $\sigma_X^2 = 0.56$, $\sigma_Y^2 = 0.24$ and $\sigma_{XY} = 0.08$ from Ex 4.A.`,
                a: [
                  String.raw`$E(C) = 10(0.8) + 5(0.4) = 10$.`,
                  String.raw`$\sigma_C^2 = 10^2(0.56) + 5^2(0.24) + 2(10)(5)(0.08) = 56 + 6 + 8 = 70$, so $\sigma_C = 8.37$.`,
                ],
                answer: 'Mean 10 dollars, variance 70, SD 8.37 dollars. Treating $X$ and $Y$ as independent would give 62: the positive covariance adds spread.',
                checks: () => [
                  ['E(C)', EW((x, y) => 10 * x + 5 * y), 10, 1e-12],
                  ['Var(C) direct', EW((x, y) => (10 * x + 5 * y) ** 2) - 100, 70, 1e-9],
                  ['Var(C) formula', 100 * 0.56 + 25 * 0.24 + 2 * 10 * 5 * COV(), 70, 1e-9],
                  ['σC', Math.sqrt(70), 8.37, 5e-3],
                  ['if independent', 100 * 0.56 + 25 * 0.24, 62, 1e-9],
                ],
              },
            ],
          ],
        ],
        ['bridge', 'A standard deviation is a distance, but how much probability lies within it? For the normal curve Chapter 6 gives an exact answer. The last section gives an answer that holds for every distribution.'],
      ],
    },
    {
      id: '4.4',
      part: 'How much probability is near the mean?',
      title: 'Chebyshev’s theorem',
      source: 'Walpole §4.4',
      blocks: [
        ['p', String.raw`A small variance should mean the variable rarely strays far from its mean. Chebyshev’s theorem makes that precise, with a guarantee that needs nothing but $\mu$ and $\sigma$.`],
        ['key', String.raw`**Chebyshev’s theorem.** For any random variable and any $k > 1$: $P(\mu - k\sigma < X < \mu + k\sigma) \ge 1 - \dfrac{1}{k^2}$.`],
        ['list', [String.raw`Within 2 standard deviations: at least $1 - 1/4 = 75\%$.`, String.raw`Within 3 standard deviations: at least $1 - 1/9 \approx 88.9\%$.`]],
        ['why', [String.raw`Split the variance sum into the values within $k\sigma$ of $\mu$ and those outside. Drop the first part (it is not negative), and in the second each $(x - \mu)^2$ is at least $k^2\sigma^2$:`, String.raw`$$\sigma^2 \ge \sum_{|x - \mu| \ge k\sigma} (x - \mu)^2 f(x) \ge k^2\sigma^2\,P(|X - \mu| \ge k\sigma).$$`, String.raw`Divide by $k^2\sigma^2$: $P(|X - \mu| \ge k\sigma) \le 1/k^2$, and the complement is the theorem.`], 'Derivation'],
        [
          'ex',
          {
            n: '4.C',
            title: 'interruptions, within two standard deviations',
            q: String.raw`For the daily interruptions of Ex 4.1 ($\mu = 1.4$, $\sigma = 1.428$), what does Chebyshev’s theorem say about the days within 2 standard deviations of the mean? What is the actual probability?`,
            a: [
              String.raw`The interval: $1.4 \pm 2(1.428) = (-1.457,\ 4.257)$.`,
              String.raw`Chebyshev: at least $1 - 1/2^2 = 0.75$ of days fall inside it.`,
              String.raw`Actually, the values 0 to 4 are inside and only 5 is outside: $P = 1 - 0.05 = 0.95$.`,
            ],
            answer: 'Chebyshev guarantees at least 0.75; the true value is 0.95. The theorem is a floor that holds for every distribution, so for any particular one it is usually cautious.',
            checks: () => [
              ['σ', Math.sqrt(E((x) => (x - 1.4) ** 2)), 1.428, 5e-4],
              ['lower', 1.4 - 2 * Math.sqrt(2.04), -1.457, 5e-4],
              ['upper', 1.4 + 2 * Math.sqrt(2.04), 4.257, 5e-4],
              ['bound', 1 - 1 / 4, 0.75, 0],
              ['actual', XS.reduce((t, x, i) => t + (Math.abs(x - 1.4) < 2 * Math.sqrt(2.04) ? PS[i] : 0), 0), 0.95, 1e-12],
            ],
          },
        ],
        ['warn', 'Chebyshev gives a lower bound, not the probability. For a normal distribution, 95% lies within 2 standard deviations (Chapter 6), well above the guaranteed 75%.'],
        ['bridge', 'Chapters 3 and 4 were about distributions in general. Chapter 5 turns to particular discrete distributions that come up again and again, each with a formula for its pmf, its mean and its variance.'],
      ],
    },
  ],
  formulas: [
    ['Mean', String.raw`$\mu = E(X) = \sum x\,f(x)$ or $\int x\,f(x)\,dx$`],
    ['Mean of $g(X)$', String.raw`$E[g(X)] = \sum g(x)\,f(x)$ or $\int g(x)\,f(x)\,dx$`],
    ['Variance', String.raw`$\sigma^2 = E[(X - \mu)^2] = E(X^2) - \mu^2$`],
    ['Linear rescaling', String.raw`$E(aX + b) = aE(X) + b$, $\;\sigma^2_{aX + b} = a^2\sigma_X^2$`],
    ['Sums', String.raw`$E(aX + bY) = aE(X) + bE(Y)$ always`],
    ['Independent sums', String.raw`$\sigma^2_{aX + bY} = a^2\sigma_X^2 + b^2\sigma_Y^2$`],
    ['Covariance, correlation', String.raw`$\sigma_{XY} = E(XY) - \mu_X\mu_Y$, $\;\rho = \sigma_{XY}/(\sigma_X\sigma_Y)$`, 'Walpole §4.2'],
    ['Sums in general', String.raw`$\sigma^2_{aX + bY} = a^2\sigma_X^2 + b^2\sigma_Y^2 + 2ab\,\sigma_{XY}$`, 'Walpole §4.3'],
    ['Chebyshev', String.raw`$P(|X - \mu| < k\sigma) \ge 1 - 1/k^2$`, 'Walpole §4.4'],
  ],
};
