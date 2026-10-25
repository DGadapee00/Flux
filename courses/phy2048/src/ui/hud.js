import '../engine/frame.js'; // configures the frame helpers the HUD reads from core
import { createHUD as createPhysicsHUD } from '@flux/shells/physics/hud.js';
import { EXAMS, LAB_META, chapterSpan, examById, examLabel, examLongLabel } from '../catalog.js';
import { course } from '../manifest.js';

export function createHUD(api) {
  return createPhysicsHUD(api, {
    exams: EXAMS,
    examById,
    examLabel,
    examLongLabel,
    labMeta: LAB_META,
    code: course.code,
    homeId: 'u1',
    unitName: 'unit',
    examNote: (unit) => `Ch ${chapterSpan(unit)}`,
  });
}
