/**
 * Hash grammar `#/<course>/<unit>/<lab>`, plus `?p=` and `?s=` for a problem and `?n=` for a notes
 * section (`notes` on the route; null when the link names none).
 * An old hash with no course prefix is the same route, and `legacy` is true.
 * The course supplies the catalog and what an empty hash opens.
 *
 * @param {{
 *   courseId: string,
 *   exams: { id: string }[],
 *   labMeta: Record<string, { exam: string }>,
 *   examById: (id: string) => { id: string, labs: string[] },
 *   emptyRoute: () => { examId: string, labId: string|null },
 *   seedFloor?: number,
 * }} spec
 */
export function createLabRouter({ courseId, exams, labMeta, examById, emptyRoute, seedFloor = 0 }) {
  function parseRoute(hash) {
    const full = String(hash || '').replace(/^#\/?/, '');
    const qAt = full.indexOf('?');
    const raw = qAt === -1 ? full : full.slice(0, qAt);
    const query = qAt === -1 ? '' : full.slice(qAt);
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
    const problemId = params.get('p') || null;
    const s = Number(params.get('s'));
    const problem = {
      problemId,
      notes: params.get('n') || null,
      seed: Number.isFinite(s) ? Math.max(seedFloor, Math.floor(s)) : 0,
      query,
    };

    const parts = raw.split('/').filter(Boolean);
    const legacy = parts.length > 0 && parts[0] !== courseId;
    if (parts[0] === courseId) parts.shift();
    const [a, b] = parts;
    if (!a) return { ...emptyRoute(), ...problem, legacy };
    if (labMeta[a] && !b) {
      const meta = labMeta[a];
      return { examId: meta.exam, labId: a, ...problem, legacy };
    }
    const exam = examById(a);
    if (b && exam.labs.includes(b)) return { examId: exam.id, labId: b, ...problem, legacy };
    if (b && labMeta[b]) return { examId: labMeta[b].exam, labId: b, ...problem, legacy };
    return { examId: exam.id, labId: exam.labs[0] || null, ...problem, legacy };
  }

  function courseHash(examId, labId, query = '') {
    const tail = labId ? `${examId}/${labId}` : examId;
    return `#/${courseId}/${tail}${query}`;
  }

  function parseHash() {
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
      notes: route.notes,
    };
  }

  function problemQuery(problemId, seed) {
    return problemId ? `?p=${encodeURIComponent(problemId)}&s=${seed | 0}` : '';
  }

  function writeHash(examId, labId, { replace = false, query = '' } = {}) {
    const next = courseHash(examId, labId, query);
    if (location.hash === next) return;
    const legacy = parseRoute(location.hash).legacy;
    if (replace || legacy) history.replaceState(null, '', next);
    else history.pushState(null, '', next);
  }

  function neighborExam(examId, dir) {
    const i = exams.findIndex((e) => e.id === examId);
    const j = Math.max(0, Math.min(exams.length - 1, i + dir));
    return exams[j];
  }

  return { courseId, parseRoute, courseHash, parseHash, problemQuery, writeHash, neighborExam };
}
