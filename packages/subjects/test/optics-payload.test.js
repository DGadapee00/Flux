/**
 * Optical payloads: the Airy first zero found numerically against its tabulated value, the imager's
 * ground sampling, and the laser link's caught share by series and by disc integral.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { J1_ZERO, besselJ1, firstZero, imagerChecked, imagerClosed } from '../src/em/imaging.js';
import { laserChecked, laserClosed } from '../src/em/lasercom.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('J₁ by its integral: known values and its first zero', () => {
  close(besselJ1(1), 0.4400505857, 1e-9, 'J₁(1)');
  close(firstZero(), J1_ZERO, 1e-9, 'first zero');
  close(J1_ZERO / Math.PI, 1.2197, 1e-4, 'the Rayleigh factor');
});

test('imager: GSD from the pixel, spot from the aperture, Q between them', () => {
  const c = imagerChecked({ hkm: 500, Dcm: 9, fmm: 580, pum: 5.5, lamnm: 550, N: 4096, bits: 12 });
  close(c.gsd, (500e3 * 5.5e-6) / 0.58, 1e-9, 'GSD');
  assert.equal(c.limit, 'pixels');
  assert.ok(c.gap < 1e-9);
  // Past the optics' limit, smaller pixels add nothing.
  const a = imagerClosed({ hkm: 500, Dcm: 9, fmm: 1500, pum: 5.5, lamnm: 550, N: 4096, bits: 12 });
  const b = imagerClosed({ hkm: 500, Dcm: 9, fmm: 1500, pum: 2.75, lamnm: 550, N: 4096, bits: 12 });
  assert.equal(a.limit, 'optics');
  assert.equal(a.resolves, b.resolves);
});

test('laser: centred share matches 1 − e^(−2r²/w²); off-pointing by series and by integral', () => {
  const base = { lamnm: 1550, Dtmm: 10, PW: 1, dkm: 1000, Drcm: 40, epsur: 0, rateMbps: 200 };
  const c = laserClosed(base);
  close(c.share, c.centred, 1e-12 * c.centred, 'centred');
  for (const epsur of [10, 58, 150, 349]) {
    const k = laserChecked({ ...base, epsur });
    assert.ok(k.gap < 1e-8, `ε ${epsur} µrad: gap ${k.gap}`);
  }
  close(laserClosed({ ...base, epsur: c.halfLoss * 1e6 }).lossDB, 3.01, 0.01, 'the 3 dB pointing error');
  // Twice the range or half the aperture: a quarter of the power.
  close(laserClosed({ ...base, dkm: 2000 }).Pr / c.Pr, 0.25, 1e-5, 'range');
  close(laserClosed({ ...base, Dtmm: 5 }).Pr / c.Pr, 0.25, 1e-5, 'aperture');
});
