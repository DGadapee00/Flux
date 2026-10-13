import { createLabRouter } from '@flux/core';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/u2/moments`) redirect onto it. */
const router = createLabRouter({
  courseId: 'statics',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  emptyRoute: () => ({ examId: 'u1', labId: 'vectors' }),
});

export const COURSE = router.courseId;
export const parseRoute = router.parseRoute;
export const courseHash = router.courseHash;
export const parseHash = router.parseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
