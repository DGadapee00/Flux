/**
 * Work and energy for a rigid body in the plane (Hibbeler Ch 18).
 * A rolling race cancels mass and radius. A rod in slots uses the instantaneous
 * centre for T. The gap on each result is a second method: time integration of
 * the kinetics, or a Simpson integral of the couple.
 */

import { G } from './constants.js';
import { gravitationalEnergy, springEnergy } from './energy.js';
import { inertiaRodCenter, inertiaRodEnd, rollingIncline } from './rotation.js';

const DEG = Math.PI / 180;

/** k = I_G / (m R²). Hoop 1, disk 1/2, sphere 2/5. */
export const ROLL_K = { hoop: 1, disk: 0.5, sphere: 2 / 5 };

function rel(a, b) {
  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b));
  if (scale < 1e-12) return diff < 1e-9 ? 0 : diff;
  return diff / scale;
}

/**
 * RK4 on dv/dt = a, ds/dt = v, with a constant. Exact through roundoff for that a.
 * Returns the speed and distance at tEnd.
 */
function integrateConst(a, tEnd, steps) {
  let s = 0;
  let v = 0;
  const h = tEnd / steps;
  const accel = () => a;
  for (let i = 0; i < steps; i++) {
    const k1s = v;
    const k1v = accel();
    const k2s = v + 0.5 * h * k1v;
    const k2v = accel();
    const k3s = v + 0.5 * h * k2v;
    const k3v = accel();
    const k4s = v + h * k3v;
    const k4v = accel();
    s += (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
    v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  return { s, v };
}

/**
 * Hoop, disk, and sphere released from rest to roll a distance down an incline.
 * Mass and radius cancel. v comes from T + V. The check integrates the Ch 17
 * acceleration until that distance.
 */
export function raceDown({ thetaDeg, distance, mass = 1, g = G, steps = 240 }) {
  const sin = Math.sin(thetaDeg * DEG);
  const quiet = { k: NaN, a: 0, v: 0, t: 0 };
  const out = { hoop: { ...quiet }, disk: { ...quiet }, sphere: { ...quiet }, winner: 'sphere', gap: 0, energy: 0 };
  if (!(distance > 0) || !(g > 0)) return out;
  let gap = 0;
  for (const shape of ['sphere', 'disk', 'hoop']) {
    const k = ROLL_K[shape];
    const kin = rollingIncline({ mass: 1, radius: 1, I: k, thetaDeg, g });
    const a = kin.a;
    const drop = g * distance * sin;
    const vEnergy = a > 1e-12 ? Math.sqrt((2 * drop) / (1 + k)) : 0;
    let vInt = 0;
    let sInt = 0;
    let t = 0;
    if (a > 1e-12) {
      t = Math.sqrt((2 * distance) / a);
      const row = integrateConst(a, t, steps);
      vInt = row.v;
      sInt = row.s;
      gap = Math.max(gap, rel(vEnergy, vInt), rel(distance, sInt));
    }
    out[shape] = { k, a, v: vEnergy, t };
  }
  const order = ['sphere', 'disk', 'hoop'].sort((p, q) => out[p].t - out[q].t || out[p].k - out[q].k);
  out.winner = order[0];
  out.gap = gap;
  out.energy = mass * g * distance * sin;
  return out;
}

/**
 * Where each racer is after `time` seconds. s is measured down the plane from the start.
 * A body that has finished stays at the end with its finish speed.
 */
export function raceAt({ thetaDeg, distance, time, g = G }) {
  const race = raceDown({ thetaDeg, distance, g });
  const place = (row) => {
    if (!(time > 0) || !(row.a > 0)) return { s: 0, v: 0, done: false };
    if (time >= row.t) return { s: distance, v: row.v, done: true };
    return { s: 0.5 * row.a * time * time, v: row.a * time, done: false };
  };
  return {
    sphere: place(race.sphere),
    disk: place(race.disk),
    hoop: place(race.hoop),
    race,
  };
}

/** T = ½mv² + ½Iω² for rolling without slip. The check is ½ I_contact ω². */
export function rollingEnergy({ mass, radius, I, speed }) {
  if (!(mass > 0) || !(radius > 0) || !Number.isFinite(I) || !Number.isFinite(speed)) {
    return { trans: NaN, rot: NaN, total: NaN, about: NaN, omega: NaN, gap: NaN };
  }
  const omega = speed / radius;
  const trans = 0.5 * mass * speed * speed;
  const rot = 0.5 * I * omega * omega;
  const about = 0.5 * (I + mass * radius * radius) * omega * omega;
  return { trans, rot, total: trans + rot, about, omega, gap: rel(trans + rot, about) };
}

/** Work of a torsional spring, ∫ M dθ, with M = −κ(θ − θ_rest). The check is Simpson's rule. */
export function coupleWork({ kappa, theta1Deg, theta2Deg, restDeg = 0 }, n = 64) {
  const t1 = theta1Deg * DEG;
  const t2 = theta2Deg * DEG;
  const rest = restDeg * DEG;
  const closed = springEnergy(kappa, t1 - rest) - springEnergy(kappa, t2 - rest);
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (t2 - t1) / steps;
  const moment = (th) => -kappa * (th - rest);
  if (!(steps > 0) || !Number.isFinite(h)) return { work: closed, numeric: closed, gap: 0 };
  let sum = moment(t1) + moment(t2);
  for (let i = 1; i < steps; i++) sum += (i % 2 === 0 ? 2 : 4) * moment(t1 + i * h);
  const numeric = (sum * h) / 3;
  return { work: closed, numeric, gap: rel(closed, numeric) };
}

/**
 * RK4 on θ'' = α(θ) from rest at theta1 until theta2. omega is signed.
 * reaches is false when the motion turns back first.
 */
function crossAngle(alphaOf, theta1, theta2) {
  const dir = Math.sign(theta2 - theta1);
  if (dir === 0) return { omega: 0, reaches: true };
  const span = Math.abs(theta2 - theta1);
  const mid = 0.5 * (theta1 + theta2);
  const scale = Math.abs(alphaOf(theta1)) + Math.abs(alphaOf(mid)) + Math.abs(alphaOf(theta2)) + 0.2;
  const tGuess = Math.min(30, Math.sqrt((2 * span) / scale) * 6 + 0.2);
  const steps = Math.max(1600, Math.ceil(tGuess / 0.001));
  const dt = tGuess / steps;
  let theta = theta1;
  let omega = 0;
  for (let n = 0; n < steps; n++) {
    const prevT = theta;
    const prevW = omega;
    const f = (th, w) => [w, alphaOf(th)];
    const [k1t, k1w] = f(theta, omega);
    const [k2t, k2w] = f(theta + 0.5 * dt * k1t, omega + 0.5 * dt * k1w);
    const [k3t, k3w] = f(theta + 0.5 * dt * k2t, omega + 0.5 * dt * k2w);
    const [k4t, k4w] = f(theta + dt * k3t, omega + dt * k3w);
    theta += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    omega += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    const crossed = (theta - theta2) * dir >= 0 && (prevT - theta2) * dir < 0;
    if (crossed) {
      const denom = theta - prevT;
      const u = denom === 0 ? 1 : (theta2 - prevT) / denom;
      return { omega: prevW + u * (omega - prevW), reaches: true };
    }
    if (n > 2 && omega * dir < -1e-4) return { omega: 0, reaches: false };
  }
  return { omega: 0, reaches: false };
}

function barPoint(length, thetaDeg) {
  const th = thetaDeg * DEG;
  const ex = length * Math.sin(th);
  const ey = -length * Math.cos(th);
  return { ex, ey, gx: ex / 2, gy: ey / 2 };
}

/**
 * Uniform bar pinned at one end. thetaDeg is from the downward vertical.
 * A torsional spring of stiffness kappa is unstretched at restDeg.
 * Released from rest at theta1. omega is the speed at theta2.
 */
export function pinnedRelease({ mass, length, theta1Deg, theta2Deg, kappa = 0, restDeg = 0, g = G }) {
  const empty = {
    omega: 0, omegaInt: 0, reaches: false, gap: 0, IO: 0, vG: 0, vEnd: 0, T: 0, work: 0,
    drop: 0, gx: 0, gy: 0, ex: 0, ey: 0, vx: 0, vy: 0,
  };
  if (!(mass > 0) || !(length > 0)) return empty;
  const IO = inertiaRodEnd(mass, length);
  const y = (deg) => -(length / 2) * Math.cos(deg * DEG);
  const twist = (deg) => deg * DEG - restDeg * DEG;
  const V = (deg) => gravitationalEnergy(mass, g, y(deg)) + springEnergy(kappa, twist(deg));
  const drop = V(theta1Deg) - V(theta2Deg);
  const work = coupleWork({ kappa, theta1Deg, theta2Deg, restDeg });
  const geom = barPoint(length, theta2Deg);
  const alphaOf = (th) => (-(mass * g * length / 2) * Math.sin(th) - kappa * (th - restDeg * DEG)) / IO;
  const motion = crossAngle(alphaOf, theta1Deg * DEG, theta2Deg * DEG);
  const reaches = drop >= -1e-8 && motion.reaches;
  const omega = drop > 1e-10 ? Math.sqrt((2 * drop) / IO) : 0;
  const omegaInt = reaches ? Math.abs(motion.omega) : 0;
  const sign = Math.sign(theta2Deg - theta1Deg) || -1;
  const w = sign * omega;
  const vx = w * -geom.gy;
  const vy = w * geom.gx;
  const gap = reaches ? Math.max(rel(omega, omegaInt), work.gap) : (drop < -1e-8 && !motion.reaches ? 0 : rel(omega, omegaInt));
  return {
    omega,
    omegaInt,
    reaches,
    gap: Number.isFinite(gap) ? gap : 1,
    IO,
    vG: omega * (length / 2),
    vEnd: omega * length,
    T: reaches ? 0.5 * IO * omega * omega : 0,
    work: work.work,
    drop,
    ...geom,
    vx,
    vy,
  };
}

function slotPoint(length, thetaDeg) {
  const th = thetaDeg * DEG;
  const ax = length * Math.cos(th);
  const ay = 0;
  const bx = 0;
  const by = length * Math.sin(th);
  return { ax, ay, bx, by, gx: ax / 2, gy: by / 2, icx: ax, icy: by };
}

/**
 * Uniform rod with one end in a horizontal slot and one in a vertical slot.
 * thetaDeg is from the floor. The instantaneous centre is the corner opposite the rod.
 * A floor spring of stiffness k joins the corner to the foot. rest is its natural length.
 * T = ½ I_IC ω², and I_IC = m L²/3.
 */
export function slotRelease({ mass, length, theta1Deg, theta2Deg, k = 0, rest = 0, g = G }) {
  const empty = {
    omega: 0, omegaInt: 0, reaches: false, gap: 0, Iic: 0, IG: 0, vG: 0, T: 0, TIC: 0, TG: 0,
    ax: 0, ay: 0, bx: 0, by: 0, gx: 0, gy: 0, icx: 0, icy: 0, vx: 0, vy: 0,
  };
  if (!(mass > 0) || !(length > 0)) return empty;
  const Iic = inertiaRodEnd(mass, length);
  const IG = inertiaRodCenter(mass, length);
  const stretch = (deg) => length * Math.cos(deg * DEG) - rest;
  const V = (deg) => gravitationalEnergy(mass, g, (length / 2) * Math.sin(deg * DEG)) + springEnergy(k, stretch(deg));
  const drop = V(theta1Deg) - V(theta2Deg);
  const alphaOf = (th) => {
    const dV = (mass * g * length / 2) * Math.cos(th) - k * length * Math.sin(th) * (length * Math.cos(th) - rest);
    return (-3 / (mass * length * length)) * dV;
  };
  const motion = crossAngle(alphaOf, theta1Deg * DEG, theta2Deg * DEG);
  const reaches = drop >= -1e-8 && motion.reaches;
  const omega = drop > 1e-10 ? Math.sqrt((2 * drop) / Iic) : 0;
  const omegaInt = reaches ? Math.abs(motion.omega) : 0;
  const sign = Math.sign(theta2Deg - theta1Deg) || -1;
  const w = sign * omega;
  const th = theta2Deg * DEG;
  const vx = (length / 2) * w * -Math.sin(th);
  const vy = (length / 2) * w * Math.cos(th);
  const vG = Math.hypot(vx, vy);
  const TIC = 0.5 * Iic * omega * omega;
  const TG = 0.5 * IG * omega * omega + 0.5 * mass * vG * vG;
  const geom = slotPoint(length, theta2Deg);
  const gap = reaches
    ? Math.max(rel(omega, omegaInt), rel(TIC, TG))
    : (drop < -1e-8 && !motion.reaches ? 0 : rel(omega, omegaInt));
  return {
    omega,
    omegaInt,
    reaches,
    gap: Number.isFinite(gap) ? gap : 1,
    Iic,
    IG,
    vG,
    T: reaches ? TIC : 0,
    TIC,
    TG,
    ...geom,
    vx,
    vy,
  };
}
