import assert from 'node:assert/strict';
import test from 'node:test';
import { LAB_CATALOGS } from '../catalog.js';
import { loadConcepts } from '../load.mjs';
import { problemIndex } from '../problems.mjs';

const { byLab, titles } = await problemIndex();

test('every problem the index joins to a lab names a lab its course has', () => {
  for (const key of Object.keys(byLab)) {
    const [course, lab] = key.split('/');
    assert.ok(LAB_CATALOGS[course]?.[lab], `${key} is not in ${course}'s lab catalog`);
  }
});

test('problem keys carry their course and are unique', () => {
  const all = Object.values(byLab).flat();
  assert.equal(new Set(all).size, all.length);
  for (const k of all) {
    assert.match(k, /^[a-z0-9]+:.+/);
    assert.ok(titles[k], k);
  }
});

test('most concepts with a lab have practice problems behind them', async () => {
  const concepts = (await loadConcepts()).map(({ concept }) => concept).filter((c) => c.labs.length);
  const practised = concepts.filter((c) => c.labs.some((ref) => byLab[`${ref.course}/${ref.lab}`]?.length));
  // A floor, not a target: it catches a bank that stops loading or loses its lab fields.
  assert.ok(practised.length / concepts.length > 0.6, `${practised.length} of ${concepts.length}`);
});
