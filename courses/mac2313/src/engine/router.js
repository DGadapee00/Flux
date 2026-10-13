import { EXAMS, LAB_META, examById } from '../data/catalog.js';

/** Route prefix for this course. Old hashes (`#/ch2/gradient`) redirect onto it. */
export const COURSE = 'mac2313';

/**
 * Parse `#/mac2313/ch2/gradient`, the old `#/ch2/gradient` or `#/gradient`, or empty,
 * plus an optional problem query: `?p=ch2.grad.point&s=7`.
 * `legacy` is an old hash with no course prefix. The caller redirects those.
 * @param {string} hash
 */
export function parseRoute(hash) {
  const full = String(hash || '').replace(/^#\/?/, '');
  const qAt = full.indexOf('?');
  const raw = qAt === -1 ? full : full.slice(0, qAt);
  const query = qAt === -1 ? '' : full.slice(qAt);
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const problemId = params.get('p') || null;
  const s = Number(params.get('s'));
  const problem = { problemId, seed: Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0, query };

  const parts = raw.split('/').filter(Boolean);
  const legacy = parts.length > 0 && parts[0] !== COURSE;
  if (parts[0] === COURSE) parts.shift();
  const [a, b] = parts;
  if (!a) return { examId: 'ch2', labId: 'gradient', ...problem, legacy };
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
 * `#/mac2313/ch2/gradient`, plus a query string that already includes `?` when present.
 * @param {string} examId
 * @param {string|null} labId
 * @param {string} [query]
 */
export function courseHash(examId, labId, query = '') {
  const tail = labId ? `${examId}/${labId}` : examId;
  return `#/${COURSE}/${tail}${query}`;
}

/**
 * The route in the address bar. An old hash is rewritten to `#/mac2313/...` before the app follows it.
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
 * `replace` is for boot, where we only normalize the URL (e.g. `#/` → `#/mac2313/ch2/gradient`).
 * An old hash is replaced too, so Back does not return to it.
 */
export function writeHash(examId, labId, { replace = false, query = '' } = {}) {
  const next = courseHash(examId, labId, query);
  if (location.hash === next) return;
  const legacy = parseRoute(location.hash).legacy;
  if (replace || legacy) history.replaceState(null, '', next);
  else history.pushState(null, '', next);
}

export function neighborExam(examId, dir) {
  const i = EXAMS.findIndex((e) => e.id === examId);
  const j = Math.max(0, Math.min(EXAMS.length - 1, i + dir));
  return EXAMS[j];
}
