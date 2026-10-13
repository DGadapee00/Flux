/**
 * Chapter 6, rewritten from the teacher's notes (Ch 6, pp. 72–85), laid out like FLUX's notes. The
 * notes pose these examples and leave the working for class; every answer here is computed, by the
 * printed z table (Table A.3) and exactly, as the TI-84 gives it. Example numbers are the notes'; the
 * textbook's material (Walpole §6.6, exponential and gamma) is marked, and its example is lettered.
 */
import { normCdf, normInv, expCdf, poisPmf } from '../stats/dist.js';
import { zTable as zLook, zForArea as zAreaLook } from '../stats/tables.js';

// The printed-table readings, as numbers: the area for z, and the z for an area.
const zTable = (z) => zLook(z).value;
const zForArea = (a) => zAreaLook(a).z;

const GREYHOUND = [31.35, 32.52, 32.06, 31.26, 31.91, 32.37];

export default {
  ch: '6',
  title: 'Some continuous probability distributions',
  lede: 'Chapter 5’s distributions counted; this chapter’s measure. The uniform is the simplest density, a flat rectangle. The normal is the most important one in the course: heights, errors and times often follow it, and in Chapter 7 so do sample means, whatever the population. The chapter ends with a way to check whether data look normal, and the textbook adds the exponential for waiting times.',
  sections: [
    {
      id: '6.1',
      part: 'A flat density',
      title: 'The continuous uniform distribution',
      lab: 'dist',
      problems: ['c6.uniform-conditional', 'c6.uniform', 'c6.uniform-wait'],
      blocks: [
        ['key', String.raw`$X$ uniform on $[A, B]$: $f(x) = \dfrac{1}{B - A}$ for $A \le x \le B$, and 0 elsewhere. Mean $\mu = \dfrac{A + B}{2}$, variance $\sigma^2 = \dfrac{(B - A)^2}{12}$.`],
        ['p', 'The density is a rectangle of base $B - A$ and height $1/(B - A)$ (area 1), so it is also called the rectangular distribution. A probability is the area of a slice of the rectangle: width × height.'],
        ['p', String.raw`It models a quantity that is equally likely to fall anywhere in a range, and nowhere outside it. The mean is the midpoint, by symmetry. The CDF is the fraction of the way across: $F(x) = \dfrac{x - A}{B - A}$ for $A \le x \le B$.`],
        [
          'ex',
          {
            n: '6.1',
            q: 'The yearly height increase $X$ of cedar trees is uniform between 6 and 11 inches. (a) Sketch the density. Find the probability a tree grows (b) between 9 and 10 inches; (c) less than 8 inches; (d) less than 7 inches, given it grows less than 8; (e) exactly 7 inches.',
            a: [
              String.raw`(a) A rectangle over $6 \le x \le 11$ of height $\frac{1}{11 - 6} = \frac{1}{5} = 0.2$.`,
              String.raw`(b) $P(9 < X < 10) = (10 - 9)(0.2) = 0.2$.`,
              String.raw`(c) $P(X < 8) = (8 - 6)(0.2) = 0.4$.`,
              String.raw`(d) $P(X < 7 \mid X < 8) = \dfrac{P(X < 7 \text{ and } X < 8)}{P(X < 8)} = \dfrac{P(X < 7)}{P(X < 8)} = \dfrac{0.2}{0.4} = 0.5$.`,
              String.raw`(e) $P(X = 7) = 0$: a single value has no width.`,
            ],
            answer: '(b) 0.2 (c) 0.4 (d) 0.5 (e) 0. Mean 8.5 inches.',
            problem: 'c6.uniform-conditional',
            case: 0,
            show: 'dist:cedar',
            checks: () => [
              ['(b)', (10 - 9) / 5, 0.2, 1e-12],
              ['(c)', (8 - 6) / 5, 0.4, 1e-12],
              ['(d)', (7 - 6) / 5 / ((8 - 6) / 5), 0.5, 1e-12],
              ['mean', (6 + 11) / 2, 8.5, 0],
            ],
          },
        ],
        ['p', 'Part (d) shows what conditioning does to a uniform: given $X < 8$, the tree’s growth is uniform on 6 to 8, so half of that range lies below 7.'],
        ['p', String.raw`Conditioning works from the other end too, and that is the form waiting-time questions take: "you have already waited $w$ minutes; what is the chance of an arrival in the next $v$?" Given $X > c$, $X$ is uniform on what is left of the interval, $[c, B]$, so the window of width $v$ gets its share of what is left: $P(X \le c + v \mid X > c) = \dfrac{v}{B - c}$. For the cedars, given more than 8 inches of growth, $P(X < 10 \mid X > 8) = \dfrac{10 - 8}{11 - 8} = \dfrac{2}{3}$.`],
        ['warn', String.raw`Dividing by the whole width $B - A$ ignores what you know. Once $c$ minutes have passed with no arrival, only $B - c$ minutes are possible.`],
        ['bridge', 'A uniform has hard edges and no favourite value. Most measurements cluster around a center and thin out on both sides, the shape Part II describes.'],
      ],
    },
    {
      id: '6.2',
      part: 'The normal curve',
      title: 'The normal distribution',
      lab: 'dist',
      problems: ['c6.z-area', 'c6.z-find', 'c6.normal-prob', 'c6.normal-percentile', 'c6.normal-count', 'c6.both-independent', 'c6.normal-spec'],
      blocks: [
        ['p', 'The normal (Gaussian) curve is the bell shape of measurement: heights, weights, errors in a reading, scores on a long test. It matters even more because of Chapter 7: the mean of a large sample is close to normal whatever the population looks like.'],
        ['key', String.raw`$X \sim N(\mu, \sigma^2)$ has density $f(x) = \dfrac{1}{\sqrt{2\pi}\,\sigma} e^{-\frac{(x - \mu)^2}{2\sigma^2}}$ for all real $x$. $E(X) = \mu$, $\text{Var}(X) = \sigma^2$.`],
        [
          'list',
          [
            'It is bell-shaped and symmetric about $\\mu$ (but not every bell-shaped curve is normal).',
            'Its support is every real number.',
            'Small $\\sigma^2$: tall and thin. Large $\\sigma^2$: fat and flat.',
            'Probabilities are areas under the curve: $P(x_1 < X < x_2) = \\int_{x_1}^{x_2} f(x)\\,dx$, found from a table or the calculator, never by hand.',
          ],
        ],
        ['def', 'Standard normal $Z$:', 'the normal distribution with mean 0 and variance 1. Table A.3 gives the area to the LEFT of each $z$: $P(Z < z)$.'],
        [
          'ex',
          {
            n: '6.2',
            q: 'Find $P(Z < 0.52)$.',
            a: ['Table A.3: row 0.5, column .02.'],
            answer: 'P(Z < 0.52) = 0.6985.',
            problem: 'c6.z-area',
            case: 0,
            show: 'dist:z052',
            checks: () => [
              ['table', zTable(0.52), 0.6985, 0],
              ['exact', normCdf(0.52), 0.6985, 5e-5],
            ],
          },
        ],
        ['key', String.raw`Right tail: $P(Z > z) = 1 - P(Z < z)$. Between: $P(a < Z < b) = P(Z < b) - P(Z < a)$.`],
        ['key', String.raw`Any normal becomes standard by $Z = \dfrac{X - \mu}{\sigma}$: how many standard deviations $x$ is from the mean.`],
        ['why', String.raw`$Z = \tfrac{1}{\sigma}X - \tfrac{\mu}{\sigma}$ is a linear function of $X$, so by §4.3 its mean is $\tfrac{\mu}{\sigma} - \tfrac{\mu}{\sigma} = 0$ and its variance is $\tfrac{1}{\sigma^2}\sigma^2 = 1$. A linear function of a normal variable is again normal, so $Z$ is standard normal, and one table serves every normal distribution.`],
        ['p', String.raw`Reading Table A.3 at $z = \pm 1, \pm 2, \pm 3$ gives three areas worth remembering, the **empirical rule**. For every normal distribution:`],
        ['list', [String.raw`about 68% of values lie within $1\sigma$ of $\mu$ ($0.8413 - 0.1587 = 0.6826$);`, String.raw`about 95% within $2\sigma$ ($0.9772 - 0.0228 = 0.9544$);`, String.raw`about 99.7% within $3\sigma$ ($0.9987 - 0.0013 = 0.9974$).`]],
        ['p', 'Compare Chebyshev’s theorem (§4.4), which guarantees only 75% within $2\\sigma$ for ANY distribution. Knowing the shape is normal buys a much sharper statement.'],
        [
          'ex',
          {
            n: '6.3',
            q: 'Heights of three-year-old girls are approximately normal with mean 38.72 inches and standard deviation 3.17. (a) What proportion are shorter than 35 inches? (b) Find the 20th percentile of height.',
            a: [
              String.raw`(a) $z = \dfrac{35 - 38.72}{3.17} = -1.17$, and $P(Z < -1.17) = 0.1210$ from the table. Calculator: normalcdf$(-10^{99}, 35, 38.72, 3.17) = 0.1203$.`,
              String.raw`(b) Find $z$ with 0.20 to its left: the table's closest area is 0.2005 at $z = -0.84$. Then $x = \mu + z\sigma = 38.72 + (-0.84)(3.17) = 36.06$. Calculator: invNorm$(0.2, 38.72, 3.17) = 36.05$.`,
            ],
            answer: '(a) about 12% (0.1210 by the table, 0.1203 exact). (b) about 36.05 inches.',
            problem: 'c6.normal-prob',
            case: 0,
            show: 'dist:heights',
            checks: () => [
              ['(a) z', Math.round(((35 - 38.72) / 3.17) * 100) / 100, -1.17, 0],
              ['(a) table', zTable(-1.17), 0.121, 0],
              ['(a) exact', normCdf(35, 38.72, 3.17), 0.1203, 5e-5],
              ['(b) table z', zForArea(0.2), -0.84, 0],
              ['(b) table x', 38.72 - 0.84 * 3.17, 36.06, 5e-3],
              ['(b) exact', normInv(0.2, 38.72, 3.17), 36.05, 5e-3],
            ],
          },
        ],
        ['ti', ['2nd VARS ▸ 2:normalcdf(: lower, upper, $\\mu$, $\\sigma$. Use $-10^{99}$ (typed -1E99) for "no lower bound" and $10^{99}$ for "no upper bound".', '2nd VARS ▸ 3:invNorm(: area to the LEFT, $\\mu$, $\\sigma$. It returns the value with that area below it (a percentile).']],
        [
          'ex',
          {
            n: '6.4',
            q: 'Finishing times in the New York City 10-km run are normal with mean 61 minutes and standard deviation 9. (a) What percentage finish between 55 and 70 minutes? (b) What time must a runner beat to be in the fastest 10%? (c) Hailey and Jack both ran, independently. What is the probability both finish within an hour?',
            a: [
              String.raw`(a) $z_1 = \dfrac{55 - 61}{9} = -0.67$, $z_2 = \dfrac{70 - 61}{9} = 1.00$. $P = 0.8413 - 0.2514 = 0.5899$ by the table; normalcdf$(55, 70, 61, 9) = 0.5889$.`,
              String.raw`(b) The FASTEST 10% have the SHORTEST times: the 10th percentile. Table: area 0.1003 at $z = -1.28$, so $x = 61 - 1.28(9) = 49.48$. invNorm$(0.1, 61, 9) = 49.47$ minutes.`,
              String.raw`(c) One runner: $P(X < 60) = P(Z < -0.11) = 0.4562$ (exact 0.4557). Independent, so multiply: $0.4562^2 = 0.2081$ (exact 0.2077).`,
            ],
            answer: '(a) about 59% (b) about 49.5 minutes (c) about 0.208.',
            problem: 'c6.normal-prob',
            case: 1,
            show: 'dist:run',
            checks: () => [
              ['(a) table', zTable(1) - zTable(-0.67), 0.5899, 1e-9],
              ['(a) exact', normCdf(70, 61, 9) - normCdf(55, 61, 9), 0.5889, 5e-5],
              ['(b) table z', zForArea(0.1), -1.28, 0],
              ['(b) exact', normInv(0.1, 61, 9), 49.47, 5e-3],
              ['(c) one, table', zTable(-0.11), 0.4562, 0],
              ['(c) both, table', zTable(-0.11) ** 2, 0.2081, 5e-5],
              ['(c) both, exact', normCdf(60, 61, 9) ** 2, 0.2077, 5e-5],
            ],
          },
        ],
        ['warn', '"Fastest" means smallest time, so the fastest 10% is the LEFT tail. Draw the curve and shade before you use invNorm, which always wants the area to the left.'],
        ['def', String.raw`$z_\alpha$:`, 'the $z$ value with area $\\alpha$ to its RIGHT under the standard normal curve (so area $1 - \\alpha$ to its left).'],
        [
          'ex',
          {
            n: '6.5',
            q: String.raw`Find $z_{0.1}$.`,
            a: [String.raw`Area to the left is $1 - 0.1 = 0.9$. The table's closest area is 0.8997 at $z = 1.28$. Calculator: invNorm$(0.9) = 1.2816$.`],
            answer: String.raw`$z_{0.1} = 1.28$.`,
            problem: 'c6.z-alpha',
            case: 0,
            checks: () => [
              ['table', zForArea(0.9), 1.28, 0],
              ['exact', normInv(0.9), 1.2816, 5e-5],
            ],
          },
        ],
        ['key', String.raw`Worth knowing by heart: $z_{0.05} = 1.645$, $z_{0.025} = 1.96$, $z_{0.005} = 2.576$.`],
        ['p', String.raw`These $z_\alpha$ values return in Chapters 8 and 9 as the critical values of confidence intervals and tests: a 95% interval leaves $\alpha/2 = 0.025$ in each tail, and uses $z_{0.025} = 1.96$.`],
        ['bridge', 'Every calculation in this part assumed the variable is normal. With real data that is a claim to check, not a given: Part III.'],
      ],
    },
    {
      id: '6.3',
      part: 'Is it normal?',
      title: 'Assessing normality: the normal probability plot',
      lab: 'npp',
      problems: ['c6.normal-scores', 'c6.normal-plot'],
      blocks: [
        ['p', 'A **normal probability plot** (Q-Q plot) checks whether data could come from a normal population:'],
        [
          'steps',
          [
            'Sort the data in ascending order.',
            String.raw`For the $i$th smallest of $n$ values, find the theoretical quantile $z_i = \Phi^{-1}\!\left(\frac{i - 0.5}{n}\right)$: the $z$ with area $\frac{i - 0.5}{n}$ to its left.`,
            'Plot the points with $z_i$ on the x-axis and the sorted data on the y-axis.',
          ],
        ],
        ['key', 'Data from a normal population give a plot that is roughly a straight line. A curve means skew; an S shape means tails heavier or lighter than a normal’s.'],
        ['why', String.raw`If the data are normal, the $i$th smallest of $n$ values should sit near the population’s $\frac{i - 0.5}{n}$ quantile, which is $\mu + \sigma z_i$. Plotted against $z_i$, those points fall on a line with intercept $\mu$ and slope $\sigma$. A different shape bends the line.`],
        [
          'ex',
          {
            n: '6.6',
            q: 'Finishing times (seconds) of a greyhound in six races: 31.35, 32.52, 32.06, 31.26, 31.91, 32.37. Is it reasonable that finishing time is normally distributed?',
            data: {
              head: ['$i$', 'sorted time', '$(i - 0.5)/6$', '$z_i$'],
              rows: [...GREYHOUND]
                .sort((a, b) => a - b)
                .map((x, i) => [i + 1, x.toFixed(2), ((i + 0.5) / 6).toFixed(4), normInv((i + 0.5) / 6).toFixed(3)]),
            },
            a: [
              'Sort the times and compute the six quantiles (table above). They are symmetric: $\\pm 1.383$, $\\pm 0.674$, $\\pm 0.210$.',
              'Plot sorted time against $z_i$. The six points lie close to a straight line.',
            ],
            answer: 'Yes: the plot is roughly linear, so a normal model for finishing time is reasonable.',
            problem: 'c6.normal-scores',
            case: 0,
            checks: () => [
              ['z1', normInv(0.5 / 6), -1.383, 5e-4],
              ['z2', normInv(1.5 / 6), -0.674, 5e-4],
              ['z3', normInv(2.5 / 6), -0.21, 5e-4],
            ],
          },
        ],
        ['ti', ['STAT ▸ 1:Edit: data in L1.', '2nd Y= ▸ 1:Plot1: On; Type: the last icon (normal probability plot); Data List: L1; Data Axis: Y (so the data go up the y-axis, as in the notes).', 'ZOOM ▸ 9:ZoomStat.']],
        ['p', 'With only a few points some wiggle is expected even from a normal population; look for a clear curve or S, not perfection. The normal probability plot lab shows how much normal samples of each size wiggle.'],
        ['bridge', String.raw`The t procedures of Chapters 8 and 9 assume a normal population when the sample is small, and this plot is how the class checks it. The last section, from the textbook, returns to waiting: the time between the Poisson events of §5.3.`],
      ],
    },
    {
      id: '6.4',
      part: 'Waiting times',
      title: 'The exponential and gamma distributions',
      source: 'Walpole §6.6',
      lab: 'dist',
      blocks: [
        ['p', String.raw`A Poisson process counts events arriving at an average rate $\lambda$ per unit of time (§5.3). The count in an interval is discrete; the time you wait for the next event is continuous. It has the **exponential distribution** with mean $\beta = 1/\lambda$.`],
        ['key', String.raw`$f(x) = \dfrac{1}{\beta} e^{-x/\beta}$ for $x > 0$ (0 elsewhere). $\mu = \beta$, $\sigma^2 = \beta^2$, and $P(X > x) = e^{-x/\beta}$.`],
        ['why', String.raw`The wait is longer than $x$ exactly when no event happens in $(0, x]$. The count there is Poisson with mean $\lambda x = x/\beta$, so $P(X > x) = P(\text{0 events}) = e^{-x/\beta}$. The CDF is $1 - e^{-x/\beta}$, and its derivative is the density.`, 'Derivation'],
        [
          'ex',
          {
            n: '6.A',
            title: 'calls at a help desk',
            q: 'Calls reach a help desk as a Poisson process at an average of 2 per minute. Let $X$ be the wait, in minutes, until the next call. Find (a) $P(X > 1)$; (b) the probability the next call comes within 30 seconds; (c) the mean and standard deviation of the wait.',
            a: [
              String.raw`$\lambda = 2$ per minute, so $X$ is exponential with $\beta = 1/2 = 0.5$ minute.`,
              String.raw`(a) $P(X > 1) = e^{-1/0.5} = e^{-2} = 0.1353$. Check with the Poisson: no calls in one minute has probability $e^{-2}\,2^0/0! = 0.1353$.`,
              String.raw`(b) $P(X < 0.5) = 1 - e^{-0.5/0.5} = 1 - e^{-1} = 0.6321$.`,
              String.raw`(c) $\mu = \sigma = \beta = 0.5$ minute.`,
            ],
            answer: '(a) 0.1353 (b) 0.6321 (c) 30 seconds each.',
            show: 'dist:wait',
            checks: () => [
              ['(a)', 1 - expCdf(1, 0.5), 0.1353, 5e-5],
              ['(a) by Poisson', poisPmf(0, 2), 0.1353, 5e-5],
              ['(b)', expCdf(0.5, 0.5), 0.6321, 5e-5],
            ],
          },
        ],
        ['key', String.raw`**Memoryless.** $P(X > s + t \mid X > s) = P(X > t)$: having waited $s$ minutes already does not shorten the wait still to come. (If no call came in the first minute, the chance of waiting more than another minute is still 0.1353.)`],
        ['p', String.raw`Waiting instead for the $\alpha$th event gives the **gamma distribution**, the sum of $\alpha$ independent exponential waits: mean $\alpha\beta$ and variance $\alpha\beta^2$ (by §4.3). The exponential is the gamma with $\alpha = 1$. The chi-squared distribution of Chapter 7 is another member of the family.`],
        ['ti', [String.raw`The TI-84 has no exponential menu item: type the formula. $P(X > 1)$ is e^(−1/0.5), with 2nd LN for e^(.`]],
        ['bridge', 'This closes the midterm material. Chapter 7 puts these distributions to work: the sample mean has a distribution of its own, and it is close to normal.'],
      ],
    },
  ],
  formulas: [
    ['Uniform on $[A, B]$', String.raw`$f(x) = \dfrac{1}{B - A}$, $\;\mu = \dfrac{A + B}{2}$, $\;\sigma^2 = \dfrac{(B - A)^2}{12}$`],
    ['Normal', String.raw`$X \sim N(\mu, \sigma^2)$, $\;E(X) = \mu$, $\;\text{Var}(X) = \sigma^2$`],
    ['Standardizing', String.raw`$z = \dfrac{x - \mu}{\sigma}$, $\;x = \mu + z\sigma$`],
    ['Normal areas', String.raw`$P(Z > z) = 1 - P(Z < z)$, $\;P(a < Z < b) = P(Z < b) - P(Z < a)$`],
    ['Empirical rule', String.raw`68%, 95%, 99.7% within $1\sigma$, $2\sigma$, $3\sigma$`],
    ['$z_\\alpha$', String.raw`area $\alpha$ to the right: $z_{0.05} = 1.645$, $z_{0.025} = 1.96$, $z_{0.005} = 2.576$`],
    ['Normal quantiles', String.raw`$z_i = \Phi^{-1}\!\left(\frac{i - 0.5}{n}\right)$ on the x-axis, sorted data on the y-axis`],
    ['Exponential', String.raw`$P(X > x) = e^{-x/\beta}$, $\;\mu = \beta = 1/\lambda$, $\;\sigma = \beta$`, 'Walpole §6.6'],
    ['Gamma', String.raw`time to the $\alpha$th event: $\mu = \alpha\beta$, $\;\sigma^2 = \alpha\beta^2$`, 'Walpole §6.6'],
  ],
};
