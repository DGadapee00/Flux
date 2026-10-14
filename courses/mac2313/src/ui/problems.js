import { createPractice as createMathPractice } from '@flux/shells/math/problems.js';
import { PROBLEMS, problemById, problemsForExam, CHAPTER_ORDER, CHAPTER_TITLES } from '../problems/index.js';
import { instance, render, grade, expected, sig, withinTol, compile, evalAtScope, exprToTex, GLYPH } from '../problems/engine.js';
import { createProgress, pickSet, MASTERED_BOX, INTERVAL_DAYS } from '../problems/progress.js';
import { examById, LAB_META } from '../data/catalog.js';

/** Unit the practice list opens on. The shell does not know it. */
const homeId = 'ch2';

export function createPractice(api) {
  return createMathPractice(api, {
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
    evalAtScope,
    exprToTex,
    GLYPH,
    createProgress,
    pickSet,
    MASTERED_BOX,
    INTERVAL_DAYS,
    examById,
    LAB_META,
    homeId,
  });
}
