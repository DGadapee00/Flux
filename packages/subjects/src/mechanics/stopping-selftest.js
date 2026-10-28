/**
 * The stopping distance against AASHTO's printed formulas, a time-stepped stop, and its scaling.
 * Run: node src/mechanics/stopping-selftest.js
 */
import { aashtoBrakingOnGrade, aashtoSSD, stepStop, stopDistance } from './stopping.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

// AASHTO's rounded factors 1.47 and 1.075 against the exact 22/15 and (22/15)²/2.
for (const V of [30, 45, 60, 70]) close(stopDistance({ Vmph: V }).total, aashtoSSD(V), 2e-3, `level SSD at ${V} mph`);
close(aashtoSSD(60), 566.0, 1e-3, 'AASHTO at 60 mph, 566 ft');
close(aashtoSSD(30), 196.7, 1e-3, 'AASHTO at 30 mph, 196.7 ft');

// On a grade, AASHTO takes cos θ ≈ 1 and sin θ ≈ G; within a percent up to 9%.
for (const G of [-0.09, -0.06, -0.03, 0.03, 0.06, 0.09]) {
  close(stopDistance({ Vmph: 60, grade: G }).braking, aashtoBrakingOnGrade(60, 11.2, G), 1e-2, `braking at G = ${G}`);
}

// The time-stepped stop matches the work–energy distance.
for (const spec of [{ Vmph: 60 }, { Vmph: 30, t: 1.5 }, { Vmph: 70, grade: -0.06, a: 9 }, { Vmph: 45, grade: 0.05 }]) {
  const e = stopDistance(spec);
  const n = stepStop(spec);
  close(n.braking, e.braking, 1e-6, `stepped braking ${JSON.stringify(spec)}`);
  close(n.total, e.total, 1e-6, `stepped total ${JSON.stringify(spec)}`);
}

// Scaling: twice the speed, twice the reaction distance and four times the braking distance.
{
  const a = stopDistance({ Vmph: 30 });
  const b = stopDistance({ Vmph: 60 });
  close(b.reaction / a.reaction, 2, 1e-12, 'reaction scales with V');
  close(b.braking / a.braking, 4, 1e-12, 'braking scales with V²');
}

// A grade steep enough downhill leaves the brakes unable to stop the car.
if (stopDistance({ Vmph: 30, a: 3, grade: -0.12 }).braking !== Infinity) {
  fails++;
  console.error('FAIL a runaway on a steep downgrade should never stop');
}

if (fails) {
  console.error(`stopping selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('stopping selftest: ok');
