import { createHUD as createMathHUD } from '@flux/shells/math/hud.js';
import { EXAMS, examById, LAB_META } from '../data/catalog.js';
import { course } from '../manifest.js';

const homeId = 'u2';

export function createHUD(api) {
  return createMathHUD(api, {
    exams: EXAMS,
    examById,
    labMeta: LAB_META,
    code: course.code,
    homeId,
  });
}
