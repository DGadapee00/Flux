import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAY, advance, playing, stopped } from '../engineering/motion.js';

test('a stopped lab does not advance', () => {
  const s = { ...stopped(0.5) };
  assert.equal(playing(s), false);
  assert.equal(advance(s, 0.1, { hi: 1 }), false);
  assert.equal(s.t, 0.5);
});

test('Play or Space starts the clock, and it wraps at the end of the run', () => {
  const s = { ...stopped(0.9) };
  s.show[PLAY.key] = true;
  assert.equal(advance(s, 0.2, { hi: 1 }), true);
  assert.ok(Math.abs(s.t - 0.1) < 1e-12);
  const k = { ...stopped(), anim: { playing: true } };
  advance(k, 0.25, { lo: 0, hi: 2, rate: 2, key: 'theta' });
  assert.equal(k.theta, 0.5);
});
