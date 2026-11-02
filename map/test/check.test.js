import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMap, proseErrors } from '../check.mjs';
import { buildGraph, findCycle } from '../graph.js';
import { labHref } from '../routes.js';

const source = (n) => ({
  title: `Source ${n}`,
  url: `https://example.org/${n}`,
  kind: 'Open textbook',
  level: 'Intro',
  why: 'A reason in our own words.',
});

const concept = (id, extra = {}) => ({
  id,
  title: `Title ${id}`,
  subject: 'calculus',
  courses: ['c1'],
  eq: String.raw`\nabla f`,
  idea: String.raw`An idea with \(x^2\) in it.`,
  requires: [],
  sources: [source(1), source(2)],
  labs: [{ course: 'c1', lab: 'l1', notes: 's1', note: 'Shows it.' }],
  ...extra,
});

/** A small map that passes. Each test breaks one thing. */
function fixture(concepts = [concept('a'), concept('b', { requires: ['a'] })]) {
  return {
    subjects: [{ id: 'calculus', label: 'Calculus', token: '--lane-calculus', dark: '#58c4dd', light: '#1a7590' }],
    courses: [
      { id: 'c1', code: 'C 1', title: 'Course one', status: 'taken', app: 'c1/' },
      { id: 'c2', code: 'C 2', title: 'Course two', status: 'later', app: null },
    ],
    statuses: ['taken', 'taking now', 'next term', 'later'],
    concepts: concepts.map((c) => ({ file: `${c.id}.js`, concept: c })),
    labCatalogs: { c1: { l1: { unit: 'u1', title: 'Lab one' } } },
    notesIndexes: { c1: { u1: [{ id: 's1', title: 'Section one', lab: 'l1' }] } },
    tracks: [{ courses: [{ id: 'c1', code: 'C 1', href: 'c1/' }] }],
  };
}

const errorsOf = (data) => checkMap(data);
const has = (errors, text) => assert.ok(errors.some((e) => e.includes(text)), `expected "${text}" in:\n${errors.join('\n')}`);

test('a well-formed map passes', () => {
  assert.deepEqual(errorsOf(fixture()), []);
});

test('duplicate ids fail', () => {
  has(errorsOf(fixture([concept('a'), concept('a')])), 'duplicate id');
});

test('a requires that names no concept fails', () => {
  has(errorsOf(fixture([concept('a', { requires: ['ghost'] })])), 'requires ghost, which is not a concept');
});

test('a cycle fails and is named', () => {
  const errors = errorsOf(fixture([concept('a', { requires: ['c'] }), concept('b', { requires: ['a'] }), concept('c', { requires: ['b'] })]));
  has(errors, 'cycle:');
  assert.deepEqual(findCycle([{ id: 'x', requires: ['x'] }]), ['x', 'x']);
});

test('a lab the course catalog lacks fails', () => {
  has(errorsOf(fixture([concept('a', { labs: [{ course: 'c1', lab: 'nope', note: 'x' }] })])), 'c1 has no lab nope');
});

test('a lab in a course with no app fails', () => {
  has(errorsOf(fixture([concept('a', { labs: [{ course: 'c2', lab: 'l1', note: 'x' }] })])), 'has no Flux app');
});

test('a notes section the notes index lacks fails', () => {
  has(errorsOf(fixture([concept('a', { labs: [{ course: 'c1', lab: 'l1', notes: 's9', note: 'x' }] })])), 'no section s9');
});

test('missing fields fail', () => {
  for (const field of ['title', 'eq', 'idea', 'sources', 'labs', 'requires']) {
    const c = concept('a');
    delete c[field];
    assert.ok(errorsOf(fixture([c])).length > 0, `missing ${field} should fail`);
  }
  const s = source(1);
  delete s.why;
  has(errorsOf(fixture([concept('a', { sources: [s, source(2)] })])), 'missing why');
});

test('a non-https URL fails', () => {
  const s = { ...source(1), url: 'http://example.org/x' };
  has(errorsOf(fixture([concept('a', { sources: [s, source(2)] })])), 'is not https');
});

