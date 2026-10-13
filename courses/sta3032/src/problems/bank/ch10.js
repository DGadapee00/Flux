/** Chapter 10 · Simple linear regression. The notes write the fitted line as ŷ = a + bx. */
import { problem, kase, range, choice, data, num, mc, tn, fx, pn, hyp, pTex, decide, decisionPart, h1Part, conclusionPart, conclude, statPart, pPart } from '../kit.js';
import { linRegTest } from '../../stats/infer.js';
import { createRng } from '../../stats/rng.js';

const C10 = { ch: '10' };
const ALPHA = choice([0.01, '0.01'], [0.05, '0.05'], [0.1, '0.1']);

const STEAM_X = [21, 24, 32, 47, 50, 59, 68, 74, 62, 50, 41, 30];
const STEAM_Y = [185.79, 214.47, 288.03, 424.84, 454.58, 539.03, 621.55, 675.06, 562.03, 452.93, 369.95, 273.98];
const NOISE_X = [1, 0, 1, 2, 5, 1, 4, 6, 2, 3];
const NOISE_Y = [70, 63, 65, 70, 70, 70, 80, 75, 80, 80];

/** Bivariate settings: what x and y are, a true line, the noise, and decimals. */
const PAIRS = {
  steam: { x: 'average temperature (°F)', y: 'steam usage (pounds)', xs: [20, 80], a: -5, b: 9, s: 12, dpx: 0, dpy: 2 },
  study: { x: 'hours studied', y: 'exam score', xs: [0, 12], a: 55, b: 3.2, s: 7, dpx: 1, dpy: 0 },
  price: { x: 'age of a used car (years)', y: 'price (1000 dollars)', xs: [1, 12], a: 28, b: -1.9, s: 2.2, dpx: 0, dpy: 1 },
  noise: { x: 'noise exposure (dB above baseline)', y: 'blood pressure rise (mm Hg)', xs: [0, 8], a: 64, b: 1.8, s: 5, dpx: 0, dpy: 0 },
};
const CTX = choice(...Object.keys(PAIRS).map((k) => [k, k]));

function pairsOf(rand, ctx, n, strength = 1) {
  const c = PAIRS[ctx];
  const r = createRng(Math.floor(rand() * 2 ** 31));
  const xs = Array.from({ length: n }, () => Number(r.uniform(c.xs[0], c.xs[1]).toFixed(c.dpx)));
  const ys = xs.map((x) => Number((c.a + c.b * x * strength + r.normal(0, c.s)).toFixed(c.dpy)));
  return [xs, ys];
}

/** The data as a tall two-column table: on a phone, every pair stays in view. */
const tableScroll = (xs, ys, c) =>
  `<table class="results" style="max-width:360px"><thead><tr><th>x: ${c.x}</th><th>y: ${c.y}</th></tr></thead><tbody>${xs.map((x, i) => `<tr><td>${x}</td><td>${ys[i]}</td></tr>`).join('')}</tbody></table>`;

