/**
 * The elevator's closed form against the free-body equations solved as a linear system, an
 * energy balance over the start of a run, and the balance point.
 * Run: node src/mechanics/hoist-selftest.js
 */
import { G } from './constants.js';
import { accelFrom, counterweight, hoist, hoistBySystem, runProfile } from './hoist.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

const m2 = counterweight(1000, 1000);
close(m2, 1450, 1e-12, 'counterweight at 45%');

// The closed form against Gaussian elimination, for loads and accelerations both ways.
for (const load of [0, 450, 1000]) {
  for (const a of [-1.2, 0, 0.5, 1.5]) {
    const spec = { m1: 1000 + load, m2, r: 0.32, I: 12 };
    const h = hoist({ ...spec, a });
    const s = hoistBySystem({ ...spec, M: h.M });
    close(s.a + 10, a + 10, 1e-12, `a back from M, load ${load}, a ${a}`);
    close(s.T1, h.T1, 1e-12, `T1, load ${load}, a ${a}`);
    close(s.T2, h.T2, 1e-12, `T2, load ${load}, a ${a}`);
    close(accelFrom({ ...spec, M: h.M }) + 10, a + 10, 1e-12, `accelFrom, load ${load}, a ${a}`);
  }
}

// Energy: from rest to v under a constant torque, the motor's work M θ is the kinetic energy of
// every body plus the change in potential energy.
{
  const spec = { m1: 2000, m2, r: 0.32, I: 12 };
  const a = 1;
  const v = 1.6;
  const { M } = hoist({ ...spec, a });
  const s = (v * v) / (2 * a);
  const work = (M * s) / spec.r;
  const T = 0.5 * (spec.m1 + spec.m2) * v * v + 0.5 * spec.I * (v / spec.r) ** 2;
  const V = (spec.m1 - spec.m2) * G * s;
  close(work, T + V, 1e-12, 'work and energy over the start');
}

// At the balance point the steady torque vanishes; accelerating torque scales with a.
{
  const spec = { m1: 1000 + 450, m2, r: 0.32, I: 12 };
  close(hoist({ ...spec, a: 0 }).M + 1, 1, 1e-12, 'balanced: no steady torque');
  close(hoist({ ...spec, a: 1 }).M / hoist({ ...spec, a: 0.5 }).M, 2, 1e-12, 'balanced: torque ∝ a');
}

// The run profile rises exactly h and stops.
{
  const p = runProfile({ a: 1, v: 1.6, h: 10 });
  close(p.at(p.total).y, 10, 1e-12, 'run reaches h');
  close(p.at(p.total - 1e-9).y, 10, 1e-6, 'run ends at rest at h');
  close(p.t1, 1.6, 1e-12, 'time to rated speed');
  const q = runProfile({ a: 1, v: 1.6, h: 2 });
  close(q.at(q.total - 1e-12).y, 2, 1e-9, 'short run reaches h');
}

if (fails) {
  console.error(`hoist selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('hoist selftest: ok');
