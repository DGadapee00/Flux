/**
 * Practice progress for this course. The Leitner rules live in @flux/core.
 * A clean solve promotes only when the item was already due, and `cap` clamps the next review.
 */
import { CHAPTER_ORDER } from '../data/catalog.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress as createCoreProgress, pickInterleave as corePickInterleave, pickSet as corePickSet } from '@flux/core';
import { browserStorage, courseStore } from '../storage.js';

export { EXAM_KEY, STORE_KEY, browserStorage, memoryStorage } from '../storage.js';
export { INTERVAL_DAYS, MASTERED_BOX };

export function createProgress(storage = browserStorage(), { now } = {}) {
  return createCoreProgress(courseStore(storage, now), { promoteWhenDue: true });
}

export function pickSet(templates, progress, opts = {}) {
  return corePickSet(templates, progress, { reserveConcept: true, ...opts, chapterOrder: CHAPTER_ORDER });
}

export function pickInterleave(templates, progress, opts = {}) {
  return corePickInterleave(templates, progress, { ...opts, chapterOrder: CHAPTER_ORDER });
}
