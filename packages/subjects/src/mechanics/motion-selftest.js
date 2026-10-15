/**
 * Self-test for the Physics I additions. Each block compares the library with a
 * second method: an integral, a vector diagram, a conservation law, or a
 * different formula. It does not compare a function with a copy of itself.
 *
 *   node src/mechanics/motion-selftest.js
 */
import { dot, fromAngle2D, mag, v } from './vectors.js';
import { momentAbout } from './statics.js';
import {
  averageVelocity, centripetalAccel, circularPeriod, constAccel1D, constVelocity,
  flight, landingTime, projectile, relativeVelocity, speedFromDisplacement, timeAtSpeed,
} from './kinematics.js';
import { atwood, bankedCurve, centripetalForce, hangingIncline, incline, newton, springCollar, verticalLoop } from './dynamics.js';
import {
  collarPath, collarTrip, conservativeWork, gravitationalEnergy, kineticEnergy, pathPotential,
  power, speedFromEnergy, springEnergy, springStop, springWork, work, workVector,
} from './energy.js';
import { centerOfMass, collide1D, impulse, momentum } from './momentum.js';
import { inclineState } from './friction.js';
import {
  angularAcceleration, angularMomentum, constAlpha, inertiaDisk, inertiaPoint, inertiaRodCenter,
  inertiaRodEnd, parallelAxisMass, rollingIncline, rotationalKE, torqueMag,
} from './rotation.js';
import {
  pendulumPeriod, physicalPendulumPeriod, shm, shmEnergy, springOmega, springPeriod,
} from './oscillation.js';
import {
  circularOrbitEnergy, circularOrbitPeriod, circularOrbitSpeed, escapeSpeed, gravityEnergy,
  gravityField, gravityForce,
} from './gravitation.js';

let passed = 0;
let failed = 0;
const DEG = Math.PI / 180;

