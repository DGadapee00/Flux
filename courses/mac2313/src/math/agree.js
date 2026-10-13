/**
 * Do two independent routes to the same quantity agree?
 *
 * `scale` is the magnitude the comparison is measured against — the size of the quantity being
 * computed, not of the difference between the routes. Each lab passes its own yardstick: ‖∇f‖ for
 * a directional derivative, ∬|f| for an integral, the size of the individual terms for a
 * discriminant. Those stay finite when the compared value cancels to zero, which is exactly when a
 * relative tolerance on the value itself breaks down.
 *
 * This replaces a `Math.max(1, |a|, |b|)` floor, which turned the relative tolerance into a flat
 * absolute one for every quantity below 1 — and most of what these labs display is below 1. On the
 * Gaussian surface at (−2, −2) it left the "routes agree" light tolerating a difference 30× the
 * value of D_u f itself, so no error in the analytic partials could ever have turned it red.
 *
 * `floor` is the absolute noise bound of the numerical route: below it the two numbers are the
 * same number and the difference is rounding. Derive it, do not guess it — for a difference
 * quotient of step h on values of size |f| it is about ε|f|/h; for a quadrature it is the
 * integrator's own error. Left at 0 the comparison is purely relative, and two values that are
 * both floating-point dust around zero will disagree.
 */
export function agreeTo(a, b, scale, { tol = 0.02, floor = 0 } = {}) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const s = Number.isFinite(scale) ? Math.abs(scale) : Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tol * s + Math.abs(floor);
}

/**
 * Rounding noise in a difference quotient of step `h` on values of size `f`. A first difference
 * divides by h and an nth difference by h^n, so the noise grows with the order.
 */
export const quotientNoise = (f, h, order = 1) =>
  (Number.EPSILON * Math.max(1, Math.abs(f))) / Math.pow(h, order);
