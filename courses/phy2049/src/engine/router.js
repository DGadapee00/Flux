import { createLabRouter } from '@flux/core';
import { EXAMS, LAB_META, examById, nextExam } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/e2/gauss`) redirect onto it. */
const router = createLabRouter({
  courseId: 'phy2049',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  seedFloor: -99, // negative: a sheet's own case
  emptyRoute: () => {
    const exam = nextExam();
    return { examId: exam.id, labId: exam.labs[0] || null };
  },
});

export const COURSE = router.courseId;
export const parseRoute = router.parseRoute;
export const courseHash = router.courseHash;
export const parseHash = router.parseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
