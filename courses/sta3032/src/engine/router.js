import { unitById, nextUnit } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/mid`, `#/final/explore/clt`) redirect onto it. */
export const COURSE = 'sta3032';

/**
 * Routes, all in the hash so every screen is a link (FLUX's scheme, with modes for labs):
 *
 *   #/sta3032/mid                         practice list for the midterm
 *   #/sta3032/mid?p=c5.binom-table&s=3    that problem, version 3 (s=0 is the notes' or book's numbers)
 *   #/sta3032/mid/exam                    the practice exam
 *   #/sta3032/mid/notes · /explore · /tables
 *   #/sta3032/final/explore/clt           a lab
 *   #/sta3032/final/explore/dist?sc=heights  a lab set up on one of its scenarios (from a notes example)
 *   #/sta3032/mid/notes/5                 a chapter's notes
 *
 * With no link, the app opens the practice list for the exam coming up next.
 * An old hash with no course prefix is the same route, and `legacy` is true.
 */
export const MODES = ['practice', 'notes', 'explore', 'tables', 'exam'];

/**
 * @param {string} [hash] Pass a hash to parse it without touching history. Omit it to read
 * `location.hash`; a legacy hash is then rewritten with `history.replaceState`.
 */
export function parseHash(hash) {
  const fromLocation = hash === undefined;
  const raw = fromLocation ? (typeof location === 'undefined' ? '' : location.hash) : hash;
  const full = String(raw || '').replace(/^#\/?/, '');
  const qAt = full.indexOf('?');
  const path = qAt === -1 ? full : full.slice(0, qAt);
  const query = qAt === -1 ? '' : full.slice(qAt + 1);
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  const legacy = parts.length > 0 && parts[0] !== COURSE;
  if (parts[0] === COURSE) parts.shift();
  const [a, b, c] = parts;
  const unit = unitById(a) || nextUnit();
  const mode = MODES.includes(b) ? b : 'practice';
  const s = params.get('s');
  const route = {
    unitId: unit.id,
    mode,
    problemId: params.get('p') || null,
    seed: s != null && Number.isFinite(Number(s)) ? Math.max(0, Math.floor(Number(s))) : null,
    set: params.get('set') || null,
    labId: mode === 'explore' && c ? c : null,
    scenario: mode === 'explore' && c ? params.get('sc') || null : null,
    chapter: mode === 'notes' && c ? c : null,
    bare: parts.length === 0 && query === '',
    legacy,
  };
  if (fromLocation && legacy && typeof location !== 'undefined' && typeof history !== 'undefined') {
    const next = hashFor(route);
    if (location.hash !== next) history.replaceState(null, '', next);
  }
  return route;
}

export function hashFor({ unitId, mode = 'practice', problemId = null, seed = null, set = null, labId = null, chapter = null, scenario = null }) {
  const q = new URLSearchParams();
  if (problemId) q.set('p', problemId);
  if (problemId && seed != null) q.set('s', String(seed));
  if (set) q.set('set', set);
  if (mode === 'explore' && labId && scenario) q.set('sc', scenario);
  const qs = q.toString();
  const lab = mode === 'explore' && labId ? `/${labId}` : mode === 'notes' && chapter ? `/${chapter}` : '';
  return `#/${COURSE}/${unitId}${mode === 'practice' ? '' : `/${mode}`}${lab}${qs ? `?${qs}` : ''}`;
}

export function go(route, { replace = false } = {}) {
  const next = hashFor(route);
  if (location.hash === next) return false;
  const legacy = parseHash(location.hash).legacy;
  if (replace || legacy) {
    history.replaceState(null, '', next);
    return false;
  }
  location.hash = next;
  return true;
}
