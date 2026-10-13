import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=ch6.truss-joints&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u3/truss${query}`);
  const legacy = parseRoute(`#/u3/truss${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u3');
    assert.equal(route.labId, 'truss');
    assert.equal(route.problemId, 'ch6.truss-joints');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u3', 'truss', query), `#/${COURSE}/u3/truss${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/moments');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'u2');
  assert.equal(short.labId, 'moments');
  const prefixed = parseRoute(`#/${COURSE}/moments`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'u2');
  assert.equal(prefixed.labId, 'moments');
});

test('an empty hash is not legacy and opens the first unit on its first lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'vectors');
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/u1/vectors`);
});

test('the moments route keeps its unit when the course prefix is present', () => {
  const route = parseRoute(`#/${COURSE}/u2/moments`);
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u2');
  assert.equal(route.labId, 'moments');
  const old = parseRoute('#/u2/moments');
  assert.equal(old.legacy, true);
  assert.equal(old.examId, 'u2');
  assert.equal(old.labId, 'moments');
});
