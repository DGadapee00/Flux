import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bridle, shelf, gantry, scissorJack, bookcase } from '../src/mechanics/static-devices.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
test('slings close the force polygon and become singular near horizontal', () => {
  for (const theta of [15, 30, 45, 60]) {
    const c = bridle({ W: 1000, theta });
    near(c.T, 500 / Math.sin((theta * Math.PI) / 180));
    near(c.gap, 0);
    near(bridle({ W: 2000, theta }).H, 2 * c.H);
  }
  near(bridle({ W: 1000, theta: 30 }).T, 1000);
});
test('shelf reactions close moments about either wall attachment', () => {
  const c = shelf({ W: 100, x: 0.2, h: 0.1 });
  near(c.H, 200);
  near(c.M, 20);
  near(c.H * 0.1 + 100 * (0.8 - 0.2), 100 * 0.8);
  near(shelf({ W: 100, x: 0.2, h: 0.2 }).H, c.H / 2);
});
test('triangular gantry joint forces agree with a section moment', () => {
  for (const h of [0.5, 1, 2]) {
    const c = gantry({ W: 600, L: 4, h });
    near(c.chord * h, c.R * 2);
    near(c.gap, 0);
    near(gantry({ W: 1200, L: 4, h }).C, 2 * c.C);
  }
});
test('jack screw force agrees with virtual work finite differences', () => {
  for (const H of [0.1, 0.2, 0.35]) {
    const s = { W: 1000, a: 0.25, H };
    const c = scissorJack(s);
    const e = 1e-6;
    const height = (x) => Math.sqrt(4 * s.a * s.a - x * x);
    near(c.Q, (-s.W * (height(c.x + e) - height(c.x - e))) / (2 * e));
    near(scissorJack({ ...s, W: 2000 }).C, 2 * c.C);
  }
});
test('cabinet threshold switches between slipping and tipping', () => {
  const s = { W: 400, b: 0.28, hp: 1.5, mu: 0.3 };
  const c = bookcase(s);
  near(c.tip * 1.5, 400 * 0.14);
  assert.ok(c.tips);
  assert.equal(bookcase({ ...s, mu: 0.01 }).tips, false);
  near(bookcase({ ...s, W: 800 }).P, 2 * c.P);
});

import { parallelogram } from '../src/mechanics/vectors.js';
test('parallelogram retains an obtuse resultant direction', () => {
  const { R, phi } = parallelogram(300, 1900, 120);
  assert.ok(phi > 90);
  near(R * Math.cos((phi * Math.PI) / 180), 300 + 1900 * Math.cos((2 * Math.PI) / 3));
  near(R * Math.sin((phi * Math.PI) / 180), 1900 * Math.sin((2 * Math.PI) / 3));
});


import { resultantWrench } from '../src/mechanics/statics.js';
import { v } from '../src/mechanics/vectors.js';
test('spatial plate worked example closes six balances about two points', () => {
  const loads = [
    { at: v(0, 0, 0), F: v(0, 0, 20) },
    { at: v(2, 0, 0), F: v(0, 0, 40) },
    { at: v(0, 1, 0), F: v(0, 0, 40) },
    { at: v(0.8, 0.4, 0), F: v(0, 0, -100) },
  ];
  for (const point of [v(0, 0, 0), v(3, 2, 1)]) {
    const { F, M } = resultantWrench(point, loads);
    for (const component of [...Object.values(F), ...Object.values(M)]) near(component, 0);
  }
});
