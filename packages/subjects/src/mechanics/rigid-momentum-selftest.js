/**
 * Rigid-body impulse and momentum against methods that assume no conservation law.
 * Run: node src/mechanics/rigid-momentum-selftest.js
 */
import { batHit, solveLinear, spinChange, spinChangeByForces, strikeBar, strikeBarByImpulses } from './rigid-momentum.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

// Spin: conservation against forces integrated in time.
for (const [I0, m, r1, r2, w1] of [[2, 2, 0.8, 0.2, 3], [3, 3, 0.7, 0.15, 2], [0.5, 1, 0.2, 0.6, 5]]) {
  const c = spinChange({ I0, m, r1, r2, w1 });
  const f = spinChangeByForces({ I0, m, r1, r2, w1 });
  close(f.w2, c.w2, 1e-8, `spin ω2, r ${r1}→${r2}`);
  close(c.I2 * c.w2, c.I1 * w1, 1e-12, 'H kept');
}
// Pulling in raises the kinetic energy by exactly the ratio of the inertias.
{
  const c = spinChange({ I0: 2, m: 2, r1: 0.8, r2: 0.2, w1: 3 });
  close(c.T2 / c.T1, c.I1 / c.I2, 1e-12, 'T2/T1 = I1/I2');
}

// Pinned bar: H about the pin against the impulse equations with the pin's impulse unknown.
for (const [d, e] of [[0.5, 0], [1.0, 0.5], [0.8, 1], [1.2, 0.3]]) {
  const spec = { M: 3, L: 1.2, m: 0.5, u: 6, d, e };
  const c = strikeBar({ ...spec, pinned: true });
  const k = strikeBarByImpulses(spec);
  close(k.w, c.w, 1e-12, `pinned ω, d=${d}`);
  close(k.v, c.v, 1e-12, `pinned v, d=${d}`);
  close(k.J, c.J, 1e-12, `pin impulse, d=${d}`);
}
// The centre of percussion: struck at 2L/3, the pin feels nothing.
close(strikeBar({ M: 3, L: 1.2, m: 0.5, u: 6, d: 0.8, e: 0.4 }).J, 0, 1e-12, 'no pin impulse at 2L/3');
// e = 0: the ball and the struck point leave together.
{
  const c = strikeBar({ M: 3, L: 1.2, m: 0.5, u: 6, d: 1.2, e: 0 });
  close(c.v, c.w * 1.2, 1e-12, 'plastic strike');
}

// Free bar: linear momentum, and angular momentum about the original contact point, are kept.
{
  const M = 2;
  const L = 1;
  const m = 0.3;
  const u = 5;
  const d = 0.1;
  const c = strikeBar({ M, L, m, u, d, e: 0.6, pinned: false });
  close(m * c.v + M * c.vG, m * u, 1e-12, 'free: linear momentum');
  // About a fixed point at the bar's centre: before, m u (d − L/2); after, m v (d − L/2) + I_G ω.
  close(m * c.v * (d - L / 2) + c.IG * c.w, m * u * (d - L / 2), 1e-12, 'free: angular momentum about G');
  const k = strikeBarByImpulses({ M, L, m, u, d, e: 0.6, pinned: false });
  close(k.vG, c.vG, 1e-12, 'free: v_G against the linear system');
  close(k.w, c.w, 1e-12, 'free: ω against the linear system');
  // Struck at the centre, it does not spin.
  close(strikeBar({ M, L, m, u, d: 0.5, e: 0.6, pinned: false }).w, 0, 1e-12, 'free: central strike');
}

// The bat: the hands' impulse vanishes at the centre of percussion, and against a linear system.
{
  const M = 0.88;
  const L = 0.84;
  const I = (M * L * L) / 3;
  const xbar = L / 2;
  const base = { I, M, xbar, m: 0.145, u: 40, w0: 50, e: 0.5 };
  close(batHit({ ...base, d: I / (M * xbar) }).J, 0, 1e-12, 'bat: no sting at the centre of percussion');
  for (const d of [0.45, 0.6, 0.8]) {
    const c = batHit({ ...base, d });
    // Unknowns [v, w1, P, J]: ball m(v + u) = P; bat linear M x̄ (w1 − w0) = −P + J; bat about the hands
    // I (w1 − w0) = −P d; restitution v − w1 d = e (w0 d + u).
    const [v, w1, , J] = solveLinear(
      [
        [base.m, 0, -1, 0],
        [0, M * xbar, 1, -1],
        [0, I, d, 0],
        [1, -d, 0, 0],
      ],
      [-base.m * base.u, M * xbar * base.w0, I * base.w0, base.e * (base.w0 * d + base.u)],
    );
    close(c.v, v, 1e-12, `bat exit speed, d=${d}`);
    close(c.w1, w1, 1e-12, `bat ω after, d=${d}`);
    close(c.J, J, 1e-10, `bat hands' impulse, d=${d}`);
  }
}

if (fails) {
  console.error(`rigid-momentum selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('rigid-momentum selftest: ok');
