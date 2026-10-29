/**
 * Second methods for failure.js.
 *   node src/mechanics/failure-selftest.js
 */
import { absMaxShear, coulombMohrFS, maxNormalFS } from './failure.js';
import { principal2, trescaPlane } from './materials.js';

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
const ok = (c, name) => (c ? (passed += 1) : (failed += 1, console.error(`FAIL ${name}`)));

// Absolute maximum shear: search every plane in three dimensions for the largest shear traction.
function scanShear(sx, sy, txy) {
  const S = [[sx, txy, 0], [txy, sy, 0], [0, 0, 0]];
  let best = 0;
  for (let i = 0; i <= 180; i++) {
    for (let j = 0; j <= 360; j++) {
      const a = (i * Math.PI) / 180;
      const b = (j * Math.PI) / 180;
      const n = [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)];
      const t = S.map((r) => r[0] * n[0] + r[1] * n[1] + r[2] * n[2]);
      const sn = t[0] * n[0] + t[1] * n[1] + t[2] * n[2];
      const tt = Math.sqrt(Math.max(0, t[0] ** 2 + t[1] ** 2 + t[2] ** 2 - sn * sn));
      if (tt > best) best = tt;
    }
  }
  return best;
}
for (const [sx, sy, txy, name] of [[80e6, 40e6, 0, 'cylinder'], [80e6, 20e6, 30e6, 'lab element'], [0, 0, 50e6, 'pure shear'], [-60e6, -10e6, 20e6, 'both compressive']]) {
  const r = absMaxShear(sx, sy, txy);
  approx(r.abs, scanShear(sx, sy, txy), 2e-4, `abs max shear by scanning planes: ${name}`);
  approx(2 * r.abs, trescaPlane(sx, sy, txy), 1e-12, `twice the abs max shear is Tresca: ${name}`);
}
approx(absMaxShear(80e6, 40e6, 0).abs, 40e6, 1e-12, 'cylinder: 40 MPa out of the plane');
approx(absMaxShear(80e6, 40e6, 0).inPlane, 20e6, 1e-12, 'cylinder: 20 MPa in the plane');
ok(!absMaxShear(0, 0, 50e6).outOfPlane, 'pure shear: the in-plane circle is the biggest');

// Coulomb–Mohr against a geometric tangency test: scale the circle until it touches the envelope.
{
  const sut = 200e6;
  const suc = 700e6;
  // The envelope: the common tangent to circles (c = sut/2, r = sut/2) and (c = −suc/2, r = suc/2).
  // A circle (c, r) touches a line r = α + βc tangent to both.
  const beta = (sut - suc) / (sut + suc);
  const alpha = (sut * suc) / (sut + suc);
  const touches = (s1, s3) => (s1 - s3) / 2 - (alpha + beta * (s1 + s3) / 2);
  for (const [sx, sy, txy] of [[0, 0, 100e6], [50e6, -300e6, 0], [30e6, -80e6, 40e6]]) {
    const n = coulombMohrFS(sx, sy, txy, sut, suc);
    const { s1, s2 } = principal2(sx * n, sy * n, txy * n);
    approx(touches(Math.max(s1, s2, 0), Math.min(s1, s2, 0)) + sut, sut, 1e-9, `the scaled circle touches the envelope (${sx / 1e6}, ${sy / 1e6}, ${txy / 1e6})`);
  }
  approx(coulombMohrFS(0, 0, 1, sut, suc) * 1, 1 / (1 / sut + 1 / suc), 1e-12, 'pure shear: τ = 1/(1/σut + 1/σuc)');
  approx(coulombMohrFS(0, 0, 155.5555e6, sut, suc), 1, 1e-5, 'pure shear fractures at 156 MPa');
  approx(maxNormalFS(0, 0, 200e6, sut, suc), 1, 1e-12, 'maximum normal stress: pure shear fractures at σut');
  approx(coulombMohrFS(100e6, 0, 0, sut, suc), 2, 1e-12, 'uniaxial tension: both rules give σut/σ');
  approx(maxNormalFS(100e6, 0, 0, sut, suc), 2, 1e-12, 'uniaxial tension: maximum normal stress');
  approx(coulombMohrFS(-350e6, 0, 0, sut, suc), 2, 1e-12, 'uniaxial compression: σuc/|σ|');
  approx(coulombMohrFS(50e6, -300e6, 0, sut, suc), 1 / (0.25 + 300 / 700), 1e-12, 'mixed quadrant: n = 1.47');
  ok(maxNormalFS(50e6, -300e6, 0, sut, suc) > coulombMohrFS(50e6, -300e6, 0, sut, suc), 'maximum normal stress is unconservative in the mixed quadrant');
  approx(coulombMohrFS(80e6, 40e6, 0, sut, suc), maxNormalFS(80e6, 40e6, 0, sut, suc), 1e-12, 'both tensile: the two rules agree');
  approx(coulombMohrFS(160e6, 0, 0, sut, suc), coulombMohrFS(80e6, 0, 0, sut, suc) / 2, 1e-12, 'double the stress, halve the factor');
}

if (failed) {
  console.error(`failure-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`failure-selftest: ${passed} passed`);
