/**
 * Second methods for inertia.js. The integrals are not the closed forms, and the
 * pin residual is not the moment about the pin.
 *
 *   node src/mechanics/inertia-selftest.js
 */
import { integral2, integralSph } from '../math/quadrature.js';
import { G } from './constants.js';
import {
  barPin,
  centralInertia,
  diskHoleIntegral,
  diskInertiaIntegral,
  diskWithHole,
  gyrationRadius,
  hoopInertiaIntegral,
  inertiaPlate,
  plateDiskInertia,
  plateInertiaIntegral,
  platePin,
  rodAboutAxis,
  rodInertiaIntegral,
  rollOrSlip,
  shapeMoments,
  sphereInertiaIntegral,
} from './inertia.js';
import {
  inertiaDisk,
  inertiaHoop,
  inertiaRodCenter,
  inertiaRodEnd,
  inertiaSphere,
  parallelAxisMass,
  rollingIncline,
} from './rotation.js';

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

console.log('\nMass moments');
{
  const m = 6;
  const L = 2;
  const rod = rodAboutAxis(m, L, L / 2);
  approx(rod.center, 2, 1e-12, 'a 6 kg rod of length 2 m has I_G = 2');
  approx(rod.end, 8, 1e-12, 'the same rod about one end has I = 8');
  approx(rod.I, rod.end, 1e-12, 'offset L/2 is the end axis');
  approx(rod.end, 4 * rod.center, 1e-12, 'the end moment is four times the centre moment');
  approx(rod.gap, 0, 1e-12, 'integrating x² dm along the rod matches the end moment');
  approx(rodInertiaIntegral(m, -1, 1, 0.3), parallelAxisMass(inertiaRodCenter(m, L), m, 0.3), 1e-12,
    'a shifted axis matches the parallel-axis theorem');

  const R = 0.5;
  const shapes = shapeMoments(2, R);
  approx(shapes.hoop, 0.5, 1e-12, 'the hoop is mR² = 0.5');
  approx(shapes.disk, 0.25, 1e-12, 'the disk is half the hoop');
  approx(shapes.sphere, 0.2, 1e-12, 'the sphere is (2/5)mR² = 0.2');
  approx(shapes.hoop, 2 * shapes.disk, 1e-12, 'same mass and radius: the hoop is twice the disk');
  approx(shapes.gap, 0, 1e-8, 'integrals match the hoop, the disk, and the sphere');
  if (shapes.which === 'hoop') {
    passed += 1;
    console.log('  PASS  the hoop has the largest moment');
  } else {
    failed += 1;
    console.log(`  FAIL  the hoop has the largest moment: got ${shapes.which}`);
  }

  const rho = 2 / ((4 / 3) * Math.PI * R * R * R);
  const sph = integralSph((x, y) => (x * x + y * y) * rho, R, { n: 20 });
  approx(sph, inertiaSphere(2, R), 2e-3, 'a spherical-coordinate integral matches (2/5)mR²');

  const plate = inertiaPlate(5, 0.6, 0.4);
  approx(plate, 5 * (0.36 + 0.16) / 12, 1e-12, 'the plate formula is m(w²+h²)/12');
  const yx = integral2(
    (x, y) => (x * x + y * y) * (5 / (0.6 * 0.4)),
    -0.3,
    0.3,
    -0.2,
    0.2,
    { n: 16, order: 'yx' },
  );
  approx(plateInertiaIntegral(5, 0.6, 0.4), yx, 1e-12, 'the two Fubini orders agree on the plate');
  approx(gyrationRadius(plate, 5), Math.sqrt(plate / 5), 1e-12, 'k_G is the square root of I/m');

  const built = plateDiskInertia({
    plateM: 5, plateW: 0.6, plateH: 0.4, diskM: 2, diskR: 0.1, diskX: 0.2,
  });
  approx(built.I, plate + 0.01 + 0.08, 1e-12, 'plate plus disk is the sum of the parallel-axis parts');
  approx(built.parallel, 0.08, 1e-12, 'the disk contributes m d² = 0.08');
  approx(built.gap, 0, 1e-6, 'integrating the plate and the disk matches that sum');
  const home = plateDiskInertia({
    plateM: 5, plateW: 0.6, plateH: 0.4, diskM: 2, diskR: 0.1, diskX: 0,
  });
  approx(built.I - home.I, 0.08, 1e-12, 'sliding the disk out adds m d² and no mass');

  const hole = diskWithHole({ mass: 12, radius: 0.3, holeRadius: 0.1, holeOffset: 0.12 });
  const removed = 12 / 9;
  const hand = inertiaDisk(12, 0.3) - parallelAxisMass(inertiaDisk(removed, 0.1), removed, 0.12);
  approx(hole.I, hand, 1e-12, 'the hole is the full disk minus the parallel-axis piece');
  approx(diskHoleIntegral({ mass: 12, radius: 0.3, holeRadius: 0.1, holeOffset: 0.12 }), hole.I, 1e-5,
    'integrating around the hole matches the subtraction');
  approx(diskInertiaIntegral(3, 0.4), inertiaDisk(3, 0.4), 1e-12, 'a centred disk integrates to (1/2)mR²');
  approx(hoopInertiaIntegral(3, 0.4), inertiaHoop(3, 0.4), 1e-12, 'a hoop integrates to mR²');
  approx(sphereInertiaIntegral(3, 0.4), inertiaSphere(3, 0.4), 1e-9, 'stacking disks integrates to (2/5)mR²');
  approx(centralInertia('disk', 3, 0.4), inertiaDisk(3, 0.4), 1e-12, 'a disk selects (1/2)mR²');
  approx(centralInertia('hoop', 3, 0.4), inertiaHoop(3, 0.4), 1e-12, 'a hoop selects mR²');
  approx(centralInertia('sphere', 3, 0.4), inertiaSphere(3, 0.4), 1e-12, 'a sphere selects (2/5)mR²');
}

