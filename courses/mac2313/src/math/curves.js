/**
 * Named parametric curves γ(t) = (x(t), y(t)) with analytic derivatives.
 * Arc length: route A is ∫ √(x'²+y'²) dt (simpson, or a closed form when we have one);
 * route B is the polyline length of the sampled curve.
 */

function hypot1(t) {
  return Math.hypot(1, 2 * t);
}

/** Antiderivative of √(1+4t²). */
function parabolaArcF(t) {
  const s = hypot1(t);
  return 0.5 * t * s + 0.25 * Math.log(Math.abs(2 * t + s));
}

export const CURVES = {
  circle: {
    id: 'circle',
    name: 'Unit circle',
    tex: '(\\cos t,\\,\\sin t)',
    t0: 0,
    t1: 2 * Math.PI,
    tStart: Math.PI / 3,
    x: (t) => Math.cos(t),
    y: (t) => Math.sin(t),
    xp: (t) => -Math.sin(t),
    yp: (t) => Math.cos(t),
    speed: () => 1,
    length: (a, b) => Math.abs(b - a),
  },
  parabola: {
    id: 'parabola',
    name: 'Parabola  (t, t²)',
    tex: '(t,\\, t^2)',
    t0: -1.5,
    t1: 1.5,
    tStart: 0.7,
    x: (t) => t,
    y: (t) => t * t,
    xp: () => 1,
    yp: (t) => 2 * t,
    speed: (t) => hypot1(t),
    length: (a, b) => parabolaArcF(b) - parabolaArcF(a),
  },
  cubic: {
    id: 'cubic',
    name: 'Cusp cousin  (t², t³ − 3t)',
    tex: '(t^2,\\, t^3-3t)',
    t0: -2,
    t1: 2,
    tStart: 1.1,
    x: (t) => t * t,
    y: (t) => t * t * t - 3 * t,
    xp: (t) => 2 * t,
    yp: (t) => 3 * t * t - 3,
    speed: (t) => Math.hypot(2 * t, 3 * t * t - 3),
    length: null,
  },
  spiral: {
    id: 'spiral',
    name: 'Archimedean spiral',
    tex: '(t\\cos t,\\, t\\sin t)',
    t0: 0,
    t1: 2 * Math.PI,
    tStart: 2.4,
    x: (t) => t * Math.cos(t),
    y: (t) => t * Math.sin(t),
    xp: (t) => Math.cos(t) - t * Math.sin(t),
    yp: (t) => Math.sin(t) + t * Math.cos(t),
    speed: (t) => Math.hypot(Math.cos(t) - t * Math.sin(t), Math.sin(t) + t * Math.cos(t)),
    length: null,
  },
};

export function curveById(id) {
  return CURVES[id] || CURVES.circle;
}

export function evalCurve(c, t) {
  const xp = c.xp(t);
  const yp = c.yp(t);
  const speed = Math.hypot(xp, yp);
  let slope = NaN;
  let tangent = 'none';
  if (Math.abs(xp) < 1e-10 && Math.abs(yp) < 1e-10) tangent = 'cusp';
  else if (Math.abs(xp) < 1e-10) tangent = 'vertical';
  else if (Math.abs(yp) < 1e-10) {
    tangent = 'horizontal';
    slope = 0;
  } else {
    tangent = 'oblique';
    slope = yp / xp;
  }
  return {
    x: c.x(t),
    y: c.y(t),
    xp,
    yp,
    speed,
    slope,
    tangent,
  };
}

/** Polyline length of γ on [a,b] with n segments — independent of simpson. */
export function polylineLength(c, a, b, n = 400) {
  let s = 0;
  let px = c.x(a);
  let py = c.y(a);
  for (let i = 1; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    const x = c.x(t);
    const y = c.y(t);
    s += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return s;
}
