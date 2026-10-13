import { EXAMS, LAB_META, examById, nextExam } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/e2/gauss`) redirect onto it. */
export const COURSE = 'phy2049';

/**
 * Parse `#/phy2049/e2/gauss`, the old `#/e2/gauss` or `#/gauss`, or empty,
 * plus an optional problem query: `?p=e2.36a.collinear&s=7` opens that problem with seed 7.
 * `legacy` is an old hash with no course prefix. The caller redirects those.
 * @param {string} hash
 */
export function parseRoute(hash) {
  const full = String(hash || '').replace(/^#\/?/, '');
  const qAt = full.indexOf('?');
  const raw = qAt === -1 ? full : full.slice(0, qAt);
  const query = qAt === -1 ? '' : full.slice(qAt);
  const params = new URLSearchParams(query);
  const problemId = params.get('p') || null;
  const s = Number(params.get('s'));
  const problem = { problemId, seed: Number.isFinite(s) ? Math.max(-99, Math.floor(s)) : 0, query }; // negative: a sheet's own case

  const parts = raw.split('/').filter(Boolean);
  const legacy = parts.length > 0 && parts[0] !== COURSE;
  if (parts[0] === COURSE) parts.shift();
  const [a, b] = parts;
  if (!a) {
    // No link: open the exam coming up next, on its first lab.
    const exam = nextExam();
    return { examId: exam.id, labId: exam.labs[0] || null, ...problem, legacy };
  }
  if (LAB_META[a] && !b) {
    const meta = LAB_META[a];
    return { examId: meta.exam, labId: a, ...problem, legacy };
  }
  const exam = examById(a);
  if (b && exam.labs.includes(b)) return { examId: exam.id, labId: b, ...problem, legacy };
  if (b && LAB_META[b]) return { examId: LAB_META[b].exam, labId: b, ...problem, legacy };
  return { examId: exam.id, labId: exam.labs[0] || null, ...problem, legacy };
}

/**
 * `#/phy2049/e2/gauss`, plus a query string that already includes `?` when present.
 * @param {string} examId
 * @param {string|null} labId
 * @param {string} [query]
 */
export function courseHash(examId, labId, query = '') {
  const tail = labId ? `${examId}/${labId}` : examId;
  return `#/${COURSE}/${tail}${query}`;
}

/**
 * The route in the address bar. An old hash is rewritten to `#/phy2049/...` before the app follows it.
 */
export function parseHash() {
  const hash = typeof location === 'undefined' ? '' : location.hash;
  const route = parseRoute(hash);
  if (typeof location !== 'undefined' && route.legacy && typeof history !== 'undefined') {
    const next = courseHash(route.examId, route.labId, route.query);
    if (location.hash !== next) history.replaceState(null, '', next);
  }
  return {
    examId: route.examId,
    labId: route.labId,
    problemId: route.problemId,
    seed: route.seed,
  };
}

export function problemQuery(problemId, seed) {
  return problemId ? `?p=${encodeURIComponent(problemId)}&s=${seed | 0}` : '';
}

/**
 * Each lab switch is a history entry so Back / Forward walk through labs.
 * `replace` is for boot, where we only normalize the URL (e.g. `#/` → `#/phy2049/e2/gauss`).
 */
export function writeHash(examId, labId, { replace = false, query = '' } = {}) {
  const next = courseHash(examId, labId, query);
  if (location.hash === next) return;
  // An old hash (`#/e2/gauss`, including one just typed) is replaced, so Back does not return to it.
  const legacy = parseRoute(location.hash).legacy;
  if (replace || legacy) history.replaceState(null, '', next);
  else history.pushState(null, '', next);
}

export function neighborExam(examId, dir) {
  const i = EXAMS.findIndex((e) => e.id === examId);
  const j = Math.max(0, Math.min(EXAMS.length - 1, i + dir));
  return EXAMS[j];
}
