import assert from 'node:assert/strict';
import test from 'node:test';
import { defineCourse, defineLab, problem } from '../src/index.js';

test('defineCourse returns the manifest and keeps the id', () => {
  const spec = {
    id: 'demo',
    code: 'ABC 0000',
    title: 'Demo',
    subject: 'math',
    term: 'Fall 2026',
    units: [],
    chapters: {},
    labs: () => Promise.resolve({}),
    problems: () => Promise.resolve([]),
  };
  const course = defineCourse(spec);
  assert.equal(course.id, 'demo');
  assert.equal(course.subject, 'math');
  assert.notEqual(course, spec);
});

test('defineCourse rejects an id that cannot be a storage namespace', () => {
  assert.throws(() => defineCourse({ id: '' }), TypeError);
  assert.throws(() => defineCourse({ id: 'PHY2049' }), TypeError);
  assert.throws(() => defineCourse({}), TypeError);
});

test('defineLab requires an id and passes the spec through', () => {
  const lab = defineLab({ id: 'vectors', title: 'Vectors' });
  assert.equal(lab.id, 'vectors');
  assert.equal(lab.title, 'Vectors');
  assert.throws(() => defineLab({ title: 'Vectors' }), TypeError);
});

test('problem fills the shared defaults and lets the spec override them', () => {
  const blank = problem({ id: 'p1' });
  assert.equal(blank.level, 1);
  assert.deepEqual(blank.topics, []);
  assert.deepEqual(blank.cases, []);
  assert.equal(blank.valid(), true);
  assert.deepEqual(blank.derive(), {});

  const custom = problem({ id: 'p2', level: 3, topics: ['one'], valid: () => false });
  assert.equal(custom.level, 3);
  assert.deepEqual(custom.topics, ['one']);
  assert.equal(custom.valid(), false);
});
