import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.2.phase&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u1/phase${query}`);
  const legacy = parseRoute(`#/u1/phase${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'phase');
    assert.equal(route.problemId, 'u1.2.phase');
    assert.equal(route.seed, 0);
  }
  assert.equal(courseHash('u1', 'phase', query), `#/${COURSE}/u1/phase${query}`);
});

test('an empty hash opens Unit 1 on the phase diagram', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'phase');
});

test('Unit 2 opens on boundary work, and a bare lab id finds its unit', () => {
  assert.equal(parseRoute(`#/${COURSE}/u2`).labId, 'piston');
  const bare = parseRoute(`#/${COURSE}/piston`);
  assert.equal(bare.examId, 'u2');
  assert.equal(bare.labId, 'piston');
});
