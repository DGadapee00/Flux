/**
 * The chain drive by tooth counts against the chordal average on the pitch polygon, and its scaling.
 * Run: node src/mechanics/drivetrain-selftest.js
 */
import { CHAIN_PITCH, cadenceFor, chordalChainSpeed, drive, pitchRadius, tyreDiameter } from './drivetrain.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

const D = tyreDiameter(0.622, 0.025);
close(D, 0.672, 1e-12, '25-622 tyre');

// The chain speed by tooth counts against the average along the polygon, on both sprockets.
for (const [Nf, Nr, cadence] of [[50, 11, 100], [34, 28, 80], [50, 17, 90], [34, 17, 90]]) {
  const d = drive({ cadence, Nf, Nr, D });
  close(chordalChainSpeed(Nf, d.wCrank), d.chain, 1e-6, `chain off the ring ${Nf}`);
  close(chordalChainSpeed(Nr, d.wWheel), d.chain, 1e-6, `chain onto the cog ${Nr}`);
  close(cadenceFor({ v: d.v, Nf, Nr, D }), cadence, 1e-12, `cadence back from speed ${Nf}/${Nr}`);
}

// The pitch radius tends to N p/(2π) for many teeth; an 11-tooth cog is 1.4% bigger.
close(pitchRadius(500), (500 * CHAIN_PITCH) / (2 * Math.PI), 1e-5, 'pitch radius, many teeth');
close(pitchRadius(11) / ((11 * CHAIN_PITCH) / (2 * Math.PI)), 1.0137, 1e-3, 'pitch radius, 11 teeth');

// The surge: off an 11-tooth cog the chain's speed swings by 1 − cos(π/11), 4%.
{
  const w = 10;
  const hi = chordalChainSpeed(11, w, { phi: 0 });
  const lo = chordalChainSpeed(11, w, { phi: Math.PI / 11 });
  close(1 - lo / hi, 1 - Math.cos(Math.PI / 11), 1e-12, 'chordal swing');
}

// Scaling: twice the cadence, twice every speed; the same ratio on other sprockets, the same bike speed.
{
  const a = drive({ cadence: 45, Nf: 50, Nr: 25, D });
  const b = drive({ cadence: 90, Nf: 50, Nr: 25, D });
  close(b.v / a.v, 2, 1e-12, 'speed with cadence');
  const c = drive({ cadence: 90, Nf: 34, Nr: 17, D });
  close(c.v, b.v, 1e-12, '50/25 and 34/17 match');
  close(b.chain / c.chain, 50 / 34, 1e-12, 'but the chain is faster on the big ring');
}

if (fails) {
  console.error(`drivetrain selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('drivetrain selftest: ok');
