/**
 * Regression (Ch 10). Drag the points, or tap empty space to add one; the least-squares line
 * ŷ = a + bx, the residuals, R² and the residual plot follow.
 *
 * What it corrects: that every unusual point matters equally (a point far out in x, high leverage,
 * can swing the line; the same miss in the middle of the x's mostly just costs R²), that a high R²
 * means the relation is linear (a curve can have R² above 0.9; the residual plot shows it), and
 * that the residuals are the vertical distances, not the perpendicular ones.
 */
import { defineLab } from './define.js';
import { setup, area, axes, segment, dot, label, C, alpha } from '../plot/plot.js';
import { regression } from '../stats/describe.js';

/** A roughly linear cloud, y ≈ 2 + 0.8x, that the outlier and leverage presets add one point to. */
const BASE = [
  [1, 3.2], [2, 3.0], [3, 4.7], [4, 6.1], [5, 5.2], [6, 7.0], [7, 7.3], [8, 9.1], [9, 8.7], [10, 9.8],
];
const PRESETS = {
  line: { label: 'A linear trend', base: BASE, extra: null, box: [0, 12, 0, 14] },
  outlier: { label: 'An outlier in the middle', base: BASE, extra: [5.5, 13], box: [0, 12, 0, 14] },
  leverage: { label: 'A point far out in x', base: BASE, extra: [20, 6], box: [0, 22, 0, 20] },
  curved: { label: 'A curve', base: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => [x, Number((1 + 0.2 * x * x).toFixed(1))]), extra: null, box: [0, 12, 0, 24] },
  none: { label: 'No relationship', base: [[1, 6.2], [2, 3.1], [3, 8.4], [4, 4.0], [5, 9.1], [6, 2.7], [7, 6.9], [8, 4.4], [9, 7.8], [10, 5.1]], extra: null, box: [0, 12, 0, 14] },
  noise: {
    label: 'Noise and blood pressure (Notes Ex 10.4)',
    base: [[1, 70], [0, 63], [1, 65], [2, 70], [5, 70], [1, 70], [4, 80], [6, 75], [2, 80], [3, 80]],
    extra: null,
    box: [0, 7, 55, 90],
  },
};

const presetPoints = (P) => (P.extra ? [...P.base, P.extra] : P.base).map(([x, y]) => [x, y]);

/** The points on screen: the user's edits of this preset, or the preset itself. */
const pointsOf = (s) => (s.edits && s.edits.preset === s.preset ? s.edits.points : presetPoints(PRESETS[s.preset]));

const fit = (pts) => (pts.length >= 3 ? regression(pts.map((p) => p[0]), pts.map((p) => p[1])) : null);

const f2 = (x) => (Math.abs(x) < 5e-5 ? '0' : x.toFixed(4).replace(/\.?0+$/, ''));

