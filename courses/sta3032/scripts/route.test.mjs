import assert from 'node:assert/strict';
import test from 'node:test';
import { nextUnit } from '../src/data/catalog.js';
import { COURSE, hashFor, parseHash } from '../src/engine/router.js';

test('a prefixed hash is the same route as the old one, and the old one is legacy', () => {
  const query = '?p=c5.binom-table&s=3';
  const prefixed = parseHash(`#/${COURSE}/mid${query}`);
  const legacy = parseHash(`#/mid${query}`);
  assert.equal(prefixed.legacy, false);
  assert.equal(legacy.legacy, true);
  for (const route of [prefixed, legacy]) {
    assert.equal(route.unitId, 'mid');
    assert.equal(route.mode, 'practice');
    assert.equal(route.problemId, 'c5.binom-table');
    assert.equal(route.seed, 3);
    assert.equal(route.bare, false);
    assert.equal(route.labId, null);
  }
  assert.equal(hashFor(prefixed), `#/${COURSE}/mid${query}`);
});

test('a lab hash keeps its unit, mode, and lab, with the prefix stripped once', () => {
  const legacy = parseHash('#/final/explore/clt');
  const prefixed = parseHash(`#/${COURSE}/final/explore/clt`);
  assert.equal(legacy.legacy, true);
  assert.equal(prefixed.legacy, false);
  for (const route of [legacy, prefixed]) {
    assert.equal(route.unitId, 'final');
    assert.equal(route.mode, 'explore');
    assert.equal(route.labId, 'clt');
    assert.equal(route.scenario, null);
  }
  assert.equal(hashFor(prefixed), `#/${COURSE}/final/explore/clt`);
});

test('an old notes link opens the practice list, and a lab scenario survives the prefix', () => {
  const notes = parseHash(`#/${COURSE}/mid/notes/5`);
  assert.equal(notes.legacy, true, 'notes mode is retired, so the address is rewritten');
  assert.equal(notes.mode, 'practice');
  assert.equal(hashFor(notes), `#/${COURSE}/mid`);

  const lab = parseHash('#/final/explore/dist?sc=heights');
  assert.equal(lab.legacy, true);
  assert.equal(lab.labId, 'dist');
  assert.equal(lab.scenario, 'heights');
  assert.equal(hashFor(lab), `#/${COURSE}/final/explore/dist?sc=heights`);
});

test('an empty hash is not legacy and opens the exam coming up next', () => {
  const route = parseHash('');
  assert.equal(route.legacy, false);
  assert.equal(route.bare, true);
  assert.equal(route.unitId, nextUnit().id);
  assert.equal(route.mode, 'practice');
  assert.equal(hashFor({ unitId: route.unitId }), `#/${COURSE}/${nextUnit().id}`);
});
