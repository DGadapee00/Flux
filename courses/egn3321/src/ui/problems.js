import { createPractice as createEngineeringPractice } from '@flux/shells/engineering/problems.js';
import { LAB_META, examById } from '../data/catalog.js';
import { sectionForProblem } from '../notes/index.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemById, problemsForExam } from '../problems/index.js';
import { GLYPH, checkUnits, choiceOptions, compile, expected, exprToTex, grade, instance, render, sig, withinTol } from '../problems/engine.js';
import { CONFUSED, PRINCIPLES, TWINS } from '../problems/principles.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress, pickInterleave, pickSet } from '../problems/progress.js';

/** Unit the practice list opens on. The shell does not know it. */
const homeId = 'u1';

/**
 * Dynamics turns on the whole practice loop (packages/shells/practice/loop.js): the principle step,
 * faded worked examples, interleaving, the notes link, the lab drawer and the symbol palette.
 */
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
    principleConfused: CONFUSED,
    principleTwins: TWINS,
    fading: true,
    sectionForProblem,
    labDrawer: true,
    GLYPH,
    exprToTex,
    paletteConsts: ['g', 'pi'],
  });
}