export default [
  problem({
    ...C10, id: 'c10.fit', title: 'Fitting and using the least-squares line', kind: 'numeric', level: 3, topics: ['regression', 'least-squares', 'prediction'], src: 'Notes Ex 10.2',
    vars: { ctx: CTX, n: range(6, 12, 1), x0: range(0.1, 0.9, 0.05), xy: data((rand, v) => pairsOf(rand, v.ctx, v.n), (v) => `${v[0].join(', ')} | ${v[1].join(', ')}`) },
    derive: ($) => {
      const [xs, ys] = $.xy;
      const R = linRegTest({ xs, ys, side: 'two' });
      const c = PAIRS[$.ctx];
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      const x0 = Number((lo + $.x0 * (hi - lo)).toFixed(c.dpx));
      return { xs, ys, c, R, x0, yhat: R.a + R.b * x0 };
    },
    valid: ($) => $.R.sxx > 0 && new Set($.xs).size >= 4,
    text: (T, $) => `The table gives ${$.c.x} (x) and ${$.c.y} (y) for ${$.xs.length} observations. Fit the least-squares line ŷ = a + bx, predict y at x = ${$.x0}, and find the coefficient of determination R².`,
    figure: ($) => tableScroll($.xs, $.ys, $.c),
    parts: [
      num('a', ($) => $.R.a, { label: 'Intercept $a$', tol: 0.003, abs: 0.02 }),
      num('b', ($) => $.R.b, { label: 'Slope $b$', tol: 0.003, abs: 0.002, traps: [[($) => $.R.sxy / $.R.syy, String.raw`That is $S_{xy}/S_{yy}$. The slope divides by $S_{xx}$: $b = S_{xy}/S_{xx}$.`]] }),
      num('yhat', ($) => $.yhat, { label: ($T, $) => String.raw`$\hat y$ at $x = ${$.x0}$`, tol: 0.004, abs: 0.02 }),
      num('r2', ($) => $.R.r2, { label: '$R^2$', tol: 0, abs: 0.002, traps: [[($) => $.R.r, 'That is r. R² is its square.']] }),
    ],
    hints: [String.raw`$b = \dfrac{S_{xy}}{S_{xx}} = \dfrac{\sum (x_i - \bar x)(y_i - \bar y)}{\sum (x_i - \bar x)^2}$ and $a = \bar y - b\bar x$.`, String.raw`Predict by substituting: $\hat y = a + bx_0$.`, 'TI-84: x in L1, y in L2, STAT → CALC → 8:LinReg(a+bx). Turn DiagnosticOn (2nd 0, catalog) to see r and R².'],
    steps: ($) => [
      String.raw`$\bar x = ${tn($.R.xb, 6)}$, $\bar y = ${tn($.R.yb, 6)}$, $S_{xx} = ${tn($.R.sxx, 6)}$, $S_{xy} = ${tn($.R.sxy, 6)}$`,
      String.raw`$$b = \dfrac{S_{xy}}{S_{xx}} = \dfrac{${tn($.R.sxy, 6)}}{${tn($.R.sxx, 6)}} = ${tn($.R.b, 5)}, \qquad a = \bar y - b\bar x = ${tn($.R.yb, 6)} - ${pn($.R.b, 5)}(${tn($.R.xb, 6)}) = ${tn($.R.a, 5)}$$`,
      String.raw`$$\hat y = ${tn($.R.a, 5)} + ${pn($.R.b, 5)}x, \qquad \hat y(${$.x0}) = ${tn($.yhat, 5)}$$`,
      String.raw`$$R^2 = 1 - \dfrac{SSE}{S_{yy}} = r^2 = ${fx($.R.r2, 4)}$$`,
      `Slope: each 1-unit increase in ${$.c.x} changes the predicted ${$.c.y} by ${tn($.R.b, 4)} on average. R²: ${fx($.R.r2 * 100, $.R.r2 > 0.999 ? 2 : 1)}% of the variation in ${$.c.y} is explained by the linear relation with ${$.c.x}.`,
    ],
    cases: [kase('Notes Ex 10.2 (steam usage)', { ctx: 'steam', n: 12, x0: (10 - 21) / (74 - 21), xy: [STEAM_X, STEAM_Y] }, { a: -6.336, b: 9.208, yhat: 85.75, r2: 0.9999 }, { note: 'x = 10°F is below the smallest temperature in the data (21°F), so this prediction is an extrapolation; see the interpretation problem.' })],
  }),

  problem({
    ...C10, id: 'c10.interpret', title: 'Interpreting a regression line', kind: 'conceptual', topics: ['regression', 'interpretation', 'extrapolation'], src: 'Notes Ex 10.2(b)–(e)',
    vars: { q: choice(['slope', 'slope'], ['intercept', 'intercept'], ['extrap', 'extrapolation'], ['r2', 'R²']) },
    derive: ($) => ({ key: $.q }),
    text: (T, $) =>
      ({
        slope: 'For the steam data (temperatures 21°F to 74°F), ŷ = −6.34 + 9.21x, where y is steam usage in pounds and x is the average temperature in °F. What does the slope 9.21 mean?',
        intercept: 'For the steam data (temperatures 21°F to 74°F), ŷ = −6.34 + 9.21x. What should you make of the intercept −6.34?',
        extrap: 'For the steam data (temperatures 21°F to 74°F), ŷ = −6.34 + 9.21x. A manager wants to predict usage for a month averaging 95°F. What is the problem?',
        r2: 'For the steam data, R² = 0.9999. What does this mean?',
      })[$.q],
    parts: [
      mc('k', ($) =>
        ({
          slope: [
            ['slope', 'Each 1°F rise in average temperature adds about 9.21 pounds of steam usage, on average'],
            ['x', 'Steam usage is 9.21 pounds when the temperature is 0°F', 'That describes the intercept, not the slope.'],
            ['y', 'Each pound of steam raises the temperature by 9.21°F', 'Regression predicts y from x, not the other way round.'],
          ],
          intercept: [
            ['intercept', 'It is the predicted usage at 0°F, which is outside the data (21–74°F), so it has no practical meaning here'],
            ['x', 'The plant uses −6.34 thousand lb of steam each month', 'Negative usage is impossible; the intercept is only the line’s value at x = 0.'],
            ['y', 'It means the fit is poor', 'The intercept says nothing about how good the fit is.'],
          ],
          extrap: [
            ['extrap', '95°F is outside the range of the data, so the prediction is an extrapolation and may be unreliable'],
            ['x', 'There is no problem; plug in x = 95', 'The line is only supported by data from 21°F to 74°F.'],
            ['y', 'The line must be refit with 95 as the intercept', 'That is not what the intercept is.'],
          ],
          r2: [
            ['r2', '99.99% of the variation in steam usage is explained by the linear relation with temperature'],
            ['x', 'Temperature causes 99.99% of steam usage', 'R² measures fit, not causation.'],
            ['y', '99.99% of the points lie exactly on the line', 'R² is about variation explained, not points on the line.'],
          ],
        })[$.q], ($) => $.key),
    ],
    hints: ['Slope: change in predicted y per one-unit increase in x.', 'Intercept: predicted y at x = 0, meaningful only if x = 0 is within the data.', 'Predict only within the range of the x data.'],
    steps: ($) => [
      {
        slope: 'The slope is the change in the predicted response for a one-unit increase in the predictor: 9.21 pounds more steam per 1°F, on average.',
        intercept: 'The intercept is the prediction at x = 0°F. No month in the data is near 0°F, so it is only where the line crosses the axis, not a real usage.',
        extrap: 'The data cover 21°F to 74°F. Predicting at 95°F assumes the straight line continues outside the data, which the data cannot check: extrapolation.',
        r2: 'R² is the proportion of the variation in y explained by the linear relation with x: 99.99% here, an almost perfect linear fit.',
      }[$.q],
    ],
    cases: [kase('Notes Ex 10.2(b)', { q: 'slope' }, { k: 'slope' }), kase('Notes Ex 10.2(c)', { q: 'intercept' }, { k: 'intercept' })],
  }),

  problem({
    ...C10, id: 'c10.correlation-test', title: 'Correlation and the test for a linear relation', kind: 'numeric', level: 3, topics: ['correlation', 'regression', 'hypothesis-test'], src: 'Notes Ex 10.3–10.4',
    vars: { ctx: CTX, n: range(8, 14, 1), side: choice(['two', 'two-tailed'], ['right', 'positive'], ['left', 'negative']), alpha: ALPHA, strength: range(0, 1.2, 0.05), xy: data((rand, v) => pairsOf(rand, v.ctx, v.n, v.strength), (v) => `${v[0].join(', ')} | ${v[1].join(', ')}`) },
    derive: ($) => {
      const [xs, ys] = $.xy;
      const R = linRegTest({ xs, ys, side: $.side });
      return { xs, ys, c: PAIRS[$.ctx], R, r: R.r, t: R.t, df: R.df, p: R.p, dec: decide(R.p, $.alpha) };
    },
    valid: ($) => Math.abs($.p - $.alpha) > 0.004 && $.R.sxx > 0,
    // New versions avoid a near-perfect line; the notes' steam data (Ex 10.3, r = 0.99993) is one.
    sampleValid: ($) => $.p > 0.0005 && Math.abs($.r) < 0.999,
    text: (T, $) => `The table gives ${$.c.x} (x) and ${$.c.y} (y). Find the correlation coefficient r, and test at α = ${$.alpha} whether x and y are ${$.side === 'two' ? 'linearly related' : $.side === 'right' ? 'positively correlated' : 'negatively correlated'}.`,
    figure: ($) => tableScroll($.xs, $.ys, $.c),
    parts: [h1Part(), num('r', ($) => $.r, { label: '$r$', tol: 0, abs: 0.002 }), statPart('t', ($) => $.t, '$t_0$'), pPart(($) => $.p), decisionPart(), conclusionPart()],
    hints: [String.raw`$r = \dfrac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$`, String.raw`Test $H_0: \rho = 0$ with $t_0 = \dfrac{r\sqrt{n-2}}{\sqrt{1-r^2}}$ on $n - 2$ degrees of freedom (the same as testing the slope).`, 'TI-84: STAT → TESTS → F:LinRegTTest (choose ≠, >0 or <0).'],
    steps: ($) => {
      const [h0, h1] = hyp(String.raw`\rho`, '0', $.side);
      return [
        String.raw`$${h0}$ versus $${h1}$`,
        String.raw`$$r = \dfrac{S_{xy}}{\sqrt{S_{xx}S_{yy}}} = \dfrac{${tn($.R.sxy, 6)}}{\sqrt{(${tn($.R.sxx, 6)})(${tn($.R.syy, 6)})}} = ${fx($.r, 4)}$$`,
        String.raw`$$t_0 = \dfrac{${fx($.r, 4)}\sqrt{${$.xs.length} - 2}}{\sqrt{1 - (${fx($.r, 4)})^2}} = ${fx($.t, 4)}, \qquad \nu = ${$.df}$$`,
        String.raw`p-value $= ${pTex($.side, 'T', $.t, $.df)} = ${fx($.p, 4)}$`,
        ...conclude($, `${$.c.x} and ${$.c.y} are ${$.side === 'two' ? 'linearly related' : $.side === 'right' ? 'positively correlated' : 'negatively correlated'}`),
      ];
    },
    cases: [
      kase('Notes Ex 10.4', { ctx: 'noise', n: 10, side: 'right', alpha: 0.05, strength: 1, xy: [NOISE_X, NOISE_Y] }, { r: 0.5262, t: 1.75, p: 0.0591, dec: 'fail' }),
      kase('Notes Ex 10.3 (steam usage)', { ctx: 'steam', n: 12, side: 'two', alpha: 0.05, strength: 1, xy: [STEAM_X, STEAM_Y] }, { r: 0.9999, t: 272.64, p: 0, dec: 'reject' }),
    ],
  }),

  problem({
    ...C10, id: 'c10.association', title: 'Positive or negative association?', kind: 'conceptual', topics: ['correlation', 'association'], src: 'Notes §10.3',
    vars: {
      s: choice(
        ['pos1', 'Monthly steam usage and average monthly temperature at the chemical plant of Notes Ex 10.1, where the months with the highest temperatures used the most steam.'],
        ['pos2', 'Hours studied and exam score.'],
        ['neg1', 'The age of a used car and its price.'],
        ['neg2', 'Outdoor temperature and a home’s heating bill.'],
        ['pos3', 'A person’s height and arm span.'],
        ['neg3', 'Hours of TV watched per week and GPA, in a study that found students who watch more TV tend to have lower GPAs.'],
      ),
    },
    derive: ($) => ({ key: $.s.slice(0, 3) }),
    text: (T) => `${T.s} Are these two variables positively or negatively associated?`,
    parts: [mc('k', [['pos', 'Positively: as one increases, the other tends to increase (r > 0)'], ['neg', 'Negatively: as one increases, the other tends to decrease (r < 0)']], ($) => $.key)],
    hints: ['Picture the scatter plot: does it rise or fall from left to right?', 'The sign of r (and of the slope b) matches the direction of the association.'],
    steps: ($) => [$.key === 'pos' ? 'Larger values of one go with larger values of the other: a positive association, so r and the slope are positive.' : 'Larger values of one go with smaller values of the other: a negative association, so r and the slope are negative.'],
    cases: [kase('Notes Ex 10.1', { s: 'pos1' }, { k: 'pos' })],
  }),
];
