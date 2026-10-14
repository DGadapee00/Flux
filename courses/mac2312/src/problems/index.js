import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u3 from './bank/u3.js';

export const PROBLEMS = [...u1, ...u2, ...u3];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byId.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);

export const CHAPTER_ORDER = ['2', '3', '5', '6', '7'];

export const CHAPTER_TITLES = {
  2: 'Applications of integration',
  3: 'Techniques of integration',
  5: 'Sequences and series',
  6: 'Power series',
  7: 'Parametric and polar',
};
