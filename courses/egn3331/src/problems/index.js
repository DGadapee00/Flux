import ch1 from './bank/ch1.js';
import ch2 from './bank/ch2.js';
import ch4 from './bank/ch4.js';
import ch8 from './bank/ch8.js';

export const PROBLEMS = [...ch1, ...ch2, ...ch4, ...ch8];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '2', '3', '4', '8', '10'];

export { CHAPTER_TITLES } from '../data/catalog.js';
