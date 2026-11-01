/**
 * Mechanical waves on a string, and sound: speed, intensity, tubes, beats, Doppler, Mach.
 * Not the electromagnetic wave in em/emwave.js.
 *
 * y = A sin(kx − ωt) travels toward +x. A standing mode on a string of length L,
 * fixed at both ends, is y = A sin(nπx/L) cos(ωt) with ω = nπv/L.
 *
 * The speed of sound follows the section's rule, v = (331 m/s) √(T/273 K), with
 * T = θ + 273 and θ the Celsius temperature. That is the book's 273 K, not 273.15.
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

/** Threshold of hearing at 1 kHz, in W/m². */
export const I0 = 1e-12;

/** v = (331 m/s) √((θ + 273) / 273), θ in °C. */
export function soundSpeed(celsius) {
  return 331 * Math.sqrt((celsius + 273) / 273);
}

/** λ = v/f. */
export function wavelength(speed, frequency) {
  return speed / frequency;
}

/** I = P / (4πr²) for a point source that radiates equally in every direction. */
export function sphereIntensity(power, radius) {
  return power / (4 * Math.PI * radius * radius);
}

/** I = (Δp)² / (2ρv) for a harmonic plane wave. */
export function intensityFromPressure(dp, rho, speed) {
  return (dp * dp) / (2 * rho * speed);
}

/**
 * The same intensity, as the period average of pressure times particle velocity.
 * The particle velocity of a plane wave is Δp/(ρv), in phase with the pressure.
 */
export function intensityFromPressureSamples({ dp, rho, speed, samples = 720 }) {
  const vp = dp / (rho * speed);
  let sum = 0;
  for (let i = 0; i < samples; i += 1) {
    const phase = (2 * Math.PI * (i + 0.5)) / samples;
    const c = Math.cos(phase);
    sum += (dp * c) * (vp * c);
  }
  return sum / samples;
}

/** Power recovered by summing I ΔA over a sphere. The closed form is the source power. */
export function radiatedPower(power, radius, n = 64) {
  const intensity = sphereIntensity(power, radius);
  const dTheta = Math.PI / n;
  const dPhi = (2 * Math.PI) / (2 * n);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const theta = (i + 0.5) * dTheta;
    const patch = radius * radius * Math.sin(theta) * dTheta * dPhi;
    for (let j = 0; j < 2 * n; j += 1) sum += intensity * patch;
  }
  return sum;
}

/** β = 10 log10(I/I0), in decibels. */
export function decibels(intensity, i0 = I0) {
  return 10 * Math.log10(intensity / i0);
}

/** I = I0 × 10^(β/10). */
export function intensityFromDecibels(beta, i0 = I0) {
  return i0 * 10 ** (beta / 10);
}

/** β2 − β1 = 10 log10(I2/I1). A ratio of 2 is 3.01 dB. */
export function levelChange(ratio) {
  return 10 * Math.log10(ratio);
}

/** f_n = nv/(4L) for a tube closed at one end. n is 1, 3, 5, …. */
export function closedPipeFrequency(n, speed, length) {
  return (n * speed) / (4 * length);
}

/** L = v/(4f) for the fundamental of a tube closed at one end. */
export function closedPipeLength(speed, frequency) {
  return speed / (4 * frequency);
}

/** f_beat = |f2 − f1|. */
export function beatFrequency(f1, f2) {
  return Math.abs(f2 - f1);
}

/**
 * Period of the beat, from the spacing of minima in a short-window rms of the sum.
 * The closed form is 1/|f2 − f1|.
 */
export function beatPeriodFromEnvelope({ f1, f2, cycles = 3 }) {
  const df = Math.abs(f2 - f1);
  const fast = Math.max(f1, f2);
  if (!(df > 0) || !(fast > df)) return NaN;
  const dt = 1 / (fast * 48);
  const win = Math.max(4, Math.round((1 / fast) / dt));
  const n = Math.ceil((cycles / df) / dt);
  const buf = new Float64Array(win);
  let acc = 0;
  let filled = 0;
  const mins = [];
  let prev = Infinity;
  let prev2 = Infinity;
  for (let i = 0; i < n; i += 1) {
    const t = i * dt;
    const y = Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t);
    const slot = i % win;
    if (filled === win) acc -= buf[slot];
    else filled += 1;
    buf[slot] = y * y;
    acc += y * y;
    if (filled < win) continue;
    const rms = Math.sqrt(acc / win);
    if (prev <= prev2 && prev <= rms && prev < 0.45) {
      const at = (i - 1) * dt;
      if (!mins.length || at - mins[mins.length - 1] > 0.45 / df) mins.push(at);
      if (mins.length === 2) return mins[1] - mins[0];
    }
    prev2 = prev;
    prev = rms;
  }
  return NaN;
}

/**
 * f' = f (v + vo) / (v − vs).
 * vo > 0: the observer moves toward the source.
 * vs > 0: the source moves toward the observer.
 */
export function doppler({ f, v, vo = 0, vs = 0 }) {
  return (f * (v + vo)) / (v - vs);
}

/**
 * Observed frequency from a pulse train. The source starts `distance` metres from
 * the observer and moves toward the observer at vs. The observer moves toward the
 * source at vo. Each pulse travels at v. The frequency is the reciprocal of the
 * mean arrival gap. The closed form is doppler().
 */
