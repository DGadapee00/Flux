import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.1.fill-time&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u1/tank${query}`);
  const legacy = parseRoute(`#/u1/tank${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'tank');
    assert.equal(route.problemId, 'u1.1.fill-time');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u1', 'tank', query), `#/${COURSE}/u1/tank${query}`);
});

test('a bare lab id resolves to its unit', () => {
  const short = parseRoute(`#/${COURSE}/tank`);
  assert.equal(short.examId, 'u1');
  assert.equal(short.labId, 'tank');
});

test('an empty hash is not legacy and opens Unit 1 on its first lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'tank');
});