test('TeX that KaTeX cannot parse fails, in eq and in prose', () => {
  has(errorsOf(fixture([concept('a', { eq: String.raw`\frac{1}{` })])), 'eq does not parse');
  has(errorsOf(fixture([concept('a', { idea: String.raw`Bad \(\notacommand x\) here.` })])), 'does not parse');
  has(errorsOf(fixture([concept('a', { idea: String.raw`Open \(x but never closed.` })])), 'unmatched');
});

test('an em dash in the idea fails', () => {
  has(errorsOf(fixture([concept('a', { idea: 'One thing — then another.' })])), 'idea has an em dash');
  assert.deepEqual(proseErrors('An en dash – is fine.'), []);
});

test('no lab and no candidate fails; a candidate alone passes', () => {
  has(errorsOf(fixture([concept('a', { labs: [] })])), 'has no lab and no candidate');
  assert.deepEqual(errorsOf(fixture([concept('a', { labs: [], candidate: 'A lab idea.' })])), []);
});

test('courses must match tracks.js', () => {
  const data = fixture();
  data.tracks = [{ courses: [{ id: 'c1', code: 'C 1', href: 'elsewhere/' }, { id: 'c3', code: 'C 3', href: null }] }];
  const errors = errorsOf(data);
  has(errors, 'differs from tracks.js');
  has(errors, 'c3: is in tracks.js but not in map/courses.js');
});

test('the graph: leads, depth and closure', () => {
  const g = buildGraph([
    { id: 'a', requires: [] },
    { id: 'b', requires: ['a'] },
    { id: 'c', requires: ['a', 'b'] },
  ]);
  assert.deepEqual(g.leads.a, ['b', 'c']);
  assert.deepEqual([g.depth.a, g.depth.b, g.depth.c], [0, 1, 2]);
  assert.deepEqual([...g.closure('c', 'requires')].sort(), ['a', 'b']);
  assert.deepEqual([...g.closure('a', 'leads')].sort(), ['b', 'c']);
});

test('lab links use each course route', () => {
  assert.equal(labHref({ course: 'phy2049', unit: 'e2', lab: 'gauss', notes: 's11' }), 'phy2049/#/phy2049/e2/gauss?n=s11');
  assert.equal(labHref({ course: 'sta3032', unit: 'final', lab: 'clt' }), 'sta3032/#/sta3032/final/explore/clt');
});

const withPath = (units, concepts) => ({ ...fixture(concepts), paths: [{ file: 'c1.js', path: { course: 'c1', units } }] });

test('a course path that matches its concepts, in order, passes', () => {
  assert.deepEqual(errorsOf(withPath([{ title: 'Unit 1', concepts: ['a'] }, { concepts: ['b'] }])), []);
});

test('a path fails on an unknown concept, a repeat, or a concept out of order', () => {
  has(errorsOf(withPath([{ concepts: ['a', 'b', 'ghost'] }])), 'ghost is not a concept');
  has(errorsOf(withPath([{ concepts: ['a', 'b', 'a'] }])), 'a appears twice');
  has(errorsOf(withPath([{ concepts: ['b', 'a'] }])), 'b comes before its prerequisite a');
});

test('a path must hold exactly the concepts that list its course', () => {
  has(errorsOf(withPath([{ concepts: ['a'] }])), 'b lists c1 but is not on its path');
  const other = concept('x', { courses: ['c2'], labs: [], candidate: 'An idea.' });
  has(errorsOf(withPath([{ concepts: ['a', 'b', 'x'] }], [concept('a'), concept('b', { requires: ['a'] }), other])), 'its courses do not list c1');
});

test('a path for an unknown course, or in the wrong file, fails', () => {
  const data = fixture();
  data.paths = [{ file: 'zz.js', path: { course: 'zz', units: [{ concepts: ['a', 'b'] }] } }];
  const errors = errorsOf(data);
  has(errors, 'course zz is not in courses.js');
  has(errorsOf({ ...fixture(), paths: [{ file: 'other.js', path: { course: 'c1', units: [{ concepts: ['a', 'b'] }] } }] }), 'expected c1.js');
});
