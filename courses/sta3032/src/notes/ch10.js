/**
 * Chapter 10, rewritten from the teacher's notes (Ch 10, pp. 171–181), laid out like FLUX's notes.
 * The notes pose these examples and work them on the TI-84 in class; every answer here is computed.
 * Example numbers are the notes'; the textbook's material (Walpole §11.2–11.6 and §11.10: the model,
 * s², inference on the slope, intervals at a given x, residual plots) is marked, and its examples
 * are lettered (10.A, 10.B, …). The model is written with α and β, matching the class's ŷ = a + bx.
 */
import { linRegTest, regression } from '../stats/infer.js';
import { tTable } from '../stats/tables.js';

const STEAM_X = [21, 24, 32, 47, 50, 59, 68, 74, 62, 50, 41, 30];
const STEAM_Y = [185.79, 214.47, 288.03, 424.84, 454.58, 539.03, 621.55, 675.06, 562.03, 452.93, 369.95, 273.98];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NOISE_X = [1, 0, 1, 2, 5, 1, 4, 6, 2, 3];
const NOISE_Y = [70, 63, 65, 70, 70, 70, 80, 75, 80, 80];

const steam = () => linRegTest({ xs: STEAM_X, ys: STEAM_Y, side: 'two' });
const noise = () => regression(NOISE_X, NOISE_Y);
const T025_8 = (() => {
  const v = tTable(0.025, 8);
  return typeof v === 'number' ? v : v.value;
})();
/** Half-width of the interval at x0 for the noise data: extra = 0 for the mean response, 1 to predict. */
const halfWidth = (x0, extra) => {
  const R = noise();
  return T025_8 * Math.sqrt(R.s2) * Math.sqrt(extra + 1 / R.n + (x0 - R.xb) ** 2 / R.sxx);
};

