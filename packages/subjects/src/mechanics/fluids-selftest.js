/**
 * Self-test for fluids.js. Closed forms against a slice sum, a surface-pressure integral,
 * RK4 of a draining tank, and the printed chapter 14 cases.
 *
 *   node src/mechanics/fluids-selftest.js
 */
import { G } from './constants.js';
import {
  absolutePressure, bernoulli, buoyantForce, circleArea, columnPressure, cylinderBuoyancy,
  flowSpeed, gaugePressure, hydraulicForce, hydraulicStroke, laminarSpeedLimit, poiseuille,
  pressureDownstream, reynolds, submergedFraction, tankLevel, torricelli, uTubeHeight, wallForce,
  wallForceSlices,
} from './fluids.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scale = Math.max(1, Math.abs(b));
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scale;
  if (good) passed += 1;
  else failed += 1;
  console.log(`  ${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `\n        got ${a}  expected ${b}`}`);
}

function ok(cond, name) {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`);
}

const gBook = 9.8;
const rho = 1000;

console.log('Hydrostatics');
const wall = wallForce(rho, 80, 500, gBook);
approx(wall.p, 3.92e5, 1e-12, 'dam average pressure is 3.92×10⁵ Pa with g = 9.80');
approx(wall.F, 1.568e10, 1e-12, 'and the force is that pressure times 4.00×10⁴ m²');
approx(wallForceSlices(rho, 80, 500, gBook), wall.F, 1e-9, 'slice sum matches the closed form');
approx(columnPressure(rho, 40, gBook), gaugePressure(rho, 40, gBook), 1e-9, 'a stacked column matches ρgh');
approx(absolutePressure(1.01e5, rho, 10, G), 1.01e5 + rho * G * 10, 1e-12, 'absolute pressure adds the surface');

console.log('Hydraulics');
approx(hydraulicForce(500, 0.5, 2.5), 1.25e4, 1e-12, 'wheel cylinder force is 1.25×10⁴ N');
const stroke = hydraulicStroke(500, 0.5, 2.5, 0.02);
approx(stroke.F2 * stroke.x2, stroke.W, 1e-12, 'the work out equals the work in');
approx(circleArea(2.5) / circleArea(0.5), (2.5 / 0.5) ** 2, 1e-12, 'area ratio is the square of the diameter ratio');
const tube = uTubeHeight(1000, 800, 0.2);
approx(1000 * tube.h1, 800 * 0.2, 1e-12, 'the U-tube balances ρh');

console.log('Buoyancy');
approx(submergedFraction(970, 1000), 0.97, 1e-12, 'the woman floats with 97% submerged');
approx(submergedFraction(2700, 1000), 1, 1e-12, 'a denser object is fully under');
const V = 60 / 970;
const Fb = buoyantForce(1000, 0.97 * V, G);
approx(Fb, 60 * G, 1e-12, 'the buoyant force equals her weight');
const cyl = cylinderBuoyancy(1000, 0.2, 0.4, 0.97, G);
approx(cyl, buoyantForce(1000, 0.97 * 0.2 * 0.4, G), 1e-9, 'top and bottom pressures give Archimedes');

console.log('Flow');
const A1 = circleArea(0.018);
const A2 = circleArea(0.005);
const v1 = flowSpeed(5e-4, A1);
const v2 = flowSpeed(5e-4, A2);
approx(v1, 1.9649, 1e-3, 'hose speed is 1.96 m/s');
approx(v2, 25.465, 1e-3, 'nozzle speed is 25.5 m/s');
approx(A1 * v1, A2 * v2, 1e-12, 'continuity keeps the volume flow');
const pHose = pressureDownstream({ p1: 1.01e5, v1: 25.5, h1: 0, v2: 1.96, h2: 0, rho, g: G });
approx(pHose, 4.24204e5, 1e-4, 'hose pressure from the printed speeds is 4.24×10⁵ Pa');
approx(bernoulli(pHose, rho, 1.96, 0, G), bernoulli(1.01e5, rho, 25.5, 0, G), 1e-9, 'Bernoulli’s sum is the same at both ends');
approx(torricelli(5, gBook), Math.sqrt(2 * gBook * 5), 1e-12, 'Torricelli is the free-fall speed from that height');
const tank = tankLevel({ h0: 4, aHole: 0.001, aTank: 1, g: G, t: 20 });
approx(tank.hNum, tank.h, 1e-6, 'RK4 of the tank matches the separated solution');

console.log('Viscosity');
const Q = poiseuille({ dp: 0.054, r: 0.09, eta: 1.81e-5, L: 20 });
approx(Q, 3.84e-3, 2e-3, 'the duct flow is 3.84×10⁻³ m³/s');
const vAir = flowSpeed(3.84e-3, Math.PI * 0.09 ** 2);
const nr = reynolds({ rho: 1.23, v: vAir, r: 0.09, eta: 1.81e-5 });
approx(nr, 1835, 0.01, 'the Reynolds number is 1835');
ok(nr < 2000, 'that flow is still laminar on the section’s line');
approx(laminarSpeedLimit({ rho: 1.23, r: 0.09, eta: 1.81e-5 }), 0.1635, 1e-3, 'the laminar limit is near 0.16 m/s');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
