/**
 * Self-test for drag.js. Every closed form is checked against RK4 on the same equation of motion,
 * and against a scaling or a printed value.
 *
 *   node src/mechanics/drag-selftest.js
 */
import {
  dragConstant, linearCoast, linearFall, quadraticFall, quadraticRiseHeight, rk4Line, terminalSpeed,
} from './drag.js';

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

console.log('Linear drag');
for (const [m, b, v0] of [[2, 0.5, 0], [0.1, 0.4, 3], [5, 2, 40]]) {
  const t = 3;
  const c = linearFall({ m, b, g, v0, t });
  const n = rk4Line((v) => g - (b / m) * v, { v0, t1: t });
  approx(c.v, n.v, 1e-9, `m ${m}, b ${b}, v0 ${v0}: v(3 s) = ${c.v.toFixed(4)} m/s by RK4`);
  approx(c.y, n.y, 1e-9, `and the distance fallen, ${c.y.toFixed(4)} m`);
}
{
  const one = linearFall({ m: 2, b: 0.5, g, t: 4 });
  approx(one.v / one.vt, 1 - Math.exp(-1), 1e-12, 'from rest it reaches 63% of v_t in one time constant');
  approx(terminalSpeed({ m: 4, b: 0.5, g }) / terminalSpeed({ m: 2, b: 0.5, g }), 2, 1e-12, 'linear: twice the mass, twice v_t');
  approx(linearFall({ m: 2, b: 0.5, g, v0: 60, t: 200 }).v, linearFall({ m: 2, b: 0.5, g, v0: 0, t: 200 }).v, 1e-9, 'the terminal speed does not depend on the starting speed');
}

console.log('\nQuadratic drag');
for (const [m, k, v0] of [[85, 0.4235, 0], [85, 0.4235, 70], [0.05, 0.002, 1]]) {
  const t = 6;
  const c = quadraticFall({ m, k, g, v0, t });
  const n = rk4Line((v) => g - (k / m) * v * Math.abs(v), { v0, t1: t, steps: 6000 });
  approx(c.v, n.v, 1e-8, `m ${m}, k ${k}, v0 ${v0}: v(6 s) = ${c.v.toFixed(4)} m/s by RK4`);
  approx(c.y, n.y, 1e-8, `and the distance fallen, ${c.y.toFixed(3)} m`);
}
{
  // OpenStax §6.4, "Terminal Velocity of a Skydiver": 85 kg, 0.70 m², C = 1.0, ρ = 1.21 kg/m³, g = 9.80.
  const k = dragConstant({ rho: 1.21, C: 1.0, A: 0.7 });
  approx(terminalSpeed({ m: 85, g: 9.8, k }), 44.35, 1e-3, 'the spread-eagle skydiver: 44 m/s, as the book prints');
  approx(terminalSpeed({ m: 75, g: 9.8, k: dragConstant({ rho: 1.21, C: 0.7, A: 0.18 }) }), 98.19, 1e-3, 'head first: 98 m/s');
  const four = terminalSpeed({ m: 85, k: dragConstant({ rho: 1.21, C: 1, A: 2.8 }) });
  approx(four / terminalSpeed({ m: 85, k }), 0.5, 1e-12, 'four times the area halves v_t');
  approx(terminalSpeed({ m: 170, k }) / terminalSpeed({ m: 85, k }), Math.SQRT2, 1e-12, 'quadratic: twice the mass, √2 times v_t');
}

console.log('\nCoasting and rising');
{
  // OpenStax §6.4, "Effect of the Resistive Force on a Motorboat": 4.0 to 1.0 m/s in 10 s.
  const tau = 10 / Math.log(4);
  const c = linearCoast({ v0: 4, tau, t: 10 });
  approx(c.v, 1, 1e-12, 'the boat slows from 4.0 to 1.0 m/s in 10 s');
  approx(c.xMax, 28.854, 1e-4, 'and coasts at most 28.9 m; the book prints 29 m');
  const n = rk4Line((v) => -v / tau, { v0: 4, t1: 10 });
  approx(c.x, n.y, 1e-9, 'its distance after 10 s matches RK4');
  // OpenStax §6.1, "Motion of a Projectile Fired Vertically": 10.0 kg at 50.0 m/s, F = 0.0100 v².
  const h = quadraticRiseHeight({ m: 10, k: 0.01, g: 9.8, v0: 50 });
  approx(h, 113.6, 1e-3, 'the mortar shell climbs 114 m, as the book prints');
  let lo = 0;
  let hi = 6;
  for (let i = 0; i < 60; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (rk4Line((v) => -9.8 - 0.001 * v * v, { v0: 50, t1: mid, steps: 4000 }).v > 0) lo = mid;
    else hi = mid;
  }
  approx(rk4Line((v) => -9.8 - 0.001 * v * v, { v0: 50, t1: lo, steps: 4000 }).y, h, 1e-6, 'RK4 to the top gives the same height');
  approx(quadraticRiseHeight({ m: 10, k: 1e-9, g: 9.8, v0: 50 }), 2500 / 19.6, 1e-6, 'with no drag it is v0²/(2g)');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
