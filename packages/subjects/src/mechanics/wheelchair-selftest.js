/**
 * The wheelchair's run down a ramp by work and energy, against Newton–Euler stepped in time,
 * and its scaling. Run: node src/mechanics/wheelchair-selftest.js
 */
import { M_PER_IN } from '../convert.js';
import { effectiveMass, rollDown, rollDownStepped } from './wheelchair.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

const R = 12 * M_PER_IN;
const wheels = [
  { n: 2, m: 1.2, R, k: 0.9 * R },
  { n: 2, m: 0.3, R: 3 * M_PER_IN, k: (3 * M_PER_IN) / Math.SQRT2 },
];
const base = { m: 95, wheels, H: 30 * M_PER_IN, slope: 1 / 12 };

close(effectiveMass(95, wheels), 95 + 2 * 1.2 * 0.81 + 2 * 0.3 * 0.5, 1e-12, 'effective mass');

// Energy against the stepped Newton–Euler run, with and without rolling resistance.
for (const spec of [base, { ...base, c: 0.01 }, { ...base, slope: 1 / 8 }, { ...base, H: 0.3, c: 0.02 }]) {
  const e = rollDown(spec);
  const n = rollDownStepped(spec);
  close(n.v, e.v, 1e-9, `speed ${JSON.stringify({ H: spec.H, s: spec.slope, c: spec.c })}`);
  close(n.t, e.t, 1e-9, `time ${JSON.stringify({ H: spec.H, s: spec.slope, c: spec.c })}`);
  // The energy books balance: the weight's work less the resistance is every body's kinetic energy.
  close(e.Ttrans + e.Trot, e.drop - e.lost, 1e-12, 'energy balance');
}

// Without resistance, only the rise matters: a steeper ramp gives the same speed, sooner.
{
  const a = rollDown(base);
  const b = rollDown({ ...base, slope: 1 / 8 });
  close(b.v, a.v, 1e-12, 'same rise, same speed');
  if (!(b.t < a.t)) {
    fails++;
    console.error('FAIL a steeper ramp should be quicker');
  }
  // Half the rise, half the kinetic energy.
  close(rollDown({ ...base, H: base.H / 2 }).Ttrans / a.Ttrans, 0.5, 1e-12, 'kinetic energy ∝ H');
}

// Rolling resistance stops the chair on a ramp where c ≥ tan θ.
if (rollDown({ ...base, c: 0.1 }).v !== 0) {
  fails++;
  console.error('FAIL c above the slope should hold the chair');
}

if (fails) {
  console.error(`wheelchair selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('wheelchair selftest: ok');
