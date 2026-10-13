/**
 * One cell of a Riemann sum, shared by the readout and the picture.
 * Index order matches riemann.js: x (or r, or the box's i) is the slow index.
 */
import { sampleCell } from './riemann.js';

export function clampIndex(index, total) {
  const n = Math.max(1, total | 0);
  const k = index | 0;
  return ((k % n) + n) % n;
}

export function rectCell(xa, xb, ya, yb, nx, ny, index, sample = 'mid') {
  const nX = Math.max(1, nx | 0);
  const nY = Math.max(1, ny | 0);
  const total = nX * nY;
  const k = clampIndex(index, total);
  const i = Math.floor(k / nY);
  const j = k - i * nY;
  const dx = (xb - xa) / nX;
  const dy = (yb - ya) / nY;
  const x0 = xa + i * dx;
  const y0 = ya + j * dy;
  const p = sampleCell(x0, y0, dx, dy, sample);
  return { index: k, i, j, total, x0, y0, dx, dy, x: p.x, y: p.y, dA: dx * dy };
}

export function rectPartial(f, xa, xb, ya, yb, nx, ny, sample, count) {
  const nX = Math.max(1, nx | 0);
  const nY = Math.max(1, ny | 0);
  const total = nX * nY;
  const n = Math.max(0, Math.min(total, count | 0));
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const c = rectCell(xa, xb, ya, yb, nX, nY, k, sample);
    sum += f(c.x, c.y) * c.dA;
  }
  return { sum, n, total };
}

export function barCell(a, b, n, index, sample = 'mid') {
  const nX = Math.max(1, n | 0);
  const k = clampIndex(index, nX);
  const dx = (b - a) / nX;
  const x0 = a + k * dx;
  const x =
    sample === 'left' || sample === 'll' ? x0 : sample === 'right' || sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
  return { index: k, total: nX, x0, dx, x };
}

export function barPartial(f, a, b, n, sample, count) {
  const nX = Math.max(1, n | 0);
  const shown = Math.max(0, Math.min(nX, count | 0));
  const dx = (b - a) / nX;
  let sum = 0;
  for (let k = 0; k < shown; k++) {
    const c = barCell(a, b, nX, k, sample);
    sum += f(c.x) * dx;
  }
  return { sum, n: shown, total: nX, dx };
}

export function polarCounts(n, maxN = 12) {
  const nr = Math.max(1, Math.min(maxN, n | 0));
  const nth = Math.max(1, Math.min(maxN, 2 * nr));
  return { nr, nth, total: nr * nth };
}

export function polarCell(R, nr, nth, index, sample = 'mid') {
  const nR = Math.max(1, nr | 0);
  const nTh = Math.max(1, nth | 0);
  const total = nR * nTh;
  const k = clampIndex(index, total);
  const i = Math.floor(k / nTh);
  const j = k - i * nTh;
  const dr = R / nR;
  const dth = (2 * Math.PI) / nTh;
  const r0 = i * dr;
  const th0 = j * dth;
  let r;
  let th;
  if (sample === 'll') {
    r = r0;
    th = th0;
  } else if (sample === 'ur') {
    r = r0 + dr;
    th = th0 + dth;
  } else {
    r = r0 + 0.5 * dr;
    th = th0 + 0.5 * dth;
  }
  return {
    index: k,
    i,
    j,
    total,
    r0,
    th0,
    dr,
    dth,
    r,
    th,
    dA: r * dr * dth,
    bare: dr * dth,
  };
}

export function polarPartial(f, R, nr, nth, sample, count, { jacobian = true } = {}) {
  const nR = Math.max(1, nr | 0);
  const nTh = Math.max(1, nth | 0);
  const total = nR * nTh;
  const n = Math.max(0, Math.min(total, count | 0));
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const c = polarCell(R, nR, nTh, k, sample);
    const rr = Math.max(c.r, 0);
    const dA = jacobian ? c.dA : c.bare;
    sum += f(rr * Math.cos(c.th), rr * Math.sin(c.th)) * dA;
  }
  return { sum, n, total };
}

