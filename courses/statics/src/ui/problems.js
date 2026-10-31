import { sectionForProblem } from '../notes/index.js';
import { createPractice as createEngineeringPractice } from '@flux/shells/engineering/problems.js';
import { PROBLEMS, problemById, problemsForExam, CHAPTER_ORDER, CHAPTER_TITLES } from '../problems/index.js';
import { instance, render, grade, expected, sig, withinTol, compile, checkUnits, choiceOptions, GLYPH, exprToTex } from '../problems/engine.js';
import { createProgress, pickSet, pickInterleave, MASTERED_BOX, INTERVAL_DAYS } from '../problems/progress.js';
import { examById, LAB_META } from '../data/catalog.js';

/** Unit the practice list opens on. The shell does not know it. */
const homeId = 'u1';

export function createPractice(api) {
  return createEngineeringPractice(api, {
    PROBLEMS,
    problemById,
    problemsForExam,
    CHAPTER_ORDER,
    CHAPTER_TITLES,
    instance,
    render,
    grade,
    expected,
    sig,
    withinTol,
    compile,
    checkUnits,
    createProgress,
    pickSet,
    MASTERED_BOX,
    INTERVAL_DAYS,
    examById,
    LAB_META,
    homeId,
    choiceOptions, GLYPH, exprToTex, pickInterleave, sectionForProblem,
    fading: true, labDrawer: true, choiceNotes: true,
    paletteConsts: ['g', 'pi'],
  });
}
