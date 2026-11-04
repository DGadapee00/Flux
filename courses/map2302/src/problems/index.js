import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u3 from './bank/u3.js';
import u4 from './bank/u4.js';
import u1m from './bank/u1-methods.js';
import u2m from './bank/u2-methods.js';
import u3m from './bank/u3-methods.js';
// The *-methods banks are the UNF supplement (exact equations through transform rules).
export const PROBLEMS = [...u1,...u1m,...u2,...u2m,...u3,...u3m,...u4];
export const problemById = id=>PROBLEMS.find(p=>p.id===id)||null;
export const problemsForExam = id=>PROBLEMS.filter(p=>p.exam===id);
export const problemsForLab = id=>PROBLEMS.filter(p=>p.lab===id);
export const CHAPTER_ORDER = ['1','2','3','4'];
export const CHAPTER_TITLES = {
  1:'First-order equations',2:'Second-order linear equations',
  3:'Fourier series and Laplace transforms',4:'First-order systems',
};