function approx(a, b, tol, name) {
  const scaleB = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scaleB;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}`);
  }
}
const ok = (c, name) => (c ? (passed += 1, console.log(`  PASS  ${name}`)) : (failed += 1, console.log(`  FAIL  ${name}`)));

/** Trapezoid on v(t) = v0 + a t. Exact for constant a, apart from roundoff. */
function trap1D(x0, v0, a, t, n = 8000) {
  const dt = t / n;
  let x = x0;
  let vel = v0;
  for (let i = 0; i < n; i++) {
    const next = vel + a * dt;
    x += 0.5 * (vel + next) * dt;
    vel = next;
  }
  return { x, vel };
}

console.log('Kinematics');
{
  const x0 = v(1, 2, 3);
  const vel = v(4, 0, -1);
  const r = constVelocity(x0, vel, 2);
  approx(r.x, 9, 1e-12, 'constant velocity, x');
  approx(r.y, 2, 1e-12, 'constant velocity, y');
  approx(r.z, 1, 1e-12, 'constant velocity, z');

  const closed = constAccel1D({ x0: 2, v0: 3, a: 4, t: 5 });
  const num = trap1D(2, 3, 4, 5);
  approx(closed.v, 23, 1e-12, 'v = v0 + a t is 23');
  approx(closed.x, 67, 1e-12, 'x = x0 + v0 t + (1/2) a t² is 67');
  approx(num.x, closed.x, 1e-9, 'trapezoid integration matches the closed form');
  approx(num.vel, closed.v, 1e-12, 'and the speed');

  // v² = v0² + 2 a Δx, then t = (v − v0) / a, against the position formula.
  const vFinal = speedFromDisplacement(0, 2, 8);
  approx(vFinal, Math.sqrt(32), 1e-12, 'speed from displacement is √32');
  const t = timeAtSpeed(0, 2, vFinal);
  approx(constAccel1D({ x0: 0, v0: 0, a: 2, t }).x, 8, 1e-12, 'that speed is reached at the given displacement');
  ok(Number.isNaN(speedFromDisplacement(1, -2, 5)), 'a negative radicand is NaN');

  const avg = averageVelocity(v(0, 0, 0), v(6, 8, 0), 0, 2);
  approx(mag(avg), 5, 1e-12, 'average velocity from (0,0) to (6,8) in 2 s has magnitude 5');

  // Level ground: R = v0² sin 2θ / g, written here, against the vector flight.
  const g = 10;
  const v0 = 10;
  const theta = 30;
  const shot = projectile({ v0, thetaDeg: theta, g, y0: 0, yLand: 0 });
  const range = (v0 * v0 * Math.sin(2 * theta * DEG)) / g;
  const hMax = (v0 * Math.sin(theta * DEG)) ** 2 / (2 * g);
  approx(shot.range, range, 1e-12, 'level range matches v0² sin 2θ / g');
  approx(shot.hMax, hMax, 1e-12, 'apex matches v0² sin²θ / (2g)');
  approx(shot.tFlight, (2 * v0 * Math.sin(theta * DEG)) / g, 1e-12, 'flight time matches 2 v0 sinθ / g');

  // A cliff, checked by energy: v = √(v0² + 2 g h). z is constant.
  const cliff = flight({ r0: v(0, 5, 2), v0: v(3, 0, 0), g, yLand: 0 });
  approx(cliff.tFlight, 1, 1e-12, 'drop of 5 m at g = 10 takes 1 s');
  approx(cliff.range, 3, 1e-12, 'horizontal range is v t');
  approx(cliff.land.z, 2, 1e-12, 'z is unchanged');
  approx(cliff.land.speed, Math.sqrt(9 + 100), 1e-12, 'impact speed matches energy');
  approx(landingTime(0, g, 5, 0), 1, 1e-12, 'landing time of a drop');

  approx(centripetalAccel(4, 2), 8, 1e-12, 'v²/r = 8');
  approx(circularPeriod(4, 2), Math.PI, 1e-12, 'period is π');
  const rel = relativeVelocity(v(3, 4, 0), v(1, 0, 0));
  approx(mag(rel), Math.sqrt(20), 1e-12, 'relative velocity magnitude');
}

console.log('\nDynamics');
{
  const mass = 2;
  const g = 10;
  const theta = 30;
  const mu = 0.2;
  const block = incline({ mass, thetaDeg: theta, mu, g, motion: 'down' });
  // Weight dotted into a downhill unit vector, minus kinetic friction up the plane.
  const th = theta * DEG;
  const downhill = v(Math.cos(th), -Math.sin(th), 0);
  const normal = v(Math.sin(th), Math.cos(th), 0);
  const W = v(0, -mass * g, 0);
  const N = -dot(W, normal);
  const aDown = (dot(W, downhill) - mu * N) / mass;
  approx(block.N, N, 1e-12, 'normal force matches the vector diagram');
  approx(block.aDown, aDown, 1e-12, 'downhill acceleration matches the vector diagram');
  approx(block.aDown, g * (Math.sin(th) - mu * Math.cos(th)), 1e-12, 'and the scalar form');

  const rest = incline({ mass, thetaDeg: theta, mu: 0.7, g, motion: 'rest' });
  ok(rest.holds, 'μ = 0.7 holds a 30° incline');
  approx(rest.aDown, 0, 1e-12, 'a held block has no acceleration');
  const slips = incline({ mass, thetaDeg: theta, mu: 0.2, g, motion: 'rest' });
  ok(!slips.holds, 'μ = 0.2 does not hold a 30° incline');
  const up = incline({ mass, thetaDeg: theta, mu, g, motion: 'up' });
  const aUp = (dot(W, downhill) + mu * N) / mass;
  approx(up.aDown, aUp, 1e-12, 'sliding up: friction adds to the downhill acceleration');

  // Atwood from the two equations of motion, solved as a 2×2 system.
  // m2 g − T = m2 a and T − m1 g = m1 a, with a positive when m2 descends.
  const m1 = 1;
  const m2 = 3;
  const machine = atwood(m1, m2, g);
  const det = (-1) * (-m1) - (-m2) * 1;
  const T = ((-m2 * g) * (-m1) - (-m2) * (m1 * g)) / det;
  const a = ((-1) * (m1 * g) - (-m2 * g) * 1) / det;
  approx(machine.T, T, 1e-12, 'Atwood tension matches the linear system');
  approx(machine.a, a, 1e-12, 'Atwood acceleration matches the linear system');
  approx(m2 * g - machine.T, m2 * machine.a, 1e-12, 'm2 equation closes');
  approx(machine.T - m1 * g, m1 * machine.a, 1e-12, 'm1 equation closes');
  approx(atwood(2, 2, g).a, 0, 1e-12, 'equal masses do not accelerate');
  approx(atwood(2, 2, g).T, 2 * g, 1e-12, 'equal masses hang at their weight');

  const aC = v(centripetalAccel(3, 1), 0, 0);
  approx(mag(newton(4, aC)), centripetalForce(4, 3, 1), 1e-12, 'F = ma gives mv²/r');
}

console.log('\nEnergy');
{
  approx(work(10, 3, 60), 15, 1e-12, 'F d cos 60° = 15');
  const F = v(10, 0, 0);
  const d = fromAngle2D(3, 60);
  approx(workVector(F, d), 15, 1e-12, 'the dot product gives the same work');
  approx(power(F, v(2, 0, 0)), 20, 1e-12, 'power is F · v');
  approx(kineticEnergy(2, 4), 16, 1e-12, '(1/2) m v² = 16');
  approx(springEnergy(50, 0.2), 1, 1e-12, '(1/2) k x² = 1');

  // A drop: kinematics v² = 2 g h against energy.
  const m = 2;
  const g = 10;
  const h = 5;
  const fromKinematics = speedFromDisplacement(0, g, h);
  const fromEnergy = speedFromEnergy({
    mass: m,
    u0: gravitationalEnergy(m, g, h),
    u: 0,
  });
  approx(fromEnergy, fromKinematics, 1e-12, 'a drop: energy and v² = 2gh agree');
  approx(fromEnergy, 10, 1e-12, 'and the speed is 10');
}

console.log('\nMomentum');
{
  const exchanged = collide1D(1, 1, 4, 0, 1);
  approx(exchanged.v1, 0, 1e-12, 'equal masses exchange: the first stops');
  approx(exchanged.v2, 4, 1e-12, 'equal masses exchange: the second takes 4');

  const m1 = 2;
  const m2 = 3;
  const u1 = 4;
  const u2 = -1;
  const e = 0.5;
  const hit = collide1D(m1, m2, u1, u2, e);
  approx(m1 * hit.v1 + m2 * hit.v2, m1 * u1 + m2 * u2, 1e-12, 'momentum is conserved');
  approx(hit.v2 - hit.v1, e * (u1 - u2), 1e-12, 'restitution holds');

  const elastic = collide1D(2, 5, 3, -2, 1);
  const k0 = kineticEnergy(2, 3) + kineticEnergy(5, 2);
  const k1 = kineticEnergy(2, elastic.v1) + kineticEnergy(5, elastic.v2);
  approx(k1, k0, 1e-12, 'an elastic collision keeps the kinetic energy');

  const stuck = collide1D(2, 2, 3, 1, 0);
  approx(stuck.v1, 2, 1e-12, 'perfectly inelastic: both leave at 2');
  approx(stuck.v2, stuck.v1, 1e-12, 'and they share that velocity');

  approx(impulse(v(2, 0, 0), 0.5).x, momentum(1, v(1, 0, 0)).x, 1e-12, 'impulse equals the change of momentum');
  const cm = centerOfMass([
    { mass: 1, r: v(0, 0, 0) },
    { mass: 3, r: v(4, 2, 0) },
  ]);
  approx(cm.r.x, 3, 1e-12, 'center of mass, x');
  approx(cm.r.y, 1.5, 1e-12, 'center of mass, y');
  approx(cm.mass, 4, 1e-12, 'center of mass, total mass');
}

console.log('\nRotation');
{
  const spun = constAlpha({ theta0: 1, omega0: 2, alpha: -1, t: 4 });
  const num = trap1D(1, 2, -1, 4);
  approx(spun.omega, num.vel, 1e-12, 'ω follows the same rule as v');
  approx(spun.theta, num.x, 1e-9, 'θ follows the same rule as x');

  const M = momentAbout(v(0, 0, 0), v(2, 0, 0), v(0, 5, 0));
  approx(mag(M), torqueMag(2, 5, 90), 1e-12, '|r × F| matches r F sinφ');
  approx(M.z, 10, 1e-12, 'the moment is 10, counterclockwise');

  const I = inertiaDisk(3, 2);
  approx(angularAcceleration(12, I), 12 / I, 1e-12, 'α = τ / I');
  approx(rotationalKE(I, 4), 0.5 * angularMomentum(I, 4) * 4, 1e-12, '(1/2) I ω² = (1/2) L ω');

  // A rod about its end is the center moment plus m (L/2)².
  const m = 6;
  const L = 2;
  approx(parallelAxisMass(inertiaRodCenter(m, L), m, L / 2), inertiaRodEnd(m, L), 1e-12,
    'parallel axis takes a rod from its center to its end');

  // Energy over a distance s, against Newton's laws in rollingIncline.
  const radius = 0.4;
  const disk = inertiaDisk(m, radius);
  const roll = rollingIncline({ mass: m, radius, I: disk, thetaDeg: 30, g: 10 });
  const k = disk / (m * radius * radius);
  const s = 3;
  const height = s * Math.sin(30 * DEG);
  const v2 = (2 * m * 10 * height) / (m * (1 + k));
  const aFromEnergy = v2 / (2 * s);
  approx(roll.a, aFromEnergy, 1e-12, 'rolling acceleration matches energy');
  approx(roll.alpha, roll.a / radius, 1e-12, 'no slip: α = a / R');
  approx(roll.k, 0.5, 1e-12, 'a disk has k = 1/2');
}

console.log('\nOscillation');
{
  const mass = 0.5;
  const k = 8;
  approx(springOmega(mass, k), 4, 1e-12, 'ω = √(k/m) = 4');
  approx(springPeriod(mass, k), Math.PI / 2, 1e-12, 'T = 2π/ω');

  // One period of ẍ = −ω²x by velocity Verlet, from one upward zero crossing
  // to the next. The library period is 2π/ω.
  const omega = 4;
  const steps = 200000;
  const dt = (2 * Math.PI) / omega / steps;
  let x = 0;
  let vel = omega;
  let t = 0;
  let prev = x;
  let measured = NaN;
  for (let i = 0; i < steps * 2; i++) {
    vel += -omega * omega * x * dt / 2;
    x += vel * dt;
    vel += -omega * omega * x * dt / 2;
    t += dt;
    if (i > steps / 4 && prev <= 0 && x > 0) {
      const frac = (0 - prev) / (x - prev);
      measured = t - dt + frac * dt;
      break;
    }
    prev = x;
  }
  approx(measured, (2 * Math.PI) / omega, 1e-8, 'period from integrating ẍ = −ω²x matches 2π/ω');

  const at = shm({ A: 3, omega: 2, phi: 0, t: 0 });
  approx(at.x, 3, 1e-12, 'at t = 0, x = A');
  approx(at.v, 0, 1e-12, 'at t = 0, v = 0');
  approx(at.a, -12, 1e-12, 'at t = 0, a = −ω² A');
  approx(shmEnergy(k, 3), springEnergy(k, 3), 1e-12, 'oscillator energy is the spring energy at full stretch');

  const L = 2.45;
  const g = 9.8;
  approx(physicalPendulumPeriod(inertiaPoint(mass, L), mass, L, g), pendulumPeriod(L, g), 1e-12,
    'a point mass on a string is a simple pendulum');
  const rod = physicalPendulumPeriod(inertiaRodEnd(mass, L), mass, L / 2, g);
  approx(rod, 2 * Math.PI * Math.sqrt((2 * L) / (3 * g)), 1e-12, 'a rod about its end swings as 2π √(2L/3g)');
}

console.log('\nGravitation');
{
  const M = 5.97e24;
  const m = 500;
  const r = 7e6;
  approx(gravityForce(M, m, r), m * gravityField(M, r), 1e-12, 'the force is the field times the test mass');

  const vEsc = escapeSpeed(M, r);
  const u = gravityEnergy(m, M, r);
  approx(kineticEnergy(m, vEsc) + u, 0, 1e-6 * Math.abs(u), 'escape speed puts the total energy at zero');

  const vCirc = circularOrbitSpeed(M, r);
  approx(vCirc * vCirc / r, gravityField(M, r), 1e-12, 'a circular orbit falls at the field strength');
  approx(circularOrbitPeriod(M, r), (2 * Math.PI * r) / vCirc, 1e-12, 'the period is one lap at the orbital speed');
  approx(circularOrbitEnergy(m, M, r), kineticEnergy(m, vCirc) + u, 1e-9, 'orbit energy is kinetic plus potential');
}

console.log('\nParticle kinetics');
{
  const g = 9.81;
  // A block that must slide: friction.js walks the regime, dynamics.js writes a = g sinθ − μ g cosθ.
  const mass = 3;
  const theta = 30;
  const slide = incline({ mass, thetaDeg: theta, mu: 0.15, g, motion: 'down' });
  const fr = inclineState({ W: mass * g, theta, mus: 0.2, muk: 0.15 });
  approx(slide.N, fr.N, 1e-12, 'incline normal matches the friction free-body');
  approx(slide.aDown, -fr.net / mass, 1e-12, 'downhill acceleration matches −net / m');

  // Hanging mass, known to descend. Independent equation, then both free-bodies' residuals.
  const block = 4;
  const hang = 6;
  const tow = hangingIncline({ block, hang, thetaDeg: 30, muk: 0.2, mus: 0.3, g, v0: 0 });
  const N = block * g * Math.cos(30 * DEG);
  const expectA = (hang * g - block * g * Math.sin(30 * DEG) - 0.2 * N) / (block + hang);
  approx(tow.a, expectA, 1e-12, 'accelerating tow matches ΣF = ma with kinetic friction');
  ok(tow.regime === 'kinetic', 'that tow is kinetic');
  const resHang = hang * g - tow.T - hang * tow.a;
  const resBlock = tow.T - block * g * Math.sin(30 * DEG) + tow.f - block * tow.a;
  approx(resHang, 0, 1e-12, 'hanging free-body residual is zero');
  approx(resBlock, 0, 1e-12, 'block free-body residual is zero');

  const held = hangingIncline({ block: 4, hang: 3, thetaDeg: 30, muk: 0.2, mus: 0.4, g, v0: 0 });
  approx(held.a, 0, 1e-12, 'a lighter hanging mass is held by static friction');
  approx(held.T, 3 * g, 1e-12, 'at rest the tension equals the hanging weight');

  // x–y solve for the bank, against the n–t formulas. +x toward the centre.
  function bankXY(m, radius, thetaDeg, speed) {
    const th = thetaDeg * DEG;
    const nx = Math.sin(th);
    const ny = Math.cos(th);
    const dx = Math.cos(th);
    const dy = -Math.sin(th);
    const bx = m * speed * speed / radius;
    const by = m * g;
    const detXY = nx * dy - dx * ny;
    return {
      N: (bx * dy - dx * by) / detXY,
      f: (nx * by - bx * ny) / detXY,
    };
  }
  const car = bankedCurve({ mass: 800, radius: 50, thetaDeg: 20, speed: 12, mu: 0.25, g });
  const xy = bankXY(800, 50, 20, 12);
  approx(car.N, xy.N, 1e-12, 'banked normal matches the x–y solve');
  approx(car.f, xy.f, 1e-12, 'banked friction matches the x–y solve');
  const design = bankedCurve({ mass: 800, radius: 50, thetaDeg: 20, speed: car.vDesign, mu: 0, g });
  approx(design.f, 0, 1e-9, 'the design speed needs no friction');
  approx(design.N, (800 * g) / Math.cos(20 * DEG), 1e-9, 'and the normal is mg / cosθ');
  const fast = bankedCurve({ mass: 800, radius: 50, thetaDeg: 30, speed: 0, mu: 0.1, g });
  const atMax = bankXY(800, 50, 30, fast.vMax);
  approx(Math.abs(atMax.f), 0.1 * atMax.N, 1e-9, 'at the maximum speed, friction is μN');
  const atMin = bankXY(800, 50, 30, fast.vMin);
  approx(atMin.f, -0.1 * atMin.N, 1e-9, 'at the minimum speed, friction is μN up the bank');

  // Loop speed by integrating a_t along the arc, against energy.
  function loopSpeed(radius, vb, phiDeg) {
    const phi = phiDeg * DEG;
    const steps = 4000;
    const dphi = phi / steps;
    let v = vb;
    for (let i = 0; i < steps; i++) {
      const mid = (i + 0.5) * dphi;
      const at = -g * Math.sin(mid);
      const next2 = v * v + 2 * at * radius * dphi;
      v = Math.sqrt(Math.max(0, next2));
    }
    return v;
  }
  const bead = verticalLoop({ mass: 0.5, radius: 0.4, speedBottom: 5, phiDeg: 180, g });
  approx(bead.speed, loopSpeed(0.4, 5, 180), 1e-6, 'loop speed matches integration of a_t');
  approx(bead.N, 0.5 * (bead.speed * bead.speed / 0.4 - g), 1e-12, 'at the top, N = m(v²/ρ − g)');
  const bottom = verticalLoop({ mass: 0.5, radius: 0.4, speedBottom: 5, phiDeg: 0, g });
  ok(bottom.N > bead.N, 'the normal force is larger at the bottom than at the top');

  const collar = springCollar({ mass: 2, k: 40, x: 0.15, thetaDeg: 0, g });
  approx(collar.a, -(springOmega(2, 40) ** 2) * 0.15, 1e-12, 'horizontal collar acceleration is −ω²x');
  const sloped = springCollar({ mass: 2, k: 30, x: 0.1, thetaDeg: 20, g });
  const u = { x: Math.cos(20 * DEG), y: -Math.sin(20 * DEG) };
  const weightForce = { x: 0, y: -2 * g };
  const springForce = { x: -30 * 0.1 * u.x, y: -30 * 0.1 * u.y };
  const along = (weightForce.x + springForce.x) * u.x + (weightForce.y + springForce.y) * u.y;
  approx(sloped.a, along / 2, 1e-12, 'sloped collar matches the force dotted onto the rod');
}

console.log('\nWork and energy');
{
  const g = 9.81;
  const direct = springWork(40, 0.5, 0.4);
  const via = collarPath({ mass: 2, k: 40, thetaDeg: 30, points: [0.5, 0.15, 0.4], v1: 0, mu: 0, g });
  approx(via.spring, direct, 1e-12, 'a detour does not change the spring work');
  approx(via.direct, direct, 1e-12, 'the end stretches give that same spring work');
  approx(via.friction, 0, 1e-12, 'a smooth rod takes no friction work');

  const rough = collarPath({ mass: 2, k: 40, thetaDeg: 30, points: [0.5, 0.15, 0.4], v1: 3, mu: 0.15, g });
  const straight = collarTrip({ mass: 2, k: 40, thetaDeg: 30, x1: 0.5, x2: 0.4, v1: 3, mu: 0.15, g });
  ok(Math.abs(rough.friction) > Math.abs(straight.friction) + 0.1, 'the longer slide takes more friction work');
  approx(rough.spring, straight.spring, 1e-12, 'friction does not change the spring work');

  function integratedSpeed({ mass, k, thetaDeg, points, v1, mu, g: grav }) {
    const steps = 4000;
    const sin = Math.sin(thetaDeg * DEG);
    const cos = Math.cos(thetaDeg * DEG);
    let v2 = v1 * v1;
    for (let leg = 0; leg < points.length - 1; leg++) {
      const x1 = points[leg];
      const x2 = points[leg + 1];
      const dir = Math.sign(x2 - x1) || 1;
      const dx = (x2 - x1) / steps;
      for (let i = 0; i < steps; i++) {
        const x = x1 + (i + 0.5) * dx;
        const a = grav * sin - (k / mass) * x - mu * grav * cos * dir;
        v2 += 2 * a * dx;
        if (v2 < -1e-8) return 0;
      }
    }
    return Math.sqrt(Math.max(0, v2));
  }
  const slide = { mass: 2, k: 80, thetaDeg: 30, points: [0.5, 0], v1: 0, mu: 0.2, g };
  const energySpeed = collarPath(slide).speed;
  approx(energySpeed, integratedSpeed(slide), 1e-6, 'collar speed matches integration along the rod');
  const fromParts = speedFromEnergy({
    mass: 2,
    k0: 0,
    u0: 0,
    u: 0,
    wnc: collarTrip({ mass: 2, k: 80, thetaDeg: 30, x1: 0.5, x2: 0, v1: 0, mu: 0.2, g }).spring
      + collarTrip({ mass: 2, k: 80, thetaDeg: 30, x1: 0.5, x2: 0, v1: 0, mu: 0.2, g }).gravity
      + collarTrip({ mass: 2, k: 80, thetaDeg: 30, x1: 0.5, x2: 0, v1: 0, mu: 0.2, g }).friction,
  });
  approx(energySpeed, fromParts, 1e-12, 'the same works through speedFromEnergy');

  let lo = 0;
  let hi = 2;
  const stopArgs = { mass: 3, k: 60, v: 4, mu: 0.15, g };
  while (collarTrip({ mass: 3, k: 60, thetaDeg: 0, x1: 0, x2: hi, v1: 4, mu: 0.15, g }).t2 > 0) hi *= 2;
  for (let i = 0; i < 50; i++) {
    const mid = 0.5 * (lo + hi);
    if (collarTrip({ mass: 3, k: 60, thetaDeg: 0, x1: 0, x2: mid, v1: 4, mu: 0.15, g }).t2 > 0) lo = mid;
    else hi = mid;
  }
  approx(springStop(stopArgs), 0.5 * (lo + hi), 1e-8, 'the stopping stretch matches an energy root');

  const spec = { mass: 1.5, g, k: 20, anchor: [0, 0], rest: 0 };
  const A = [0.2, 1];
  const B = [1.4, 0.4];
  const closed = conservativeWork(spec, A, B);
  const steps = 4000;
  let trap = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const x = A[0] + t * (B[0] - A[0]);
    const y = A[1] + t * (B[1] - A[1]);
    const dx = (B[0] - A[0]) / steps;
    const dy = (B[1] - A[1]) / steps;
    const len = Math.hypot(x, y);
    const sx = len > 1e-12 ? -spec.k * x : 0;
    const sy = len > 1e-12 ? -spec.k * y : 0;
    trap += sx * dx + (sy - spec.mass * g) * dy;
  }
  approx(closed, trap, 1e-6, 'conservative work matches the straight-line integral');
  approx(pathPotential({ ...spec, x: 0, y: 0 }), gravitationalEnergy(spec.mass, g, 0) + springEnergy(spec.k, 0), 1e-12, 'potential at the anchor is the rest energy');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
