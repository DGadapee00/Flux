import { createHUD as createEngineeringHUD } from '@flux/shells/engineering/hud.js';
import { EXAMS, LAB_META, examById } from '../data/catalog.js';
import { course } from '../manifest.js';
import { notesDeps } from '../notes/deps.js';

/** Unit the app opens on. The shell does not know it. */
const homeId = 'u1';

export function createHUD(api) {
  return createEngineeringHUD(api, {
    exams: EXAMS,
    examById,
    labMeta: LAB_META,
    title: course.title,
    wordmark: course.code,
    homeId,
    notes: notesDeps,
  });
}
