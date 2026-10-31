/**
 * Simple harmonic motion: a spring, a simple pendulum, and a physical pendulum.
 * The pendulum formulas are the small-angle ones. Phase is in radians.
 */

import { G } from './constants.js';

/** ω = √(k/m). */
export function springOmega(mass, k) {
  return Math.sqrt(k / mass);
}

/** T = 2π √(m/k). */
export function springPeriod(mass, k) {
  return (2 * Math.PI) / springOmega(mass, k);
}

/** T = 2π √(L/g) for a simple pendulum. */
export function pendulumPeriod(length, g = G) {
  return 2 * Math.PI * Math.sqrt(length / g);
}

/**
 * T = 2π √(I / (m g d)). d is the distance from the pivot to the center of mass.
 */
export function physicalPendulumPeriod(I, mass, d, g = G) {
  return 2 * Math.PI * Math.sqrt(I / (mass * g * d));
}

/** x = A cos(ωt + φ), and the velocity and acceleration that go with it. */
export function shm({ A, omega, phi = 0, t }) {
  const phase = omega * t + phi;
  const x = A * Math.cos(phase);
  const vel = -A * omega * Math.sin(phase);
  return { x, v: vel, a: -omega * omega * x };
}

/** Total energy of a spring oscillator, (1/2) k A². */
export function shmEnergy(k, A) {
  return 0.5 * k * A * A;
}

/** Speed at displacement x, ω √(A² − x²). Zero at the turning point. */
export function speedAtDisplacement(mass, k, A, x) {
  return springOmega(mass, k) * Math.sqrt(Math.max(0, A * A - x * x));
}

/** A vertical spring's new equilibrium, mg/k below the unstretched point. */
export function verticalShift(mass, k, g = G) {
  return (mass * g) / k;
}

/** b_c = 2√(mk). Under this the motion still oscillates. */
export function criticalDamping(mass, k) {
  return 2 * Math.sqrt(mass * k);
}

/** ω = √(ω₀² − (b/2m)²). NaN when the motion is not underdamped. */
export function underdampedOmega(mass, k, b) {
  const inside = k / mass - (b * b) / (4 * mass * mass);
  return inside > 0 ? Math.sqrt(inside) : NaN;
}

/** x = A₀ e^(−bt/2m) cos(ωt + φ), with the velocity from the product rule. */
export function underdampedMotion({ A0, mass, k, b, phi = 0, t }) {
  const omega = underdampedOmega(mass, k, b);
  const gamma = b / (2 * mass);
  const decay = Math.exp(-gamma * t);
  const phase = omega * t + phi;
  const c = Math.cos(phase);
  const s = Math.sin(phase);
  const x = A0 * decay * c;
  return {
    x,
    v: A0 * decay * (-gamma * c - omega * s),
    omega,
    envelope: A0 * decay,
  };
}

/**
 * Steady amplitude of m ẍ + b ẋ + kx = F₀ sin(ωt):
 * A = F₀ / √(m²(ω₀² − ω²)² + b²ω²).
 */
export function drivenAmplitude({ F0, mass, k, b, omega }) {
  const delta = k / mass - omega * omega;
  const denom = Math.sqrt(mass * mass * delta * delta + b * b * omega * omega);
  return F0 / denom;
}

/**
 * Phase lag of x = A sin(ωt − δ) behind the drive F₀ sin(ωt).
 * δ runs from 0, below resonance, through π/2 at ω₀, toward π above it.
 */
export function drivenLag(mass, k, b, omega) {
  const delta = k - mass * omega * omega;
  const phi = Math.atan2(-b * omega, delta);
  let lag = -phi;
  if (lag < 0) lag += 2 * Math.PI;
  if (lag > Math.PI + 1e-12) lag -= 2 * Math.PI;
  return lag;
}

/** The book's peak at ω₀, A = F₀ / (b ω₀). The true peak of A(ω) sits slightly lower. */
export function resonanceAmplitude(F0, b, omega0) {
  return F0 / (b * omega0);
}

/** ω at the true peak of A(ω): √(ω₀² − b²/(2m²)), or 0 when damping is heavy. */
export function amplitudePeakOmega(mass, k, b) {
  const inside = k / mass - (b * b) / (2 * mass * mass);
  return inside > 0 ? Math.sqrt(inside) : 0;
}

