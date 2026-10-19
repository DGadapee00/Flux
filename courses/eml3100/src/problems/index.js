import ch2 from './bank/ch2.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import ch5 from './bank/ch5.js';

export const PROBLEMS = [...ch2, ...ch3, ...ch4, ...ch5];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['2', '3', '4', '5'];

export { CHAPTER_TITLES } from '../data/catalog.js';
