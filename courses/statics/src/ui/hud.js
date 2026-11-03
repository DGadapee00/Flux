import { trackSiblings } from '@flux/tracks';
import { createHUD as createEngineeringHUD } from '@flux/shells/engineering/hud.js';
import { EXAMS, examById, LAB_META } from '../data/catalog.js';
import { notesDeps } from '../notes/deps.js';
import { course } from '../manifest.js';

/** Unit the app opens on. The shell does not know it. */
const homeId = 'u1';

export function createHUD(api) {
  return createEngineeringHUD(api, {
    exams: EXAMS,
    examById,
    labMeta: LAB_META,
    code: course.code,
    title: course.title,
    courseId: course.id,
    track: trackSiblings(course.id),
    homeId,
    notes: notesDeps,
  });
}

export { sciHTML } from '@flux/shells/engineering/format.js';