export function boxCell(xa, xb, ya, yb, za, zb, n, index) {
  const nX = Math.max(1, n | 0);
  const total = nX * nX * nX;
  const k = clampIndex(index, total);
  const i = Math.floor(k / (nX * nX));
  const rem = k - i * nX * nX;
  const j = Math.floor(rem / nX);
  const kk = rem - j * nX;
  const dx = (xb - xa) / nX;
  const dy = (yb - ya) / nX;
  const dz = (zb - za) / nX;
  const x = xa + (i + 0.5) * dx;
  const y = ya + (j + 0.5) * dy;
  const z = za + (kk + 0.5) * dz;
  return { index: k, i, j, k: kk, total, x, y, z, dx, dy, dz, dV: dx * dy * dz, x0: x - 0.5 * dx, y0: y - 0.5 * dy, z0: z - 0.5 * dz };
}

export function boxPartial(f, xa, xb, ya, yb, za, zb, n, count) {
  const nX = Math.max(1, n | 0);
  const total = nX * nX * nX;
  const shown = Math.max(0, Math.min(total, count | 0));
  let sum = 0;
  for (let k = 0; k < shown; k++) {
    const c = boxCell(xa, xb, ya, yb, za, zb, nX, k);
    sum += f(c.x, c.y, c.z) * c.dV;
  }
  return { sum, n: shown, total };
}

/** Sample range of f on a grid. Flat means the color scale has nothing to rank. */
export function range2(f, xa, xb, ya, yb, n = 8) {
  let lo = Infinity;
  let hi = -Infinity;
  const N = Math.max(1, n | 0);
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const v = f(xa + ((xb - xa) * i) / N, ya + ((yb - ya) * j) / N);
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1, flat: true };
  const flat = !(hi - lo > 1e-8 * Math.max(1, Math.abs(lo), Math.abs(hi)));
  return { lo, hi, flat };
}

export function range1(f, a, b, n = 16) {
  let lo = Infinity;
  let hi = -Infinity;
  const N = Math.max(1, n | 0);
  for (let i = 0; i <= N; i++) {
    const v = f(a + ((b - a) * i) / N);
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1, flat: true };
  const flat = !(hi - lo > 1e-8 * Math.max(1, Math.abs(lo), Math.abs(hi)));
  return { lo, hi, flat };
}

export function range3(f, xa, xb, ya, yb, za, zb, n = 4) {
  let lo = Infinity;
  let hi = -Infinity;
  const N = Math.max(1, n | 0);
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      for (let k = 0; k <= N; k++) {
        const v = f(xa + ((xb - xa) * i) / N, ya + ((yb - ya) * j) / N, za + ((zb - za) * k) / N);
        if (!Number.isFinite(v)) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1, flat: true };
  const flat = !(hi - lo > 1e-8 * Math.max(1, Math.abs(lo), Math.abs(hi)));
  return { lo, hi, flat };
}

/** Polar point. θ = 0 lies on +x, θ = π/2 lies on +y. */
export function polMath(r, th, z = 0) {
  return { x: r * Math.cos(th), y: r * Math.sin(th), z };
}

/**
 * Spherical point. φ = 0 is +z, φ = π/2 and θ = 0 is +x, θ = π/2 is +y.
 * This is the only place that conversion is written.
 */
export function sphMath(rho, phi, th) {
  const s = Math.sin(phi);
  return { x: rho * s * Math.cos(th), y: rho * s * Math.sin(th), z: rho * Math.cos(phi) };
}

/** Area r Δr Δθ, or Δr Δθ when the Jacobian is left out. */
export function polarArea(r, dr, dth, { jacobian = true } = {}) {
  return (jacobian ? r : 1) * dr * dth;
}

/** ρ² sinφ Δρ Δφ Δθ, or ρ² Δρ Δφ Δθ when sinφ is left out. */
export function sphVolume(rho, phi, dRho, dPhi, dTh, { sinPhi = true } = {}) {
  const s = sinPhi ? Math.sin(phi) : 1;
  return rho * rho * s * dRho * dPhi * dTh;
}

/**
 * Corners of the "forgotten r" rectangle: radial width Δr, tangential width Δθ
 * (not r Δθ), centered on the sample. θ-hat at θ = 0 is +y.
 * Returns the four floor corners in math (x, y), CCW from the inner-left.
 */
export function polarRectCorners({ r, th, dr, tang }) {
  const erx = Math.cos(th);
  const ery = Math.sin(th);
  const etx = -ery;
  const ety = erx;
  const cx = r * erx;
  const cy = r * ery;
  const hx = dr / 2;
  const hy = tang / 2;
  const corner = (sx, sy) => ({
    x: cx + sx * hx * erx + sy * hy * etx,
    y: cy + sx * hx * ery + sy * hy * ety,
  });
  return [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
}
