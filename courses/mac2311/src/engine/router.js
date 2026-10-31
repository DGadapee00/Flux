import { createLabRouter } from '@flux/core';
import { calculusDestination } from '@flux/tracks/calculus';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';
const router = createLabRouter({
  courseId: 'mac2311',
  exams: EXAMS,
  labMeta: LAB_META,
  examById,
  emptyRoute: () => ({ examId: 'c1', labId: 'limits' }),
});
export const COURSE = router.courseId;
export function parseRoute(hash) {
  const canonical = calculusDestination(hash);
  return { ...router.parseRoute(canonical), legacy: !!hash && canonical !== hash };
}
export function parseHash() {
  const hash = typeof location === 'undefined' ? '' : location.hash;
  const route = parseRoute(hash);
  if (typeof history !== 'undefined' && route.legacy)
    history.replaceState(null, '', router.courseHash(route.examId, route.labId, route.query));
  return route;
}
export const courseHash = router.courseHash;
export const problemQuery = router.problemQuery;
export const writeHash = router.writeHash;
export const neighborExam = router.neighborExam;
