import { browserStorage, createStore, memoryStorage } from '@flux/core';

export const STORE_KEY = 'flux.statics.problems.v1';
export const WIDTH_KEY = 'flux.statics.notes.width.v1';
export const FULL_KEY = 'flux.statics.notes.full.v1';
export const EXAM_KEY = 'flux.statics.exam.v1';

export const LEGACY_STORE_KEY = 'flux-statics.problems.v1';
export const LEGACY_EXAM_KEY = 'flux-statics.exam.v1';

const SLOTS = [
  { name: 'notes.width', version: 1, key: WIDTH_KEY },
  { name: 'notes.full', version: 1, key: FULL_KEY },
  { name: 'problems', version: 1, key: STORE_KEY, legacy: LEGACY_STORE_KEY },
  { name: 'exam', version: 1, key: EXAM_KEY, legacy: LEGACY_EXAM_KEY },
];

/** @param {object | null} [storage] @param {() => number} [now] */
export function courseStore(storage = browserStorage(), now) {
  return createStore({ courseId: 'statics', storage, slots: SLOTS, now });
}

export { browserStorage, memoryStorage };
