/**
 * Second methods for path.js. None of these repeat the formula they check.
 *
 *   node src/mechanics/path-selftest.js
 */
import { df1 } from '../math/ndiff.js';
import { v } from './vectors.js';
import {
  accelAt,
  distanceByCrossings,
  integrateAbsSpeed,
  integratePieces,
  normalTangential,
  normalTangentialOf,
  projectTimePath,
  radiusOfCurvature,
  relativeNumeric,
  relativeOf,
  rk4Motion,
  rk4Pieces,
} from './path.js';

let passed = 0;
let failed = 0;

function approx(got, want, tol, name) {
  const scale = Math.max(1, Math.abs(want));
  const good = Number.isFinite(got) && Math.abs(got - want) <= tol * scale;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${got}  expected ${want}`);
  }
}

function graphCheck() {
  const f = (x) => Math.sin(x);
  const x = 0.7;
  const speed = 2.5;
  const at = -0.4;
  const yp = Math.cos(x);
  const ypp = -Math.sin(x);
  const formula = normalTangential({ yp, ypp, speed, at });
  const diffs = normalTangentialOf(f, x, speed, at);
  approx(diffs.rho, formula.rho, 1e-6, 'ρ from differences matches (1+y′²)^{3/2}/|y″|');
  approx(diffs.at, at, 1e-12, 'a_t is the given tangential acceleration');
  approx(diffs.an, formula.an, 1e-6, 'a_n from differences matches v²/ρ');
  approx(radiusOfCurvature(yp, ypp), formula.rho, 1e-12, 'radius helper matches the split');
}

function timePathCheck() {
  const R = 2;
  const w = 3;
  const t = 0.4;
  const x = (tt) => R * Math.cos(w * tt);
  const y = (tt) => R * Math.sin(w * tt);
  const got = projectTimePath(x, y, t);
  approx(got.speed, R * w, 1e-6, 'circle speed is Rω');
  approx(got.at, 0, 1e-6, 'constant ω has a_t = 0');
  approx(got.an, R * w * w, 1e-4, 'circle a_n is Rω² from r(t)');

  const speed = 1.7;
  const xCat = (tt) => Math.asinh(speed * tt);
  const yCat = (tt) => Math.sqrt(1 + (speed * tt) ** 2);
  const tc = 0.8;
  const xc = xCat(tc);
  const along = projectTimePath(xCat, yCat, tc);
  const graph = normalTangential({
    yp: Math.sinh(xc),
    ypp: Math.cosh(xc),
    speed: along.speed,
    at: along.at,
  });
  approx(along.an, graph.an, 1e-3, 'catenary a_n from r(t) matches v²/ρ');
  approx(graph.rho, Math.cosh(xc) ** 2, 1e-9, 'catenary ρ is cosh² x');
  approx(along.speed, speed, 1e-4, 'constant speed along the catenary');
}

function rectilinearCheck() {
  const pieces = [
    { t0: 0, t1: 2, coeff: [2, 3] },
    { t0: 2, t1: 4, coeff: [-4] },
  ];
  const state = integratePieces(pieces, 0, 1);
  const at = (t) => {
    if (t <= 2) return { s: t + t * t + 0.5 * t ** 3, v: 1 + 2 * t + 1.5 * t * t, a: 2 + 3 * t };
    const s2 = 2 + 4 + 4;
    const v2 = 1 + 4 + 6;
    const tau = t - 2;
    return { s: s2 + v2 * tau - 2 * tau * tau, v: v2 - 4 * tau, a: -4 };
  };
  for (const t of [0, 1, 2, 3.5, 4]) {
    const exact = at(t);
    const got = state(t);
    approx(got.s, exact.s, 1e-12, `exact s(${t})`);
    approx(got.v, exact.v, 1e-12, `exact v(${t})`);
    approx(got.a, exact.a, 1e-12, `exact a(${t})`);
    approx(accelAt(pieces, t), exact.a, 1e-12, `accelAt(${t})`);
  }
  const end = state(4);
  const smooth = rk4Motion((t) => 2 + 3 * t, 0, 1, 0, 2, 8);
  approx(smooth.s, state(2).s, 1e-8, 'RK4 on one smooth piece matches s');
  approx(smooth.v, state(2).v, 1e-8, 'RK4 on one smooth piece matches v');
  const rk = rk4Pieces(pieces, 0, 1, 4, 40);
  approx(rk.s, end.s, 1e-8, 'piecewise RK4 s matches the exact integral');
  approx(rk.v, end.v, 1e-8, 'piecewise RK4 v matches the exact integral');

  const brake = integratePieces([{ t0: 0, t1: 5, coeff: [-2] }], 0, 4);
  const closed = 13;
  approx(distanceByCrossings(brake, 0, 5), closed, 1e-6, 'distance is the sum of |Δs| at the stop');
  approx(integrateAbsSpeed((t) => brake(t).v, 0, 5, 2000), closed, 1e-4, '∫|v| dt matches that sum');
  approx(brake(5).s - brake(0).s, -5, 1e-12, 'displacement is not the distance');
  approx(df1((t) => brake(t).s, 3), brake(3).v, 1e-6, 'ds/dt matches v');
}

function relativeCheck() {
  const rA = (t) => v(t, 0.5 * t * t, 0);
  const rB = (t) => v(2 * t, 3, -t);
  const t = 1.2;
  const analytic = relativeOf(
    { r: rA(t), v: v(1, t, 0), a: v(0, 1, 0) },
    { r: rB(t), v: v(2, 0, -1), a: v(0, 0, 0) },
  );
  const num = relativeNumeric(rA, rB, t);
  approx(num.v.x, analytic.v.x, 1e-6, 'v_B/A,x from d/dt(r_B − r_A)');
  approx(num.v.y, analytic.v.y, 1e-6, 'v_B/A,y from d/dt(r_B − r_A)');
  approx(num.v.z, analytic.v.z, 1e-6, 'v_B/A,z from d/dt(r_B − r_A)');
  approx(num.a.x, analytic.a.x, 1e-4, 'a_B/A,x from the second derivative');
  approx(num.a.y, analytic.a.y, 1e-4, 'a_B/A,y from the second derivative');
  approx(num.r.x, analytic.r.x, 1e-12, 'r_B/A is the position difference');
}

graphCheck();
timePathCheck();
rectilinearCheck();
relativeCheck();
console.log(failed ? `${failed} failed` : `path: ${passed} checks passed`);
process.exit(failed ? 1 : 0);
