/**
 * Mass moments for planar rigid-body kinetics, and the two motions that use them:
 * a body pinned at one point, and a round body on an incline.
 *
 * Closed forms live next to a second route. Rods, plates, disks, and spheres are
 * checked by integrating r² dm. A pin force is checked by moments about G.
 * Rolling is checked against the energy method; slipping against the work of friction.
 *
 * Angles that cross the boundary are radians inside these functions, except thetaDeg.
 */

import { integral2, integralPolar, simpson } from '../math/quadrature.js';
import { G } from './constants.js';
import {
  inertiaDisk,
  inertiaHoop,
  inertiaRodCenter,
  inertiaRodEnd,
  inertiaSphere,
  parallelAxisMass,
  rollingIncline,
} from './rotation.js';

const DEG = Math.PI / 180;

function rel(a, b) {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-12);
  return Math.abs(a - b) / scale;
}

/** Thin rectangular plate, axis through the centre, perpendicular to the plate. */
export function inertiaPlate(mass, width, height) {
  return (mass * (width * width + height * height)) / 12;
}

/** k_G = √(I/m). */
export function gyrationRadius(I, mass) {
  if (!(mass > 0) || !(I >= 0)) return NaN;
  return Math.sqrt(I / mass);
}

/** I about one axis. Each part gives I_cm and the coordinates of its centre relative to that axis. */
export function compositeInertia(parts) {
  let I = 0;
  let mass = 0;
  for (const part of parts) {
    I += parallelAxisMass(part.iCm, part.mass, Math.hypot(part.x, part.y));
    mass += part.mass;
  }
  return { I, mass };
}

/** Slender rod. `offset` is the distance from the mass centre to the axis. */
export function rodInertia(mass, length, offset) {
  return parallelAxisMass(inertiaRodCenter(mass, length), mass, offset);
}

/** ∫ (x − axis)² λ dx along a uniform rod. */
export function rodInertiaIntegral(mass, x0, x1, axis = 0) {
  const length = x1 - x0;
  if (!(length > 0) || !(mass >= 0)) return NaN;
  const lambda = mass / length;
  return simpson((x) => {
    const d = x - axis;
    return d * d * lambda;
  }, x0, x1);
}

/** ∬ r² ρ dA for a uniform disk, in polar coordinates. The Jacobian is inside integralPolar. */
export function diskInertiaIntegral(mass, radius, n = 48) {
  if (!(radius > 0) || !(mass >= 0)) return NaN;
  const rho = mass / (Math.PI * radius * radius);
  return integralPolar((r) => r * r * rho, 0, radius, 0, 2 * Math.PI, { n });
}

/** A thin hoop: every bit of mass sits at radius R. */
export function hoopInertiaIntegral(mass, radius) {
  if (!(mass >= 0)) return NaN;
  const lambda = mass / (2 * Math.PI);
  return simpson(() => radius * radius * lambda, 0, 2 * Math.PI);
}

/**
 * Solid sphere by stacking disks perpendicular to the axis.
 * A slice at z has I_z = (1/2) dm r(z)².
 */
export function sphereInertiaIntegral(mass, radius) {
  if (!(radius > 0) || !(mass >= 0)) return NaN;
  const rho = mass / ((4 / 3) * Math.PI * radius * radius * radius);
  return simpson((z) => {
    const r2 = radius * radius - z * z;
    if (r2 <= 0) return 0;
    return 0.5 * (rho * Math.PI * r2) * r2;
  }, -radius, radius);
}

/** ∬ ρ[(x−ax)² + (y−ay)²] dA over a plate centred at the origin. */
export function plateInertiaIntegral(mass, width, height, axisX = 0, axisY = 0, n = 24) {
  if (!(width > 0) || !(height > 0) || !(mass >= 0)) return NaN;
  const rho = mass / (width * height);
  return integral2(
    (x, y) => {
      const dx = x - axisX;
      const dy = y - axisY;
      return (dx * dx + dy * dy) * rho;
    },
    -width / 2,
    width / 2,
    -height / 2,
    height / 2,
    { n },
  );
}

/**
 * Disk of the given mass, centre at (cx, cy), moment about (axisX, axisY).
 * Polar coordinates are centred on the disk, so the integrand stays smooth.
 */
