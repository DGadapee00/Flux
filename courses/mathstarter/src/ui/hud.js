import { TRACKS, trackSiblings, siblingHref } from '@flux/tracks';
import { createHUD as createMathHUD } from '@flux/shells/math/hud.js';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';
import { course } from '../manifest.js';
import { notesDeps } from '../notes/deps.js';

/** Unit the app opens on. The shell does not know it. */
const homeId = 'u1';

export function createHUD(api) {
  return createMathHUD(api, {
    exams: EXAMS,
    examById,
    labMeta: LAB_META,
    code: course.code,
    title: course.title,
    courseId: course.id,
    track: trackSiblings(course.id).length ? trackSiblings(course.id) : TRACKS.find(t=>t.id===course.track).courses.map(c=>({...c,href:c.href?siblingHref(c.href):null})),
    homeId,
    predictions: true,
    notes: notesDeps,
  });
}
