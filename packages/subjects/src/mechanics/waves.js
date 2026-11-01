/**
 * Mechanical waves on a string: speed, a traveling wave, standing modes, and power.
 * Sound intensity, tubes, beats, and Doppler are separate and come with the sound chapter.
 * Not the electromagnetic wave in em/emwave.js.
 *
 * y = A sin(kx − ωt) travels toward +x. A standing mode on a string of length L,
 * fixed at both ends, is y = A sin(nπx/L) cos(ωt) with ω = nπv/L.
 */

/** v = √(F/μ). */
export function waveSpeed(tension, mu) {
  return Math.sqrt(tension / mu);
}

/** The tension that produces a chosen speed, F = μv². */
export function tensionForSpeed(mu, speed) {
  return mu * speed * speed;
}

/** f_n = nv/(2L) for a string fixed at both ends. */
export function modeFrequency(n, speed, length) {
  return (n * speed) / (2 * length);
}

/** Open-string length from a speed and a fundamental, L = v/(2f). */
export function lengthFromPitch(speed, frequency) {
  return speed / (2 * frequency);
}

/** y = A sin(kx − ωt), and the transverse velocity. */
export function travelingWave({ A, k, omega, x, t }) {
  const phase = k * x - omega * t;
  const y = A * Math.sin(phase);
  return { y, vy: -A * omega * Math.cos(phase) };
}

/** Wavelength, period, and speed read off k and ω. */
export function waveFromConstants(k, omega) {
  return {
    lambda: (2 * Math.PI) / k,
    T: (2 * Math.PI) / omega,
    v: omega / k,
  };
}

/**
 * Time-averaged power of a sinusoidal wave on a string, ½ μ A² ω² v.
 * The transverse force does work at a rate −F (∂y/∂x)(∂y/∂t).
 */
export function wavePower({ mu, A, omega, v }) {
  return 0.5 * mu * A * A * omega * omega * v;
}

/** That power, averaged numerically over one period at x = 0. */
export function wavePowerSamples({ mu, A, omega, v, samples = 720 }) {
  const k = omega / v;
  const tension = mu * v * v;
  const period = (2 * Math.PI) / omega;
  let sum = 0;
  for (let i = 0; i < samples; i += 1) {
    const phase = -omega * ((i + 0.5) / samples) * period;
    const slope = A * k * Math.cos(phase);
    const vy = -A * omega * Math.cos(phase);
    sum += -tension * slope * vy;
  }
  return sum / samples;
}

/**
 * Speed of a pulse, read from a finite-difference solution of y_tt = v² y_xx.
 * A gaussian splits into two travelers. The right-hand peak's position, divided
 * by the time, is the speed. The closed form is √(F/μ).
 */
export function pulseSpeed({ tension, mu, cells = 280 }) {
  const v = Math.sqrt(tension / mu);
  if (!(v > 0)) return NaN;
  const width = 1;
  const dx = width / 40;
  const dt = 0.45 * dx / v;
  const N = cells;
  const y = new Float64Array(N + 1);
  const next = new Float64Array(N + 1);
  const vel = new Float64Array(N + 1);
  const x0 = 12 * dx;
  const sigma = 3.2 * dx;
  for (let i = 1; i < N; i += 1) {
    const z = (i * dx - x0) / sigma;
    y[i] = Math.exp(-0.5 * z * z);
  }
  const steps = Math.round((0.55 * width) / (v * dt));
  const c2 = (v * v * dt) / (dx * dx);
  for (let s = 0; s < steps; s += 1) {
    for (let i = 1; i < N; i += 1) {
      const a = c2 * (y[i + 1] - 2 * y[i] + y[i - 1]);
      vel[i] += a;
      next[i] = y[i] + vel[i] * dt;
    }
    for (let i = 1; i < N; i += 1) y[i] = next[i];
  }
  const t = steps * dt;
  let best = 0;
  let at = 0;
  const start = Math.round((x0 + 4 * dx) / dx);
  for (let i = start; i < N; i += 1) {
    if (y[i] > best) {
      best = y[i];
      at = i;
    }
  }
  return (at * dx - x0) / t;
}

/**
 * Period of standing mode n, from two downward crossings of an antinode.
 * The closed form is 2L/(nv). Fixed ends. Released from rest in the mode shape.
 */
export function standingPeriodFromCrossings({ tension, mu, length, mode = 1, cells = 160 }) {
  const v = Math.sqrt(tension / mu);
  if (!(v > 0) || !(length > 0)) return NaN;
  const dx = length / cells;
  const dt = 0.45 * dx / v;
  const y = new Float64Array(cells + 1);
  const next = new Float64Array(cells + 1);
  const vel = new Float64Array(cells + 1);
  for (let i = 1; i < cells; i += 1) y[i] = Math.sin((mode * Math.PI * i) / cells);
  const anti = Math.round(cells / (2 * mode));
  const expect = (2 * length) / (mode * v);
  const steps = Math.ceil((2.3 * expect) / dt);
  const c2 = (v * v * dt) / (dx * dx);
  const downs = [];
  let prev = y[anti];
  let t = 0;
  for (let s = 0; s < steps && downs.length < 2; s += 1) {
    for (let i = 1; i < cells; i += 1) {
      const a = c2 * (y[i + 1] - 2 * y[i] + y[i - 1]);
      vel[i] += a;
      next[i] = y[i] + vel[i] * dt;
    }
    for (let i = 1; i < cells; i += 1) y[i] = next[i];
    t += dt;
    const now = y[anti];
    if (prev > 0 && now <= 0) {
      const frac = prev / (prev - now);
      downs.push(t - dt + frac * dt);
    }
    prev = now;
  }
  if (downs.length < 2) return NaN;
  return downs[1] - downs[0];
}
