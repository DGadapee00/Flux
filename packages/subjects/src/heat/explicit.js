/**
 * The explicit finite-difference scheme for the heat equation, and its stability limit
 * (EML 4140, numerical conduction).
 *
 * On a rod of N cells with its ends held at 0, the explicit scheme steps
 *   T_i ← T_i + Fo (T_{i−1} − 2T_i + T_{i+1}),   Fo = αΔt/Δx².
 * Each grid sine sin(kπi/N) is an exact mode of it: it is multiplied every step by
 *   G_k = 1 − 4 Fo sin²(kπ/2N).
 * While Fo ≤ 1/2 every |G_k| ≤ 1. Past it the finest mode has G < −1: it flips sign and grows every step,
 * so the solution saw-tooths and blows up. Refining the grid at the same Δt raises Fo, so a finer grid
 * can be the unstable one.
 *
 * The lab starts from the true profile, a half sine, plus a whisper of the finest grid mode, as round-off
 * would add. The scheme's result is checked against the mode formula, amplitude × G_kⁿ, exactly; the
 * error against the exact solution e^{−π²αt/L²} sin(πx/L) is what the lab shows.
 */

export const ROD = { L: 0.1, alpha: 1.1e-4 }; // copper-like

export function explicitRun({ N, dtms, tEnd = 20 }) {
  const dx = ROD.L / N;
  const dt = dtms / 1000;
  const Fo = (ROD.alpha * dt) / (dx * dx);
  const steps = Math.round(tEnd / dt);
  const seedAmp = 1e-6;
  const xs = Array.from({ length: N + 1 }, (_, i) => i / N);
  const modeK = N - 1; // the finest mode that fits
  let T = xs.map((x, i) => Math.sin(Math.PI * x) + seedAmp * Math.sin((modeK * Math.PI * i) / N));
  T[0] = 0;
  T[N] = 0;
  // Stop once the run has plainly blown up, before the numbers overflow.
  let done = 0;
  for (let s = 0; s < steps; s++) {
    const nT = T.slice();
    for (let i = 1; i < N; i++) nT[i] = T[i] + Fo * (T[i - 1] - 2 * T[i] + T[i + 1]);
    T = nT;
    done++;
    if (Math.max(...T.map(Math.abs)) > 1e6) break;
  }
  const G = (k) => 1 - 4 * Fo * Math.sin((k * Math.PI) / (2 * N)) ** 2;
  const formula = xs.map((x, i) => G(1) ** done * Math.sin(Math.PI * x) + seedAmp * G(modeK) ** done * Math.sin((modeK * Math.PI * i) / N));
  const tDone = done * dt;
  const exact = xs.map((x) => Math.exp(-((Math.PI / ROD.L) ** 2) * ROD.alpha * tDone) * Math.sin(Math.PI * x));
  const big = Math.max(...formula.map(Math.abs), 1e-300);
  const gap = Math.max(...T.map((v, i) => Math.abs(v - formula[i]))) / big;
  const err = Math.max(...T.map((v, i) => Math.abs(v - exact[i])));
  return { Fo, steps, done, tDone, blewUp: done < steps, xs, T, exact, formula, gap, err, Gfine: G(modeK), G1: G(1), stable: Fo <= 0.5, peak: Math.max(...T.map(Math.abs)) };
}
