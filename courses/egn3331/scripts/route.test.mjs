import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.1.inclined&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u1/cut${query}`);
  const legacy = parseRoute(`#/u1/cut${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'cut');
    assert.equal(route.problemId, 'u1.1.inclined');
    assert.equal(route.seed, 0);
  }
  assert.equal(courseHash('u1', 'cut', query), `#/${COURSE}/u1/cut${query}`);
});

test('an empty hash opens Unit 1 on the inclined cut', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'cut');
});

test('a bare lab id finds its unit, and a unit still to be built opens with no lab', () => {
  const bare = parseRoute(`#/${COURSE}/pins`);
  assert.equal(bare.examId, 'u1');
  assert.equal(bare.labId, 'pins');
  const later = parseRoute(`#/${COURSE}/u7`);
  assert.equal(later.examId, 'u7');
  assert.ok(!later.labId);
});