export function diskAboutIntegral(mass, radius, cx, cy, axisX, axisY, n = 48) {
  if (!(radius > 0) || !(mass >= 0)) return NaN;
  const rho = mass / (Math.PI * radius * radius);
  return integralPolar((r, th) => {
    const x = cx + r * Math.cos(th);
    const y = cy + r * Math.sin(th);
    const dx = x - axisX;
    const dy = y - axisY;
    return (dx * dx + dy * dy) * rho;
  }, 0, radius, 0, 2 * Math.PI, { n });
}

/**
 * A uniform disk with a circular hole. `mass` and `radius` describe the disk
 * before the hole is cut. The hole's centre is `holeOffset` from the disk centre.
 */
export function diskWithHole({ mass, radius, holeRadius, holeOffset }) {
  const removed = mass * (holeRadius * holeRadius) / (radius * radius);
  const full = inertiaDisk(mass, radius);
  const hole = parallelAxisMass(inertiaDisk(removed, holeRadius), removed, holeOffset);
  return { I: full - hole, removed, kept: mass - removed, full, hole };
}

/** The hole integral subtracted from the full disk. Independent of the parallel-axis form. */
export function diskHoleIntegral({ mass, radius, holeRadius, holeOffset }, n = 64) {
  const full = diskInertiaIntegral(mass, radius, n);
  const removed = diskAboutIntegral(mass * (holeRadius * holeRadius) / (radius * radius), holeRadius, holeOffset, 0, 0, 0, n);
  return full - removed;
}

/** Rod from −L/2 to L/2. The axis is `offset` from the centre. */
export function rodAboutAxis(mass, length, offset) {
  const center = inertiaRodCenter(mass, length);
  const end = inertiaRodEnd(mass, length);
  const I = rodInertia(mass, length, offset);
  const numeric = rodInertiaIntegral(mass, -length / 2, length / 2, offset);
  return { I, numeric, gap: rel(I, numeric), center, end, parallel: mass * offset * offset };
}

/** Hoop, disk, and solid sphere about a centre axis, each checked by integration. */
export function shapeMoments(mass, radius) {
  const hoop = inertiaHoop(mass, radius);
  const disk = inertiaDisk(mass, radius);
  const sphere = inertiaSphere(mass, radius);
  const gap = Math.max(
    rel(hoop, hoopInertiaIntegral(mass, radius)),
    rel(disk, diskInertiaIntegral(mass, radius)),
    rel(sphere, sphereInertiaIntegral(mass, radius)),
  );
  const which = hoop >= disk && hoop >= sphere ? 'hoop' : disk >= sphere ? 'disk' : 'sphere';
  return { hoop, disk, sphere, gap, which };
}

/** Plate centred at the origin, plus a disk. The axis is perpendicular to the plate. */
export function plateDiskInertia({
  plateM, plateW, plateH, diskM, diskR, diskX, diskY = 0, axisX = 0, axisY = 0,
}) {
  const { I, mass } = compositeInertia([
    { mass: plateM, iCm: inertiaPlate(plateM, plateW, plateH), x: -axisX, y: -axisY },
    { mass: diskM, iCm: inertiaDisk(diskM, diskR), x: diskX - axisX, y: diskY - axisY },
  ]);
  const numeric = plateInertiaIntegral(plateM, plateW, plateH, axisX, axisY)
    + diskAboutIntegral(diskM, diskR, diskX, diskY, axisX, axisY);
  const dx = diskX - axisX;
  const dy = diskY - axisY;
  return { I, numeric, gap: rel(I, numeric), parallel: diskM * (dx * dx + dy * dy), mass };
}

const SHAPE = {
  hoop: inertiaHoop,
  disk: inertiaDisk,
  sphere: inertiaSphere,
};

/** Mass moment about the centre for a hoop, a disk, or a solid sphere. */
export function centralInertia(shape, mass, radius) {
  const fn = SHAPE[shape];
  if (!fn) return NaN;
  return fn(mass, radius);
}

/**
 * Uniform bar pinned at one end. thetaDeg is measured from the downward vertical,
 * so 0 hangs at rest and 90 is horizontal. omega is in rad/s.
 * The cross product supplies the pin force. alphaC, OxC, and OyC are the component form.
 */
