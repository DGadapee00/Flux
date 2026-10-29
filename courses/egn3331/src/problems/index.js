import ch1 from './bank/ch1.js';
import ch2 from './bank/ch2.js';
import ch4 from './bank/ch4.js';
import ch5 from './bank/ch5.js';
import ch8 from './bank/ch8.js';
import ch6 from './bank/ch6.js';
import ch7 from './bank/ch7.js';
import ch9 from './bank/ch9.js';
import ch12 from './bank/ch12.js';
import ch13 from './bank/ch13.js';
import ch14 from './bank/ch14.js';
import { applyPrincipleTags } from '@flux/shells/practice/principles.js';
import { PRINCIPLE_TAGS } from './principles.js';

/** Each template's principle tags come from src/problems/principles.js. */
export const PROBLEMS = applyPrincipleTags([...ch1, ...ch2, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9, ...ch12, ...ch13, ...ch14], PRINCIPLE_TAGS);

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '13', '14'];

export { CHAPTER_TITLES } from '../data/catalog.js';
