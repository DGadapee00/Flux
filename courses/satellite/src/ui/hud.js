import { trackSiblings } from '@flux/tracks';
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
    code: course.code,
    title: course.title,
    courseId: course.id,
    // The project guide (guide.html) is this course's front page. The row ends with a way back to it.
    track: [...trackSiblings(course.id), { id: 'guide', code: 'GUIDE →', title: 'The project guide: subsystems, methods and checklists', href: 'guide.html' }],
    homeId,
    notes: notesDeps,
  });
}
