/**
 * The space environment's models: orbital decay by Dawson's integral against Runge–Kutta in time,
 * the model atmosphere against the U.S. Standard Atmosphere 1976, and memory upsets by the Poisson
 * closed form against the three-state chain.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { dawson, decayChecked, density, exoTemp, lifetimeClosed, scaleHeight } from '../src/mechanics/orbitdecay.js';
import { doubleShare, doubleShareChain, upsetsChecked } from '../src/em/upsets.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('Dawson’s integral against Simpson’s rule on e^(s²)', () => {
  for (const x of [0.5, 1, 2, 3.5, 4.5, 6]) {
    const n = 4000;
    const h = x / n;
    let s = 0;
    for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.exp((i * h) ** 2 - x * x);
    close(dawson(x), (s * h) / 3, 1e-9, `D(${x})`);
  }
});

test('the model atmosphere at F10.7 = 147 is within 23% of the 1976 standard atmosphere', () => {
  const f = (1000 - 500) / 3.4;
  close(exoTemp(f), 1000, 1e-9, 'T∞');
  for (const [z, rho] of [[400, 2.803e-12], [500, 5.215e-13], [600, 1.137e-13]]) {
    assert.ok(Math.abs(density(z, f) / rho - 1) < 0.23, `${z} km: ${density(z, f)} vs ${rho}`);
  }
  assert.ok(scaleHeight(exoTemp(250)) > scaleHeight(exoTemp(70)), 'a hotter thermosphere is taller');
});

test('lifetime: Dawson closed form against Runge–Kutta in time', () => {
  for (const z0 of [350, 450, 550, 700]) {
    for (const f107 of [70, 150, 250]) {
      for (const B of [0.005, 0.02]) {
        const c = decayChecked({ z0, B, f107 });
        assert.ok(c.gap < 1e-8, `${z0} km, F ${f107}, B ${B}: gap ${c.gap}`);
      }
    }
  }
  assert.ok(lifetimeClosed({ z0: 500, B: 0.011, f107: 70 }) > lifetimeClosed({ z0: 500, B: 0.011, f107: 250 }), 'solar maximum shortens a life');
});

test('upsets: Poisson closed form against the three-state chain', () => {
  for (const x of [1e-8, 1e-4, 0.01, 0.3, 2]) close(doubleShareChain(x) / doubleShare(x), 1, 1e-9, `x = ${x}`);
  const c = upsetsChecked({ bits: 1e9, word: 72, rate: 280 / 2.5e9, scrub: 1, ecc: true });
  close(c.single, 112, 1e-9, 'upsets a day');
  close(c.uncorrectable, (1e9 * 72 * (280 / 2.5e9) ** 2 * 1) / 2, 1e-4 * c.uncorrectable, 'small-x limit N k λ² T/2');
  assert.ok(c.gap < 1e-9);
});
