import { browserStorage, createStore, memoryStorage } from '@flux/core';

export const STORE_KEY = 'flux.bench.problems.v1';
export const EXAM_KEY = 'flux.bench.exam.v1';
export const WIDTH_KEY = 'flux.bench.notes.width.v1';
export const FULL_KEY = 'flux.bench.notes.full.v1';

const SLOTS = [
  { name: 'problems', version: 1, key: STORE_KEY },
  { name: 'exam', version: 1, key: EXAM_KEY },
  { name: 'notes.width', version: 1, key: WIDTH_KEY },
  { name: 'notes.full', version: 1, key: FULL_KEY },
];

/** @param {object | null} [storage] @param {() => number} [now] */
export function courseStore(storage = browserStorage(), now) {
  return createStore({ courseId: 'bench', storage, slots: SLOTS, now });
}

export { browserStorage, memoryStorage };
