/**
 * The pinned body at any pose against barPin and platePin, and its swing against energy.
 * Run: node src/mechanics/pinned-selftest.js
 */
import { barPin, platePin } from './inertia.js';
import { pinnedAt, swing } from './pinned.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};
const G = 9.81;

// A bar pinned at one end: the general form against barPin, at several poses and spins.
for (const [th, w] of [[90, 0], [30, 1.5], [0, 3.8], [135, 0.7]]) {
  const m = 4;
  const L = 2;
  const b = barPin({ mass: m, length: L, thetaDeg: th, omega: w });
  const p = pinnedAt({ mass: m, IO: (m * L * L) / 3, r: [b.rx, b.ry], omega: w });
  close(p.alpha + 100, b.alpha + 100, 1e-12, `α bar ${th}`);
  close(p.Ox + 100, b.Ox + 100, 1e-12, `Ox bar ${th}`);
  close(p.Oy + 100, b.Oy + 100, 1e-12, `Oy bar ${th}`);
}

// A square plate pinned at a corner, released from rest: against platePin.
{
  const m = 2;
  const s = 0.4;
  const q = platePin({ mass: m, width: s, height: s });
  const p = pinnedAt({ mass: m, IO: q.IO, r: [s / 2, s / 2] });
  close(p.Ox, q.Ox, 1e-12, 'Ox plate');
  close(p.Oy, q.Oy, 1e-12, 'Oy plate');
}

// The swing keeps energy: ½ I_O ω² + m g y_G stays at its release value.
{
  const m = 4;
  const L = 2;
  const IO = (m * L * L) / 3;
  const s = swing({ mass: m, IO, r0: [1, 0], tEnd: 4 });
  const E0 = 0;
  for (const t of [0.3, 0.9, 1.7, 3.2]) {
    const q = s.at(t);
    close(0.5 * IO * q.omega ** 2 + m * G * q.r[1] + 100, E0 + 100, 1e-6, `energy at ${t} s`);
  }
  // At the bottom, the speed from energy: ω² = 3g/L for a bar released horizontal.
  let best = 0;
  for (let t = 0; t < 2; t += 0.001) best = Math.max(best, Math.abs(s.at(t).omega));
  close(best, Math.sqrt((3 * G) / L), 1e-4, 'ω at the bottom');
}

if (fails) {
  console.error(`pinned selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('pinned selftest: ok');
