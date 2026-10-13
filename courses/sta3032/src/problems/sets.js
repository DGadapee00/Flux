/**
 * Named problem sets: a fixed list of templates in a fixed order, worked as a session on the
 * practice list or sat as a timed practice exam (#/<unit>/exam?set=<id>). The review set follows the
 * class's midterm review sheet question by question; each item names the worked case that is the
 * sheet's own question, so the first pass can use the sheet's numbers and later ones fresh numbers.
 */
import { problemById } from './index.js';
import { CASE_SEED } from './engine.js';

export const SETS = [
  {
    id: 'review1',
    units: ['mid', 'final'],
    title: 'Midterm review sheet',
    short: 'Review sheet',
    blurb: 'The eight questions of the class review sheet, in its order and wording, every part of each.',
    items: [
      { id: 'c1.summarize', src: 'Review 1, Q1' },
      { id: 'c4.pmf-missing', src: 'Review 1, Q2' },
      { id: 'c4.linear-combination', src: 'Review 1, Q3' },
      { id: 'c5.binom-three', src: 'Review 1, Q4' },
      { id: 'c5.poisson-period', src: 'Review 1, Q5' },
      { id: 'c4.density-k', src: 'Review 1, Q6' },
      { id: 'c6.uniform-wait', src: 'Review 1, Q7' },
      { id: 'c6.normal-spec', src: 'Review 1, Q8' },
    ],
  },
];

export const setById = (id) => SETS.find((s) => s.id === id) || null;
export const setsForUnit = (unitId) => SETS.filter((s) => s.units.includes(unitId));

/** The seed that opens an item's own worked case (the sheet's numbers), or null if it has none. */
export function sheetSeed(item) {
  const tpl = problemById(item.id);
  const i = tpl ? tpl.cases.findIndex((c) => c.src === item.src) : -1;
  if (i < 0) return null;
  return i === 0 ? 0 : CASE_SEED + i;
}
