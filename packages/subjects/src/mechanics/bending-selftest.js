/**
 * Second methods for bending.js.
 *   node src/mechanics/bending-selftest.js
 */
import { bentStripStress, compositeRects, compositeSection, curvature, tiltedRect } from './bending.js';

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

// Curvature: the stress −Ey/ρ integrated over a rectangle returns M.
{
  const E = 200e9;
  const b = 0.04;
  const h = 0.08;
  const I = (b * h ** 3) / 12;
  const k = curvature(2000, E, I);
  let M = 0;
  const n = 4000;
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + ((i + 0.5) * h) / n;
    M += -y * (-E * y * k) * b * (h / n);
  }
  approx(M, 2000, 1e-6, '∫ −y σ dA returns M');
  approx(1 / k, 170.667, 1e-5, 'radius of curvature 171 m');
  approx(E * (h / 2) * k, 46.875e6, 1e-12, 'outer-fiber stress matches 6M/bh²');
  approx(bentStripStress(200e9, 0.635e-3, 0.1778), 357.1e6, 1e-3, 'band-saw blade on a 14 in wheel: 357 MPa');
  approx(bentStripStress(200e9, 0.635e-3, 0.127), (0.1778 / 0.127) * bentStripStress(200e9, 0.635e-3, 0.1778), 1e-12, 'smaller wheel: stress grows as 1/ρ');
}

// A tilted moment: integrate the stress for force and both moments.
{
  const r = tiltedRect(0.04, 0.08, 2000, 10);
  let F = 0;
  let Mz = 0;
  let My = 0;
  const n = 400;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const y = -0.04 + ((i + 0.5) * 0.08) / n;
      const z = -0.02 + ((j + 0.5) * 0.04) / n;
      const dA = (0.08 / n) * (0.04 / n);
      const s = r.stress(y, z);
      F += s * dA;
      Mz += -y * s * dA;
      My += z * s * dA;
    }
  }
  approx(Math.abs(F) + 1, 1, 1e-6, 'tilted moment: no net force');
  approx(Mz, 2000 * Math.cos(10 * Math.PI / 180), 1e-4, 'tilted moment: Mz returned');
  approx(My, 2000 * Math.sin(10 * Math.PI / 180), 1e-4, 'tilted moment: My returned');
  // The neutral axis: σ vanishes along the line at α through the centroid.
  const a = (r.alpha * Math.PI) / 180;
  approx(Math.abs(r.stress(0.01 * Math.sin(a), 0.01 * Math.cos(a))) + 1, 1, 1e-9, 'σ = 0 along the neutral axis');
  approx(tiltedRect(0.04, 0.08, 2000, 0).max, 46.875e6, 1e-12, 'no tilt: back to 6M/bh²');
  approx(tiltedRect(0.04, 0.04, 2000, 30).alpha, 30, 1e-12, 'a square: the neutral axis follows the moment');
}

// Composite: the transformed section against a direct balance of the real stresses.
{
  const sec = compositeSection([{ b: 0.1, h: 0.01, E: 200e9 }, { b: 0.1, h: 0.2, E: 12.5e9 }], 12.5e9);
  approx(sec.ybar, 0.0633333, 1e-5, 'neutral axis 63.3 mm up');
  approx(sec.I, 164.80e-6, 1e-3, 'transformed I 164.8 × 10⁶ mm⁴');
  // Real stress = E × strain, strain = −(y − ȳ)/ρ, with 1/ρ = M/(Eref I).
  const M = 20e3;
  const k = M / sec.EI;
  let F = 0;
  let Mr = 0;
  const n = 4000;
  for (const p of sec.parts) {
    for (let i = 0; i < n; i++) {
      const y = p.y0 + ((i + 0.5) * p.h) / n;
      const s = -p.E * (y - sec.ybar) * k;
      F += s * p.b * (p.h / n);
      Mr += -(y - sec.ybar) * s * p.b * (p.h / n);
      if (i === n / 2) approx(sec.stress(M, y), s, 1e-9, `transformed stress = E × strain at y = ${(y * 1000).toFixed(1)} mm`);
    }
  }
  approx(Math.abs(F) + M, M, 1e-6, 'composite: no net force');
  approx(Mr, M, 1e-6, 'composite: the real stresses carry M');
  approx(sec.stress(M, sec.H), -17.80e6, 1e-3, 'wood top −17.8 MPa');
  approx(sec.stress(M, 0), 123.0e6, 2e-3, 'steel bottom 123 MPa');
  const one = compositeSection([{ b: 0.1, h: 0.2, E: 12.5e9 }], 12.5e9);
  approx(one.stress(M, 0.2), -(6 * M) / (0.1 * 0.04), 1e-12, 'one material: back to 6M/bh²');
}

// Side by side: a flitch beam, two 1.5 × 9.25 in boards and a 0.375 in plate, in inch-pound units.
{
  const Ew = 1.4e6;
  const Es = 29e6;
  const h = 9.25;
  const sec = compositeRects([{ b: 3, h, E: Ew }, { b: 0.375, h, E: Es }], Ew);
  const EI = Ew * (3 * h ** 3) / 12 + Es * (0.375 * h ** 3) / 12;
  approx(sec.EI, EI, 1e-12, 'flitch: EI is the sum of the parts about one axis');
  approx(sec.ybar, h / 2, 1e-12, 'flitch: same depth, so the axis is at mid-depth');
  approx(sec.parts[1].share, (Es * 0.375) / (Es * 0.375 + Ew * 3), 1e-12, 'flitch: the plate\'s share is its EI over the total');
  const M = 117600;
  approx(sec.stress(M, 0, h), -(M * Ew * (h / 2)) / EI, 1e-12, 'flitch: wood top stress from the shared curvature');
  // Balance by strips: no net force, and the real stresses carry M.
  let F = 0;
  let Mr = 0;
  const n = 2000;
  sec.parts.forEach((p, i) => {
    for (let j = 0; j < n; j++) {
      const y = p.y0 + ((j + 0.5) * p.h) / n;
      const s = sec.stress(M, i, y);
      F += s * p.b * (p.h / n);
      Mr += -(y - sec.ybar) * s * p.b * (p.h / n);
    }
  });
  approx(Math.abs(F) + M, M, 1e-9, 'flitch: no net force');
  approx(Mr, M, 1e-6, 'flitch: the real stresses carry M');
  // Stacked layers give the same answer through either routine.
  const a = compositeSection([{ b: 0.1, h: 0.01, E: 200e9 }, { b: 0.1, h: 0.2, E: 12.5e9 }], 12.5e9);
  const b = compositeRects([{ b: 0.1, h: 0.01, E: 200e9, y0: 0 }, { b: 0.1, h: 0.2, E: 12.5e9, y0: 0.01 }], 12.5e9);
  approx(b.I, a.I, 1e-12, 'stacked: compositeRects agrees with compositeSection');
  approx(b.stress(20e3, 0, 0), a.stress(20e3, 0), 1e-12, 'stacked: same steel stress');
  // Scaling: double the plate's E, and the wood's stress falls but not by half.
  const s2 = compositeRects([{ b: 3, h, E: Ew }, { b: 0.375, h, E: 2 * Es }], Ew);
  const relief = s2.stress(M, 0, h) / sec.stress(M, 0, h);
  approx(relief, EI / (EI + Es * (0.375 * h ** 3) / 12), 1e-12, 'a stiffer plate relieves the wood by EI/(EI + ΔEI), less than half');
}

if (failed) {
  console.error(`bending-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`bending-selftest: ${passed} passed`);
