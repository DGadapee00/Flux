import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u2.def.quad&s=7';
  const prefixed = parseRoute(`#/${COURSE}/u2/secant${query}`);
  const legacy = parseRoute(`#/u2/secant${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u2');
    assert.equal(route.labId, 'secant');
    assert.equal(route.problemId, 'u2.def.quad');
    assert.equal(route.seed, 7);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u2', 'secant', query), `#/${COURSE}/u2/secant${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/riemann');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'u4');
  assert.equal(short.labId, 'riemann');
  const prefixed = parseRoute(`#/${COURSE}/riemann`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'u4');
  assert.equal(prefixed.labId, 'riemann');
});

test('an empty hash is not legacy and opens the secant lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u2');
  assert.equal(route.labId, 'secant');
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/u2/secant`);
});

test('a unit with no lab yet keeps the unit and a null lab', () => {
  const route = parseRoute('#/mac2311/u1');
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, null);
});
