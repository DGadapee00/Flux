/**
 * Second methods for thinwall.js.
 *   node src/mechanics/thinwall-selftest.js
 */
import { channel, iFlow, lippedChannel, openShearCentre } from './thinwall.js';

let passed = 0;
let failed = 0;
const ok = (c, name) => (c ? (passed += 1) : (failed += 1, console.error(`FAIL ${name}`)));
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

// Lipped channel: the closed form against the general open-section solver, and the plain channel.
{
  const t = 0.105;
  const h = 1.52;
  const b = 1.52;
  const d = 0.3225;
  const c = lippedChannel(1, b, h, d, t);
  // Web at x = 0, flanges toward +x, lips turned in: free end to free end.
  const pts = [[b, h / 2 - d], [b, h / 2], [0, h / 2], [0, -h / 2], [b, -h / 2], [b, -h / 2 + d]];
  const o = openShearCentre(pts, t, 1, 4000);
  approx(o.I, c.I, 1e-12, 'lipped: I by segments matches the closed form');
  approx(Math.abs(o.Fy), 1, 1e-6, 'lipped: the flow adds up to V');
  approx(Math.abs(o.Fx) + 1, 1, 1e-9, 'lipped: no net sideways force');
  approx(Math.abs(o.Qend) + 1, 1, 1e-9, 'lipped: Q returns to zero at the far free end');
  approx(-o.xs, c.e, 1e-6, 'lipped: the solver puts the shear centre e behind the web');
  ok(c.e > channel(1, b, h, t, t).e, 'lips push the shear centre farther out');
  const plain = openShearCentre([[b, h / 2], [0, h / 2], [0, -h / 2], [b, -h / 2]], t, 1, 4000);
  approx(-plain.xs, channel(1, b, h, t, t).e, 1e-6, 'no lips: back to 3b²t/(ht + 6bt)');
  approx(lippedChannel(1, b, h, 0, t).e, channel(1, b, h, t, t).e, 1e-12, 'd = 0 in the closed form gives the channel');
  approx(c.J, ((h + 2 * b + 2 * d) * t ** 3) / 3, 1e-12, 'open-wall J = Σ L t³/3');
  approx(openShearCentre(pts, 2 * t, 1, 400).xs, o.xs, 1e-3, 'e does not depend on a uniform t');
}

if (failed) {
  console.error(`thinwall-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`thinwall-selftest: ${passed} passed`);
