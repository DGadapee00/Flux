/** Every lab, in the order the Explore list shows them. */
import dist from './dist.js';
import clt from './clt.js';
import ci from './ci.js';
import power from './power.js';
import tests from './tests.js';
import reg from './reg.js';
import describe from './describe.js';
import cond from './cond.js';
import npp from './npp.js';
import paired from './paired.js';

export const LABS = [describe, cond, dist, npp, clt, ci, power, tests, paired, reg];

export const labById = (id) => LABS.find((l) => l.id === id) || null;

/** The labs a chapter's problems point to, most direct first. */
const FOR_CHAPTER = {
  1: ['describe'],
  2: ['cond'],
  3: ['dist'],
  4: ['dist'],
  5: ['dist'],
  6: ['dist', 'npp'],
  7: ['clt'],
  8: ['ci', 'power', 'tests', 'npp'],
  9: ['paired', 'tests'],
  10: ['reg', 'tests'],
};
export const labsForChapter = (ch) => (FOR_CHAPTER[ch] || []).map(labById).filter(Boolean);
