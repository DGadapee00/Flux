import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=ch2.grad.point&s=7';
  const prefixed = parseRoute(`#/${COURSE}/ch2/gradient${query}`);
  const legacy = parseRoute(`#/ch2/gradient${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'ch2');
    assert.equal(route.labId, 'gradient');
    assert.equal(route.problemId, 'ch2.grad.point');
    assert.equal(route.seed, 7);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('ch2', 'gradient', query), `#/${COURSE}/ch2/gradient${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/gradient');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'ch2');
  assert.equal(short.labId, 'gradient');
  const prefixed = parseRoute(`#/${COURSE}/gradient`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'ch2');
  assert.equal(prefixed.labId, 'gradient');
});

test('an empty hash is not legacy and opens chapter 2 on gradient', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'ch2');
  assert.equal(route.labId, 'gradient');
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/ch2/gradient`);
});
