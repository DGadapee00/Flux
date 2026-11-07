/**
 * Truncation error and order of accuracy (EGN 3203 unit 2).
 *
 * Three ways to estimate f′(x) from values of f a step h apart, each read off a Taylor series:
 *   forward      (f(x + h) − f(x))/h                                   error ≈ (h/2) f″      order 1
 *   central      (f(x + h) − f(x − h))/2h                              error ≈ (h²/6) f‴     order 2
 *   five-point   (−f(x+2h) + 8f(x+h) − 8f(x−h) + f(x−2h))/12h          error ≈ (h⁴/30) f⁽⁵⁾  order 4
 * Halving h halves the first error, quarters the second, and divides the third by sixteen. Below
 * some h the round-off in f, about u|f|/h, takes over and the error grows again.
 *
 * The function is sin x at x = 1, whose derivative is cos 1. The reference is checked a second way,
 * by complex-step differentiation, f′(x) ≈ Im f(x + ih)/h, which subtracts nothing and so is exact to
 * round-off at any tiny h: Im sin(x + ih) = cos x sinh h.
 */
export const X0 = 1;
export const f = Math.sin;
export const exact = Math.cos(X0);

/** The derivative by complex step: Im sin(x + ih)/h = cos x · sinh(h)/h. */
export const complexStep = (x, h = 1e-20) => (Math.cos(x) * Math.sinh(h)) / h;

export const METHODS = {
  forward: { name: 'forward', order: 1, d: (x, h) => (f(x + h) - f(x)) / h, lead: (x, h) => (h / 2) * -Math.sin(x) },
  central: { name: 'central', order: 2, d: (x, h) => (f(x + h) - f(x - h)) / (2 * h), lead: (x, h) => ((h * h) / 6) * -Math.cos(x) },
  five: { name: 'five-point', order: 4, d: (x, h) => (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h), lead: (x, h) => (h ** 4 / 30) * Math.cos(x) },
};

/** Every method's error at step h, its observed order from h to h/2, and the reference check. */
export function differences(h) {
  const out = {};
  for (const [id, m] of Object.entries(METHODS)) {
    const e1 = Math.abs(m.d(X0, h) - exact);
    const e2 = Math.abs(m.d(X0, h / 2) - exact);
    out[id] = { ...m, value: m.d(X0, h), error: e1, errorHalf: e2, observed: e1 > 0 && e2 > 0 ? Math.log2(e1 / e2) : null, predicted: Math.abs(m.lead(X0, h)) };
  }
  return { h, methods: out, exact, reference: complexStep(X0), gap: Math.abs(complexStep(X0) - exact) / Math.abs(exact) };
}
