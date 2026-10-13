/**
 * Named problem sets: a fixed list of templates in a fixed order, worked as a session on the
 * practice list or sat as a timed practice exam (#/<unit>/exam?set=<id>). The review set follows the
 * class's midterm review sheet question by question; each item names the worked case that is the
 * sheet's own question, so the first pass can use the sheet's numbers and later ones fresh numbers.
 */
import { problemById } from './index.js';
import { CASE_SEED } from './engine.js';

// The class review-sheet set was removed on 13 Oct 2026 (see PROVENANCE.md). Named sets
// can be added here again; problems-check checks each one.
export const SETS = [];

export const setById = (id) => SETS.find((s) => s.id === id) || null;
export const setsForUnit = (unitId) => SETS.filter((s) => s.units.includes(unitId));

/** The seed that opens an item's own worked case (the sheet's numbers), or null if it has none. */
export function sheetSeed(item) {
  const tpl = problemById(item.id);
  const i = tpl ? tpl.cases.findIndex((c) => c.src === item.src) : -1;
  if (i < 0) return null;
  return i === 0 ? 0 : CASE_SEED + i;
}
