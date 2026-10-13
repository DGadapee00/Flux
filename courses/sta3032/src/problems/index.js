/**
 * Problem bank for STA 3032 (Walpole, Myers, Myers & Ye; the teacher's notes). One file per
 * chapter; each exports an array of templates. See kit.js and PROBLEMS.md.
 */
import ch1 from './bank/ch1.js';
import ch2 from './bank/ch2.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import ch5 from './bank/ch5.js';
import ch6 from './bank/ch6.js';
import ch7 from './bank/ch7.js';
import ch8 from './bank/ch8.js';
import ch9 from './bank/ch9.js';
import ch10 from './bank/ch10.js';
import { UNITS, CHAPTER_ORDER, CHAPTER_TITLES } from '../data/catalog.js';

export const PROBLEMS = [...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9, ...ch10];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;

/** The problems a unit (exam) covers: every chapter it lists. */
export function problemsForUnit(unitId) {
  const u = UNITS.find((x) => x.id === unitId);
  return u ? PROBLEMS.filter((p) => u.chapters.includes(p.ch)) : [];
}

export const problemsForChapter = (ch) => PROBLEMS.filter((p) => p.ch === ch);

export { CHAPTER_ORDER, CHAPTER_TITLES };
export { instance, render, grade, answers, sig } from './engine.js';
