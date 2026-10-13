import { browserStorage, createStore, memoryStorage } from '@flux/core';

export const STORE_KEY = 'flux.sta3032.problems.v1';
export const EXAM_KEY = 'flux.sta3032.exam.v1';
export const TALLY_KEY = 'flux.sta3032.labs.v1';

export const LEGACY_STORE_KEY = 'fluxstats.problems.v1';
export const LEGACY_EXAM_KEY = 'fluxstats.exam.v1';
export const LEGACY_TALLY_KEY = 'fluxstats.labs.v1';

const SLOTS = [
  { name: 'problems', version: 1, key: STORE_KEY, legacy: LEGACY_STORE_KEY },
  { name: 'exam', version: 1, key: EXAM_KEY, legacy: LEGACY_EXAM_KEY },
  { name: 'labs', version: 1, key: TALLY_KEY, legacy: LEGACY_TALLY_KEY },
];

/** @param {object | null} [storage] @param {() => number} [now] */
export function courseStore(storage = browserStorage(), now) {
  return createStore({ courseId: 'sta3032', storage, slots: SLOTS, now });
}

export { browserStorage, memoryStorage };
