import { createLabRouter } from '@flux/core';
import { EXAMS, LAB_META, examById, nextExam } from '../catalog.js';

const router = createLabRouter({
  courseId: 'phy2048',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  emptyRoute: () => {
    const unit = nextExam();
    return { examId: unit.id, labId: unit.labs[0] || null };
  },
});

export const COURSE = router.courseId;
export const parseRoute = router.parseRoute;
export const courseHash = router.courseHash;
export const parseHash = router.parseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
