/**
 * Second methods for strain.js.
 *   node src/mechanics/strain-selftest.js
 */
import { eigen2, hooke3, principal2, transform } from './materials.js';
import {
  deltaRosette, planeStressFromStrain, principalStrains, rectangularRosette, rosette, strainTransform,
} from './strain.js';

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

const u = 1e-6;
const [ex, ey, g] = [500 * u, -100 * u, 400 * u];

// Transformation against moving a real line element: displacement field u = (εx x + γ/2 y, γ/2 x + εy y).
for (const th of [0, 17, 45, 90, 133]) {
  const t = th * Math.PI / 180;
  const n = [Math.cos(t), Math.sin(t)];
  const du = [ex * n[0] + (g / 2) * n[1], (g / 2) * n[0] + ey * n[1]];
  const stretch = du[0] * n[0] + du[1] * n[1];
  approx(strainTransform(ex, ey, g, th).e, stretch, 1e-12, `ε(${th}°) from a moved line element`);
  // Stress transformation with σ → ε and τ → γ/2 is the same algebra.
  const s = transform(ex, ey, g / 2, th);
  approx(strainTransform(ex, ey, g, th).e, s.sx, 1e-12, `ε(${th}°) matches the stress rule with τ = γ/2`);
  approx(strainTransform(ex, ey, g, th).g / 2, s.txy, 1e-12, `γ'(${th}°)/2 matches the stress rule`);
  approx(strainTransform(ex, ey, g, th).e + strainTransform(ex, ey, g, th).et, ex + ey, 1e-12, `εx' + εy' is invariant at ${th}°`);
}

// Principal strains: closed form against the eigenvalues of the strain tensor.
{
  const p = principalStrains(ex, ey, g);
  const q = eigen2(ex, ey, g / 2);
  approx(p.e1, q.s1, 1e-12, 'ε1 is the larger eigenvalue');
  approx(p.e2, q.s2, 1e-12, 'ε2 is the smaller eigenvalue');
  approx(p.e1, 560.555 * u, 1e-6, 'ε1 = 561 µε');
  approx(strainTransform(ex, ey, g, p.thetaP).e, p.e1, 1e-12, 'the gauge at θp reads ε1');
  approx(Math.abs(strainTransform(ex, ey, g, p.thetaP).g), 0, 1, 'no shear strain on the principal axes');
  approx(Math.abs(strainTransform(ex, ey, g, p.thetaP + 45).g), p.gmax, 1e-9, 'γmax = 2R at 45° from the principal axes');
}

// Rosettes: closed forms against the general three-gauge solve, and back again.
{
  const r = rectangularRosette(500 * u, 400 * u, -100 * u);
  const s = rosette([0, 45, 90], [500 * u, 400 * u, -100 * u]);
  approx(r.gxy, 400 * u, 1e-12, 'rectangular rosette: γ = 2εb − εa − εc');
  approx(s.ex, r.ex, 1e-9, 'general solve: εx');
  approx(s.ey, r.ey, 1e-9, 'general solve: εy');
  approx(s.gxy, r.gxy, 1e-9, 'general solve: γ');
  const read = [0, 60, 120].map((a) => strainTransform(ex, ey, g, a).e);
  const d = deltaRosette(...read);
  approx(d.ex, ex, 1e-9, 'delta rosette recovers εx');
  approx(d.ey, ey, 1e-9, 'delta rosette recovers εy');
  approx(d.gxy, g, 1e-9, 'delta rosette recovers γ');
  const any = rosette([10, 55, 140], [10, 55, 140].map((a) => strainTransform(ex, ey, g, a).e));
  approx(any.gxy, g, 1e-9, 'any three gauges recover γ');
}

// Plane stress from strain: back through Hooke's law, and principal stresses from principal strains.
{
  const E = 200e9;
  const nu = 0.3;
  const st = planeStressFromStrain(ex, ey, g, E, nu);
  const back = hooke3(st.sx, st.sy, 0, E, nu);
  approx(back.ex, ex, 1e-12, 'Hooke returns εx');
  approx(back.ey, ey, 1e-12, 'Hooke returns εy');
  approx(back.ez, st.ez, 1e-12, 'Hooke gives the same εz');
  approx(st.sx, 103.297e6, 1e-5, 'σx = 103.3 MPa');
  approx(st.txy, 30.769e6, 1e-5, 'τ = 30.8 MPa');
  const p = principalStrains(ex, ey, g);
  const s1 = planeStressFromStrain(p.e1, p.e2, 0, E, nu).sx;
  approx(s1, principal2(st.sx, st.sy, st.txy).s1, 1e-9, 'principal stress from principal strains');
  approx(planeStressFromStrain(2 * ex, 2 * ey, 2 * g, E, nu).sx, 2 * st.sx, 1e-12, 'double the strains, double the stress');
}

if (failed) {
  console.error(`strain-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`strain-selftest: ${passed} passed`);
