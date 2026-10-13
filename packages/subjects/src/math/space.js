/**
 * Parametric curves γ(t)=(x(t), y(t), z(t)) in R³ (Merino §4.3).
 * Length: route A is ∫ √(x'²+y'²+z'²) dt; route B is the sampled polyline.
 */

export const SPACE_CURVES = {
  helix: {
    id: 'helix',
    name: 'Helix  (cos t, sin t, t/2)',
    tex: '(\\cos t,\\,\\sin t,\\, t/2)',
    t0: 0,
    t1: 2 * Math.PI,
    tStart: Math.PI / 3,
    x: (t) => Math.cos(t),
    y: (t) => Math.sin(t),
    z: (t) => t / 2,
    xp: (t) => -Math.sin(t),
    yp: (t) => Math.cos(t),
    zp: () => 0.5,
    speed: () => Math.sqrt(5) / 2,
    length: (a, b) => (Math.sqrt(5) / 2) * Math.abs(b - a),
  },
  coil: {
    id: 'coil',
    name: '(t, 2 cos t, 2 sin t)',
    tex: '(t,\\, 2\\cos t,\\, 2\\sin t)',
    t0: 0,
    t1: 2 * Math.PI,
    tStart: Math.PI / 2,
    x: (t) => t,
    y: (t) => 2 * Math.cos(t),
    z: (t) => 2 * Math.sin(t),
    xp: () => 1,
    yp: (t) => -2 * Math.sin(t),
    zp: (t) => 2 * Math.cos(t),
    speed: () => Math.sqrt(5),
    length: (a, b) => Math.sqrt(5) * Math.abs(b - a),
  },
  cubic: {
    id: 'cubic',
    name: '(t, t², t³)',
    tex: '(t,\\, t^2,\\, t^3)',
    t0: -1.2,
    t1: 1.2,
    tStart: 0.7,
    x: (t) => t,
    y: (t) => t * t,
    z: (t) => t * t * t,
    xp: () => 1,
    yp: (t) => 2 * t,
    zp: (t) => 3 * t * t,
    speed: (t) => Math.hypot(1, 2 * t, 3 * t * t),
    length: null,
  },
  line: {
    id: 'line',
    name: '(2t, t, 1 − t)',
    tex: '(2t,\\, t,\\, 1-t)',
    t0: -1,
    t1: 1.5,
    tStart: 0.4,
    x: (t) => 2 * t,
    y: (t) => t,
    z: (t) => 1 - t,
    xp: () => 2,
    yp: () => 1,
    zp: () => -1,
    speed: () => Math.sqrt(6),
    length: (a, b) => Math.sqrt(6) * Math.abs(b - a),
  },
};

export function spaceById(id) {
  return SPACE_CURVES[id] || SPACE_CURVES.helix;
}

export function evalSpace(c, t) {
  const xp = c.xp(t);
  const yp = c.yp(t);
  const zp = c.zp(t);
  const speed = Math.hypot(xp, yp, zp);
  return {
    x: c.x(t),
    y: c.y(t),
    z: c.z(t),
    xp,
    yp,
    zp,
    speed,
  };
}

/** Polyline length in R³ — independent of simpson. */
export function polylineLength3(c, a, b, n = 400) {
  let s = 0;
  let px = c.x(a);
  let py = c.y(a);
  let pz = c.z(a);
  for (let i = 1; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    const x = c.x(t);
    const y = c.y(t);
    const z = c.z(t);
    s += Math.hypot(x - px, y - py, z - pz);
    px = x;
    py = y;
    pz = z;
  }
  return s;
}
