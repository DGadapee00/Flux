/**
 * The pointing budget: the Poisson–gamma closed form for landing inside a cone, against the offset
 * normal integrated over the disc, and against a seeded Monte Carlo draw.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { budgetChecked, insideClosed, insideNumeric } from '../src/mechanics/pointingbudget.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('no bias: the Rayleigh closed form', () => {
  close(insideClosed(0, 1, 3), 1 - Math.exp(-4.5), 1e-15, 'within 3σ radially');
  assert.ok(insideClosed(0, 1, 3) < 0.9973, 'a 3σ circle holds less than a 3σ line');
});

test('closed form against the disc integral, over a grid of biases and cones', () => {
  for (const b of [0, 0.5, 1, 2, 4]) {
    for (const R of [0.5, 1, 2, 3, 5]) {
      close(insideNumeric(b, 1, R), insideClosed(b, 1, R), 1e-8, `b ${b}, R ${R}`);
    }
  }
});

test('closed form against a seeded Monte Carlo draw', () => {
  let s = 20261115;
  const u = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const N = 200000;
  for (const [b, R] of [[1, 2], [2, 2.5], [0.5, 1]]) {
    let inside = 0;
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(-2 * Math.log(u()));
      const a = 2 * Math.PI * u();
      const x = b + r * Math.cos(a);
      const y = r * Math.sin(a);
      if (x * x + y * y < R * R) inside++;
    }
    close(inside / N, insideClosed(b, 1, R), 0.004, `b ${b}, R ${R}`);
  }
});

test('the budget: random terms add in quadrature, biases add straight', () => {
  const c = budgetChecked({ sensor: 'star', jitter: 0.02, misalign: 0.03, thermal: 0.01, R: 0.1 });
  close(c.sigma, Math.hypot(30 / 3600 / 3, 0.02), 1e-15, 'σ');
  close(c.bias, 0.04, 1e-15, 'bias');
  assert.ok(c.gap < 1e-8);
});
