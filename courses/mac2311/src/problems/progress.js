import { CHAPTER_ORDER } from './index.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress as createCoreProgress, pickSet as corePickSet } from '@flux/core';
import { browserStorage, courseStore } from '../storage.js';

export { EXAM_KEY, STORE_KEY, browserStorage, memoryStorage } from '../storage.js';
export { INTERVAL_DAYS, MASTERED_BOX };

export function createProgress(storage = browserStorage(), { now } = {}) {
  return createCoreProgress(courseStore(storage, now));
}

export function pickSet(templates, progress, opts = {}) {
  return corePickSet(templates, progress, { ...opts, chapterOrder: CHAPTER_ORDER });
}
