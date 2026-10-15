/**
 * Planar rigid-body kinematics. Positive ω and α are counterclockwise.
 * sliderCrank, fourBar, and rollingPoint take angles in radians.
 * ladder takes the floor angle in degrees.
 */

const DEG = Math.PI / 180;

function z() {
  return { x: 0, y: 0, z: 0 };
}

/** v_B = v_A + ω × r_B/A. omega is the z component. */
export function relativeVelocity(vA, omega, rBfromA) {
  return {
    x: vA.x - omega * rBfromA.y,
    y: vA.y + omega * rBfromA.x,
    z: 0,
  };
}

/** a_B = a_A + α × r − ω² r. */
export function relativeAcceleration(aA, omega, alpha, rBfromA) {
  const w2 = omega * omega;
  return {
    x: aA.x - alpha * rBfromA.y - w2 * rBfromA.x,
    y: aA.y + alpha * rBfromA.x - w2 * rBfromA.y,
    z: 0,
  };
}

/**
 * Intersection of the lines through A and B that are perpendicular to the velocity directions.
 * Null when those lines are parallel (pure translation, centre at infinity).
 */
export function instantCenter(pointA, dirA, pointB, dirB) {
  const a1 = dirA.x;
  const b1 = dirA.y;
  const c1 = dirA.x * pointA.x + dirA.y * pointA.y;
  const a2 = dirB.x;
  const b2 = dirB.y;
  const c2 = dirB.x * pointB.x + dirB.y * pointB.y;
  const det = a1 * b2 - a2 * b1;
  if (!(Math.abs(det) > 1e-12)) return null;
  return {
    x: (c1 * b2 - c2 * b1) / det,
    y: (a1 * c2 - a2 * c1) / det,
    z: 0,
  };
}

/** ω = (r × v)_z / |r|², with r drawn from a centre that is instantaneously at rest. */
export function omegaFromCenter(point, velocity, center) {
  const rx = point.x - center.x;
  const ry = point.y - center.y;
  const r2 = rx * rx + ry * ry;
  if (!(r2 > 1e-16)) return NaN;
  return (rx * velocity.y - ry * velocity.x) / r2;
}

/** p + s dirP = q + t dirQ. Null when the directions are parallel. */
export function lineIntersection(p, dirP, q, dirQ) {
  const det = dirP.x * dirQ.y - dirP.y * dirQ.x;
  if (!(Math.abs(det) > 1e-12)) return null;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const s = (dx * dirQ.y - dy * dirQ.x) / det;
  return { x: p.x + s * dirP.x, y: p.y + s * dirP.y, z: 0 };
}

/**
 * Foot on the floor, top on the wall at x = 0. thetaDeg is the angle with the floor.
 * footSpeed > 0 moves the foot away from the wall, and the top descends.
 */
export function ladder(length, thetaDeg, footSpeed) {
  const th = thetaDeg * DEG;
  const foot = { x: length * Math.cos(th), y: 0, z: 0 };
  const top = { x: 0, y: length * Math.sin(th), z: 0 };
  const ic = { x: foot.x, y: top.y, z: 0 };
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  if (!(Math.abs(sin) > 1e-8) || !(length > 0)) {
    return { foot, top, ic, omega: 0, vTop: z(), down: 0 };
  }
  const omega = footSpeed / (length * sin);
  const vTop = { x: 0, y: -omega * length * cos, z: 0 };
  return { foot, top, ic, omega, vTop, down: -vTop.y };
}

/**
 * Two pulleys joined by an open belt, or two external gears.
 * external true reverses the sense. ratio multiplies ω and α of the driver.
 */
export function rollContact(radius1, omega1, radius2, { external = false } = {}) {
  if (!(radius2 > 0)) return { omega2: 0, speed: 0, ratio: 0 };
  const sign = external ? -1 : 1;
  const ratio = sign * (radius1 / radius2);
  return {
    omega2: ratio * omega1,
    speed: Math.abs(radius1 * omega1),
    ratio,
  };
}

/**
 * Slider-crank. theta is the crank angle from the slider axis, in radians.
 * The rod stays on the side with cos φ ≥ 0. locked is true when the crank cannot reach.
 */
