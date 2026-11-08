import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u3 from './bank/u3.js';
import u4 from './bank/u4.js';
import u5 from './bank/u5.js';
import { foldCoaching } from '@flux/shells/practice/coaching.js';
import { applyPrincipleTags } from '@flux/shells/practice/principles.js';
import coaching from './coaching/index.js';
import { PRINCIPLE_TAGS } from './principles.js';

/*
 * Traps, wrong-option explanations and extra hints live beside the bank (src/problems/coaching/),
 * one file per unit, and are folded in here so the app and the checker see the same thing.
 */
export const PROBLEMS = foldCoaching(applyPrincipleTags([...u1, ...u2, ...u3, ...u4, ...u5], PRINCIPLE_TAGS), coaching);

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '2', '3', '4', '5'];

export const CHAPTER_TITLES = {
  1: 'Bonding and structure',
  2: 'Defects',
  3: 'Phase diagrams',
  4: 'Failure',
  5: 'Polymers, glasses and corrosion',
};
