/**
 * The stopping pulse against RK4 on the force law, and the CPSC drop numbers.
 * Run: node src/mechanics/impact-pulse-selftest.js
 */
import { crushDepth, minDuration, stopPulse, stopPulseNumeric } from './impact-pulse.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

// CPSC 16 CFR 1203: a 5.0 kg drop assembly at 6.2 m/s on the flat anvil.
for (const shape of ['half-sine', 'square']) {
  for (const [tau, e] of [[0.006, 0.1], [0.001, 0.5], [0.012, 0]]) {
    const spec = { m: 5, v0: 6.2, e, tau, shape };
    const n = stopPulseNumeric(spec);
    close(n.vEnd + 6.2, e * 6.2 + 6.2, 1e-6, `${shape} τ=${tau}: rebound speed`);
    close(crushDepth(spec).crush, n.crush, 1e-5, `${shape} τ=${tau}: crush depth`);
  }
}

// The shortest pulse that keeps the peak at 300 g has exactly 300 g.
for (const shape of ['half-sine', 'square']) {
  const tau = minDuration({ v0: 6.2, e: 0.1, shape, limitG: 300 });
  close(stopPulse({ m: 5, v0: 6.2, e: 0.1, tau, shape }).gPeak, 300, 1e-12, `${shape}: 300 g at the shortest pulse`);
}

// A square pulse peaks lower than a half-sine of the same impulse and length, by π/2.
{
  const a = stopPulse({ m: 5, v0: 6.2, e: 0.1, tau: 0.006, shape: 'half-sine' });
  const b = stopPulse({ m: 5, v0: 6.2, e: 0.1, tau: 0.006, shape: 'square' });
  close(a.Fpk / b.Fpk, Math.PI / 2, 1e-12, 'half-sine peak / square peak');
}

if (fails) {
  console.error(`impact-pulse selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('impact-pulse selftest: ok');