export function dopplerFromArrivals({ f, v, vo = 0, vs = 0, distance = 60, pulses = 4 }) {
  if (!(f > 0) || !(v > Math.abs(vs)) || !(v + vo > 0)) return NaN;
  const emitDt = 1 / f;
  const dt = emitDt / 48;
  const emitted = [];
  const arrivals = [];
  let t = 0;
  let nextEmit = 0;
  const travel = distance / Math.max(v - Math.abs(vs), v * 0.05);
  const tmax = pulses * emitDt + travel + distance / v;
  while (t < tmax && arrivals.length < pulses) {
    const xo = vo * t;
    if (emitted.length < pulses && t + 1e-12 >= nextEmit) {
      const xs = distance - vs * nextEmit;
      if (xs > vo * nextEmit + 1e-6) emitted.push({ xs, te: nextEmit, hit: false });
      nextEmit += emitDt;
    }
    for (const pulse of emitted) {
      if (pulse.hit) continue;
      const xp = pulse.xs - v * (t - pulse.te);
      if (xp <= xo) {
        const prevT = Math.max(pulse.te, t - dt);
        const prevGap = pulse.xs - v * (prevT - pulse.te) - vo * prevT;
        const gap = xp - xo;
        const frac = prevGap === gap ? 1 : prevGap / (prevGap - gap);
        arrivals.push(prevT + Math.min(Math.max(frac, 0), 1) * (t - prevT));
        pulse.hit = true;
      }
    }
    t += dt;
  }
  if (arrivals.length < 3) return NaN;
  let sum = 0;
  for (let i = 1; i < arrivals.length; i += 1) sum += arrivals[i] - arrivals[i - 1];
  return (arrivals.length - 1) / sum;
}

/** M = vs / v. */
export function machNumber(speed, sound) {
  return speed / sound;
}

/** Half-angle of the Mach cone, sin θ = v/vs = 1/M, in radians. */
export function machAngle(mach) {
  return Math.asin(1 / mach);
}

/**
 * The same angle, measured on a wavefront. A pulse emitted at the origin has
 * grown to radius v t. The source is now at vs t. The tangent from the source
 * to that circle is the shock, and θ is its angle with the path behind the source.
 */
export function machAngleFromWavefront(mach, samples = 3600) {
  if (!(mach > 1)) return NaN;
  const radius = 1;
  let best = Infinity;
  let angle = NaN;
  for (let i = 1; i < samples; i += 1) {
    const a = (Math.PI * i) / samples;
    const x = radius * Math.cos(a);
    const y = radius * Math.sin(a);
    const residual = Math.abs(x * mach - radius * radius);
    if (residual < best) {
      best = residual;
      const dx = x - mach;
      const dy = y;
      const len = Math.hypot(dx, dy);
      const cosRear = Math.min(1, Math.max(-1, -dx / len));
      angle = Math.acos(cosRear);
    }
  }
  return angle;
}

/**
 * Period of a pipe mode, from two downward crossings of an antinode.
 * `end` is 'closed' (one end closed, n = 1, 3, 5, …) or 'open' (both ends open,
 * n = 1, 2, 3, …). The closed form is 4L/(nv) or 2L/(nv).
 */
export function pipePeriodFromCrossings({ speed, length, end = 'closed', harmonic = 1, cells = 160 }) {
  const v = speed;
  if (!(v > 0) || !(length > 0)) return NaN;
  const openOpen = end === 'open';
  const n = harmonic;
  const dx = length / cells;
  const dt = 0.4 * dx / v;
  const y = new Float64Array(cells + 1);
  const next = new Float64Array(cells + 1);
  const vel = new Float64Array(cells + 1);
  for (let i = 0; i <= cells; i += 1) {
    const x = (i * length) / cells;
    y[i] = openOpen
      ? Math.cos((n * Math.PI * x) / length)
      : Math.sin((n * Math.PI * x) / (2 * length));
  }
  if (!openOpen) y[0] = 0;
  const watch = cells;
  const expect = openOpen ? (2 * length) / (n * v) : (4 * length) / (n * v);
  const steps = Math.ceil((2.4 * expect) / dt);
  const c2 = (v * v * dt) / (dx * dx);
  const downs = [];
  let prev = y[watch];
  let t = 0;
  for (let s = 0; s < steps && downs.length < 2; s += 1) {
    for (let i = 0; i <= cells; i += 1) {
      if (!openOpen && i === 0) {
        next[0] = 0;
        vel[0] = 0;
        continue;
      }
      let lap;
      if (i === 0) lap = 2 * (y[1] - y[0]);
      else if (i === cells) lap = 2 * (y[cells - 1] - y[cells]);
      else lap = y[i + 1] - 2 * y[i] + y[i - 1];
      vel[i] += c2 * lap;
      next[i] = y[i] + vel[i] * dt;
    }
    for (let i = 0; i <= cells; i += 1) y[i] = next[i];
    t += dt;
    const now = y[watch];
    if (prev > 0 && now <= 0) {
      const frac = prev / (prev - now);
      downs.push(t - dt + frac * dt);
    }
    prev = now;
  }
  if (downs.length < 2) return NaN;
  return downs[1] - downs[0];
}
