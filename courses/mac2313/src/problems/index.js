/**
 * Problem bank for MAC 2313. Each bank module exports an array of templates.
 */
import ch2 from './bank/ch2.js';
import ch2more from './bank/ch2more.js';
import ch2pc from './bank/ch2pc.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import ch1 from './bank/ch1.js';
import ch5 from './bank/ch5.js';

export const PROBLEMS = [...ch1, ...ch2, ...ch2more, ...ch2pc, ...ch3, ...ch4, ...ch5];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '2', '3', '4', '5'];

export const CHAPTER_TITLES = {
  1: 'Preliminaries',
  2: 'Functions of two variables',
  3: 'Double integrals',
  4: 'Functions of three variables',
  5: 'Triple integrals',
};

export { instance, render, grade, answers, sig } from './engine.js';
export { applyProblem } from './simbridge.js';
