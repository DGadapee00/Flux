import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=ch7.work&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u4/track${query}`);
  const legacy = parseRoute(`#/u4/track${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u4');
    assert.equal(route.labId, 'track');
    assert.equal(route.problemId, 'ch7.work');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u4', 'track', query), `#/${COURSE}/u4/track${query}`);
});

test('a bare lab id resolves to its unit', () => {
  const short = parseRoute(`#/${COURSE}/projectile`);
  assert.equal(short.examId, 'u2');
  assert.equal(short.labId, 'projectile');
});

test('an empty hash opens Unit 1 on its first lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'vectors');
});
