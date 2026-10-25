import '../engine/frame.js'; // configures the frame helpers the HUD reads from core
import { createHUD as createPhysicsHUD } from '@flux/shells/physics/hud.js';
import { EXAMS, LAB_META, examById, examLabel, examLongLabel } from '../data/catalog.js';
import { resetChargeListSig } from '../labs/charges-ui.js';
import { course } from '../manifest.js';
import { drawAC, drawPaschen, drawRC, drawVI, drawVx } from './plot.js';

/** The mini-plots, by the `type` a lab's plot() returns. */
const plots = {
  Vx: (canvas, plot) => drawVx(canvas, plot.xs, plot.Vs, plot.xProbe, plot.xA),
  ac: (canvas, plot) => drawAC(canvas, plot.power, plot.t),
  vi: drawVI,
  paschen: drawPaschen,
  rc: drawRC,
};

/** What the keys list says for the actions only these labs have. */
const keyActions = {
  sweep: ['Space', 'Play or pause the sum'],
  'add+': ['+', 'Add a positive charge'],
  'add-': ['−', 'Add a negative charge'],
  delete: ['Delete', 'Remove the selected charge'],
};

export function createHUD(api) {
  return createPhysicsHUD(api, {
    exams: EXAMS,
    examById,
    examLabel,
    examLongLabel,
    labMeta: LAB_META,
    code: course.code,
    homeId: 'e2',
    unitName: 'exam',
    examNote: (exam) => `Ch ${exam.chapters}`,
    plots,
    labPanel: { reset: resetChargeListSig },
    keyActions,
  });
}

export { sciHTML } from './format.js';
