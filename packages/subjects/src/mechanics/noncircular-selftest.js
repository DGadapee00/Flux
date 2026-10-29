/**
 * Second methods for noncircular.js.
 *   node src/mechanics/noncircular-selftest.js
 */
import { bredt, openThin, rectTorsion, rectTorsionCoeffs, rectTorsionDouble } from './noncircular.js';
import { polarJ } from './torsion.js';

let passed = 0;
let failed = 0;
function approx(got, want, tol, name) {
  const ok = Number.isFinite(got) && Math.abs(got - want) <= tol * Math.max(1e-12, Math.abs(want));
  if (ok) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name}: got ${got}, want ${want}`);
  }
}

const G = 77e9;

// Bredt on a thin round tube against the exact polar moment.
{
  const r = 0.025;
  const t = 0.0005;
  const b = bredt(500, Math.PI * r * r, [{ len: 2 * Math.PI * r, t }], G);
  const J = polarJ(r + t / 2, r - t / 2);
  approx(b.J, J, 2e-4, 'thin round tube: Bredt J matches πd⁴/32 differences');
  approx(b.tauMax, (500 * r) / J, 2e-4, 'thin round tube: Bredt stress matches Tρ/J at mid-wall');
}

// A rectangular tube: flow balance, and the twist rate by the energy in each wall.
{
  const T = 3000;
  const walls = [{ len: 0.1, t: 0.004 }, { len: 0.05, t: 0.004 }, { len: 0.1, t: 0.004 }, { len: 0.05, t: 0.004 }];
  const b = bredt(T, 0.1 * 0.05, walls, G);
  approx(b.q, 300e3, 1e-12, 'flow T/2A_m = 300 N/mm');
  approx(b.tauMax, 75e6, 1e-12, 'stress 75 MPa');
  const energy = walls.reduce((s, w) => s + (b.q ** 2 * w.len) / (2 * G * w.t), 0);
  approx(energy, 0.5 * T * b.rate, 1e-12, 'energy per length equals T θ/2');
  const thick = bredt(T, 0.1 * 0.05, walls.map((w, i) => (i === 0 ? { ...w, t: 0.008 } : w)), G);
  approx(thick.tauMax, b.tauMax, 1e-12, 'the thinnest wall sets the peak: thickening one wall leaves it');
}

// Open thin sections: a slit tube against the closed one.
{
  const r = 0.025;
  const t = 0.002;
  const open = openThin(100, [{ len: 2 * Math.PI * r, t }], G);
  const closed = bredt(100, Math.PI * r * r, [{ len: 2 * Math.PI * r, t }], G);
  approx(closed.J / open.J, 3 * (r / t) ** 2, 1e-12, 'slit tube: J falls by 3(r/t)²');
  approx(open.tauMax / closed.tauMax, (3 * r) / t, 1e-12, 'slit tube: stress rises by 3r/t');
}

// Rectangles: the series against published coefficients, the thin limit, and a numerical Prandtl solve.
{
  const sq = rectTorsionCoeffs(1, 1);
  approx(sq.beta, 0.1406, 1e-3, 'square: β = 0.141');
  approx(sq.alpha, 0.208, 2e-3, 'square: α = 0.208');
  const two = rectTorsionCoeffs(2, 1);
  approx(two.beta, 0.229, 2e-3, '2 to 1: β = 0.229');
  approx(two.alpha, 0.246, 2e-3, '2 to 1: α = 0.246');
  approx(rectTorsionCoeffs(1000, 1).beta, 1 / 3, 1e-3, 'thin strip: β → 1/3');
  approx(rectTorsionCoeffs(1000, 1).alpha, 1 / 3, 1e-3, 'thin strip: α → 1/3');
  // Prandtl: ∇²φ = −2 on the section, φ = 0 on the edge; T/(Gθ) = 2∫φ dA. Solve on a grid by relaxation.
  const n = 41;
  const hx = 2 / (n - 1);
  const hy = 1 / ((n - 1) / 2);
  const ny = (n - 1) / 2 + 1;
  const phi = Array.from({ length: n }, () => new Float64Array(ny));
  const cx = 1 / (hx * hx);
  const cy = 1 / (hy * hy);
  for (let it = 0; it < 6000; it++) {
    for (let i = 1; i < n - 1; i++) {
      for (let j = 1; j < ny - 1; j++) {
        const nw = (cx * (phi[i - 1][j] + phi[i + 1][j]) + cy * (phi[i][j - 1] + phi[i][j + 1]) + 2) / (2 * cx + 2 * cy);
        phi[i][j] += 1.85 * (nw - phi[i][j]);
      }
    }
  }
  let sum = 0;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < ny - 1; j++) {
    sum += ((phi[i][j] + phi[i + 1][j] + phi[i][j + 1] + phi[i + 1][j + 1]) / 4) * hx * hy;
  }
  approx(2 * sum, two.beta * 2 * 1, 2e-2, '2 to 1: the Prandtl grid gives β b t³');
  for (const k of [1, 1.5, 2, 4, 10]) {
    const one = rectTorsionCoeffs(k, 1);
    const two = rectTorsionDouble(k, 1);
    approx(two.beta, one.beta, 2e-5, `${k} to 1: β by the double series`);
    approx(two.alpha, one.alpha, 5e-5, `${k} to 1: α by the double series`);
  }
  const r = rectTorsion(200, 0.04, 0.02, G);
  approx(r.tauMax, 200 / (two.alpha * 0.04 * 0.02 ** 2), 1e-12, 'a 40 × 20 bar: τ = T/(α b t²)');
}

if (failed) {
  console.error(`noncircular-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`noncircular-selftest: ${passed} passed`);
