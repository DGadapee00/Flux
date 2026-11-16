/**
 * In-space propulsion: the rocket equation against a stepped burn, the cold-gas ceiling, and the
 * electric spiral against flying it.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { TECH, budgetPropChecked, coldGasK, powerThrust, propellantClosed, spiralChecked } from '../src/mechanics/propulsion.js';

test('the closed-form propellant matches the stepped burn for every technology', () => {
  for (const tech of Object.keys(TECH)) {
    for (const hkm of [400, 550]) {
      const c = budgetPropChecked({ hkm, years: 3, mass: 10, area: 0.06, f107: 147, dry: 10, tech });
      assert.ok(c.gap < 1e-6, `${tech} at ${hkm} km: gap ${c.gap}`);
    }
  }
});

test('a cold-gas tank’s mass ratio does not depend on pressure, and caps the Δv', () => {
  const k = coldGasK();
  assert.ok(k > 1.5 && k < 1.8);
  const ceiling = propellantClosed({ dv: 10, dry: 10, tech: 'cold' }).ceiling;
  assert.equal(propellantClosed({ dv: ceiling * 1.01, dry: 0, tech: 'cold' }).mp, null);
  assert.ok(propellantClosed({ dv: ceiling * 0.99, dry: 0.001, tech: 'cold' }).mp > 0);
});

test('at fixed power, thrust falls as specific impulse rises', () => {
  assert.ok(Math.abs(powerThrust(40, 0.5, 1500) / powerThrust(40, 0.5, 3000) - 2) < 1e-12);
});

test('the electric spiral’s closed form matches flying it, raising and lowering', () => {
  for (const [h1, h2] of [[400, 550], [550, 300]]) {
    const c = spiralChecked({ h1, h2, mass: 12, power: 40, isp: 1500, eta: 0.5 });
    assert.ok(c.gap < 1e-3, `${h1} → ${h2}: gap ${c.gap}`);
  }
});