console.log('\nPinned bar and plate');
{
  const level = barPin({ mass: 4, length: 2, thetaDeg: 90, g: 9.81 });
  approx(level.Ox, 0, 1e-12, 'a horizontal bar has no horizontal pin force at release');
  approx(level.Oy, 9.81, 1e-12, 'the vertical pin force is mg/4');
  approx(level.pin, 9.81, 1e-12, 'the pin force magnitude is mg/4');
  approx(level.ratio, 0.25, 1e-12, 'that is a quarter of the weight');
  approx(level.alpha, -3 * 9.81 / 4, 1e-12, 'α = −3g/(2L)');
  approx(level.gap, 0, 1e-12, 'moments about G reproduce the pin solution');

  const hung = barPin({ mass: 4, length: 2, thetaDeg: 0, g: 9.81 });
  approx(hung.alpha, 0, 1e-12, 'a bar hanging straight down has no angular acceleration');
  approx(hung.pin, 4 * 9.81, 1e-12, 'the pin holds the weight');
  approx(hung.gap, 0, 1e-12, 'the hanging bar still closes the moment about G');

  const spun = barPin({ mass: 3, length: 1.2, thetaDeg: 40, omega: 2.5, g: 9.81 });
  approx(spun.gap, 0, 1e-12, 'a moving bar closes both the component form and the moment about G');

  const square = platePin({ mass: 2, width: 0.4, height: 0.4, g: 9.81 });
  approx(square.Ox, 2 * 9.81 * 3 / 8, 1e-12, 'a square plate puts 3mg/8 on the horizontal pin component');
  approx(square.Oy, 2 * 9.81 * 5 / 8, 1e-12, 'and 5mg/8 on the vertical component');
  approx(square.gap, 0, 1e-12, 'the plate moment about G matches I_G α');

  const strip = platePin({ mass: 4, width: 2, height: 0, g: 9.81 });
  approx(strip.Oy, level.Oy, 1e-12, 'a plate of zero height is the horizontal bar');
  approx(strip.Ox, 0, 1e-12, 'and it has the same zero horizontal reaction');
}

console.log('\nRoll or slip');
{
  const m = 2;
  const radius = 0.25;
  const disk = rollOrSlip({
    mass: m, radius, I: inertiaDisk(m, radius), thetaDeg: 30, mu: 0.3, g: 9.81,
  });
  const known = rollingIncline({ mass: m, radius, I: inertiaDisk(m, radius), thetaDeg: 30, g: 9.81 });
  approx(disk.a, 9.81 / 3, 1e-12, 'a disk at 30° accelerates at g/3');
  approx(disk.a, known.a, 1e-12, 'that acceleration is the rolling-incline result');
  approx(disk.f, 9.81 / 3, 1e-12, 'the friction on this disk is also g/3 newtons');
  approx(disk.mode === 'roll' ? 1 : 0, 1, 1e-12, 'μ = 0.3 is enough for the disk to roll');
  approx(disk.gap, 0, 1e-12, 'energy and the two friction expressions agree');
  approx(disk.vKin, Math.sqrt(2 * disk.a), 1e-12, 'constant acceleration gives the speed after 1 m');

  const hoop = rollOrSlip({
    mass: m, radius, I: inertiaHoop(m, radius), thetaDeg: 30, mu: 0.15, g: 9.81,
  });
  const cos = Math.cos(30 * Math.PI / 180);
  const aSlip = 9.81 * (0.5 - 0.15 * cos);
  approx(hoop.mode === 'slip' ? 1 : 0, 1, 1e-12, 'μ = 0.15 is not enough for the hoop');
  approx(hoop.a, aSlip, 1e-12, 'slipping acceleration is g(sinθ − μ cosθ)');
  approx(hoop.f, 0.15 * m * 9.81 * cos, 1e-12, 'slipping friction is μN');
  approx(hoop.gap, 0, 1e-12, 'the work of friction accounts for the energy');

  const sphere = rollOrSlip({
    mass: m, radius, I: inertiaSphere(m, radius), thetaDeg: 30, mu: 0.3, g: 9.81,
  });
  approx(sphere.a, (5 / 7) * 9.81 * 0.5, 1e-12, 'a sphere rolls at (5/7)g sinθ');
  approx(sphere.mode === 'roll' ? 1 : 0, 1, 1e-12, 'μ = 0.3 rolls the sphere');
  approx(sphere.gap, 0, 1e-12, 'the sphere energy check closes');

  const edge = rollOrSlip({
    mass: m, radius, I: inertiaDisk(m, radius), thetaDeg: 30, mu: disk.muMin, g: 9.81,
  });
  approx(edge.mode === 'roll' ? 1 : 0, 1, 1e-12, 'friction exactly at the limit still rolls');

  const gentle = rollOrSlip({
    mass: 1, radius: 0.2, I: inertiaDisk(1, 0.2), thetaDeg: 10, mu: 0.05, g: G,
  });
  approx(gentle.mode === 'slip' ? 1 : 0, 1, 1e-12, 'a gentle incline can still slip a disk');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
