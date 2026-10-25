import { createPractice as createPhysicsPractice } from '@flux/shells/physics/problems.js';
import { examById, examLabel, LAB_META } from '../data/catalog.js';
import { sectionForProblem } from '../notes/index.js';
import { GLYPH, checkUnits, choiceOptions, compile, exprToTex, expected, grade, instance, render, sig, withinTol } from '../problems/engine.js';
import { guidanceFor, workedExample } from '../problems/fading.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemById, problemsForExam } from '../problems/index.js';
import { asksPrinciple, gradePrinciple, primaryOf, principleOptions, UNSURE } from '../problems/principle-step.js';
import { PRINCIPLES } from '../problems/principles.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress, pickInterleave, pickSet } from '../problems/progress.js';
import { sequenceRank, stageOf } from '../problems/sequence.js';
import { caseIndex, sheetCaseLabel, sheetItems } from '../problems/sheets.js';

/**
 * "Which principle decides this problem?" before the parts open. Off: students found it slowed every
 * problem without helping. The solution still names the deciding principle, and grouping by
 * principle still works. Set true to bring the question back.
 */
const ASK_PRINCIPLE = false;

/** The practice panel over this course's bank, engine, progress and notes. */
export function createPractice(api) {
  return createPhysicsPractice(api, {
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
    examLabel,
    examNote: (exam) => `Ch ${exam.chapters}`,
    LAB_META,
    homeId: 'e2',
    PRINCIPLES,
    primaryOf,
    asksPrinciple,
    principleOptions,
    gradePrinciple,
    UNSURE,
    ASK_PRINCIPLE,
    guidanceFor,
    workedExample,
    sectionForProblem,
    sequenceRank,
    stageOf,
    sheetItems,
    sheetCaseLabel,
    caseIndex,
    exprToTex,
    GLYPH,
    paletteConsts: ['k', 'eps0', 'mu0', 'pi'],
  });
}
