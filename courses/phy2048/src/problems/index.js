/**
 * PHY 2048 problem bank, one module per OpenStax chapter.
 * Later chapters are named in the catalog and get a file here when they are written.
 */
import ch2 from './bank/ch2.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import ch5 from './bank/ch5.js';
import ch6 from './bank/ch6.js';
import ch7 from './bank/ch7.js';
import ch8 from './bank/ch8.js';
import { BANK_CHAPTERS, CHAPTERS } from '../catalog.js';

export const BY_CHAPTER = {
  2: ch2,
  3: ch3,
  4: ch4,
  5: ch5,
  6: ch6,
  7: ch7,
  8: ch8,
};

export const PROBLEMS = [...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byId.get(id) || null;

export { BANK_CHAPTERS, CHAPTERS };
