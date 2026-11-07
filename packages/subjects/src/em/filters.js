/**
 * A square wave through an RC low-pass filter (EEL 3111, frequency response).
 *
 * The filter's response to a sine at angular frequency ω is H(jω) = 1/(1 + jωτ), τ = RC: its
 * amplitude is cut by |H| = 1/√(1 + (ωτ)²) and delayed by the phase −arctan(ωτ). The corner,
 * f_c = 1/(2πτ), is where |H| = 1/√2.
 *
 * A ±1 V square wave at f₀ is a sum of odd harmonics, (4/π) Σ sin(nω₀t)/n. Each passes through the
 * filter on its own, cut and delayed by a different amount, so the output is a different shape, not
 * a smaller square wave.
 *
 * The closed form takes the harmonics one by one: b_n = (4/(πn)) |H(jnω₀)| with phase −arctan(nω₀τ).
 * The second method solves the circuit in time. In periodic steady state the capacitor charges
 * towards +1 for half a period and towards −1 for the next, between ±V_p with V_p = tanh(T/(4τ)):
 *   v(t) = 1 − (1 + V_p) e^{−t/τ},  0 ≤ t < T/2,   and v(t + T/2) = −v(t).
 * Its Fourier coefficients, found by Simpson's rule over one period, must match b_n.
 */

/** The output in periodic steady state, at time t, for period T and time constant tau. */
export function squareResponse(t, T, tau) {
  const Vp = Math.tanh(T / (4 * tau));
  const s = ((t % T) + T) % T;
  const half = s < T / 2;
  const u = half ? s : s - T / 2;
  const v = 1 - (1 + Vp) * Math.exp(-u / tau);
  return half ? v : -v;
}

export const squareInput = (t, T) => ((((t % T) + T) % T) < T / 2 ? 1 : -1);

/** The n-th harmonic through the filter: input and output amplitude, the cut, the phase and the time delay. */
export function harmonic(n, f0, tau) {
  const w = 2 * Math.PI * n * f0;
  const gain = 1 / Math.sqrt(1 + (w * tau) ** 2);
  const phase = -Math.atan(w * tau);
  return { n, f: n * f0, ampIn: 4 / (Math.PI * n), ampOut: (4 / (Math.PI * n)) * gain, gain, phase, delay: -phase / w };
}

/** Sine and cosine Fourier coefficients of the time-domain output, by Simpson's rule over one period. */
function fourierOfOutput(n, T, tau, steps = 4000) {
  const h = T / steps;
  let bs = 0;
  let bc = 0;
  for (let k = 0; k <= steps; k++) {
    const t = k * h;
    const wgt = k === 0 || k === steps ? 1 : k % 2 ? 4 : 2;
    const v = squareResponse(t, T, tau);
    bs += wgt * v * Math.sin((2 * Math.PI * n * t) / T);
    bc += wgt * v * Math.cos((2 * Math.PI * n * t) / T);
  }
  const scale = (2 / T) * (h / 3);
  return { amp: Math.hypot(bs, bc) * scale, phase: Math.atan2(bc, bs) };
}

export function filterChecked({ f0, fc }, harmonics = 15) {
  const tau = 1 / (2 * Math.PI * fc);
  const T = 1 / f0;
  const list = [];
  for (let n = 1; n <= harmonics; n += 2) list.push(harmonic(n, f0, tau));
  // The second method on the first three odd harmonics: amplitude and phase from the time solution.
  let gap = 0;
  for (const hm of list.slice(0, 3)) {
    const fs = fourierOfOutput(hm.n, T, tau);
    gap = Math.max(gap, Math.abs(fs.amp - hm.ampOut) / list[0].ampIn, Math.abs(fs.phase - hm.phase));
  }
  return {
    tau, T, list, gap,
    Vp: Math.tanh(T / (4 * tau)),
    first: list[0],
    third: list[1],
    // The output's third harmonic against its fundamental, beside the input's 1/3.
    ratio31: list[1].ampOut / list[0].ampOut,
  };
}
