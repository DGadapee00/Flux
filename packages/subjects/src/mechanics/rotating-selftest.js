/**
 * Rotating axes against the geometry differentiated numerically, and against polar coordinates.
 * Run: node src/mechanics/rotating-selftest.js
 */
import { polarComponents } from './polar.js';
import { rotatingAxes, slottedRocker, slottedRockerNumeric } from './rotating.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};
const DEG = Math.PI / 180;

// The slotted rocker, closed form against the rocker angle differentiated in time.
for (const phi of [0, 30, 90, 150, 200, 270, 330]) {
  for (const [omega, alpha] of [[4, 0], [8, 0], [3, 5]]) {
    const spec = { r: 0.1, d: 0.25, phi: phi * DEG, omega, alpha };
    const c = slottedRocker(spec);
    const n = slottedRockerNumeric(spec);
    close(c.W, n.W, 1e-6, `Ω at φ=${phi}`);
    close(c.vRel, n.vRel, 1e-6, `v_rel at φ=${phi}`);
    close(c.Wd, n.Wd, 2e-4, `Ω̇ at φ=${phi}, ω=${omega}`);
    close(c.aRel, n.aRel, 2e-4, `a_rel at φ=${phi}, ω=${omega}`);
  }
}

// Pin at the top of its circle: its velocity is across the slot, so v_rel = 0, Ω = rω/(d + r), no Coriolis.
{
  const c = slottedRocker({ r: 0.1, d: 0.25, phi: 90 * DEG, omega: 4 });
  close(c.vRel, 0, 1e-12, 'top: v_rel');
  close(Math.abs(c.W), (0.1 * 4) / 0.35, 1e-12, 'top: Ω');
  close(c.coriolis, 0, 1e-12, 'top: Coriolis');
}

// Scaling at a steady crank: Ω goes as ω, Ω̇ as ω².
{
  const a = slottedRocker({ r: 0.1, d: 0.25, phi: 30 * DEG, omega: 4 });
  const b = slottedRocker({ r: 0.1, d: 0.25, phi: 30 * DEG, omega: 8 });
  close(b.W / a.W, 2, 1e-12, 'Ω ∝ ω');
  close(b.Wd / a.Wd, 4, 1e-12, 'Ω̇ ∝ ω²');
}

// With the origin fixed and r along x, rotating axes agree with polar coordinates.
{
  const rot = rotatingAxes({ W: 3, Wd: 2, r: [0.8, 0], vRel: [0.5, 0], aRel: [0.4, 0] });
  const pol = polarComponents({ r: 0.8, rd: 0.5, rdd: 0.4, thd: 3, thdd: 2 });
  close(rot.a[0], pol.ar, 1e-12, 'rotating = polar, radial');
  close(rot.a[1], pol.ath, 1e-12, 'rotating = polar, transverse');
  close(rot.terms.coriolis[1], 2 * 3 * 0.5, 1e-12, 'Coriolis 2Ωv_rel');
}

if (fails) {
  console.error(`rotating selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('rotating selftest: ok');
