import { trackSiblings } from '@flux/tracks';
import { createHUD as createMathHUD } from '@flux/shells/math/hud.js';
import { EXAMS, examById, LAB_META } from '../data/catalog.js';
import { course } from '../manifest.js';

/** Unit the app opens on. The shell does not know it. */
const homeId = 'ch2';

export function createHUD(api) {
  return createMathHUD(api, {
    exams: EXAMS,
    examById,
    labMeta: LAB_META,
    code: course.code,
    title: course.title,
    courseId: course.id,
    track: trackSiblings(course.id),
    homeId,
  });
}

export { sciHTML } from '@flux/shells/math/format.js';
