/**
 * Polar components against numerical differentiation of x(t), y(t), and two scalings.
 * Run: node src/mechanics/polar-selftest.js
 */
import { polarComponents, polarForces, polarNumeric, straightPass } from './polar.js';

let fails = 0;
const close = (a, b, tol, what) => {
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  if (!ok) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

// A collar sliding out along a turning arm: r = 0.2 + 0.5t, θ = 2t + 0.5·0.8 t².
{
  const rOf = (t) => 0.2 + 0.5 * t;
  const thOf = (t) => 2 * t + 0.4 * t * t;
  for (const t of [0, 0.7, 1.5]) {
    const c = polarComponents({ r: rOf(t), rd: 0.5, rdd: 0, thd: 2 + 0.8 * t, thdd: 0.8 });
    const n = polarNumeric(rOf, thOf, t);
    close(c.vr, n.vr, 1e-6, `arm vr t=${t}`);
    close(c.vth, n.vth, 1e-6, `arm vth t=${t}`);
    close(c.ar, n.ar, 1e-4, `arm ar t=${t}`);
    close(c.ath, n.ath, 1e-4, `arm ath t=${t}`);
  }
}

// A cam follower: r = 0.3 + 0.05 cos θ, θ = 6t.
{
  const w = 6;
  const rOf = (t) => 0.3 + 0.05 * Math.cos(w * t);
  const thOf = (t) => w * t;
  for (const t of [0.1, 0.4]) {
    const th = w * t;
    const c = polarComponents({ r: rOf(t), rd: -0.05 * w * Math.sin(th), rdd: -0.05 * w * w * Math.cos(th), thd: w });
    const n = polarNumeric(rOf, thOf, t);
    close(c.ar, n.ar, 1e-4, `cam ar t=${t}`);
    close(c.ath, n.ath, 1e-4, `cam ath t=${t}`);
  }
}

// A car on a straight road past a radar: the acceleration is zero, r̈ is not.
{
  for (const t of [0, 1, 2.5]) {
    const p = straightPass({ d: 40, u: 25, x0: -60, t });
    const c = polarComponents(p);
    close(c.ar, 0, 1e-12, `straight a_r t=${t}`);
    close(c.ath, 0, 1e-12, `straight a_θ t=${t}`);
    close(c.v, 25, 1e-12, `straight speed t=${t}`);
    const n = polarNumeric((s) => straightPass({ d: 40, u: 25, x0: -60, t: s }).r, (s) => straightPass({ d: 40, u: 25, x0: -60, t: s }).th, t);
    close(n.ar, 0, 1e-4, `straight numeric a_r t=${t}`);
  }
  const closest = straightPass({ d: 40, u: 25, x0: 0, t: 0 });
  close(closest.rdd, (25 * 25) / 40, 1e-12, 'r̈ at the closest point is u²/d');
}

// Uniform circular motion: a_r = −v²/r.
{
  const c = polarComponents({ r: 2, thd: 3 });
  close(c.ar, -(6 * 6) / 2, 1e-12, 'circle a_r');
  close(c.ath, 0, 1e-12, 'circle a_θ');
}

// Scaling: double θ̇ at fixed r and ṙ. The centripetal part ×4, the 2ṙθ̇ part ×2.
{
  const one = polarComponents({ r: 0.5, rd: 0.4, thd: 3 });
  const two = polarComponents({ r: 0.5, rd: 0.4, thd: 6 });
  close(two.ar / one.ar, 4, 1e-12, 'a_r scales as θ̇²');
  close(two.ath / one.ath, 2, 1e-12, 'a_θ scales as θ̇');
}

// Forces are m times the components.
{
  const f = polarForces(2, { r: 0.5, rd: 0.4, thd: 3 });
  close(f.Fth, 2 * 2 * 0.4 * 3, 1e-12, 'F_θ = 2 m ṙ θ̇');
}

if (fails) {
  console.error(`polar selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('polar selftest: ok');
