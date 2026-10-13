/**
 * Chain rule (Merino Theorems 15 and 16).
 *
 * Theorem 15: g = f ∘ γ with γ(t)=(x(t), y(t)). Then
 *   g'(t) = f_x x' + f_y y' = ∇f · γ'.
 * Theorem 16: inner map g(s,t)=(x(s,t), y(s,t)), h = f ∘ g. Then
 *   h_s = f_x x_s + f_y y_s,  h_t = f_x x_t + f_y y_t.
 *
 * Dual routes: the chain formula vs a central difference quotient of the composite.
 * A third route for Theorem 15 dots a numeric gradient with γ'.
 */

export function chainAlong(surf, curve, t, params) {
  const x = curve.x(t);
  const y = curve.y(t);
  const xp = curve.xp(t);
  const yp = curve.yp(t);
  const f = surf.f(x, y, params);
  const fx = surf.fx(x, y, params);
  const fy = surf.fy(x, y, params);
  return { x, y, xp, yp, f, fx, fy, g: f, gp: fx * xp + fy * yp };
}

export function gQuotient(surf, curve, t, params, h = 1e-5) {
  const g = (s) => surf.f(curve.x(s), curve.y(s), params);
  return (g(t + h) - g(t - h)) / (2 * h);
}

/** Inner maps g: R² → R² for Theorem 16. */
export const INNERS = {
  polar: {
    id: 'polar',
    name: 'Polar  (s cos t, s sin t)',
    tex: '(s\\cos t,\\, s\\sin t)',
    x: (s, t) => s * Math.cos(t),
    y: (s, t) => s * Math.sin(t),
    xs: (s, t) => Math.cos(t),
    ys: (s, t) => Math.sin(t),
    xt: (s, t) => -s * Math.sin(t),
    yt: (s, t) => s * Math.cos(t),
    sMin: 0.3,
    sMax: 2,
    s0: 1,
    tMin: 0,
    tMax: 2 * Math.PI,
    tStart: Math.PI / 3,
  },
  bilinear: {
    id: 'bilinear',
    name: '(s t², s² t)',
    tex: '(s t^2,\\, s^2 t)',
    x: (s, t) => s * t * t,
    y: (s, t) => s * s * t,
    xs: (s, t) => t * t,
    ys: (s, t) => 2 * s * t,
    xt: (s, t) => 2 * s * t,
    yt: (s, t) => s * s,
    sMin: 0.4,
    sMax: 1.4,
    s0: 0.8,
    tMin: 0.4,
    tMax: 1.4,
    tStart: 0.9,
  },
};

export function innerById(id) {
  return INNERS[id] || INNERS.polar;
}

export function evalInner(inn, s, t) {
  return {
    x: inn.x(s, t),
    y: inn.y(s, t),
    xs: inn.xs(s, t),
    ys: inn.ys(s, t),
    xt: inn.xt(s, t),
    yt: inn.yt(s, t),
  };
}

export function chainMap(surf, inn, s, t, params) {
  const g = evalInner(inn, s, t);
  const f = surf.f(g.x, g.y, params);
  const fx = surf.fx(g.x, g.y, params);
  const fy = surf.fy(g.x, g.y, params);
  return {
    ...g,
    f,
    fx,
    fy,
    h: f,
    hs: fx * g.xs + fy * g.ys,
    ht: fx * g.xt + fy * g.yt,
  };
}

export function hQuotientS(surf, inn, s, t, params, h = 1e-5) {
  const H = (ss) => surf.f(inn.x(ss, t), inn.y(ss, t), params);
  return (H(s + h) - H(s - h)) / (2 * h);
}

export function hQuotientT(surf, inn, s, t, params, h = 1e-5) {
  const H = (tt) => surf.f(inn.x(s, tt), inn.y(s, tt), params);
  return (H(t + h) - H(t - h)) / (2 * h);
}
