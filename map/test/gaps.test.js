import assert from 'node:assert/strict';
import test from 'node:test';
import { APPLICATIONS, recipesOf } from '../applications/index.js';
import { rankGaps, recipeUses } from '../gaps.mjs';
import { loadConcepts } from '../load.mjs';

const concepts = (await loadConcepts()).map((x) => x.concept);
const byId = Object.fromEntries(concepts.map((c) => [c.id, c]));

test('every application recipe names concepts on the map, and its labs belong to those concepts', () => {
  for (const app of APPLICATIONS) {
    for (const r of recipesOf(app)) {
      for (const id of r.concepts || []) assert.ok(byId[id], `${app.id}/${r.id}: ${id}`);
      for (const ref of r.labs || []) {
        assert.ok(r.concepts.includes(ref.concept), `${app.id}/${r.id}: ${ref.concept}`);
        assert.ok(byId[ref.concept].labs.some((l) => l.course === ref.course && l.lab === ref.lab), `${ref.course}/${ref.lab}`);
      }
    }
  }
});

test('a gap that an application recipe needs ranks higher by two per recipe', () => {
  const without = rankGaps(concepts, []).gaps.find((r) => r.id === 'thermal-radiation');
  const withApps = rankGaps(concepts).gaps.find((r) => r.id === 'thermal-radiation');
  assert.deepEqual(withApps.uses, ['satellite/thermal']);
  assert.equal(withApps.score - without.score, 2);
  assert.deepEqual(recipeUses([{ id: 'a', components: [{ id: 'x', concepts: ['q'] }], integration: { id: 'all' } }]), { q: ['a/x'] });
});
