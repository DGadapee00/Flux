import { migrateCalculus } from './migration.js';
import { browserStorage, createStore, memoryStorage } from '@flux/core';

export const STORE_KEY = 'flux.mac2311.problems.v1';
export const EXAM_KEY = 'flux.mac2311.exam.v1';
export const WIDTH_KEY = 'flux.mac2311.notes.width.v1';
export const FULL_KEY = 'flux.mac2311.notes.full.v1';

export const MERGE_KEY = 'flux.mac2311.merge.v1';

const SLOTS = [
  { name: 'merge', version: 1, key: MERGE_KEY },
  { name: 'problems', version: 1, key: STORE_KEY },
  { name: 'exam', version: 1, key: EXAM_KEY },
  { name: 'notes.width', version: 1, key: WIDTH_KEY },
  { name: 'notes.full', version: 1, key: FULL_KEY },
];

/** @param {object | null} [storage] @param {() => number} [now] */
export function courseStore(storage = browserStorage(), now) {
  migrateCalculus(storage);
  return createStore({ courseId: 'mac2311', storage, slots: SLOTS, now });
}

export { browserStorage, memoryStorage };
