/**
 * The block and tackle against a stiff rope integrated in time (no constraint assumed), and against
 * the work–energy balance. Run: node src/mechanics/pulley-selftest.js
 */
import { tackle, tackleSpeed, tackleStiffRope } from './pulley.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

for (const [mA, mB, n, muk] of [[4, 2, 1, 0], [4, 6, 2, 0.2], [2, 10, 3, 0.3], [5, 3, 2, 0]]) {
  const r = tackle({ mA, mB, n, mus: muk, muk });
  const t = 0.4;
  const stiff = tackleStiffRope({ mA, mB, n, f: r.f, t });
  close(stiff.vB, r.aB * t, 3e-3, `stiff rope v_B, n=${n}`);
  close(stiff.vA, n * r.aB * t, 3e-3, `stiff rope v_A = n v_B, n=${n}`);
  const h = 0.5 * r.aB * t * t;
  const e = tackleSpeed({ mA, mB, n, f: r.f, h });
  close(e.vB, r.aB * t, 1e-12, `work-energy v_B, n=${n}`);
  close(r.T * n + mB * r.aB, mB * 9.81, 1e-12, `load equation, n=${n}`);
}

// n = 1 with no friction is a table-top Atwood: a = m_B g / (m_A + m_B).
close(tackle({ mA: 3, mB: 1 }).aB, 9.81 / 4, 1e-12, 'n = 1');
// Scaling: the block counts n² times its mass.
close(tackle({ mA: 2, mB: 4, n: 2 }).mEff, 4 + 4 * 2, 1e-12, 'effective mass');
// A load the friction can hold does not move, and the rope carries its share of the weight.
const held = tackle({ mA: 10, mB: 2, n: 2, mus: 0.3, muk: 0.2 });
close(held.aB, 0, 1e-12, 'held');
close(held.T, (2 * 9.81) / 2, 1e-12, 'held tension');

if (fails) {
  console.error(`pulley selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('pulley selftest: ok');
