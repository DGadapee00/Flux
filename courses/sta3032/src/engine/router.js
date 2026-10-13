import { createModesRouter } from '@flux/core';
import { nextUnit, unitById } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/mid`, `#/final/explore/clt`) redirect onto it. */
const router = createModesRouter({
  courseId: 'sta3032',
  modes: ['practice', 'explore', 'tables', 'exam'],
  unitById,
  nextUnit,
  retired: ['notes'],
});

export const COURSE = router.courseId;
export const MODES = router.modes;
export const parseHash = router.parseHash;
export const hashFor = router.hashFor;
export const go = router.go;
