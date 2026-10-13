/**
 * Chapter 3, rewritten from the teacher's notes (Ch 3, pp. 41–46), laid out like FLUX's notes.
 * Example numbers are the notes'; the textbook's material (Walpole §3.3, a density with an unknown
 * constant, and §3.4, joint distributions) is
 * marked, and its examples are lettered (3.A, 3.B). Chapter 4 reuses the welds table of Ex 3.B.
 */
import { binomPmf } from '../stats/dist.js';

/** Simpson's rule, for checking the integrals the notes do by hand. */
const integrate = (f, a, b, n = 2000) => {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
};
const f35 = (x) => (x >= -1 && x <= 2 ? (x * x) / 3 : 0);

/** Ex 3.B: two welds per part. WELDS[y][x] = P(X = x, Y = y), x defective welds, y = 1 for the old machine. */
export const WELDS = [
  [0.3, 0.2, 0.1],
  [0.1, 0.2, 0.1],
];
const gX = (x) => WELDS[0][x] + WELDS[1][x];
const hY = (y) => WELDS[y].reduce((a, b) => a + b, 0);

export default {
  ch: '3',
  title: 'Random variables and probability distributions',
  lede: 'A random variable puts a number on each outcome of an experiment, and its distribution says how likely each number is. This chapter sets up the two kinds, discrete (counts, with probabilities listed value by value) and continuous (measurements, with probability as area under a curve), and the cumulative distribution function that works for both. Chapters 5 and 6 are catalogues of the distributions built here.',
  sections: [
    {
      id: '3.1',
      part: 'Numbers from outcomes',
      title: 'Random variables',
      problems: ['c3.discrete-continuous'],
      blocks: [
        ['p', 'Chapter 2’s outcomes were words: RB, heads then a 4, defective. Most questions are about a number computed from the outcome: how many red balls, how long the wait. Making that number the object of study is the step from probability to statistics.'],
        ['def', 'Random variable.', 'A variable whose numerical value is set by the outcome of a random experiment: exactly one number for each sample point. Written with capital letters, $X$, $Y$; a value it takes, with lower case, $x$, $y$.'],
        [
          'ex',
          {
            n: '3.1',
            q: 'Two balls are drawn in succession, without replacement, from an urn with 4 red and 3 black balls. $Y$ is the number of red balls drawn. List its values.',
            data: { head: ['Sample point', '$y$'], rows: [['RR', 2], ['RB', 1], ['BR', 1], ['BB', 0]] },
            a: ['Each sample point gets one value of $Y$: count its reds.'],
            answer: '$Y$ takes the values 0, 1, 2: a discrete random variable.',
            problem: 'c3.discrete-continuous',
            case: 0,
          },
        ],
        ['p', 'Two sample points, RB and BR, give the same value $y = 1$. That is normal: a random variable can map many outcomes to one number, and $P(Y = 1)$ collects all of them.'],
        [
          'ex',
          {
            n: '3.2',
            q: '$X$ is the waiting time, in hours, between successive speeders spotted by a radar unit. What values can it take?',
            a: ['Any $x \\ge 0$: a time can be any number, not just whole ones.'],
            answer: 'A continuous random variable.',
            problem: 'c3.discrete-continuous',
            case: 1,
          },
        ],
        ['list', ['A **discrete** random variable takes a countable set of separate values, usually whole numbers you can list (counts).', 'A **continuous** random variable takes any value in a range, decimals and fractions included (measurements).']],
        ['warn', 'Money and scores are recorded in whole cents or points but are usually treated as continuous; what matters is whether the variable counts or measures.'],
        ['bridge', 'The two kinds need two different ways of attaching probabilities. A discrete variable gets a probability at each value (Part II, first); a continuous one gets probability only on intervals, as area (Part II, second).'],
      ],
    },
    {
      id: '3.2',
      part: 'Distributions of one variable',
      title: 'Discrete probability distributions',
      lab: 'dist',
      problems: ['c3.build-distribution', 'c3.pmf-table', 'c3.pmf-constant'],
      blocks: [
        ['p', 'A discrete distribution is a list: each value the variable can take, and its probability. The list can be a table, a formula, or a graph.'],
        ['def', 'Probability mass function (pmf).', String.raw`$f(x) = P(X = x)$, listed for every value $x$. It must satisfy (1) $f(x) \ge 0$ and (2) $\sum_x f(x) = 1$.`],
        ['why', 'The values of $X$ are mutually exclusive (it cannot be 1 and 2 at once) and between them they cover every outcome, so their probabilities must add to $P(S) = 1$. Exercises that ask for the constant $c$ in a pmf use exactly this: set the sum to 1 and solve.'],
        [
          'ex',
          {
            n: '3.3',
            q: 'A car agency sells 50% of its inventory of a foreign car with side airbags. Find the probability distribution of $X$, the number of cars with side airbags among the next 4 sold.',
            a: [
              'Each car has airbags with probability 1/2, independently. The number of orders that give $x$ cars with airbags out of 4 is $_4C_x$, and each order has probability $(1/2)^4 = 1/16$.',
              String.raw`$f(0) = \tfrac{1}{16}$, $f(1) = {}_4C_1 \tfrac{1}{16} = \tfrac{4}{16}$, $f(2) = {}_4C_2 \tfrac{1}{16} = \tfrac{6}{16}$, $f(3) = \tfrac{4}{16}$, $f(4) = \tfrac{1}{16}$.`,
              'In one formula: $f(x) = {}_4C_x\,(1/2)^4$ for $x = 0, 1, 2, 3, 4$. (This is the binomial distribution of Chapter 5.)',
            ],
            answer: 'f(x) = 1/16, 4/16, 6/16, 4/16, 1/16 for x = 0, …, 4: symmetric about 2.',
            problem: 'c3.build-distribution',
            case: 0,
            show: 'dist:bin4',
            checks: () => [
              ...[1, 4, 6, 4, 1].map((k, x) => [`f(${x})`, binomPmf(x, 4, 0.5), k / 16, 1e-12]),
              ['sum', [0, 1, 2, 3, 4].reduce((t, x) => t + binomPmf(x, 4, 0.5), 0), 1, 1e-12],
            ],
          },
        ],
        ['p', 'Plot a pmf as spikes (a line at each $x$ of height $f(x)$) or as a **probability histogram**: a bar of width 1 centered at each $x$, so each bar’s AREA is its probability. The area picture is the bridge to continuous variables, where area is the only way probability is shown.'],
        ['p', 'Many questions ask for "at most" or "up to": the probability accumulated from the left. That running total has its own name.'],
        ['def', 'Cumulative distribution function (CDF).', String.raw`$F(x) = P(X \le x) = \sum_{t \le x} f(t)$, for every real $x$.`],
        ['fix', String.raw`The notes' definition box writes the sum over $t < x$. It must be $t \le x$: $F(x)$ is $P(X \le x)$, which includes $f(x)$ itself (in Ex 3.4, $F(0) = f(0) = 1/16$, not 0).`],
        [
          'ex',
          {
            n: '3.4',
            q: 'Find the CDF of $X$ in Example 3.3.',
            a: [
              String.raw`Add up the pmf: $F(0) = \tfrac{1}{16}$, $F(1) = \tfrac{5}{16}$, $F(2) = \tfrac{11}{16}$, $F(3) = \tfrac{15}{16}$, $F(4) = 1$.`,
              String.raw`Between the values it stays flat: $F(x) = 0$ for $x < 0$; $\tfrac{1}{16}$ for $0 \le x < 1$; $\tfrac{5}{16}$ for $1 \le x < 2$; $\tfrac{11}{16}$ for $2 \le x < 3$; $\tfrac{15}{16}$ for $3 \le x < 4$; $1$ for $x \ge 4$.`,
            ],
            answer: 'A step function: it jumps by f(x) at each value x, and is right-continuous (the filled dot is on the left end of each step).',
            checks: () => {
              let c = 0;
              return [1, 5, 11, 15, 16].map((k, x) => {
                c += binomPmf(x, 4, 0.5);
                return [`F(${x})`, c, k / 16, 1e-12];
              });
            },
          },
        ],
        ['key', 'For a discrete $X$: $P(a < X \\le b) = F(b) - F(a)$. Watch the endpoints: $P(X < 3) = P(X \\le 2) = F(2)$.'],
        ['p', String.raw`Going back is as easy: the size of each jump is the pmf, $f(x) = F(x) - F(x - 1)$ for integer values. In Ex 3.4, $f(2) = F(2) - F(1) = \tfrac{11}{16} - \tfrac{5}{16} = \tfrac{6}{16}$.`],
      ],
    },
    {
      id: '3.3',
      title: 'Continuous probability distributions',
      lab: 'dist',
      problems: ['c3.density-cdf', 'c3.pdf-constant', 'c3.cdf', 'c4.density-k'],
      blocks: [
        ['p', String.raw`For a continuous $X$, any single value has probability 0: there are infinitely many values between 0 and 1, so $P(X = 0.5) = 1/\infty = 0$. Probability lives on intervals instead.`],
        ['p', 'Picture a probability histogram of a measurement with narrower and narrower bars: the bar tops smooth into a curve, and the area under the curve over an interval is the probability of landing in it. That curve is the density.'],
        ['def', 'Probability density function (pdf).', String.raw`A function $f(x)$ with (1) $f(x) \ge 0$ for all $x$; (2) $\int_{-\infty}^{\infty} f(x)\,dx = 1$; and (3) $P(a < X < b) = \int_a^b f(x)\,dx$, the area under $f$ between $a$ and $b$.`],
        ['key', 'For a continuous $X$, $P(a < X < b) = P(a \\le X \\le b)$: including an endpoint adds probability 0. (Not so for a discrete $X$.)'],
        [
          'ex',
          {
            n: '3.5',
            q: String.raw`The error $X$ (°C) in the reaction temperature of a lab experiment has density $f(x) = \frac{x^2}{3}$ for $-1 < x < 2$, and 0 elsewhere. (a) Verify that $f$ is a density. (b) Find $P(0 < X \le 1)$.`,
            a: [
              String.raw`(a) $f(x) = x^2/3 \ge 0$ everywhere. And $\int_{-1}^{2} \frac{x^2}{3}\,dx = \frac{x^3}{9}\Big|_{-1}^{2} = \frac{8}{9} - \frac{-1}{9} = 1$. ✓`,
              String.raw`(b) $P(0 < X \le 1) = \int_0^1 \frac{x^2}{3}\,dx = \frac{x^3}{9}\Big|_0^1 = \frac{1}{9}$.`,
            ],
            answer: '(b) 1/9 = 0.1111.',
            problem: 'c3.density-cdf',
            case: 0,
            checks: () => [
              ['total area', integrate(f35, -1, 2), 1, 1e-9],
              ['P(0<X≤1)', integrate(f35, 0, 1), 1 / 9, 1e-9],
              ['f(2) > 1', f35(2), 4 / 3, 1e-12],
            ],
          },
        ],
        ['ti', ['MATH ▸ 9:fnInt(, then fill in the template: lower 0, upper 1, the function X²/3, variable X.', 'ENTER gives 0.1111111111.']],
        ['warn', String.raw`A density is not a probability, and it can be bigger than 1: in Ex 3.5, $f(2) = 4/3$. Only its AREA over an interval is a probability.`],
        ['def', 'CDF of a continuous $X$:', String.raw`$F(x) = P(X \le x) = \int_{-\infty}^{x} f(t)\,dt$. Then $P(a < X < b) = F(b) - F(a)$, and $f(x) = F'(x)$ wherever the derivative exists.`],
        ['why', String.raw`$F(x)$ is the area to the left of $x$. Moving $x$ right by a small $h$ adds a thin strip of area about $f(x)\,h$, so $F(x + h) - F(x) \approx f(x)\,h$, and dividing by $h$ gives $F'(x) = f(x)$: the fundamental theorem of calculus.`],
        [
          'ex',
          {
            n: '3.6',
            q: 'For the density of Example 3.5, find $F(x)$ and use it to find $P(0 < X \\le 1)$.',
            a: [
              String.raw`For $-1 < x < 2$: $F(x) = \int_{-1}^{x} \frac{t^2}{3}\,dt = \frac{t^3}{9}\Big|_{-1}^{x} = \frac{x^3 + 1}{9}$.`,
              String.raw`So $F(x) = 0$ for $x < -1$; $\frac{x^3 + 1}{9}$ for $-1 \le x < 2$; $1$ for $x \ge 2$.`,
              String.raw`$P(0 < X \le 1) = F(1) - F(0) = \frac{2}{9} - \frac{1}{9} = \frac{1}{9}$, as before.`,
            ],
            checks: () => [
              ['F(1)', integrate(f35, -1, 1), 2 / 9, 1e-9],
              ['F(0)', integrate(f35, -1, 0), 1 / 9, 1e-9],
              ['F(1.5) formula', integrate(f35, -1, 1.5), (1.5 ** 3 + 1) / 9, 1e-9],
            ],
          },
        ],
        ['key', 'Every CDF is non-decreasing, from 0 on the far left to 1 on the far right. A discrete CDF is a step function; a continuous one is a continuous curve.'],
        [
          'book',
          'Walpole §3.3',
          [
            ['p', String.raw`Often the density is given only up to a constant: $f(x) = kx$, or $k(x + 1)$, on some interval. Property (2), total area 1, is what fixes $k$: integrate, set the result equal to 1, and solve. After that the density is complete, and every probability (and in Chapter 4, the mean) comes from it.`],
            [
              'ex',
              {
                n: '3.A',
                title: 'finding the constant',
                q: String.raw`$X$ has density $f(x) = kx$ for $0 \le x \le 4$, and 0 elsewhere. (a) Find $k$. (b) Find $P(1 \le X \le 3)$. (c) Find $E(X)$ (§4.1).`,
                a: [
                  String.raw`(a) $\int_0^4 kx\,dx = k\,\dfrac{x^2}{2}\Big|_0^4 = 8k = 1$, so $k = \dfrac{1}{8} = 0.125$.`,
                  String.raw`(b) $P(1 \le X \le 3) = \int_1^3 \dfrac{x}{8}\,dx = \dfrac{x^2}{16}\Big|_1^3 = \dfrac{9 - 1}{16} = 0.5$.`,
                  String.raw`(c) $E(X) = \int_0^4 x \cdot \dfrac{x}{8}\,dx = \dfrac{x^3}{24}\Big|_0^4 = \dfrac{64}{24} = 2.667$.`,
                ],
                answer: String.raw`$k = 1/8$, $P(1 \le X \le 3) = 0.5$, $E(X) = 8/3 \approx 2.667$: above the middle of the interval, 2, because the density rises to the right.`,
                checks: () => {
                  const f = (x) => (x >= 0 && x <= 4 ? x / 8 : 0);
                  return [
                    ['total area', integrate(f, 0, 4), 1, 1e-9],
                    ['k', 1 / 8, 0.125, 0],
                    ['P(1≤X≤3)', integrate(f, 1, 3), 0.5, 1e-9],
                    ['E(X)', integrate((x) => x * f(x), 0, 4), 2.667, 5e-4],
                  ];
                },
              },
            ],
            ['warn', String.raw`$k$ is not a probability and can be larger than 1: for $f(x) = kx^2$ on $[0, 1]$, $k = 3$. Only the total area has to be 1.`],
          ],
        ],
        ['bridge', 'One variable at a time covers most of the course. But a part has more than one feature, a student more than one score, and the interesting question is often how two variables move together. That takes a joint distribution.'],
      ],
    },
    {
      id: '3.4',
      part: 'Two variables at once',
      title: 'Joint distributions',
      source: 'Walpole §3.4',
      blocks: [
        ['p', String.raw`Two discrete random variables $X$ and $Y$ measured on the same outcome have a **joint probability distribution**: a table of $f(x, y) = P(X = x \text{ and } Y = y)$, one cell for each pair of values. It is a two-way table of Chapter 2, with probabilities in the cells instead of counts.`],
        ['def', 'Joint pmf.', String.raw`$f(x, y) \ge 0$ for every pair, $\sum_x \sum_y f(x, y) = 1$, and $P((X, Y) \in A) = \sum_{A} f(x, y)$ for any region $A$ of pairs.`],
        ['def', 'Marginal distributions.', String.raw`$g(x) = \sum_y f(x, y)$ and $h(y) = \sum_x f(x, y)$: the column and row totals. Each is the ordinary distribution of one variable, ignoring the other.`],
        ['def', 'Conditional distribution.', String.raw`$f(x \mid y) = \dfrac{f(x, y)}{h(y)}$: one row of the table, rescaled to add to 1. It is the distribution of $X$ among outcomes with that value of $Y$.`],
        ['def', 'Independence.', String.raw`$X$ and $Y$ are independent if $f(x, y) = g(x)\,h(y)$ for EVERY pair $(x, y)$. One cell that fails is enough to show they are dependent.`],
        [
          'ex',
          {
            n: '3.B',
            title: 'welds and machines',
            q: 'Each part has two welds. For a randomly chosen part, $X$ is the number of welds that need rework and $Y = 1$ if the part came from the older of two machines ($Y = 0$ for the newer). The joint distribution is below. (a) Check it is a joint pmf. (b) Find the marginal distributions. (c) Find the distribution of $X$ for parts from the old machine, and $P(X \\ge 1 \\mid Y = 1)$. (d) Are $X$ and $Y$ independent?',
            data: {
              head: ['$f(x, y)$', '$x = 0$', '$x = 1$', '$x = 2$', '$h(y)$'],
              rows: [
                ['$y = 0$ (new)', '0.30', '0.20', '0.10', '0.60'],
                ['$y = 1$ (old)', '0.10', '0.20', '0.10', '0.40'],
                ['$g(x)$', '0.40', '0.40', '0.20', '1'],
              ],
            },
            a: [
              '(a) Every cell is at least 0, and $0.30 + 0.20 + 0.10 + 0.10 + 0.20 + 0.10 = 1$. ✓',
              String.raw`(b) Column totals: $g(0) = 0.40$, $g(1) = 0.40$, $g(2) = 0.20$. Row totals: $h(0) = 0.60$, $h(1) = 0.40$.`,
              String.raw`(c) Divide the $y = 1$ row by $h(1) = 0.40$: $f(0 \mid 1) = 0.25$, $f(1 \mid 1) = 0.50$, $f(2 \mid 1) = 0.25$. So $P(X \ge 1 \mid Y = 1) = 0.50 + 0.25 = 0.75$.`,
              String.raw`(d) Try the first cell: $f(0, 0) = 0.30$, but $g(0)\,h(0) = (0.40)(0.60) = 0.24$. They differ, so $X$ and $Y$ are dependent.`,
            ],
            answer: 'Dependent: 75% of old-machine parts need some rework, against 50% of new-machine parts ($P(X \\ge 1 \\mid Y = 0) = 0.30/0.60$).',
            checks: () => [
              ['total', hY(0) + hY(1), 1, 1e-12],
              ['g(0)', gX(0), 0.4, 1e-12],
              ['g(1)', gX(1), 0.4, 1e-12],
              ['g(2)', gX(2), 0.2, 1e-12],
              ['h(0)', hY(0), 0.6, 1e-12],
              ['h(1)', hY(1), 0.4, 1e-12],
              ['f(0|1)', WELDS[1][0] / hY(1), 0.25, 1e-12],
              ['f(1|1)', WELDS[1][1] / hY(1), 0.5, 1e-12],
              ['f(2|1)', WELDS[1][2] / hY(1), 0.25, 1e-12],
              ['P(X≥1|Y=1)', (WELDS[1][1] + WELDS[1][2]) / hY(1), 0.75, 1e-12],
              ['P(X≥1|Y=0)', (WELDS[0][1] + WELDS[0][2]) / hY(0), 0.5, 1e-12],
              ['g(0)h(0)', gX(0) * hY(0), 0.24, 1e-12],
            ],
          },
        ],
        ['warn', 'To show independence you must check every cell; to show dependence one cell is enough. A table whose rows are multiples of each other is independent.'],
        ['p', String.raw`Two continuous variables work the same way with a **joint density** $f(x, y)$: probabilities are volumes under the surface, $P((X, Y) \in A) = \iint_A f(x, y)\,dx\,dy$, and the marginals integrate out the other variable instead of summing it.`],
        ['bridge', 'A distribution is a whole list of numbers. Chapter 4 boils it down to two: the mean, where the distribution is centered, and the variance, how far it spreads. It also measures how two variables in a joint table move together, using the welds table above.'],
      ],
    },
  ],
  formulas: [
    ['pmf', String.raw`$f(x) = P(X = x)$, $\;f(x) \ge 0$, $\;\sum_x f(x) = 1$`],
    ['Discrete CDF', String.raw`$F(x) = P(X \le x) = \sum_{t \le x} f(t)$`],
    ['Probability from a discrete CDF', String.raw`$P(a < X \le b) = F(b) - F(a)$`],
    ['pdf', String.raw`$f(x) \ge 0$, $\;\int_{-\infty}^{\infty} f(x)\,dx = 1$, $\;P(a < X < b) = \int_a^b f(x)\,dx$`],
    ['Continuous CDF', String.raw`$F(x) = \int_{-\infty}^{x} f(t)\,dt$, $\;f(x) = F'(x)$`],
    ['A single value', String.raw`$P(X = a) = 0$ when $X$ is continuous`],
    ['Marginals', String.raw`$g(x) = \sum_y f(x, y)$, $\;h(y) = \sum_x f(x, y)$`, 'Walpole §3.4'],
    ['Conditional distribution', String.raw`$f(x \mid y) = f(x, y) / h(y)$`, 'Walpole §3.4'],
    ['Independence', String.raw`$f(x, y) = g(x)\,h(y)$ for every $(x, y)$`, 'Walpole §3.4'],
  ],
};
