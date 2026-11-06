/**
 * The fluids labs' closed forms against their second methods: Couette start-up against a
 * finite-difference march, a gate against slices, a rigid-body tank against a volume balance, a
 * nozzle particle against RK4 tracking, and a bend against Simpson's rule on Euler's normal equation.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { FLUIDS, couetteStress, marchStartup, settlingTime, startupProfile } from '../src/mechanics/couette.js';
import { gateForce, gateForceSlices, rigidSurface, rigidSurfaceByVolume } from '../src/mechanics/pressure-fields.js';
import { bendPressure, bendPressureSteps, nozzleParticle, nozzleTransit, trackParticle } from '../src/mechanics/flowfields.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`);

test('Couette: the series and the march agree, and the stress ignores density', () => {
  const nu = FLUIDS.water.mu / FLUIDS.water.rho;
  const h = 0.002;
  const t = 0.3 * settlingTime(nu, h);
  const fd = marchStartup(t, nu, h, 80);
  for (let i = 0; i <= 80; i++) close(fd[i], startupProfile(i / 80, t, nu, h), 2e-3, `u at ${i}`);
  close(couetteStress(FLUIDS.water.mu, 0.5, h), 0.2504, 1e-3, 'water stress');
});

test('gate: a vertical gate from the surface acts at two thirds of its depth', () => {
  const g = gateForce({ rho: 1000, d: 0, L: 3, b: 2, theta: 90, g: 9.81 });
  close(g.ycp, 2, 1e-12, 'centre of pressure');
  close(g.F, 1000 * 9.81 * 1.5 * 6, 1e-12, 'force');
  for (const p of [{ d: 0, theta: 90 }, { d: 4, theta: 90 }, { d: 1, theta: 30 }, { d: 10, theta: 60 }]) {
    const spec = { rho: 998, L: 2, b: 1.5, ...p };
    const a = gateForce(spec);
    const b = gateForceSlices(spec);
    close(b.F, a.F, 1e-9, 'force by slices');
    close(b.ycp, a.ycp, 1e-9, 'centre by slices');
    close(b.hold, a.hold, 1e-9, 'holding force');
  }
});

test('rigid tank: the closed-form surface keeps the water poured in', () => {
  for (const p of [
    { mode: 'linear', len: 1, h0: 0.45, ax: 3, az: 0 },
    { mode: 'linear', len: 1, h0: 0.45, ax: -5, az: 3 },
    { mode: 'spin', len: 0.15, h0: 0.45, omega: 20, az: 0 },
    { mode: 'spin', len: 0.15, h0: 0.4, omega: 25, az: -3 },
  ]) {
    const a = rigidSurface({ ...p, rho: 998 });
    const b = rigidSurfaceByVolume(p);
    close(b.inner, a.inner, 1e-9, `${p.mode} inner`);
    close(b.outer, a.outer, 1e-9, `${p.mode} outer`);
  }
  const tilt = rigidSurface({ mode: 'linear', len: 1, h0: 0.4, ax: 9.81, rho: 1000, g: 9.81 });
  close(tilt.angle, 45, 1e-12, 'a = g tilts the surface 45 degrees');
  assert.ok(tilt.inner > tilt.outer, 'the water piles at the back');
});

test('nozzle: tracking a particle gives the closed-form time and acceleration', () => {
  for (const p of [
    { u0: 1, L: 0.5, CR: 4, ramp: 0 },
    { u0: 0.5, L: 1, CR: 2, ramp: 0.4 },
    { u0: 2, L: 0.3, CR: 6, ramp: 0.1 },
  ]) {
    for (const f of [0.2, 0.6, 0.95]) {
      const a = nozzleParticle(p, f * p.L);
      const b = trackParticle(p, f * p.L);
      close(b.t, a.t, 1e-7, 'time');
      close(b.accel, a.accel, 1e-5, 'acceleration');
    }
  }
  close(nozzleTransit({ u0: 1, L: 1, CR: 2, ramp: 0 }), 0.75, 1e-12, 'steady transit (1 − c/2) L/u0');
  assert.equal(nozzleParticle({ u0: 1, L: 1, CR: 3, ramp: 0 }, 0.5).local, 0, 'steady flow has no local term');
});

test('bend: Euler across the streamlines, two ways', () => {
  for (const profile of ['vortex', 'uniform']) {
    const p = { rho: 998, V: 2, R: 0.3, w: 0.2, profile };
    close(bendPressureSteps(p).dp, bendPressure(p).dp, 1e-9, profile);
  }
  const v = bendPressure({ rho: 1000, V: 2, R: 0.3, w: 0.2, profile: 'vortex' });
  close(v.dp, (1000 / 2) * (v.uIn ** 2 - v.uOut ** 2), 1e-12, 'Bernoulli across a free vortex');
});
