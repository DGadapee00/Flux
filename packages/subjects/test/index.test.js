import assert from 'node:assert/strict';
import test from 'node:test';
import { len, proj } from '../src/math/vec.js';
import { fitScale } from '../src/math/scale.js';
import { parseUnit } from '../src/em/units.js';
import { parseUnit as parseMech } from '../src/mechanics/units.js';
import { mean, sd } from '../src/stats/describe.js';
import { SUBJECTS } from '../src/index.js';

test('the four subject libraries are present', () => {
  assert.deepEqual(SUBJECTS, ['em', 'math', 'mechanics', 'stats']);
});

test('shared vector arithmetic, the grid step, and both unit tables', () => {
  assert.equal(len({ x: 3, y: 4, z: 0 }), 5);
  assert.deepEqual(proj({ x: 2, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 0 });
  assert.equal(fitScale(3.4), 1);
  assert.deepEqual(parseUnit('N'), [1, 1, -2, 0]);
  assert.deepEqual(parseMech('lb'), [1, 1, -2, 0]);
  assert.equal(mean([1, 2, 3, 4]), 2.5);
  assert.equal(sd([1, 2, 3, 4]), Math.sqrt(5 / 3));
});
