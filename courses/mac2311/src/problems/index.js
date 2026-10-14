import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u4 from './bank/u4.js';

export const PROBLEMS = [...u1, ...u2, ...u4];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byId.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);

export const CHAPTER_ORDER = ['2', '3', '4', '5'];

export const CHAPTER_TITLES = {
  2: 'Limits',
  3: 'Derivatives',
  4: 'Applications of differentiation',
  5: 'Integration',
};
