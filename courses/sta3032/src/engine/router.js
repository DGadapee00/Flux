import { unitById, nextUnit } from '../data/catalog.js';

/**
 * Routes, all in the hash so every screen is a link (FLUX's scheme, with modes for labs):
 *
 *   #/mid                         practice list for the midterm
 *   #/mid?p=c5.binom-table&s=3    that problem, version 3 (s=0 is the notes' or book's numbers)
 *   #/mid/exam                    the practice exam
 *   #/mid/notes · /explore · /tables
 *   #/final/explore/clt           a lab
 *   #/final/explore/dist?sc=heights  a lab set up on one of its scenarios (from a notes example)
 *   #/mid/notes/5                 a chapter's notes
 *
 * With no link, the app opens the practice list for the exam coming up next.
 */
export const MODES = ['practice', 'notes', 'explore', 'tables', 'exam'];

export function parseHash(hash = typeof location === 'undefined' ? '' : location.hash) {
  const full = hash.replace(/^#\/?/, '');
  const [path, query = ''] = full.split('?');
  const params = new URLSearchParams(query);
  const [a, b, c] = path.split('/').filter(Boolean);
  const unit = unitById(a) || nextUnit();
  const mode = MODES.includes(b) ? b : 'practice';
  const s = params.get('s');
  return {
    unitId: unit.id,
    mode,
    problemId: params.get('p') || null,
    seed: s != null && Number.isFinite(Number(s)) ? Math.max(0, Math.floor(Number(s))) : null,
    set: params.get('set') || null,
    labId: mode === 'explore' && c ? c : null,
    scenario: mode === 'explore' && c ? params.get('sc') || null : null,
    chapter: mode === 'notes' && c ? c : null,
    bare: !full,
  };
}

export function hashFor({ unitId, mode = 'practice', problemId = null, seed = null, set = null, labId = null, chapter = null, scenario = null }) {
  const q = new URLSearchParams();
  if (problemId) q.set('p', problemId);
  if (problemId && seed != null) q.set('s', String(seed));
  if (set) q.set('set', set);
  if (mode === 'explore' && labId && scenario) q.set('sc', scenario);
  const qs = q.toString();
  const lab = mode === 'explore' && labId ? `/${labId}` : mode === 'notes' && chapter ? `/${chapter}` : '';
  return `#/${unitId}${mode === 'practice' ? '' : `/${mode}`}${lab}${qs ? `?${qs}` : ''}`;
}

export function go(route, { replace = false } = {}) {
  const next = hashFor(route);
  if (location.hash === next) return false;
  if (replace) {
    history.replaceState(null, '', next);
    return false;
  }
  location.hash = next;
  return true;
}
