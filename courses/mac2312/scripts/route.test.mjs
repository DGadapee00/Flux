import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=u1.vol.disk&s=7';
  const prefixed = parseRoute(`#/${COURSE}/u1/solids${query}`);
  const legacy = parseRoute(`#/u1/solids${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.examId, 'u1');
    assert.equal(route.labId, 'solids');
    assert.equal(route.problemId, 'u1.vol.disk');
    assert.equal(route.seed, 7);
    assert.equal(route.query, query);
  }
  assert.equal(courseHash('u1', 'solids', query), `#/${COURSE}/u1/solids${query}`);
});

test('a bare lab id still resolves, and the course prefix is stripped once', () => {
  const short = parseRoute('#/taylor');
  assert.equal(short.legacy, true);
  assert.equal(short.examId, 'u3');
  assert.equal(short.labId, 'taylor');
  const prefixed = parseRoute(`#/${COURSE}/taylor`);
  assert.equal(prefixed.legacy, false);
  assert.equal(prefixed.examId, 'u3');
  assert.equal(prefixed.labId, 'taylor');
  const series = parseRoute('#/series');
  assert.equal(series.legacy, true);
  assert.equal(series.examId, 'u3');
  assert.equal(series.labId, 'series');
  const parametric = parseRoute('#/parametric');
  assert.equal(parametric.legacy, true);
  assert.equal(parametric.examId, 'u4');
  assert.equal(parametric.labId, 'parametric');
  const polar = parseRoute('#/polar');
  assert.equal(polar.legacy, true);
  assert.equal(polar.examId, 'u4');
  assert.equal(polar.labId, 'polar');
});

test('an empty hash is not legacy and opens the solids lab', () => {
  const route = parseRoute('');
  assert.equal(route.legacy, false);
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'solids');
  assert.equal(courseHash(route.examId, route.labId), `#/${COURSE}/u1/solids`);
});

test('unit 1 arc length is the second lab', () => {
  const route = parseRoute('#/mac2312/u1/arc');
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'arc');
  assert.equal(courseHash('u1', 'arc'), `#/${COURSE}/u1/arc`);
});

test('a unit hash opens that unit’s first lab', () => {
  const route = parseRoute('#/mac2312/u1');
  assert.equal(route.examId, 'u1');
  assert.equal(route.labId, 'solids');
  const techniques = parseRoute('#/mac2312/u2');
  assert.equal(techniques.examId, 'u2');
  assert.equal(techniques.labId, 'numint');
  const series = parseRoute('#/mac2312/u3');
  assert.equal(series.examId, 'u3');
  assert.equal(series.labId, 'taylor');
});

test('unit 4 opens the parametric lab', () => {
  const route = parseRoute('#/mac2312/u4');
  assert.equal(route.examId, 'u4');
  assert.equal(route.labId, 'parametric');
});
