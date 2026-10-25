import { createPractice as createPhysicsPractice } from '@flux/shells/physics/problems.js';
import { LAB_META, chapterSpan, examById, examLabel } from '../catalog.js';
import { GLYPH, checkUnits, choiceOptions, compile, exprToTex, expected, grade, instance, render, sig, withinTol } from '../problems/engine.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemById, problemsForExam } from '../problems/index.js';
import { INTERVAL_DAYS, MASTERED_BOX, createProgress, pickInterleave, pickSet } from '../problems/progress.js';

/** What a part with no label is called, when its id is a symbol: ("th" → "θ"). */
const PART_NAMES = { th: 'θ', mu: 'μ', w: 'ω', tau: 'τ', alpha: 'α', rho: 'ρ', dt: 'Δt', dx: 'Δx', dv: 'Δv' };

/** The practice panel over this course's bank, engine and progress. */
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
    examNote: (unit) => `Ch ${chapterSpan(unit)}`,
    LAB_META,
    homeId: 'u1',
    exprToTex,
    GLYPH,
    paletteConsts: ['g', 'pi'],
    unitName: 'unit',
    partNames: PART_NAMES,
  });
}
