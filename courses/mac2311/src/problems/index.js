import c1 from './bank/c1.js';
import u1 from './bank/u1.js';
import u2 from './bank/u2.js';
import u3 from './bank/u3.js';
import u4 from './bank/u4.js';
import ii1 from './bank/ii/u1.js';
import ii2 from './bank/ii/u2.js';
import ii3 from './bank/ii/u3.js';
import iiSeries from './bank/ii/series.js';
import ii4 from './bank/ii/u4.js';
import { calculusProblemId, calculusProblemUnit } from '@flux/tracks/calculus';
export { CHAPTER_TITLES } from '../data/catalog.js';
const merge = (tpl, source) => ({
  ...tpl,
  id: calculusProblemId(source, tpl.id),
  legacyId: tpl.id,
  exam: calculusProblemUnit(source, tpl.id),
  ch: source === 'mac2312' ? `v2.${tpl.ch}` : tpl.ch,
});
export const LEGACY_PROBLEMS = [
  ...[...u1, ...u2, ...u3, ...u4].map((t) => merge(t, 'mac2311')),
  ...[...ii1, ...ii2, ...ii3, ...iiSeries, ...ii4].map((t) => merge(t, 'mac2312')),
];
export const PROBLEMS = [...LEGACY_PROBLEMS.filter((t) => t.exam !== 'c1'), ...c1];
const byId = new Map([...LEGACY_PROBLEMS, ...PROBLEMS].map((t) => [t.id, t]));
export const problemById = (id) => byId.get(id) || null;
export const problemsForExam = (id) => PROBLEMS.filter((t) => t.exam === id);
export const CHAPTER_ORDER = ['2', '3', '4', '5', 'v2.2', 'v2.3', 'v2.7', 'v2.5', 'v2.6'];