export default defineLab({
  id: 'reg',
  title: 'Regression',
  ch: ['10'],
  blurb: 'Drag points and watch the least-squares line, the residuals and R² follow. Outliers, leverage, and a curve with a high R².',
  height: 1.05,
  params: [
    { id: 'preset', label: 'Points', type: 'choice', options: Object.entries(PRESETS).map(([k, p]) => [k, p.label]), value: 'line', select: true },
    { id: 'resid', label: 'Show the residuals', type: 'toggle', value: true },
    { id: 'rplot', label: 'Show the residual plot', type: 'toggle', value: true },
  ],
  initial: { edits: null, sel: -1 },
  scenarios: Object.entries(PRESETS).map(([k, p]) => ({ id: k, label: p.label, state: { preset: k, edits: null, sel: -1 } })),
  actions: [
    { id: 'undo', label: 'Reset the points', run: (s) => ({ ...s, edits: null, sel: -1 }) },
    {
      id: 'pop',
      label: 'Remove the last point',
      run: (s) => {
        const pts = pointsOf(s).slice(0, -1);
        return pts.length >= 3 ? { ...s, edits: { preset: s.preset, points: pts }, sel: -1 } : s;
      },
    },
  ],

  compute(s) {
    const P = PRESETS[s.preset];
    const pts = pointsOf(s);
    const F = fit(pts);
    const base = fit(P.base);
    const resid = F ? pts.map(([x, y]) => y - (F.b0 + F.b1 * x)) : [];
    const lev = F ? pts.map(([x]) => 1 / F.n + (x - F.xb) ** 2 / F.sxx) : [];
    const edited = !!(s.edits && s.edits.preset === s.preset);
    return { P, pts, fit: F, base, resid, lev, edited, ghost: edited || !!P.extra };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const [x0, x1, y0, y1] = r.P.box;
    const split = s.rplot ? Math.round(h * 0.68) : h;
    const A = area(w, split, { x: [x0, x1], y: [y0, y1], left: 34 });
    axes(ctx, A, { xLabel: 'x', yLabel: 'y' });
    const F = r.fit;
    ctx.save();
    ctx.beginPath();
    ctx.rect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
    ctx.clip();
    if (r.ghost && r.base) segment(ctx, A, x0, r.base.b0 + r.base.b1 * x0, x1, r.base.b0 + r.base.b1 * x1, { color: alpha(C.text, 0.35), width: 1.5, dash: [5, 5] });
    if (F) {
      if (s.resid) r.pts.forEach(([x, y], i) => segment(ctx, A, x, y, x, y - r.resid[i], { color: alpha(C.red, 0.8), width: 1.5 }));
      segment(ctx, A, x0, F.b0 + F.b1 * x0, x1, F.b0 + F.b1 * x1, { color: C.gold, width: 2.4 });
    }
    ctx.restore();
    r.pts.forEach(([x, y], i) => dot(ctx, A, x, y, { color: i === s.sel ? C.yellow : C.blue, r: i === s.sel ? 6 : 5, ring: i === s.sel ? C.text : null }));

    let B = null;
    if (s.rplot && F) {
      const m = Math.max(1, ...r.resid.map(Math.abs)) * 1.2;
      B = area(w, h, { x: [x0, x1], y: [-m, m], left: 34, top: split + 12 });
      axes(ctx, B, { xLabel: 'x', yCount: 3 });
      label(ctx, 'residual e = y − ŷ', B.x0 + 4, B.y0 - 12, { color: C.muted, baseline: 'top' });
      segment(ctx, B, x0, 0, x1, 0, { color: C.gold, width: 1.2 });
      r.pts.forEach(([x], i) => dot(ctx, B, x, r.resid[i], { color: i === s.sel ? C.yellow : C.blue, r: 3.5 }));
    }
    return { A, B };
  },

  pointer: {
    down(view, s, px, py) {
      const { A } = view;
      if (px < A.x0 - 10 || px > A.x1 + 10 || py < A.y0 - 10 || py > A.y1 + 10) return false;
      const pts = pointsOf(s).map((p) => [...p]);
      let best = -1;
      let bd = 22;
      pts.forEach(([x, y], i) => {
        const d = Math.hypot(A.x(x) - px, A.y(y) - py);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best < 0) {
        if (pts.length >= 40) return false;
        pts.push([A.x.invert(px), A.y.invert(py)]);
        best = pts.length - 1;
      }
      s.edits = { preset: s.preset, points: pts };
      s.sel = best;
      return true;
    },
    move(view, s, px, py) {
      const { A } = view;
      const [x0, x1, y0, y1] = PRESETS[s.preset].box;
      const x = Math.min(x1, Math.max(x0, A.x.invert(px)));
      const y = Math.min(y1, Math.max(y0, A.y.invert(py)));
      s.edits.points[s.sel] = [Number(x.toFixed(2)), Number(y.toFixed(2))];
      return true;
    },
  },

  readout(s, r) {
    const F = r.fit;
    if (!F) return [['Line', 'needs 3 points']];
    return [
      [String.raw`$\hat{y} = a + bx$`, `$${f2(F.b0)} ${F.b1 < 0 ? '-' : '+'} ${f2(Math.abs(F.b1))}x$`],
      ['$r$', `$${f2(F.r)}$`],
      ['$R^2$', `$${f2(F.r2)}$`],
      ['$s$', `$${f2(Math.sqrt(F.s2))}$`],
    ];
  },

  explain(s, r) {
    const F = r.fit;
    if (!F) return ['Put back a point or two: a line needs at least three to have any residuals left.'];
    const out = [
      String.raw`The gold line makes $SSE = \sum e_i^2$ as small as possible, where each residual $e_i = y_i - \hat{y}_i$ is a VERTICAL distance (red). Here $SSE = ${f2(F.sse)}$, $b = S_{xy}/S_{xx} = ${f2(F.b1)}$ and $a = \bar{y} - b\bar{x} = ${f2(F.b0)}$.`,
      String.raw`$R^2 = 1 - SSE/S_{yy} = ${f2(F.r2)}$: the share of the variation in $y$ the line accounts for.`,
    ];
    if (r.ghost && r.base) out.push(String.raw`The dashed line is the fit without ${r.edited ? 'your changes' : 'the extra point'}: $\hat{y} = ${f2(r.base.b0)} + ${f2(r.base.b1)}x$.`);
    if (s.sel >= 0 && s.sel < r.pts.length) {
      out.push(String.raw`The selected point has leverage $h = \frac{1}{n} + \frac{(x - \bar{x})^2}{S_{xx}} = ${f2(r.lev[s.sel])}$ (the average is $2/n = ${f2(2 / F.n)}$). The further its $x$ from $\bar{x}$, the harder it pulls the line.`);
    }
    if (s.preset === 'curved' && !r.edited) out.push(String.raw`$R^2$ is high, yet the residual plot is a U: the line is too high at the ends and too low in the middle. A straight line is the wrong model even though it "explains" most of the variation. Always look at the residual plot.`);
    return out;
  },

  predictions: [
    {
      id: 'outlier',
      setup: { preset: 'line' },
      change: { preset: 'outlier' },
      prompt: 'Add one point far above the others, in the MIDDLE of the x values (x = 5.5, y = 13). The slope of the fitted line…',
      options: [['lot', 'changes a lot'], ['little', 'barely changes'], ['flip', 'changes sign']],
      outcome: (b, a) => {
        const k = Math.abs(a.fit.b1 - b.fit.b1) / Math.abs(b.fit.b1);
        return a.fit.b1 * b.fit.b1 < 0 ? 'flip' : k > 0.2 ? 'lot' : 'little';
      },
      expect: 'little',
      why: 'A point at x near x̄ has low leverage: it lifts the whole line a little (the intercept), but it cannot tilt it much. What it does damage is the fit: R² drops from 0.94 to 0.53, because its residual is huge.',
    },
    {
      id: 'leverage',
      setup: { preset: 'line' },
      change: { preset: 'leverage' },
      prompt: 'Instead, add one point far out to the right (x = 20) that sits well BELOW where the trend would put it (y = 6 instead of about 18). The slope…',
      options: [['lot', 'changes a lot'], ['little', 'barely changes'], ['up', 'gets steeper']],
      outcome: (b, a) => {
        const k = Math.abs(a.fit.b1 - b.fit.b1) / Math.abs(b.fit.b1);
        return a.fit.b1 > b.fit.b1 * 1.05 ? 'up' : k > 0.2 ? 'lot' : 'little';
      },
      expect: 'lot',
      why: 'Far from x̄ a point has high leverage: it works like a long lever on the line. This one drags the slope from 0.77 down to 0.21, almost by itself. Before trusting a fit, look for points far out in x.',
    },
    {
      id: 'curve-r2',
      setup: { preset: 'line' },
      change: { preset: 'curved' },
      prompt: 'Now the points follow a clear curve, y = 1 + 0.2x², with no scatter at all. Fitting a straight line anyway, R² will be…',
      options: [['low', 'low (below 0.5): it is not a line'], ['mid', 'middling (0.5 to 0.9)'], ['high', 'high (above 0.9)']],
      outcome: (b, a) => (a.fit.r2 > 0.9 ? 'high' : a.fit.r2 >= 0.5 ? 'mid' : 'low'),
      expect: 'high',
      why: 'R² = 0.95: the line tracks the rising curve closely. R² measures how much variation a line accounts for, not whether a line is the right shape. The residual plot gives the curve away: a U, not a patternless band.',
    },
  ],
});
