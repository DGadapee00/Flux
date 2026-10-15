/**
 * Second methods for rigid-energy.js.
 *
 *   node src/mechanics/rigid-energy-selftest.js
 */
import { G } from './constants.js';
import { inertiaDisk, inertiaHoop, inertiaSphere } from './rotation.js';
import {
  ROLL_K,
  coupleWork,
  pinnedRelease,
  raceDown,
  rollingEnergy,
  slotRelease,
} from './rigid-energy.js';

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
    console.log(`  FAIL  ${name}: got ${got}, want ${want}`);
  }
}

function check(ok, name) {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
  }
}

const DEG = Math.PI / 180;

console.log('\nRolling race');
{
  const race = raceDown({ thetaDeg: 30, distance: 2, mass: 2, g: G });
  const sin = Math.sin(30 * DEG);
  const drop = G * 2 * sin;
  for (const shape of ['sphere', 'disk', 'hoop']) {
    const k = ROLL_K[shape];
    approx(race[shape].k, k, 1e-15, `${shape} k is ${k}`);
    approx(race[shape].v, Math.sqrt((2 * drop) / (1 + k)), 1e-12, `${shape} finish speed from energy`);
    approx(race[shape].a, (G * sin) / (1 + k), 1e-12, `${shape} acceleration is the Ch 17 value`);
  }
  approx(race.gap, 0, 1e-9, 'integrating the acceleration meets the energy speed');
  check(race.winner === 'sphere', 'the sphere finishes first');
  check(race.sphere.t < race.disk.t && race.disk.t < race.hoop.t, 'sphere, then disk, then hoop');
  const heavy = raceDown({ thetaDeg: 30, distance: 2, mass: 9, g: G });
  const wide = raceDown({ thetaDeg: 30, distance: 2, mass: 2, g: G });
  approx(heavy.sphere.v, race.sphere.v, 1e-12, 'mass cancels');
  approx(wide.disk.v, race.disk.v, 1e-12, 'the same incline gives the same disk speed');
  approx(race.energy, 2 * drop, 1e-12, 'the lost height is the kinetic energy at the bottom');
  approx(race.sphere.v, Math.sqrt(drop / 0.7), 1e-12, 'a sphere divides by 7/5');
}

console.log('\nRolling kinetic energy');
{
  const mass = 2;
  const radius = 0.25;
  const speed = 3;
  const disk = rollingEnergy({ mass, radius, I: inertiaDisk(mass, radius), speed });
  approx(disk.trans, 9, 1e-12, 'translational part is 9 J');
  approx(disk.rot, 4.5, 1e-12, 'a disk spins with half of that');
  approx(disk.total, 13.5, 1e-12, 'total is 13.5 J');
  approx(disk.gap, 0, 1e-12, 'the contact axis gives the same total');
  const hoop = rollingEnergy({ mass, radius, I: inertiaHoop(mass, radius), speed });
  approx(hoop.rot, hoop.trans, 1e-12, 'a hoop splits the energy in half');
  const sphere = rollingEnergy({ mass, radius, I: inertiaSphere(mass, radius), speed });
  approx(sphere.rot / sphere.trans, 0.4, 1e-12, 'a sphere puts 2/5 of the translational part into spin');
}

console.log('\nPinned bar');
{
  const plain = pinnedRelease({ mass: 4, length: 2, theta1Deg: 90, theta2Deg: 0, g: G });
  const omega = Math.sqrt((3 * G) / 2);
  approx(plain.omega, omega, 1e-6, 'a horizontal bar reaches the bottom at sqrt(3g/L)');
  approx(plain.vG, omega, 1e-6, 'the centre is one metre from the pin');
  approx(plain.T, 4 * G, 1e-9, 'the kinetic energy equals the lost height');
  approx(plain.gap, 0, 1e-5, 'the equation of motion meets the energy speed');
  check(plain.reaches, 'the plain bar reaches the bottom');
  const wound = pinnedRelease({ mass: 4, length: 2, theta1Deg: 90, theta2Deg: 0, kappa: 15, restDeg: 0, g: G });
  const spring = 0.5 * 15 * (Math.PI / 2) ** 2;
  approx(wound.work, spring, 1e-12, 'the couple does ½κ(π/2)² of work');
  approx(wound.T, 4 * G + spring, 1e-8, 'the spring adds its stored energy');
  approx(wound.gap, 0, 1e-4, 'the wound bar integration meets the energy speed');
  check(wound.omega > plain.omega, 'unwinding the spring speeds the bar');
  const stuck = pinnedRelease({ mass: 1, length: 0.4, theta1Deg: 20, theta2Deg: 160, kappa: 0, g: G });
  check(!stuck.reaches && stuck.omega === 0, 'a bar released near the bottom does not climb past the top');
}

console.log('\nRod in slots');
{
  const open = slotRelease({ mass: 3, length: 1.5, theta1Deg: 60, theta2Deg: 30, g: G });
  const expect = Math.sqrt(((3 * G) / 1.5) * (Math.sin(60 * DEG) - Math.sin(30 * DEG)));
  approx(open.omega, expect, 1e-6, 'slot rod speed from the height of G');
  approx(open.Iic, 3 * 1.5 * 1.5 / 3, 1e-12, 'I about the instantaneous centre is mL²/3');
  approx(open.gap, 0, 1e-5, 'integrating the slot equation meets ½ I_IC ω²');
  approx(open.TG, open.TIC, 1e-12, 'centre-plus-translation matches the instantaneous centre');
  const pushed = slotRelease({ mass: 3, length: 1.5, theta1Deg: 60, theta2Deg: 30, k: 40, rest: 1.5, g: G });
  check(pushed.reaches && pushed.omega > open.omega, 'a compressed spring speeds the fall');
  approx(pushed.gap, 0, 1e-4, 'the sprung rod integration meets the energy speed');
  const uphill = slotRelease({ mass: 3, length: 1.5, theta1Deg: 30, theta2Deg: 70, k: 0, g: G });
  check(!uphill.reaches, 'the rod does not climb on its own');
}

console.log('\nCouple');
{
  const row = coupleWork({ kappa: 15, theta1Deg: 90, theta2Deg: 0, restDeg: 0 });
  approx(row.work, 0.5 * 15 * (Math.PI / 2) ** 2, 1e-12, 'closed work of the couple');
  approx(row.gap, 0, 1e-9, 'Simpson matches the closed work');
}

console.log(failed ? `\n${failed} failed, ${passed} passed` : `\n${passed} passed`);
if (failed) process.exit(1);
