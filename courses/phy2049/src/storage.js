import { browserStorage, createStore, memoryStorage } from '@flux/core';

export const STORE_KEY = 'flux.phy2049.problems.v1';
export const EXAM_KEY = 'flux.phy2049.exam.v1';
export const PREDICT_KEY = 'flux.phy2049.predict.v1';
export const WIDTH_KEY = 'flux.phy2049.notes.width.v1';
export const FULL_KEY = 'flux.phy2049.notes.full.v1';

export const LEGACY_STORE_KEY = 'flux.problems.v1';
export const LEGACY_EXAM_KEY = 'flux.exam.v1';
export const LEGACY_PREDICT_KEY = 'flux.predict.v1';
export const LEGACY_WIDTH_KEY = 'flux.notes.width';
export const LEGACY_FULL_KEY = 'flux.notes.full';

const SLOTS = [
  { name: 'problems', version: 1, key: STORE_KEY, legacy: LEGACY_STORE_KEY },
  { name: 'exam', version: 1, key: EXAM_KEY, legacy: LEGACY_EXAM_KEY },
  { name: 'predict', version: 1, key: PREDICT_KEY, legacy: LEGACY_PREDICT_KEY },
  { name: 'notes.width', version: 1, key: WIDTH_KEY, legacy: LEGACY_WIDTH_KEY },
  { name: 'notes.full', version: 1, key: FULL_KEY, legacy: LEGACY_FULL_KEY },
];

/** @param {object | null} [storage] @param {() => number} [now] */
export function courseStore(storage = browserStorage(), now) {
  return createStore({ courseId: 'phy2049', storage, slots: SLOTS, now });
}

export { browserStorage, memoryStorage };