export function sliderCrank({ r, l, theta, omega = 0, alpha = 0 }) {
  const quiet = { x: 0, phi: 0, v: 0, a: 0, phiDot: 0, phiDdot: 0, locked: true };
  if (!(l > 0)) return quiet;
  const n = r / l;
  const s = n * Math.sin(theta);
  if (Math.abs(s) > 1) return quiet;
  const phi = Math.asin(s);
  const cphi = Math.cos(phi);
  const cth = Math.cos(theta);
  const sth = Math.sin(theta);
  const x = r * cth + l * cphi;
  if (!(cphi > 1e-8)) return { ...quiet, x, phi };
  const phiDot = (n * cth * omega) / cphi;
  const phiDdot = (n * (-sth * omega * omega + cth * alpha) + Math.sin(phi) * phiDot * phiDot) / cphi;
  const vRaw = -r * sth * omega - l * Math.sin(phi) * phiDot;
  const aRaw = -r * cth * omega * omega - r * sth * alpha - l * cphi * phiDot * phiDot - l * Math.sin(phi) * phiDdot;
  const snap = (n) => (Math.abs(n) < 1e-8 ? 0 : n);
  return { x, phi, v: snap(vRaw), a: snap(aRaw), phiDot, phiDdot, locked: false };
}

/** Two intersections of circles, or null when they miss. Tangent circles repeat the one point. */
export function circleCircle(p, rP, q, rQ) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const d = Math.hypot(dx, dy);
  if (!(d > 1e-12) || d > rP + rQ + 1e-9 || d < Math.abs(rP - rQ) - 1e-9) return null;
  const a = (rP * rP - rQ * rQ + d * d) / (2 * d);
  const h2 = rP * rP - a * a;
  if (h2 < -1e-8) return null;
  const h = Math.sqrt(Math.max(0, h2));
  const mx = p.x + (a * dx) / d;
  const my = p.y + (a * dy) / d;
  const ox = (-dy * h) / d;
  const oy = (dx * h) / d;
  return [
    { x: mx + ox, y: my + oy, z: 0 },
    { x: mx - ox, y: my - oy, z: 0 },
  ];
}

function missed() {
  const o = z();
  return {
    A: { ...o },
    B: { ...o },
    C: { ...o },
    vA: { ...o },
    vB: { ...o },
    ic: null,
    omegaCoupler: 0,
    speedB: 0,
    miss: true,
  };
}

/**
 * Crank at the origin, rocker pivot at (ground, 0). theta is the crank angle in radians.
 * assembly 'up' keeps the coupler point with the larger y.
 */
export function fourBar({ crank, coupler, rocker, ground, theta, omega = 0, assembly = 'up' }) {
  const A = { x: crank * Math.cos(theta), y: crank * Math.sin(theta), z: 0 };
  const C = { x: ground, y: 0, z: 0 };
  const hits = circleCircle(A, coupler, C, rocker);
  if (!hits) return missed();
  const B = assembly === 'down'
    ? (hits[0].y <= hits[1].y ? hits[0] : hits[1])
    : (hits[0].y >= hits[1].y ? hits[0] : hits[1]);
  const vA = relativeVelocity(z(), omega, A);
  const along = { x: B.x - C.x, y: B.y - C.y, z: 0 };
  const ic = lineIntersection(z(), A, C, along);
  if (!ic) {
    return { A, B, C, vA, vB: z(), ic: null, omegaCoupler: 0, speedB: 0, miss: false };
  }
  const rx = A.x - ic.x;
  const ry = A.y - ic.y;
  const r2 = rx * rx + ry * ry;
  if (!(r2 > 1e-12)) {
    return { A, B, C, vA, vB: z(), ic, omegaCoupler: 0, speedB: 0, miss: false };
  }
  const omegaCoupler = (rx * vA.y - ry * vA.x) / r2;
  const vB = relativeVelocity(z(), omegaCoupler, { x: B.x - ic.x, y: B.y - ic.y, z: 0 });
  return {
    A,
    B,
    C,
    vA,
    vB,
    ic,
    omegaCoupler,
    speedB: Math.hypot(vB.x, vB.y),
    miss: false,
  };
}

/**
 * A mark on a wheel rolling without slip in the +x direction.
 * phi is clockwise from the contact point, in radians. omega is signed (clockwise is negative).
 */
export function rollingPoint({ radius, speed, phi }) {
  const rx = -radius * Math.sin(phi);
  const ry = -radius * Math.cos(phi);
  const omega = radius > 0 ? -speed / radius : 0;
  const vx = speed * (1 - Math.cos(phi));
  const vy = speed * Math.sin(phi);
  const aScale = radius > 0 ? (speed * speed) / radius : 0;
  const ax = aScale * Math.sin(phi);
  const ay = aScale * Math.cos(phi);
  return {
    rx,
    ry,
    vx,
    vy,
    speed: Math.hypot(vx, vy),
    ax,
    ay,
    aMag: Math.hypot(ax, ay),
    omega,
    vTop: 2 * speed,
  };
}

/** Cycloid of a mark that started at the contact, for a wheel rolling on y = 0. */
export function cycloid(radius, phi) {
  return {
    x: radius * (phi - Math.sin(phi)),
    y: radius * (1 - Math.cos(phi)),
    z: 0,
  };
}
