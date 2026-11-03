import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGraph, COURSES, SUBJECTS } from '@flux/map';
import { loadConcepts } from '@flux/map/load.mjs';
import { find, fold, searchIndex } from '../src/find.js';
import { inSubjects, layout, nearestInDirection } from '../src/layout.js';

const concepts = (await loadConcepts()).map((x) => x.concept);
const index = searchIndex(concepts, SUBJECTS, COURSES);
const ids = (q) => find(index, q).results.map((r) => `${r.kind}:${r.id}`);

test('a title is found from its start, a word inside it, or with plain quotes and no accents', () => {
  assert.equal(ids('gauss')[0], 'concept:gauss-law');
  assert.equal(ids("gauss's law")[0], 'concept:gauss-law', 'a straight quote finds a curly one');
  assert.ok(ids('theorem').includes('concept:divergence-theorem'), 'a word inside the title');
  assert.equal(fold('  Fick’s   Law '), "fick's law");
});

test('a subject or a course comes before concepts that match as well, and a code needs no space', () => {
  const heat = ids('heat');
  assert.equal(heat[0], 'subject:heat');
  assert.ok(heat.includes('concept:heat-equation'));
  assert.equal(ids('phy2049')[0], 'course:phy2049');
  assert.equal(ids('PHY 2049')[0], 'course:phy2049');
});

test('several words match across title, subject and course; nothing matches nothing', () => {
  const r = find(index, 'divergence calculus');
  assert.ok(r.results.some((e) => e.id === 'divergence-theorem'));
  assert.deepEqual(find(index, '').results, []);
  assert.deepEqual(find(index, 'zzqqxx').results, []);
  assert.ok(find(index, 'e', 8).total > 8, 'total counts matches past the limit');
  assert.equal(find(index, 'e', 8).results.length, 8);
});

test('an arrow key moves to the nearest box on that side, or nowhere at the edge', () => {
  const pos = { a: { x: 0, y: 0 }, b: { x: 146, y: 0 }, c: { x: 146, y: 62 }, d: { x: 0, y: 62 }, far: { x: 146, y: 600 } };
  assert.equal(nearestInDirection(pos, 'a', 'right'), 'b');
  assert.equal(nearestInDirection(pos, 'a', 'down'), 'd');
  assert.equal(nearestInDirection(pos, 'c', 'left'), 'd');
  assert.equal(nearestInDirection(pos, 'b', 'up'), null);
  assert.equal(nearestInDirection(pos, 'a', 'left'), null);
  // On the real map every box but the last column has somewhere to go right.
  const { pos: full } = layout(concepts, SUBJECTS, buildGraph(concepts).depth);
  assert.ok(nearestInDirection(full, 'divergence', 'right'));
});

test('a subject filter keeps its lanes and always the chosen concept', () => {
  const subjectOf = (id) => concepts.find((c) => c.id === id).subject;
  const all = concepts.map((c) => c.id);
  const heat = inSubjects(all, subjectOf, new Set(['heat']), 'divergence');
  assert.ok([...heat].every((id) => subjectOf(id) === 'heat' || id === 'divergence'));
  assert.ok(heat.has('divergence') && heat.has('heat-equation'));
  assert.equal(inSubjects(all, subjectOf, new Set(), 'divergence').size, all.length);
});
