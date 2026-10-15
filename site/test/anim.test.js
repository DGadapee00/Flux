import assert from 'node:assert/strict';
import test from 'node:test';
import { climb, gradient, height, levelRadius, LEVELS } from '../src/anim/math.js';
import { solveTruss } from '../src/anim/mechanics.js';
import { reduceMotion } from '../src/anim/motion.js';
import { connectingLines, fieldAt, probePath } from '../src/anim/physics.js';
import { normalPdf, statsScene } from '../src/anim/stats.js';
import { carnotCycle, corners, enclosedArea, heatIn, K, netWork, T_COLD, T_HOT } from '../src/anim/thermal.js';

const rest = {
  t: 0,
  playing: false,
  visible: true,
  fineHover: true,
  reduced: false,
  touchPlayed: false,
};

test('dipole field lines run from the positive charge to the negative one', () => {
  const mid = fieldAt(0, 0);
  assert.ok(mid.x > 0, 'between the charges the field points from + toward −');
  assert.ok(Math.abs(mid.y) < 1e-9);

  const lines = connectingLines();
  assert.ok(lines.length >= 5);
  for (const line of lines) {
    const end = line[line.length - 1];
    assert.ok(Math.hypot(end.x - 0.9, end.y) < 0.22);
  }

  const probe = probePath();
  assert.ok(probe[0].x < 0);
  assert.ok(probe[probe.length - 1].x > 0.6);
  for (let i = 1; i < probe.length; i += 1) {
    assert.ok(probe[i].x >= probe[i - 1].x - 1e-9, 'the probe line does not turn back');
  }
});

test('gradient ascent climbs the hill', () => {
  const path = climb();
  assert.ok(path.length > 10);
  for (let i = 1; i < path.length; i += 1) {
    assert.ok(path[i].f >= path[i - 1].f - 1e-12);
  }
  const start = Math.hypot(path[0].x, path[0].y);
  const end = Math.hypot(path[path.length - 1].x, path[path.length - 1].y);
  assert.ok(end < start * 0.25);
  const g = gradient(0.5, 0);
  assert.ok(g.x < 0);
  assert.ok(Math.abs(g.y) < 1e-12);
  for (const level of LEVELS) {
    const r = levelRadius(level);
    assert.ok(Math.abs(height(r, 0) - level) < 1e-9);
  }
});

test('truss forces match the closed form, tension on the tie and compression in the rafters', () => {
  const P = 1;
  const h = 1.2;
  const truss = solveTruss(P, h);
  const length = Math.hypot(1, h);
  const compression = -P * length / (2 * h);
  const tie = P / (2 * h);
  assert.ok(Math.abs(truss.Ax) < 1e-9);
  assert.ok(Math.abs(truss.Ay - P / 2) < 1e-9);
  assert.ok(Math.abs(truss.By - P / 2) < 1e-9);
  assert.ok(Math.abs(truss.Tac - compression) < 1e-9);
  assert.ok(Math.abs(truss.Tbc - compression) < 1e-9);
  assert.ok(Math.abs(truss.Tab - tie) < 1e-9);
  assert.ok(truss.Tab > 0);
  assert.ok(truss.Tac < 0);
});

test('histogram counts are the samples, and the curve is the normal density', () => {
  const scene = statsScene();
  assert.equal(scene.samples.length, scene.n);
  assert.equal(scene.counts.length, 12);
  const inside = scene.samples.filter((sample) => sample >= scene.x0 && sample < scene.x1).length;
  assert.equal(scene.counts.reduce((sum, count) => sum + count, 0), inside);
  assert.ok(inside > scene.n * 0.9);
  const mean = scene.samples.reduce((sum, sample) => sum + sample, 0) / scene.n;
  assert.ok(Math.abs(mean) < 0.2);
  assert.ok(Math.abs(normalPdf(0) - 1 / Math.sqrt(2 * Math.PI)) < 1e-12);
  const mid = scene.curve.find((point) => Math.abs(point.x) < 0.05);
  const edge = scene.curve[0];
  assert.ok(mid.y > edge.y * 5);
  assert.ok(Math.abs(mid.y - scene.n * scene.width * normalPdf(mid.x)) < 1e-9);
});

test('motion plays once, holds, pauses off screen, and stays still when reduced', () => {
  let state = reduceMotion(rest, { type: 'enter' });
  assert.equal(state.playing, true);
  assert.equal(state.t, 0);
  state = reduceMotion(state, { type: 'tick', dt: 0.4 });
  assert.ok(Math.abs(state.t - 0.4) < 1e-12);
  state = reduceMotion(state, { type: 'hide' });
  const frozen = reduceMotion(state, { type: 'tick', dt: 0.5 });
  assert.equal(frozen.t, state.t);
  assert.equal(frozen.playing, true);
  state = reduceMotion(frozen, { type: 'show' });
  state = reduceMotion(state, { type: 'tick', dt: 0.9 });
  assert.equal(state.t, 1);
  assert.equal(state.playing, false);
  state = reduceMotion(state, { type: 'enter' });
  assert.equal(state.t, 0);
  assert.equal(state.playing, true);

  const reduced = reduceMotion({ ...rest, reduced: false }, { type: 'reduced', on: true });
  const stayed = reduceMotion(reduced, { type: 'enter' });
  assert.equal(stayed.t, 1, 'reduced motion holds the finished picture');
  assert.equal(stayed.playing, false);

  const touch = reduceMotion({ ...rest, fineHover: false, visible: false }, { type: 'show' });
  assert.equal(touch.playing, true);
  assert.equal(touch.touchPlayed, true);
  const again = reduceMotion({ ...touch, playing: false, t: 1 }, { type: 'show' });
  assert.equal(again.t, 1);
  assert.equal(again.playing, false);
});

test('the Carnot cycle closes, its adiabats hold P v^k, and its area is the net work', () => {
  const { v1, v2, v3, v4 } = corners();
  const { legs, path } = carnotCycle();
  assert.equal(legs.length, 4);
  const first = path[0];
  const last = path[path.length - 1];
  assert.ok(Math.abs(first.x - last.x) < 1e-12 && Math.abs(first.y - last.y) < 1e-12, 'the path closes');
  assert.ok(v1 < v2 && v2 < v3 && v4 < v3 && v1 < v4);
  for (const [i, T] of [
    [0, T_HOT],
    [2, T_COLD],
  ]) {
    for (const point of legs[i]) assert.ok(Math.abs(point.x * point.y - T) < 1e-12, 'Pv = RT on an isotherm');
  }
  for (const i of [1, 3]) {
    const c = legs[i][0].y * legs[i][0].x ** K;
    for (const point of legs[i]) assert.ok(Math.abs(point.y * point.x ** K - c) < 1e-12, 'P v^k is constant');
  }
  // Second calculation: the polygon's area against R (T_H − T_L) ln(v2/v1).
  const area = enclosedArea(path.slice(0, -1));
  assert.ok(area > 0, 'an engine runs clockwise on P–v');
  assert.ok(Math.abs(area - netWork()) / netWork() < 0.01, `area ${area} vs ${netWork()}`);
  assert.ok(Math.abs(netWork() / heatIn() - (1 - T_COLD / T_HOT)) < 1e-12, 'Carnot efficiency');
  assert.ok(Math.abs(v3 / v4 - v2 / v1) < 1e-12, 'the two isotherms span the same volume ratio');
});
