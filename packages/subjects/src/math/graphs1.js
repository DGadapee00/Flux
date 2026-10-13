/**
 * Named y = f(x) for the Chapter 1 labs. Analytic f' and an antiderivative F are route A.
 */

export const GRAPHS = {
  quad: {
    id: 'quad',
    name: 'x²',
    tex: 'x^2',
    f: (x) => x * x,
    fp: (x) => 2 * x,
    F: (x) => (x * x * x) / 3,
  },
  line: {
    id: 'line',
    name: '2x + 1',
    tex: '2x+1',
    f: (x) => 2 * x + 1,
    fp: () => 2,
    F: (x) => x * x + x,
  },
  abs: {
    id: 'abs',
    name: '|x|',
    tex: '|x|',
    f: (x) => Math.abs(x),
    fp: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN),
    F: (x) => 0.5 * x * Math.abs(x),
  },
  cube: {
    id: 'cube',
    name: 'x³',
    tex: 'x^3',
    f: (x) => x * x * x,
    fp: (x) => 3 * x * x,
    F: (x) => (x * x * x * x) / 4,
  },
  hole: {
    id: 'hole',
    name: '(x² − 1)/(x − 1)',
    tex: '\\dfrac{x^2-1}{x-1}',
    f: (x) => {
      if (Math.abs(x - 1) < 1e-12) return NaN;
      return (x * x - 1) / (x - 1);
    },
    fp: (x) => (Math.abs(x - 1) < 1e-12 ? NaN : 1),
    F: (x) => 0.5 * x * x + x,
  },
  squeeze: {
    id: 'squeeze',
    name: 'x² sin(1/x)',
    tex: 'x^2\\sin(1/x)',
    f: (x) => (x === 0 ? 0 : x * x * Math.sin(1 / x)),
    fp: (x) => {
      if (x === 0) return 0;
      return 2 * x * Math.sin(1 / x) - Math.cos(1 / x);
    },
    F: null,
  },
  semi: {
    id: 'semi',
    name: '√(1 − x²)',
    tex: '\\sqrt{1-x^2}',
    f: (x) => {
      const d = 1 - x * x;
      if (d < 0) return NaN;
      return Math.sqrt(d);
    },
    fp: (x) => {
      const d = 1 - x * x;
      if (d <= 1e-15) return NaN;
      return -x / Math.sqrt(d);
    },
    F: (x) => {
      const xx = Math.max(-1, Math.min(1, x));
      const s = Math.sqrt(Math.max(0, 1 - xx * xx));
      return 0.5 * (xx * s + Math.asin(xx));
    },
  },
};

export function graphById(id) {
  return GRAPHS[id] || GRAPHS.quad;
}

/** Polyline length of y = f(x) on [a, b]. Independent of Simpson of √(1 + f'²). */
export function graphPolyline(g, a, b, n = 400) {
  const nX = Math.max(2, n | 0);
  let L = 0;
  let px = a;
  let py = g.f(a);
  for (let i = 1; i <= nX; i++) {
    const x = a + ((b - a) * i) / nX;
    const y = g.f(x);
    if (Number.isFinite(py) && Number.isFinite(y)) L += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return L;
}

/** Speed √(1 + f'(x)²) with a tiny inset so endpoint singularities (the semicircle) stay finite. */
export function graphSpeed(g, x, a, b) {
  const span = Math.max(1e-9, Math.abs(b - a));
  const eps = 1e-7 * span;
  const xx = Math.min(b - eps, Math.max(a + eps, x));
  const fp = g.fp(xx);
  if (!Number.isFinite(fp)) return 0;
  return Math.hypot(1, fp);
}
