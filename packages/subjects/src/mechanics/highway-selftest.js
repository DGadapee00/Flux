/**
 * The highway curve against the vector force balance of bankedCurve, and AASHTO's unit factor 15.
 * Run: node src/mechanics/highway-selftest.js
 */
import { M_PER_FT } from '../convert.js';
import { bankedCurve } from './dynamics.js';
import { MPH, aashtoFmax, frictionNeed, limitSpeed, minRadius, minRadiusFt } from './highway.js';

let fails = 0;
const close = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b)))) {
    fails++;
    console.error(`FAIL ${what}: ${a} vs ${b}`);
  }
};

// The published design radii follow from the formula: 50, 60, 70 mph with e = 8%.
close(minRadiusFt(60, 0.08, aashtoFmax(60)), 1200, 1e-12, '60 mph');
close(minRadiusFt(70, 0.08, aashtoFmax(70)), 4900 / 2.7, 1e-12, '70 mph');
close(minRadiusFt(50, 0.08, aashtoFmax(50)), 2500 / 3.3, 1e-12, '50 mph');
close(aashtoFmax(62.5), 0.115, 1e-12, 'f between table rows');

// The factor 15 is g and the mph-to-ft/s conversion: V²(mph)/15 ≈ v²(ft/s)/g(ft/s²).
{
  const v = 60 * MPH;
  const exactSI = (v * v) / (9.80665 * 0.2);
  close(minRadius(60, 0.08, 0.12).m, exactSI, 3e-3, 'AASHTO 15 against v²/(g(e + f))');
}

// The exact limit and the friction need against bankedCurve's force balance.
for (const [Rft, e, f, Vmph] of [[1200, 0.08, 0.12, 60], [758, 0.04, 0.14, 45], [1815, 0.1, 0.1, 75]]) {
  const R = Rft * M_PER_FT;
  const th = Math.atan(e) * (180 / Math.PI);
  const vLim = limitSpeed(R, e, f);
  close(bankedCurve({ mass: 1, radius: R, thetaDeg: th, mu: f }).vMax, vLim, 1e-9, `limit speed R=${Rft}`);
  const v = Vmph * MPH;
  const b = bankedCurve({ mass: 1, radius: R, thetaDeg: th, speed: v });
  close(frictionNeed(v, R, e), b.f / b.N, 1e-9, `friction need R=${Rft}`);
}

// At the design speed the exact limit sits just above it: the e f term is a small margin.
{
  const R = 1200 * M_PER_FT;
  const v = limitSpeed(R, 0.08, 0.12);
  if (!(v > 60 * MPH && v < 60.5 * MPH)) {
    fails++;
    console.error(`FAIL margin: ${v / MPH} mph`);
  }
}

if (fails) {
  console.error(`highway selftest: ${fails} failure(s)`);
  process.exit(1);
}
console.log('highway selftest: ok');