/** Arithmetic–geometric mean. The exact pendulum period is 2π√(L/g) divided by this. */
export function agm(a, g, tol = 1e-15) {
  let aa = a;
  let gg = g;
  for (let i = 0; i < 60; i += 1) {
    const nextA = 0.5 * (aa + gg);
    const nextG = Math.sqrt(aa * gg);
    aa = nextA;
    gg = nextG;
    if (Math.abs(aa - gg) <= tol * Math.max(1, Math.abs(aa))) break;
  }
  return 0.5 * (aa + gg);
}

/** Exact simple-pendulum period. θ₀ is in radians. T = 2π√(L/g) / AGM(1, cos(θ₀/2)). */
export function pendulumPeriodExact(length, theta0, g = G) {
  return pendulumPeriod(length, g) / agm(1, Math.cos(theta0 / 2));
}

/** First correction, T ≈ T₀ (1 + θ₀²/16), with θ₀ in radians. */
export function pendulumPeriodSeries(length, theta0, g = G) {
  return pendulumPeriod(length, g) * (1 + (theta0 * theta0) / 16);
}

/** g = 4π² L / T² from a measured small-angle period. */
export function gravityFromPendulum(length, period) {
  return (4 * Math.PI * Math.PI * length) / (period * period);
}

/** Length of a uniform rod, pivoted at one end, whose small-angle period is 1/f. */
export function tunedDamperLength(frequency, g = G) {
  const period = 1 / frequency;
  return (3 * g * period * period) / (8 * Math.PI * Math.PI);
}

/** κ = I ω² from a measured torsion period. */
export function torsionConstant(I, period) {
  const omega = (2 * Math.PI) / period;
  return I * omega * omega;
}

/**
 * RK4 for ẍ = acc(x, v, t). Returns the end state and the downward zero crossings.
 * A crossing is interpolated, so the period read from two of them is not stuck to the step.
 */
function rk4Second({ x0, v0, t1, steps, acc, tail = 0 }) {
  const h = t1 / steps;
  let x = x0;
  let v = v0;
  let t = 0;
  let prevX = x0;
  let prevT = 0;
  const down = [];
  let peak = 0;
  const tailStart = t1 - tail;
  for (let i = 0; i < steps; i += 1) {
    const k1v = acc(x, v, t);
    const k1x = v;
    const k2v = acc(x + 0.5 * h * k1x, v + 0.5 * h * k1v, t + 0.5 * h);
    const k2x = v + 0.5 * h * k1v;
    const k3v = acc(x + 0.5 * h * k2x, v + 0.5 * h * k2v, t + 0.5 * h);
    const k3x = v + 0.5 * h * k2v;
    const k4v = acc(x + h * k3x, v + h * k3v, t + h);
    const k4x = v + h * k3v;
    const nx = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const nv = v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    const nt = t + h;
    if (prevX > 0 && nx <= 0) {
      const frac = prevX / (prevX - nx);
      down.push(prevT + frac * h);
    }
    if (nt >= tailStart) peak = Math.max(peak, Math.abs(nx));
    prevX = nx;
    prevT = nt;
    x = nx;
    v = nv;
    t = nt;
  }
  return { x, v, t, down, peak };
}

/** Period of a spring from two downward crossings, started from rest at x = A. */
export function springPeriodFromCrossings(mass, k, steps = 8000) {
  const expect = springPeriod(mass, k);
  const omega = springOmega(mass, k);
  const done = rk4Second({
    x0: 1,
    v0: 0,
    t1: 1.7 * expect,
    steps,
    acc: (x) => -omega * omega * x,
  });
  if (done.down.length < 2) return NaN;
  return done.down[1] - done.down[0];
}

/**
 * Period of θ̈ = −α sin θ, from two downward crossings, started from rest at θ₀.
 * α = g/L for a simple pendulum and 3g/(2L) for a uniform rod about one end.
 */
export function angularPeriodFromCrossings(alpha, theta0, steps = 8000) {
  const small = (2 * Math.PI) / Math.sqrt(alpha);
  const guess = small * (1 + (theta0 * theta0) / 16);
  const done = rk4Second({
    x0: theta0,
    v0: 0,
    t1: 2.4 * guess,
    steps,
    acc: (th) => -alpha * Math.sin(th),
  });
  if (done.down.length < 2) return NaN;
  return done.down[1] - done.down[0];
}

/**
 * Steady amplitude of a driven oscillator, read as the peak |x| after the transient.
 * The closed form is drivenAmplitude. This is the time integration.
 */
