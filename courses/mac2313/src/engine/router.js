import { createLabRouter } from '@flux/core';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/ch2/gradient`) redirect onto it. */
const router = createLabRouter({
  courseId: 'mac2313',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  emptyRoute: () => ({ examId: 'ch2', labId: 'gradient' }),
});

export const COURSE = router.courseId;
export const parseRoute = router.parseRoute;
export const courseHash = router.courseHash;
export const parseHash = router.parseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