export default {
  ch: '10',
  title: 'Simple linear regression',
  lede: String.raw`When two quantitative variables are measured on the same individuals, a scatter plot shows how they move together and a straight line can summarize it. This chapter fits that line by least squares, measures the strength of the relation with the correlation coefficient, and tests whether an apparent linear relation is real. The textbook then treats the fitted line as an estimate of a true one, which gives a margin of error for the slope and intervals for predictions.`,
  sections: [
    {
      id: '10.1',
      part: 'Two variables at once',
      title: 'Bivariate data and scatter plots',
      lab: 'reg',
      problems: ['c10.association'],
      blocks: [
        ['p', 'A **univariate** data set measures one variable on each individual; a **bivariate** data set measures two. The **response variable** $Y$ is the one explained by the **explanatory** (predictor) variable $X$.'],
        [
          'ex',
          {
            n: '10.1',
            q: 'A chemical plant’s monthly steam usage (pounds) is thought to depend on the month’s average temperature (°F). Last year’s data are below. Which is the response, and what does a scatter plot show?',
            data: { head: ['Month', 'Temp. $x$', 'Usage $y$'], rows: MONTHS.map((m, i) => [m, STEAM_X[i], STEAM_Y[i].toFixed(2)]) },
            a: ['Usage depends on temperature: temperature is $X$ (explanatory), usage is $Y$ (response).', 'Plot each month as a point $(x, y)$. The points rise almost exactly along a straight line.'],
            answer: 'A strong, positive, linear relation.',
            problem: 'c10.association',
            case: 0,
          },
        ],
        ['ti', ['STAT ▸ 1:Edit: $x$ in L1, $y$ in L2.', '2nd Y= ▸ 1:Plot1: On, Type: scatter (the first icon), Xlist: L1, Ylist: L2.', 'ZOOM ▸ 9:ZoomStat.']],
        ['p', 'Read a scatter plot for three things: the **direction** (up or down), the **form** (a line, a curve, or no pattern) and the **strength** (how tightly the points follow the form). Look for points that stand apart too.'],
        ['bridge', 'When the form is a straight line, the next step is to find the line that fits best, and to say what "best" means.'],
      ],
    },
    {
      id: '10.2',
      part: 'Fitting a line',
      title: 'The least-squares line',
      lab: 'reg',
      problems: ['c10.fit', 'c10.interpret'],
      blocks: [
        ['key', String.raw`The fitted line is $\hat{y} = a + bx$, with slope $b = \dfrac{S_{xy}}{S_{xx}} = \dfrac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}$ and intercept $a = \bar{y} - b\bar{x}$.`],
        ['why', 'Of all straight lines, this one makes the sum of the squared vertical distances from the points (the residuals $y_i - \\hat{y}_i$) as small as possible: "least squares".'],
        ['p', String.raw`Two facts follow from the formulas. The line always passes through $(\bar{x}, \bar{y})$, since $a = \bar{y} - b\bar{x}$. And the residuals always add to zero: the line runs through the middle of the cloud, with as much above it as below.`],
        [
          'ex',
          {
            n: '10.2',
            q: 'For the steam data: (a) fit the regression line; (b) interpret the slope; (c) interpret the intercept; (d) predict usage at 10°F; (e) and at 60°F; (f) find and interpret $R^2$.',
            a: [
              String.raw`(a) LinReg(a+bx): $\hat{y} = -6.336 + 9.208x$.`,
              '(b) Each 1°F rise in average temperature goes with an estimated 9.208 more pounds of steam per month, on average.',
              '(c) At 0°F the line gives −6.336 pounds, which is impossible. The intercept has no practical meaning here: 0°F is far outside the temperatures observed (21°F to 74°F).',
              String.raw`(d) $\hat{y} = -6.336 + 9.208(10) = 85.75$ pounds. But 10°F is outside the data: this is an **extrapolation**, and the line may not hold there.`,
              String.raw`(e) $\hat{y} = -6.336 + 9.208(60) = 546.17$ pounds: inside the data's range, so a reasonable prediction.`,
              String.raw`(f) $R^2 = 0.9999$: 99.99% of the variation in steam usage is explained by the linear relation with temperature.`,
            ],
            problem: 'c10.fit',
            case: 0,
            checks: () => {
              const R = steam();
              return [
                ['a', R.a, -6.336, 5e-4],
                ['b', R.b, 9.208, 5e-4],
                ['ŷ(10)', R.a + R.b * 10, 85.75, 5e-3],
                ['ŷ(60)', R.a + R.b * 60, 546.17, 5e-3],
                ['R²', R.r2, 0.9999, 5e-5],
              ];
            },
          },
        ],
        ['fix', 'The notes ask for a prediction at 10°F without comment. 10°F is below every temperature in the data, so it is an extrapolation; the answer is what the line says, not something the data support.'],
        ['ti', ['STAT ▸ CALC ▸ 8:LinReg(a+bx), Xlist: L1, Ylist: L2 (leave FreqList and Store RegEQ empty); Calculate.', 'With DiagnosticOn (below) it also shows $r^2$ and $r$.']],
        ['def', 'Coefficient of determination $R^2$:', 'the share of the variation in $y$ explained by the line, between 0 and 1. For a straight-line fit it equals $r^2$.'],
        ['why', String.raw`The total variation of $y$ about its mean, $S_{yy} = \sum (y_i - \bar{y})^2$, splits into the part the line explains and the part left in the residuals, $SSE = \sum (y_i - \hat{y}_i)^2$. So $R^2 = 1 - SSE/S_{yy}$: the share not left over.`],
        ['bridge', 'A line can be fitted to any cloud of points, even one with no pattern at all. Part III measures how well it fits and tests whether the relation is real.'],
      ],
    },
    {
      id: '10.3',
      part: 'How strong, and is it real?',
      title: 'Correlation and the test for a linear relation',
      lab: 'reg',
      problems: ['c10.correlation-test', 'c10.association'],
      blocks: [
        ['p', 'Two linearly related variables are **positively associated** if one tends to increase as the other does, and **negatively associated** if one decreases as the other increases.'],
        ['def', 'Correlation coefficient $r$:', 'measures the strength and direction of a LINEAR relation, $-1 \\le r \\le 1$. Near $\\pm 1$: points close to a line. Near 0: no linear relation (there may still be a curved one).'],
        ['p', String.raw`$r$ and the slope always have the same sign: $b = r\,\dfrac{s_y}{s_x}$. Unlike $b$, $r$ has no units, so it does not change if $x$ or $y$ is measured on another scale.`],
        ['key', String.raw`Test for a linear relation (LinRegTTest): $H_0: \beta = 0$ (no linear relation) vs $H_1: \beta \ne 0$, $> 0$ or $< 0$. $t_0 = \dfrac{r\sqrt{n - 2}}{\sqrt{1 - r^2}}$ with $n - 2$ df.`],
        [
          'ex',
          {
            n: '10.3',
            q: 'For the steam data, find $r$ and test whether temperature and usage are linearly related, at $\\alpha = 0.05$.',
            a: [
              '$r = 0.99993$: an extremely strong positive linear relation.',
              '$H_0: \\beta = 0$, $H_1: \\beta \\ne 0$. LinRegTTest: $t_0 = 272.6$ on 10 df, p-value $\\approx 1 \\times 10^{-20}$.',
              'p-value $< 0.05$: reject $H_0$.',
            ],
            answer: 'There is sufficient evidence that temperature and steam usage are linearly related.',
            problem: 'c10.correlation-test',
            case: 1,
            checks: () => {
              const R = steam();
              return [
                ['r', R.r, 0.99993, 5e-6],
                ['t', R.t, 272.6, 0.05],
                ['p < 1e-19', R.p < 1e-19 ? 1 : 0, 1, 0],
              ];
            },
          },
        ],
        ['ti', ['Once: 2nd 0 (CATALOG) ▸ DiagnosticOn ▸ ENTER ENTER, so LinReg shows $r$.', 'STAT ▸ TESTS ▸ F:LinRegTTest, Xlist: L1, Ylist: L2, choose the alternative ($\\beta$ & $\\rho$ $\\ne$, $<$, $>$ 0); Calculate.']],
        [
          'ex',
          {
            n: '10.4',
            q: 'Noise exposure (sound pressure level) and blood pressure rise (mm Hg) for 10 people (below). Find $r$ and test whether they are positively correlated, at $\\alpha = 0.05$.',
            data: { head: ['Noise $x$', ...NOISE_X], rows: [['BP rise $y$', ...NOISE_Y]] },
            a: [
              'LinReg: $\\hat{y} = 68.13 + 1.667x$, $r = 0.5262$: a moderate positive linear relation.',
              '$H_0: \\beta = 0$, $H_1: \\beta > 0$. $t_0 = \\dfrac{0.5262\\sqrt{8}}{\\sqrt{1 - 0.5262^2}} = 1.75$ on 8 df; p-value $= 0.0591$.',
              '$0.0591 \\ge 0.05$: fail to reject $H_0$.',
            ],
            answer: 'There is not sufficient evidence (at the 0.05 level) of a positive linear relation between noise exposure and blood pressure rise.',
            problem: 'c10.correlation-test',
            case: 0,
            show: 'reg:noise',
            checks: () => {
              const R = linRegTest({ xs: NOISE_X, ys: NOISE_Y, side: 'right' });
              return [
                ['r', R.r, 0.5262, 5e-5],
                ['t', R.t, 1.75, 5e-3],
                ['p', R.p, 0.0591, 5e-5],
                ['b', R.b, 1.667, 5e-4],
              ];
            },
          },
        ],
        ['warn', 'Correlation is not causation, and $r$ only measures LINEAR relations. Always look at the scatter plot: a curve can have a high $r$ (and a U-shaped residual plot), and one outlier far out in $x$ can make or break it. The regression lab shows both.'],
        ['bridge', String.raw`The class notes stop here. The textbook goes on to treat the line as an estimate of a true population line, which gives a margin of error for the slope and intervals for predictions: Part IV.`],
      ],
    },
    {
      id: '10.4',
      part: 'The regression model',
      title: 'The model, residuals and s²',
      source: 'Walpole §11.2, §11.4, §11.10',
      lab: 'reg',
      blocks: [
        ['p', String.raw`Behind the fitted line is a model for the population. For each $x$, the response is a random variable centered on a true line, with random scatter around it:`],
        ['key', String.raw`$Y = \alpha + \beta x + \varepsilon$, where the errors $\varepsilon$ are independent and normal with mean 0 and the SAME variance $\sigma^2$ at every $x$.`],
        ['p', String.raw`So the mean of $Y$ at $x$ is $\mu_{Y|x} = \alpha + \beta x$, and $a$ and $b$ are estimates of $\alpha$ and $\beta$, just as $\bar{x}$ estimates $\mu$. The test of §10.3, $H_0: \beta = 0$, is about this true slope. The size of the scatter, $\sigma^2$, is estimated from the residuals $e_i = y_i - \hat{y}_i$:`],
        ['key', String.raw`$s^2 = \dfrac{SSE}{n - 2} = \dfrac{\sum e_i^2}{n - 2}$, and $s$ is the typical size of a residual, in the units of $y$.`],
        ['why', String.raw`The divisor is $n - 2$ because two parameters, $a$ and $b$, were estimated from the data before the residuals could be computed: the residuals satisfy two equations (they add to zero, and so do $x_i e_i$), so only $n - 2$ of them are free. Compare $n - 1$ for $s^2$ in §1.4, where one parameter, $\bar{x}$, was estimated.`],
        [
          'ex',
          {
            n: '10.A',
            title: 'residuals for the noise data',
            q: 'For the noise and blood pressure data of Example 10.4 ($\\hat{y} = 68.13 + 1.667x$), find the residuals, $SSE$ and $s$.',
            data: {
              head: ['$x$', '$y$', String.raw`$\hat{y} = a + bx$`, String.raw`$e = y - \hat{y}$`],
              rows: NOISE_X.map((x, i) => {
                const yh = noise().b0 + noise().b1 * x;
                return [x, NOISE_Y[i], yh.toFixed(2), (NOISE_Y[i] - yh).toFixed(2)];
              }),
            },
            a: [
              String.raw`Each residual is the observed $y$ minus the line’s value: for the first person, $70 - (68.13 + 1.667 \times 1) = 0.20$.`,
              String.raw`$SSE = \sum e_i^2 = 250.27$. (Shortcut: $SSE = S_{yy} - bS_{xy} = 346.1 - 1.667(57.5) = 250.27$.)`,
              String.raw`$s^2 = 250.27/8 = 31.28$, so $s = 5.593$ mm Hg.`,
            ],
            answer: 'A typical person’s blood pressure rise is about 5.6 mm Hg off the line. Plotted against $x$, the residuals are negative at both ends ($x$ = 0, 5, 6) and positive in the middle ($x$ = 2 to 4). With 10 points that is only a hint, but an arch is the sign of a curve: look at it before trusting the line.',
            show: 'reg:noise',
            checks: () => {
              const R = noise();
              return [
                ['e₁', NOISE_Y[0] - (R.b0 + R.b1 * NOISE_X[0]), 0.2, 5e-3],
                ['Σe', NOISE_X.reduce((t, x, i) => t + NOISE_Y[i] - (R.b0 + R.b1 * x), 0), 0, 1e-9],
                ['Syy', R.syy, 346.1, 1e-9],
                ['Sxy', R.sxy, 57.5, 1e-9],
                ['SSE', R.sse, 250.27, 5e-3],
                ['s²', R.s2, 31.28, 5e-3],
                ['s', Math.sqrt(R.s2), 5.593, 5e-4],
                // The arch: every residual at x = 0, 5, 6 is negative; the mean residual at x = 2 to 4 is positive.
                ['ends negative', NOISE_X.every((x, i) => ![0, 5, 6].includes(x) || NOISE_Y[i] < R.b0 + R.b1 * x) ? 1 : 0, 1, 0],
                ['middle positive', NOISE_X.reduce((t, x, i) => t + (x >= 2 && x <= 4 ? NOISE_Y[i] - (R.b0 + R.b1 * x) : 0), 0) > 0 ? 1 : 0, 1, 0],
              ];
            },
          },
        ],
        ['ti', ['LinRegTTest (§10.3) prints $s$ along with $a$, $b$, $r$ and $r^2$. It also stores the residuals in the list RESID (2nd STAT, LIST NAMES).']],
        ['h', 'Checking the model: the residual plot'],
        ['p', String.raw`The model’s assumptions are about the errors, so check them on the residuals. Plot $e_i$ against $x_i$ (the regression lab draws it under the scatter plot). If the model fits, the residual plot is a patternless band around 0 of even width.`],
        [
          'list',
          [
            'A curve (a U or an arch): the relation is not linear, and a straight line is the wrong model.',
            'A funnel, wider at one end: the variance is not constant, and the intervals below are unreliable.',
            'One residual far from the rest: an outlier worth checking before it is trusted or removed.',
          ],
        ],
        ['p', 'A normal probability plot of the residuals (§6.3) checks the normality assumption.'],
      ],
    },
    {
      id: '10.5',
      title: 'Inference on the slope',
      source: 'Walpole §11.5',
      lab: 'reg',
      blocks: [
        ['p', String.raw`The slope $b$ varies from sample to sample around the true $\beta$, with standard error $s/\sqrt{S_{xx}}$. Standardized, it has a $t$ distribution with $n - 2$ degrees of freedom, which gives a test and an interval exactly as for a mean in Chapter 8.`],
        ['key', String.raw`$t_0 = \dfrac{b - \beta_0}{s/\sqrt{S_{xx}}}$ with $n - 2$ df. Interval for $\beta$: $b \pm t_{\alpha/2,\,n-2}\,\dfrac{s}{\sqrt{S_{xx}}}$.`],
        ['why', String.raw`With $\beta_0 = 0$ this is the LinRegTTest of §10.3: $\dfrac{b}{s/\sqrt{S_{xx}}}$ and $\dfrac{r\sqrt{n-2}}{\sqrt{1 - r^2}}$ are the same number written two ways (substitute $b = S_{xy}/S_{xx}$, $r = S_{xy}/\sqrt{S_{xx}S_{yy}}$ and $SSE = S_{yy}(1 - r^2)$). The slope form also tests other values of $\beta_0$, and gives the interval.`],
        [
          'ex',
          {
            n: '10.B',
            title: 'a margin of error for the slope',
            q: 'For the noise data ($b = 1.667$, $s = 5.593$, $S_{xx} = 34.5$, $n = 10$), find the $t$ statistic for $H_0: \\beta = 0$ and a 95% confidence interval for $\\beta$.',
            a: [
              String.raw`Standard error: $s/\sqrt{S_{xx}} = 5.593/\sqrt{34.5} = 5.593/5.874 = 0.9522$.`,
              String.raw`$t_0 = 1.667/0.9522 = 1.75$ on 8 df: the value of Example 10.4.`,
              String.raw`$t_{0.025,8} = 2.306$: $1.667 \pm 2.306(0.9522) = 1.667 \pm 2.196$, which is $(-0.529,\ 3.863)$.`,
            ],
            answer: 'The interval runs from a small decrease to an increase of almost 4 mm Hg per unit of noise. It contains 0, so at the 5% level (two-sided) the data cannot rule out no relation, in line with Example 10.4.',
            show: 'reg:noise',
            checks: () => {
              const R = noise();
              const se = Math.sqrt(R.s2) / Math.sqrt(R.sxx);
              return [
                ['Sxx', R.sxx, 34.5, 1e-9],
                ['se', se, 0.9522, 5e-5],
                ['t', R.b1 / se, 1.75, 5e-3],
                ['same as r form', R.b1 / se - linRegTest({ xs: NOISE_X, ys: NOISE_Y, side: 'right' }).t, 0, 1e-9],
                ['t table', T025_8, 2.306, 5e-4],
                ['margin', T025_8 * se, 2.196, 5e-4],
                ['lo', R.b1 - T025_8 * se, -0.529, 5e-4],
                ['hi', R.b1 + T025_8 * se, 3.863, 5e-4],
              ];
            },
          },
        ],
        ['ti', ['STAT ▸ TESTS ▸ G:LinRegTInt, Xlist: L1, Ylist: L2, C-Level: 0.95; Calculate. It shows the interval for the slope.']],
      ],
    },
    {
      id: '10.6',
      title: 'Estimating a mean response and predicting a new one',
      source: 'Walpole §11.6',
      lab: 'reg',
      blocks: [
        ['p', String.raw`At a chosen $x_0$, the line gives $\hat{y}_0 = a + bx_0$. It answers two different questions, with two different margins of error, just as a confidence interval and a prediction interval did for a mean (§8.4):`],
        ['key', String.raw`**Mean response** $\mu_{Y|x_0}$: $\hat{y}_0 \pm t_{\alpha/2,\,n-2}\; s\sqrt{\dfrac{1}{n} + \dfrac{(x_0 - \bar{x})^2}{S_{xx}}}$.`],
        ['key', String.raw`**A single new** $y_0$: $\hat{y}_0 \pm t_{\alpha/2,\,n-2}\; s\sqrt{1 + \dfrac{1}{n} + \dfrac{(x_0 - \bar{x})^2}{S_{xx}}}$.`],
        ['why', String.raw`The line is least certain far from the center of the data: a small error in the slope swings the line more the further $x_0$ is from $\bar{x}$. That is the $(x_0 - \bar{x})^2$ term, and one more reason extrapolation is risky. The extra 1 in the prediction interval is a single new value’s own scatter, $\sigma^2$.`],
        [
          'ex',
          {
            n: '10.C',
            title: 'at a noise level of 4',
            q: 'For the noise data ($\\bar{x} = 2.5$), find (a) a 95% confidence interval for the mean blood pressure rise of all people exposed at level $x_0 = 4$; (b) a 95% prediction interval for one such person.',
            a: [
              String.raw`$\hat{y}_0 = 68.13 + 1.667(4) = 74.8$ mm Hg, and $\dfrac{(x_0 - \bar{x})^2}{S_{xx}} = \dfrac{1.5^2}{34.5} = 0.0652$.`,
              String.raw`(a) $2.306(5.593)\sqrt{0.1 + 0.0652} = 12.897(0.4065) = 5.24$: $(69.56,\ 80.04)$.`,
              String.raw`(b) $2.306(5.593)\sqrt{1 + 0.1 + 0.0652} = 12.897(1.0795) = 13.92$: $(60.88,\ 88.72)$.`,
            ],
            answer: 'The average rise at level 4 is pinned down to about ±5 mm Hg; one person’s rise only to about ±14.',
            checks: () => {
              const R = noise();
              return [
                ['xb', R.xb, 2.5, 1e-12],
                ['ŷ0', R.b0 + R.b1 * 4, 74.8, 1e-9],
                ['term', (4 - R.xb) ** 2 / R.sxx, 0.0652, 5e-5],
                ['(a) half', halfWidth(4, 0), 5.24, 5e-3],
                ['(a) lo', 74.8 - halfWidth(4, 0), 69.56, 5e-3],
                ['(a) hi', 74.8 + halfWidth(4, 0), 80.04, 5e-3],
                ['(b) half', halfWidth(4, 1), 13.92, 5e-3],
                ['(b) lo', 74.8 - halfWidth(4, 1), 60.88, 5e-3],
                ['(b) hi', 74.8 + halfWidth(4, 1), 88.72, 5e-3],
              ];
            },
          },
        ],
        ['warn', 'Both intervals assume the model of §10.4 holds at $x_0$. Outside the range of the data (10°F for the steam plant) nothing in the data supports that.'],
        ['bridge', 'This is where the course ends: from describing one data set (Chapter 1), through probability and sampling distributions, to estimating and testing with one sample, two samples, and a line.'],
      ],
    },
  ],
  formulas: [
    ['Least-squares line', String.raw`$\hat{y} = a + bx$, $\;b = S_{xy}/S_{xx}$, $\;a = \bar{y} - b\bar{x}$`],
    ['Sums of squares', String.raw`$S_{xx} = \sum (x_i - \bar{x})^2$, $\;S_{xy} = \sum (x_i - \bar{x})(y_i - \bar{y})$`],
    ['Correlation', String.raw`$r = \dfrac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$, $\;b = r\,s_y/s_x$, $\;R^2 = r^2$`],
    ['Test for a linear relation', String.raw`$t_0 = \dfrac{r\sqrt{n-2}}{\sqrt{1 - r^2}}$, $\;n - 2$ df`],
    ['Error variance', String.raw`$s^2 = SSE/(n - 2)$, $\;SSE = S_{yy} - bS_{xy}$`, 'Walpole §11.4'],
    ['Slope', String.raw`$t_0 = \dfrac{b - \beta_0}{s/\sqrt{S_{xx}}}$, interval $b \pm t_{\alpha/2,\,n-2}\,s/\sqrt{S_{xx}}$`, 'Walpole §11.5'],
    ['Mean response at $x_0$', String.raw`$\hat{y}_0 \pm t_{\alpha/2,\,n-2}\,s\sqrt{1/n + (x_0 - \bar{x})^2/S_{xx}}$`, 'Walpole §11.6'],
    ['New $y$ at $x_0$', String.raw`$\hat{y}_0 \pm t_{\alpha/2,\,n-2}\,s\sqrt{1 + 1/n + (x_0 - \bar{x})^2/S_{xx}}$`, 'Walpole §11.6'],
  ],
};
