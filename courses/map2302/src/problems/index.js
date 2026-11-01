import u1 from './bank/u1.js';
export const PROBLEMS = [...u1];
export const problemById = id=>PROBLEMS.find(p=>p.id===id)||null;
export const problemsForExam = id=>PROBLEMS.filter(p=>p.exam===id);
export const problemsForLab = id=>PROBLEMS.filter(p=>p.lab===id);
export const CHAPTER_ORDER = ['1','2','3','4'];
export const CHAPTER_TITLES = {
  1:'First-order equations',2:'Second-order linear equations',
  3:'Fourier series and Laplace transforms',4:'First-order systems',
};
