/**
 * Progress files for the courses on the hub.
 * A course file restores that course. A hub file restores every course.
 * A section whose course id does not match is refused, and nothing is written.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { exportBundle, importBundle, memoryStorage } from '@flux/core';
import { courseStore as calc1Store } from '@flux/mac2311/src/storage.js';
import { courseStore as calc2Store } from '@flux/mac2312/src/storage.js';
import { courseStore as macStore } from '@flux/mac2313/src/storage.js';
import { courseStore as phyStore } from '@flux/phy2049/src/storage.js';
import { courseStore as staStore } from '@flux/sta3032/src/storage.js';
import { courseStore as dynamicsStore } from '@flux/egn3321/src/storage.js';
import { courseStore as staticsStore } from '@flux/statics/src/storage.js';

const COURSES = [
  ['phy2049', phyStore],
  ['mac2311', calc1Store],
  ['mac2312', calc2Store],
  ['mac2313', macStore],
  ['statics', staticsStore],
  ['sta3032', staStore],
  ['egn3321', dynamicsStore],
];

function parts(fill) {
  return COURSES.map(([courseId, make], i) => {
    const store = make(memoryStorage(), () => 0);
    if (fill) store.writeJSON('problems', { v: 1, courseId, n: i });
    return { courseId, store };
  });
}

test('each course export restores that course and rejects another course id', () => {
  const saved = parts(true);
  const fresh = parts(false);
  for (let i = 0; i < saved.length; i++) {
    fresh[i].store.importJSON(saved[i].store.exportJSON());
    assert.equal(fresh[i].store.readJSON('problems').n, i);
    assert.throws(() => fresh[i].store.importJSON(saved[(i + 1) % saved.length].store.exportJSON()), /does not match this course/);
    assert.equal(fresh[i].store.readJSON('problems').n, i);
  }
});

test('one hub file round-trips every course', () => {
  const saved = parts(true);
  const blob = exportBundle(saved);
  assert.deepEqual(Object.keys(blob.courses), ['phy2049', 'mac2311', 'mac2312', 'mac2313', 'statics', 'sta3032', 'egn3321']);
  const fresh = parts(false);
  importBundle(blob, fresh);
  for (let i = 0; i < fresh.length; i++) assert.equal(fresh[i].store.readJSON('problems').n, i);
});

test('a wrong id inside one section writes nothing', () => {
  const saved = parts(true);
  const blob = exportBundle(saved);
  blob.courses.phy2049.courseId = 'mac2313';
  const fresh = parts(false);
  assert.throws(() => importBundle(blob, fresh), /does not match this course/);
  for (const part of fresh) assert.equal(part.store.readJSON('problems'), null);
});

test('a single-course file is not a hub backup', () => {
  const saved = parts(true);
  const fresh = parts(false);
  assert.throws(() => importBundle(saved[0].store.exportJSON(), fresh), /does not match this backup/);
  for (const part of fresh) assert.equal(part.store.readJSON('problems'), null);
});
