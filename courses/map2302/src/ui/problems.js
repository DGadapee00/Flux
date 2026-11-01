import { createPractice as createMathPractice } from '@flux/shells/math/problems.js';
import { LAB_META, examById } from '../data/catalog.js';
import { sectionForProblem } from '../notes/index.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemById, problemsForExam } from '../problems/index.js';
import { GLYPH, evalAtScope, checkUnits, choiceOptions, compile, expected, exprToTex, grade, instance, render, sig, withinTol } from '../problems/engine.js';
import { PRINCIPLES } from '../problems/principles.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress, pickInterleave, pickSet } from '../problems/progress.js';

/** Unit the practice list opens on. The shell does not know it. */
const homeId = 'u1';

/**
 * Every feature of the practice loop is on (packages/shells/practice/loop.js): principle tags,
 * faded worked examples, interleaving, the notes link, the lab drawer and the symbol palette. A new
 * course keeps them all on.
 */
export function createPractice(api) {
  return createMathPractice(api, {
    PROBLEMS,
    practiceLabel: exam => `Unit ${exam.n}`,
    assessmentFor: exam => exam.id === 'u4' ? { label: 'Cumulative final practice', templates: PROBLEMS } : null,
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
    checkUnits,
    choiceOptions,
    createProgress,
    pickSet,
    pickInterleave,
    MASTERED_BOX,
    INTERVAL_DAYS,
    examById,
    LAB_META,
    homeId,
    PRINCIPLES,
    fading: true,
    choiceNotes: true,
    sectionForProblem,
    labDrawer: true,
    GLYPH,
    exprToTex,
    paletteConsts: ['g', 'pi'],
  });
}