export function drivenSteadyAmplitude({ mass, k, b, F0, omega, stepsPer = 220 }) {
  const drive = Math.max(Math.abs(omega), 1e-4);
  const period = (2 * Math.PI) / drive;
  const tau = (2 * mass) / Math.max(b, 1e-6);
  const settle = Math.min(14 * tau, 100 * period);
  const tail = 2 * period;
  const t1 = settle + tail;
  const steps = Math.max(400, Math.ceil((t1 / period) * stepsPer));
  const done = rk4Second({
    x0: 0,
    v0: 0,
    t1,
    steps,
    tail,
    acc: (x, v, t) => (F0 * Math.sin(omega * t) - b * v - k * x) / mass,
  });
  return done.peak;
}

/**
 * A building of mass M and a rod pendulum of mass m and length L, pivoted on it.
 * The building alone would sway at frequency f. Small angles. Returns the state at t1,
 * whether the beam and the building spend time on opposite sides, and the energy drift.
 * Pass `trace` to also record that many samples of (t, x, θ), including both ends.
 */
export function coupledDamper({
  M, m, L, f, g = G, x0 = 0.02, t1 = 4, steps = 5000, trace = 0,
}) {
  const d = L / 2;
  const I = (m * L * L) / 3;
  const omega = 2 * Math.PI * f;
  const K = M * omega * omega;
  const energy = (x, vx, th, w) => (
    0.5 * (M + m) * vx * vx
    + m * d * vx * w
    + 0.5 * I * w * w
    + 0.5 * K * x * x
    + 0.5 * m * g * d * th * th
  );
  if (!(t1 > 0)) {
    const e0 = energy(x0, 0, 0, 0);
    return {
      x: x0, vx: 0, th: 0, w: 0, I, K, d,
      energy0: e0, energy1: e0, thPeak: 0, opposed: false,
    };
  }
  const det = (M + m) * I - (m * d) * (m * d);
  const accel = (x, th) => {
    const b1 = -K * x;
    const b2 = -m * g * d * th;
    return [
      (b1 * I - m * d * b2) / det,
      ((M + m) * b2 - m * d * b1) / det,
    ];
  };
  const h = t1 / Math.max(steps, 1);
  let x = x0;
  let vx = 0;
  let th = 0;
  let w = 0;
  const e0 = energy(x, vx, th, w);
  let thPeak = 0;
  let oppose = 0;
  const n = Math.max(steps, 1);
  const nTrace = Math.max(0, trace | 0);
  const traceT = nTrace > 1 ? new Array(nTrace) : null;
  const traceX = nTrace > 1 ? new Array(nTrace) : null;
  const traceTh = nTrace > 1 ? new Array(nTrace) : null;
  if (traceT) {
    traceT[0] = 0;
    traceX[0] = x;
    traceTh[0] = th;
  }
  let nextTrace = 1;
  for (let i = 0; i < n; i += 1) {
    const k1 = accel(x, th);
    const k1x = vx;
    const k1v = k1[0];
    const k1th = w;
    const k1w = k1[1];
    const k2 = accel(x + 0.5 * h * k1x, th + 0.5 * h * k1th);
    const k2x = vx + 0.5 * h * k1v;
    const k2v = k2[0];
    const k2th = w + 0.5 * h * k1w;
    const k2w = k2[1];
    const k3 = accel(x + 0.5 * h * k2x, th + 0.5 * h * k2th);
    const k3x = vx + 0.5 * h * k2v;
    const k3v = k3[0];
    const k3th = w + 0.5 * h * k2w;
    const k3w = k3[1];
    const k4 = accel(x + h * k3x, th + h * k3th);
    const k4x = vx + h * k3v;
    const k4v = k4[0];
    const k4th = w + h * k3w;
    const k4w = k4[1];
    x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    vx += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    th += (h / 6) * (k1th + 2 * k2th + 2 * k3th + k4th);
    w += (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    thPeak = Math.max(thPeak, Math.abs(th));
    if (x * th < 0 && Math.abs(th) > 1e-4 && Math.abs(x) > 0.15 * Math.abs(x0)) oppose += 1;
    if (traceT) {
      while (nextTrace < nTrace && i + 1 >= Math.round((nextTrace * (n - 1)) / (nTrace - 1))) {
        traceT[nextTrace] = (i + 1) * h;
        traceX[nextTrace] = x;
        traceTh[nextTrace] = th;
        nextTrace += 1;
      }
    }
  }
  if (traceT) {
    traceT[nTrace - 1] = t1;
    traceX[nTrace - 1] = x;
    traceTh[nTrace - 1] = th;
  }
  return {
    x, vx, th, w, I, K, d,
    energy0: e0,
    energy1: energy(x, vx, th, w),
    thPeak,
    opposed: oppose > 0.05 * n,
    ...(traceT ? { traceT, traceX, traceTh } : {}),
  };
}
