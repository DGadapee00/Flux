/**
 * Differentiating by differences, and where round-off takes over (EGN 3203).
 *
 * The forward difference [f(x + h) − f(x)]/h misses f′(x) by about (h/2)|f″|; the central difference
 * [f(x + h) − f(x − h)]/2h by about (h²/6)|f‴|. But f(x + h) and f(x) agree in most of their digits
 * when h is small, and subtracting them leaves only the rest: each value carries a relative error
 * near ε = 2⁻⁵², so the difference carries about ε|f|/h. The total error
 *   forward:  (h/2)|f″| + ε|f|/h,   least near h = √(2ε|f|/|f″|) ≈ 10⁻⁸,
 *   central:  (h²/6)|f‴| + ε|f|/h,  least near h = (3ε|f|/|f‴|)^{1/3} ≈ 10⁻⁵,
 * falls, bottoms out, then climbs as h shrinks.
 *
 * Here f = sin x at x = 1. The errors are measured against cos 1, and that reference is checked by
 * the complex step, Im f(x + ih)/h = cos x · sinh h/h, which has no subtraction and so no round-off
 * growth.
 */

export const X0 = 1;
export const EPS = 2 ** -52;

export function diffChecked({ lh }) {
  const h = 10 ** lh;
  const exact = Math.cos(X0);
  const fwd = (Math.sin(X0 + h) - Math.sin(X0)) / h;
  const cen = (Math.sin(X0 + h) - Math.sin(X0 - h)) / (2 * h);
  const errF = Math.abs(fwd - exact);
  const errC = Math.abs(cen - exact);
  const f = Math.abs(Math.sin(X0));
  const modelF = (h / 2) * Math.abs(Math.sin(X0)) + (EPS * f) / h;
  const modelC = ((h * h) / 6) * Math.abs(Math.cos(X0)) + (EPS * f) / h;
  const hOptF = Math.sqrt((2 * EPS * f) / Math.abs(Math.sin(X0)));
  const hOptC = Math.cbrt((3 * EPS * f) / Math.abs(Math.cos(X0)));
  // Complex step at a tiny step: Im sin(x + ih)/h = cos x sinh h / h.
  const hs = 1e-20;
  const cs = (Math.cos(X0) * Math.sinh(hs)) / hs;
  return { h, fwd, cen, errF, errC, modelF, modelC, hOptF, hOptC, exact, cs, gap: Math.abs(cs - exact) / Math.abs(exact) };
}

export const errorsAt = (lh) => {
  const h = 10 ** lh;
  const exact = Math.cos(X0);
  return {
    f: Math.abs((Math.sin(X0 + h) - Math.sin(X0)) / h - exact),
    c: Math.abs((Math.sin(X0 + h) - Math.sin(X0 - h)) / (2 * h) - exact),
  };
};
