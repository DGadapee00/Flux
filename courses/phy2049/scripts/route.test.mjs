import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=e4.44.two-loop&s=0';
  const prefixed = parseRoute(`#/${COURSE}/e4/circuits${query}`);
  const legacy = parseRoute(`#/e4/circuits${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'e4');
    assert.equal(route.labId, 'circuits');
    assert.equal(route.problemId, 'e4.44.two-loop');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('e4', 'circuits', query), `#/${COURSE}/e4/circuits${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/gauss');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'e2');
  assert.equal(short.labId, 'gauss');
  const prefixed = parseRoute(`#/${COURSE}/gauss`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'e2');
  assert.equal(prefixed.labId, 'gauss');
});

test('an empty hash is not legacy and opens some exam on its first lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/${route.examId}/${route.labId}`);
});
