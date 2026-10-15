import { createLabRouter } from '@flux/core';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';

const router = createLabRouter({
  courseId: 'egn3321',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  emptyRoute: () => ({ examId: 'u1', labId: 'rectilinear' }),
});

export const COURSE = router.courseId;
export const parseRoute = router.parseRoute;
export const courseHash = router.courseHash;
export const parseHash = router.parseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
