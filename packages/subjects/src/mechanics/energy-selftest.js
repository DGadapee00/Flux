/**
 * Self-test for the Unit 4 additions: work along a path, climbing power, and potential-energy curves.
 * Each result is checked by a second method and by a scaling.
 *
 *   node src/mechanics/energy-selftest.js
 */
import { climbPower, workAlongPath } from './energy.js';
import { equilibria, forceFrom, period, simulate, turningPoints, wellAround } from './potential.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scale = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scale;
  if (good) passed += 1;
  else failed += 1;
  console.log(`  ${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `\n        got ${a}  expected ${b}`}`);
}

const g = 9.81;

console.log('Work along a path');
{
  const A = { x: 0, y: 0 };
  const B = { x: 3, y: 4 };
  const straight = (u) => ({ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u });
  const corner = (u) => (u < 0.5 ? { x: 6 * u, y: 0 } : { x: 3, y: 8 * (u - 0.5) });
  const arc = (u) => {
    const phi = Math.PI * (1 - u) + Math.atan2(4, 3) - Math.PI;
    return { x: 1.5 + 2.5 * Math.cos(phi + Math.PI), y: 2 + 2.5 * Math.sin(phi + Math.PI) };
  };
  const gravity = () => ({ x: 0, y: -2 * g });
  for (const [name, p] of [['straight', straight], ['corner', corner], ['arc', arc]]) {
    approx(workAlongPath(gravity, p, 2000), -2 * g * 4, 1e-6, `gravity on a 2 kg body, ${name} path: −mgΔy`);
    const spring = (x, y) => ({ x: -50 * x, y: -50 * y });
    approx(workAlongPath(spring, p, 2000), -0.5 * 50 * 25, 1e-6, `a spring anchored at the origin, ${name} path: −½k(r_B² − r_A²)`);
  }
  // Friction of fixed size against the motion: −f times the length of the path.
  const friction = (x, y, t) => ({ x: -10 * t.x, y: -10 * t.y });
  approx(workAlongPath(friction, straight, 2000), -10 * 5, 1e-6, 'friction along the straight path: −f·5 m');
  approx(workAlongPath(friction, corner, 2000), -10 * 7, 1e-4, 'friction along the corner path: −f·7 m');
  approx(workAlongPath(friction, arc, 4000), -10 * Math.PI * 2.5, 1e-6, 'friction along the half-circle: −f·π(2.5 m)');
  approx(workAlongPath(gravity, straight, 2000) * 2, workAlongPath(() => ({ x: 0, y: -4 * g }), straight, 2000), 1e-12, 'twice the weight, twice the work');
}

console.log('\nClimbing power');
{
  // OpenStax §7.4, "Automotive Power Driving Uphill": 1200 kg, 15% grade, 90 km/h, 25% lost; g = 9.8.
  const book = climbPower({ mass: 1200, speed: 25, grade: 0.15, lossShare: 0.25, g: 9.8 });
  approx(book.total, 58147, 1e-3, 'the book prints 58 kW');
  approx(book.theta, 8.5308, 1e-4, 'a 15% grade is 8.53°');
  // A second method: energy over a measured kilometre of road, divided by the time it takes.
  const L = 1000;
  const t = L / 25;
  const dU = 1200 * 9.8 * L * Math.sin(Math.atan(0.15));
  approx(dU / 0.75 / t, book.total, 1e-12, 'ΔE over 1 km divided by the time gives the same power');
  approx(climbPower({ mass: 1200, speed: 50, grade: 0.15, lossShare: 0.25 }).total / climbPower({ mass: 1200, speed: 25, grade: 0.15, lossShare: 0.25 }).total, 2, 1e-12, 'twice the speed, twice the power');
  approx(climbPower({ mass: 1200, speed: 25, grade: 0, lossForce: 400 }).total, 400 * 25, 1e-12, 'on the flat, only the losses: F v');
}

console.log('\nPotential-energy curves');
{
  // OpenStax §8.4, "Quartic and Quadratic Potential Energy Diagram": U = 2(x⁴ − x²), E = −0.25 J.
  const U = (x) => 2 * (x ** 4 - x * x);
  const tps = turningPoints(U, -0.25, -2, 2);
  approx(tps.length, 4, 0, 'four turning points');
  approx(tps[3], Math.sqrt(0.5 + Math.sqrt(1 / 8)), 1e-9, 'x_R = 0.924 m');
  approx(tps[2], Math.sqrt(0.5 - Math.sqrt(1 / 8)), 1e-9, 'x_P = 0.383 m');
  const eq = equilibria(U, -2, 2);
  approx(eq.length, 3, 0, 'three equilibria');
  approx(eq[2].x, Math.SQRT1_2, 1e-6, 'a stable one at 1/√2 = 0.707 m');
  approx(eq[1].stable ? 1 : 0, 0, 0, 'the one at the origin is unstable');
  approx(forceFrom(U, 0.9), -(8 * 0.729 - 4 * 0.9), 1e-8, 'F = −dU/dx at 0.9 m, against the derivative by hand');
  // The period, by the integral and by stepping the motion.
  const well = wellAround(U, -0.25, 0.7, -2, 2);
  const T = period(U, -0.25, 1, well.a, well.b);
  const sim = simulate(U, 1, well.b, { dt: 2e-5 });
  approx(sim.period, T, 1e-4, `period in the right well, ${T.toFixed(4)} s, by stepping the motion`);
  approx(sim.lo, well.a, 1e-4, 'and it turns at x_P');
  // A spring: the period does not depend on the energy, 2π√(m/k), and is √2 longer for twice the mass.
  const k = 8;
  const S = (x) => 0.5 * k * x * x;
  for (const E of [0.5, 2]) {
    const w = wellAround(S, E, 0, -5, 5);
    approx(period(S, E, 2, w.a, w.b), 2 * Math.PI * Math.sqrt(2 / k), 1e-6, `spring, E = ${E} J: T = 2π√(m/k)`);
  }
  const w1 = wellAround(S, 1, 0, -5, 5);
  approx(period(S, 1, 4, w1.a, w1.b) / period(S, 1, 2, w1.a, w1.b), Math.SQRT2, 1e-9, 'twice the mass: √2 times the period');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
