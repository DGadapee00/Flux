/**
 * PHY 2048 problem bank. Chapters 2–4 are the first slice. Later chapters are
 * named in the catalog and get a file here when their problems are written.
 */
import ch2 from './bank/ch2.js';
import ch3 from './bank/ch3.js';
import ch4 from './bank/ch4.js';
import { BANK_CHAPTERS, CHAPTERS } from '../catalog.js';

export const BY_CHAPTER = {
  2: ch2,
  3: ch3,
  4: ch4,
};

export const PROBLEMS = [...ch2, ...ch3, ...ch4];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byId.get(id) || null;

export { BANK_CHAPTERS, CHAPTERS };
