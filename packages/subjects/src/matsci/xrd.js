/**
 * X-ray diffraction from a cubic crystal (EMA 3010).
 *
 * Planes (hkl) of a cubic crystal with lattice parameter a are d = a/√(h² + k² + l²) apart. Waves
 * scattered from successive planes add in phase only when the path difference is a whole number of
 * wavelengths, Bragg's law nλ = 2d sin θ. Planes that cut through the basis atoms out of step cancel:
 * the structure factor F = Σ exp[2πi(hx + ky + lz)] over the atoms of the cell is zero for h + k + l
 * odd in BCC, and for mixed odd and even h, k, l in FCC. So a crystal reflects only at a few angles.
 *
 * The second method sums F over the cell's atoms numerically to decide which peaks appear, and finds
 * each peak's angle by maximising the intensity scattered by a stack of 40 planes.
 */

export const LAMBDA = 0.15406; // nm, copper Kα
export const BASIS = {
  sc: [[0, 0, 0]],
  bcc: [[0, 0, 0], [0.5, 0.5, 0.5]],
  fcc: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]],
};
export const NAMES = { sc: 'Simple cubic', bcc: 'Body-centred cubic', fcc: 'Face-centred cubic' };

/** The selection rule, written out. */
export function allowed(struct, h, k, l) {
  if (struct === 'bcc') return (h + k + l) % 2 === 0;
  if (struct === 'fcc') {
    const odd = [h, k, l].map((v) => Math.abs(v) % 2);
    return odd[0] === odd[1] && odd[1] === odd[2];
  }
  return true;
}

/** |F|² summed over the basis. */
export function structureFactor(struct, h, k, l) {
  let re = 0;
  let im = 0;
  for (const [x, y, z] of BASIS[struct]) {
    const ph = 2 * Math.PI * (h * x + k * y + l * z);
    re += Math.cos(ph);
    im += Math.sin(ph);
  }
  return re * re + im * im;
}

/** Families of planes by N = h² + k² + l², with every signed permutation counted. */
function families(maxN = 40) {
  const out = new Map();
  const r = Math.ceil(Math.sqrt(maxN));
  for (let h = -r; h <= r; h++) for (let k = -r; k <= r; k++) for (let l = -r; l <= r; l++) {
    const N = h * h + k * k + l * l;
    if (N === 0 || N > maxN) continue;
    if (!out.has(N)) out.set(N, []);
    out.get(N).push([h, k, l]);
  }
  return out;
}
const FAM = families();
const label = (hkl) => [...hkl].map(Math.abs).sort((p, q) => q - p).join('');

export function peaksClosed({ struct, a }) {
  const peaks = [];
  for (const [N, list] of [...FAM.entries()].sort((p, q) => p[0] - q[0])) {
    const on = list.filter(([h, k, l]) => allowed(struct, h, k, l));
    if (!on.length) continue;
    const s = (LAMBDA * Math.sqrt(N)) / (2 * a);
    if (s >= 1) continue;
    const theta = Math.asin(s);
    const names = [...new Set(on.map(label))];
    peaks.push({ N, hkl: names.join(', '), d: a / Math.sqrt(N), theta, tt: (2 * theta * 180) / Math.PI, mult: on.length });
  }
  return peaks;
}

/** Intensity from M planes d apart at angle θ: |Σ e^{i·4πd j sinθ/λ}|². */
export function stack(d, theta, M = 40) {
  const ph = (4 * Math.PI * d * Math.sin(theta)) / LAMBDA;
  let re = 0;
  let im = 0;
  for (let j = 0; j < M; j++) {
    re += Math.cos(ph * j);
    im += Math.sin(ph * j);
  }
  return re * re + im * im;
}

function peakAngle(d, guess) {
  // Golden-section search for the maximum of the stack's intensity near the guess.
  let lo = guess - 0.004;
  let hi = guess + 0.004;
  const g = (Math.sqrt(5) - 1) / 2;
  let x1 = hi - g * (hi - lo);
  let x2 = lo + g * (hi - lo);
  let f1 = stack(d, x1);
  let f2 = stack(d, x2);
  for (let i = 0; i < 80; i++) {
    if (f1 > f2) {
      hi = x2;
      x2 = x1;
      f2 = f1;
      x1 = hi - g * (hi - lo);
      f1 = stack(d, x1);
    } else {
      lo = x1;
      x1 = x2;
      f1 = f2;
      x2 = lo + g * (hi - lo);
      f2 = stack(d, x2);
    }
  }
  return (lo + hi) / 2;
}

export function xrdChecked(state) {
  const peaks = peaksClosed(state);
  let gap = 0;
  // Every family: the rule and the summed structure factor must agree on which peaks appear.
  for (const [N, list] of FAM.entries()) {
    const s = (LAMBDA * Math.sqrt(N)) / (2 * state.a);
    if (s >= 1) continue;
    for (const [h, k, l] of list) {
      const on = structureFactor(state.struct, h, k, l) > 1e-9;
      if (on !== allowed(state.struct, h, k, l)) gap = 1;
    }
  }
  for (const p of peaks) {
    p.I = p.mult * structureFactor(state.struct, ...FAM.get(p.N).find(([h, k, l]) => allowed(state.struct, h, k, l)));
    const th = peakAngle(p.d, p.theta);
    gap = Math.max(gap, Math.abs(th - p.theta) / p.theta);
  }
  const Imax = Math.max(...peaks.map((p) => p.I));
  for (const p of peaks) p.rel = p.I / Imax;
  const present = (h, k, l) => structureFactor(state.struct, h, k, l) > 1e-9;
  return { peaks, gap, present, first: peaks[0] };
}