export function barPin({ mass, length, thetaDeg, omega = 0, g = G }) {
  const th = thetaDeg * DEG;
  const r = length / 2;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const rx = r * sin;
  const ry = -r * cos;
  const IO = inertiaRodEnd(mass, length);
  const IG = inertiaRodCenter(mass, length);
  const alpha = (rx * (-mass * g)) / IO;
  const ax = -alpha * ry - omega * omega * rx;
  const ay = alpha * rx - omega * omega * ry;
  const Ox = mass * ax;
  const Oy = mass * g + mass * ay;
  const momentG = (-rx) * Oy - (-ry) * Ox;
  const alphaC = -(3 * g * sin) / (2 * length);
  const axC = alphaC * r * cos - omega * omega * r * sin;
  const ayC = alphaC * r * sin + omega * omega * r * cos;
  const OxC = mass * axC;
  const OyC = mass * g + mass * ayC;
  const pin = Math.hypot(Ox, Oy);
  const weight = mass * g;
  return {
    alpha,
    ax,
    ay,
    Ox,
    Oy,
    pin,
    weight,
    ratio: pin / weight,
    alphaC,
    OxC,
    OyC,
    rx,
    ry,
    IO,
    IG,
    gap: Math.max(rel(momentG, IG * alpha), rel(alpha, alphaC), rel(Ox, OxC), rel(Oy, OyC)),
  };
}

/**
 * Rectangular plate in the vertical plane, pin at a corner, sides along +x and +y.
 * Released from rest when those sides are horizontal and vertical.
 */
export function platePin({ mass, width, height, omega = 0, g = G }) {
  const rx = width / 2;
  const ry = height / 2;
  const IG = inertiaPlate(mass, width, height);
  const IO = parallelAxisMass(IG, mass, Math.hypot(rx, ry));
  const alpha = (rx * (-mass * g)) / IO;
  const ax = -alpha * ry - omega * omega * rx;
  const ay = alpha * rx - omega * omega * ry;
  const Ox = mass * ax;
  const Oy = mass * g + mass * ay;
  const momentG = (-rx) * Oy - (-ry) * Ox;
  const denom = width * width + height * height;
  const alphaF = -(3 * g * width) / (2 * denom);
  const pin = Math.hypot(Ox, Oy);
  return {
    alpha,
    ax,
    ay,
    Ox,
    Oy,
    pin,
    weight: mass * g,
    ratio: pin / (mass * g),
    alphaF,
    rx,
    ry,
    IO,
    IG,
    gap: Math.max(rel(momentG, IG * alpha), rel(alpha, alphaF)),
  };
}

/**
 * Round body on a straight incline. I is about the mass centre.
 * Rolls without slip when the friction that rolling needs does not exceed μN.
 * Otherwise friction is μN and the contact point slides.
 */
export function rollOrSlip({ mass, radius, I, thetaDeg, mu, g = G, distance = 1 }) {
  const th = thetaDeg * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const k = I / (mass * radius * radius);
  const roll = rollingIncline({ mass, radius, I, thetaDeg, g });
  const N = mass * g * cos;
  const fForce = mass * g * sin - mass * roll.a;
  const fTorque = (I * roll.a) / (radius * radius);
  const muMin = N > 1e-12 ? fForce / N : 0;
  const rolls = fForce <= mu * N + 1e-9 * Math.max(1, N);
  const a = rolls ? roll.a : g * sin - (mu * N) / mass;
  const f = rolls ? fForce : mu * N;
  const alpha = rolls ? a / radius : (f * radius) / I;
  const h = distance * sin;
  const vKin = Math.sqrt(Math.max(0, 2 * a * distance));
  const vEnergy = Math.sqrt(Math.max(0, (2 * g * h) / (1 + k)));
  const t = a > 1e-12 ? Math.sqrt((2 * distance) / a) : 0;
  const omega = alpha * t;
  const phi = 0.5 * alpha * t * t;
  const ke = 0.5 * mass * vKin * vKin + 0.5 * I * omega * omega;
  const work = mass * g * h - f * distance + f * radius * phi;
  const gap = rolls
    ? Math.max(rel(fForce, fTorque), rel(vKin, vEnergy))
    : rel(work, ke);
  return {
    a, alpha, f, N, k, muMin, mode: rolls ? 'roll' : 'slip', rolls, vKin, vEnergy, gap, fForce, fTorque,
  };
}
