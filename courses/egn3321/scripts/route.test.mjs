import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.12.path&s=0';
  const prefixed = parseRoute(`#/${COURSE}/u1/path-nt${query}`);
  const legacy = parseRoute(`#/u1/path-nt${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'path-nt');
    assert.equal(route.problemId, 'u1.12.path');
    assert.equal(route.seed, 0);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u1', 'path-nt', query), `#/${COURSE}/u1/path-nt${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/relative');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'u1');
  assert.equal(short.labId, 'relative');
  const prefixed = parseRoute(`#/${COURSE}/relative`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'u1');
  assert.equal(prefixed.labId, 'relative');
});

test('an empty hash is not legacy and opens Unit 1 on rectilinear motion', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'rectilinear');
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/u1/rectilinear`);
});

test('Unit 5 opens on the instant centre, and Unit 6 opens on inertia', () => {
  const u3 = parseRoute(`#/${COURSE}/u3`);
  assert.equal(u3.legacy, false);
  assert.equal(u3.examId, 'u3');
  assert.equal(u3.labId, 'collar');
  const built = parseRoute(`#/${COURSE}/u4`);
  assert.equal(built.legacy, false);
  assert.equal(built.examId, 'u4');
  assert.equal(built.labId, 'impulse');
  const route = parseRoute(`#/${COURSE}/u5`);
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u5');
  assert.equal(route.labId, 'ic');
  const later = parseRoute(`#/${COURSE}/u6`);
  assert.equal(later.legacy, false);
  assert.equal(later.examId, 'u6');
  assert.equal(later.labId, 'inertia');
  const last = parseRoute(`#/${COURSE}/u7`);
  assert.equal(last.legacy, false);
  assert.equal(last.examId, 'u7');
  assert.equal(last.labId, null);
  const old = parseRoute('#/u1/rectilinear');
  assert.equal(old.legacy, true);
  assert.equal(old.examId, 'u1');
  assert.equal(old.labId, 'rectilinear');
});
