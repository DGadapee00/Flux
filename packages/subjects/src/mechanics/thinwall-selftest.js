/**
 * Second methods for thinwall.js.
 *   node src/mechanics/thinwall-selftest.js
 */
import { channel, iFlow } from './thinwall.js';

let passed = 0;
let failed = 0;
function approx(got, want, tol, name) {
  const ok = Number.isFinite(got) && Math.abs(got - want) <= tol * Math.max(1e-12, Math.abs(want));
  if (ok) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name}: got ${got}, want ${want}`);
  }
}

// Channel: integrate the flange flow for F, and check the web's flow carries V.
{
  const V = 5000;
  const [b, h, t] = [0.05, 0.15, 0.003];
  const c = channel(V, b, h, t, t);
  approx(c.e, 0.0166667, 1e-5, 'channel e = 16.7 mm behind the web');
  const n = 20000;
  let F = 0;
  for (let i = 0; i < n; i++) {
    const s = ((i + 0.5) * b) / n;
    F += ((V * t * s * (h / 2)) / c.I) * (b / n);
  }
  approx(F, c.F, 1e-8, 'flange force by integrating q');
  approx((F * h) / V, c.e, 1e-8, 'shear centre from the moment of the flange forces');
  // The web's flow, q(y) = V Q(y)/I, integrated over the web, returns V.
  let Vw = 0;
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + ((i + 0.5) * h) / n;
    const Q = b * t * (h / 2) + (t * ((h / 2) ** 2 - y * y)) / 2;
    Vw += ((V * Q) / c.I) * (h / n);
  }
  approx(Vw, V, 1e-6, 'the web carries V');
  approx(channel(V, b, h, t, t).twist, V * c.e, 1e-12, 'loading through the web adds a twist V e');
  approx(channel(2 * V, b, h, t, t).e, c.e, 1e-12, 'e does not depend on V');
  approx(channel(V, 0, h, t, t).e, 0, 1, 'no flanges: the shear centre is on the web');
}

// I: flow is conserved where two flange halves meet the web, and the flanges carry no net vertical force.
{
  const V = 20e3;
  const s = iFlow(V, 0.12, 0.01, 0.006, 0.17);
  approx(s.qWebTop, 2 * s.qJoin, 1e-12, 'two flange halves feed the web');
  let Vw = 0;
  const n = 20000;
  const h = 0.17;
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + ((i + 0.5) * h) / n;
    const Q = 0.12 * 0.01 * (h / 2) + (0.006 * ((h / 2) ** 2 - y * y)) / 2;
    Vw += ((V * Q) / s.I) * (h / n);
  }
  approx(Vw, V, 1e-6, 'the thin-wall I web carries all of V');
  approx(iFlow(2 * V, 0.12, 0.01, 0.006, 0.17).tauFlange, 2 * s.tauFlange, 1e-12, 'double V, double the flange stress');
}

if (failed) {
  console.error(`thinwall-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`thinwall-selftest: ${passed} passed`);
