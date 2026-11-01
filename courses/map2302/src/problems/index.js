import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u3 from './bank/u3.js';
import u4 from './bank/u4.js';
export const PROBLEMS = [...u1,...u2,...u3,...u4];
export const problemById = id=>PROBLEMS.find(p=>p.id===id)||null;
export const problemsForExam = id=>PROBLEMS.filter(p=>p.exam===id);
export const problemsForLab = id=>PROBLEMS.filter(p=>p.lab===id);
export const CHAPTER_ORDER = ['1','2','3','4'];
export const CHAPTER_TITLES = {
  1:'First-order equations',2:'Second-order linear equations',
  3:'Fourier series and Laplace transforms',4:'First-order systems',
};
