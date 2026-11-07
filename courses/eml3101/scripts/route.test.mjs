import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.1.fractions&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u1/mixture${query}`);
  const legacy = parseRoute(`#/u1/mixture${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'mixture');
    assert.equal(route.problemId, 'u1.1.fractions');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u1', 'mixture', query), `#/${COURSE}/u1/mixture${query}`);
});

test('a bare lab id resolves to its unit', () => {
  const short = parseRoute(`#/${COURSE}/mixture`);
  assert.equal(short.examId, 'u1');
  assert.equal(short.labId, 'mixture');
});

test('an empty hash is not legacy and opens Unit 1 on its first lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'mixture');
});
