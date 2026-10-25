/** PHY 2048 problem bank, one module per OpenStax chapter this course keeps. */
import ch2 from './bank/ch2.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import ch5 from './bank/ch5.js';
import ch6 from './bank/ch6.js';
import ch7 from './bank/ch7.js';
import ch8 from './bank/ch8.js';
import ch9 from './bank/ch9.js';
import ch10 from './bank/ch10.js';
import ch11 from './bank/ch11.js';
import ch12 from './bank/ch12.js';
import ch13 from './bank/ch13.js';
import ch15 from './bank/ch15.js';
import { BANK_CHAPTERS, CHAPTERS } from '../catalog.js';

export const BY_CHAPTER = {
  2: ch2,
  3: ch3,
  4: ch4,
  5: ch5,
  6: ch6,
  7: ch7,
  8: ch8,
  9: ch9,
  10: ch10,
  11: ch11,
  12: ch12,
  13: ch13,
  15: ch15,
};

export const PROBLEMS = [
  ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8,
  ...ch9, ...ch10, ...ch11, ...ch12, ...ch13, ...ch15,
];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byId.get(id) || null;

export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

/** Chapters in the order a student meets them. Only chapters with problems appear. */
export const CHAPTER_ORDER = BANK_CHAPTERS;
export const CHAPTER_TITLES = CHAPTERS;

export { BANK_CHAPTERS, CHAPTERS };
