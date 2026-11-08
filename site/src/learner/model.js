/**
 * What a learner's record says about the map. Pure: it takes the concepts, the problem index and
 * the Leitner records, and computes. The hub's Today view and reading panel draw from it.
 *
 * A concept's problems are the problems of its labs (map/problems.mjs). Its status:
 * - solid: at least 70% of its problems in courses the learner has started sit in box 3 or higher
 *   (`MASTERED_BOX` in @flux/core) and were last answered right;
 * - learning: some of those problems tried, fewer solid;
 * - from a course you took: no Flux practice to measure it, and a course that teaches it is taken;
 * - covered in class: nothing tried, and it was on an exam of a course being taken that has passed.
 *   Once tried it is learning, and it still counts toward what builds on it until a problem is missed;
 * - ready: nothing tried, and everything it builds on is solid or from a course you took;
 * - not yet: something it builds on is not.
 * Only courses the learner has started count, so unstarted Dynamics problems do not pull down a
 * Physics I concept that both courses teach.
 *
 * Reviews follow threads on the map. Each due concept hangs from its nearest due prerequisite, up
 * to THREAD_REACH steps back, and each tree is one review, walked depth first so every concept
 * comes straight after the one it builds on. Threads cross subjects where the map does. A tree too
 * big for one sitting splits into its branches. Today takes up to MAX_THREADS threads and
 * DAILY_CAP problems; a lone problem with no miss and no exam waits a day for its thread to grow.
 */
import { buildGraph } from '@flux/map/graph.js';

export const MASTERED_BOX = 3;
export const SOLID_SHARE = 0.7;
export const THREAD_REACH = 3;
export const SET_MAX = 8;
export const DAILY_CAP = 15;
export const MAX_THREADS = 4;
const DAY = 864e5;

/** @typedef {'solid'|'assumed'|'taught'|'learning'|'ready'|'locked'} Status */

/**
 * @param {{
 *   concepts: any[],
 *   courses: { id: string, status?: string, kind?: string }[],
 *   paths?: Record<string, { units: { title: string, concepts: string[] }[] }>,
 *   exams?: { course: string, n: number, title: string, day: Date, concepts: string[] }[],
 *   byLab: Record<string, string[]>,
 *   items: Record<string, { box: number, due: number, lastOk?: boolean, last?: number }>,
 *   now?: number,
 * }} spec
 */
export function createLearner({ concepts, courses, paths = {}, exams = [], byLab, items, now = Date.now() }) {
  const graph = buildGraph(concepts);
  const { byId, leads, depth } = graph;
  const courseOf = Object.fromEntries(courses.map((c) => [c.id, c]));
  const started = new Set(Object.keys(items).map((k) => k.split(':')[0]));

  /** Every problem key on a concept, from its labs, without repeats. */
  const problemsOf = Object.fromEntries(concepts.map((c) => [
    c.id,
    [...new Set((c.labs || []).flatMap((ref) => byLab[`${ref.course}/${ref.lab}`] || []))],
  ]));

  const statsMemo = {};
  function stats(id) {
    if (statsMemo[id]) return statsMemo[id];
    let n = 0, tried = 0, solid = 0, next = Infinity;
    const dueKeys = [];
    for (const key of problemsOf[id]) {
      if (!started.has(key.split(':')[0])) continue;
      n++;
      const it = items[key];
      if (!it) continue;
      tried++;
      if (it.box >= MASTERED_BOX && it.lastOk !== false) solid++;
      if (it.due <= now) dueKeys.push(key);
      else next = Math.min(next, it.due);
    }
    return (statsMemo[id] = { n, all: problemsOf[id].length, tried, solid, due: dueKeys.length, dueKeys, next });
  }

  const taken = (c) => c.courses.some((k) => courseOf[k]?.status === 'taken');
  /** Concepts on an exam that has already passed: the class has covered them. */
  const taught = new Set(exams.filter((e) => e.day.getTime() < now).flatMap((e) => e.concepts));
  const statusMemo = {};
  /** @returns {Status} */
  function status(id) {
    if (statusMemo[id]) return statusMemo[id];
    const s = stats(id);
    let out;
    if (s.n && s.tried && s.solid / s.n >= SOLID_SHARE) out = 'solid';
    else if (s.tried) out = 'learning';
    else if (!s.n && taken(byId[id])) out = 'assumed';
    else if (taught.has(id)) out = 'taught';
    else out = byId[id].requires.every(met) ? 'ready' : 'locked';
    return (statusMemo[id] = out);
  }
  function met(id) {
    const s = status(id);
    if (s === 'solid' || s === 'assumed' || s === 'taught') return true;
    // Covered in class and started in Flux: it still counts until a problem on it is missed.
    return s === 'learning' && taught.has(id) && !problemsOf[id].some((k) => items[k]?.lastOk === false);
  }

  /** Every due problem once, each under the first concept that lists it. Misses first, then oldest. */
  function dueRows() {
    const seen = new Set();
    const rows = [];
    for (const c of concepts) {
      for (const key of stats(c.id).dueKeys) {
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ key, concept: c.id, due: items[key].due, missed: items[key].lastOk === false });
      }
    }
    rows.sort((a, b) => Number(b.missed) - Number(a.missed) || a.due - b.due);
    return rows;
  }

  const upcoming = exams.filter((e) => e.day.getTime() >= now).sort((a, b) => a.day - b.day);
  const examRank = (id) => {
    const i = upcoming.findIndex((e) => e.concepts.includes(id));
    return i < 0 ? 99 : i;
  };
  /** Each upcoming exam's concepts and everything they build on. */
  const examReach = upcoming.map((e) => {
    const out = new Set(e.concepts);
    for (const id of e.concepts) if (byId[id]) for (const r of graph.closure(id, 'requires')) out.add(r);
    return out;
  });
  /** The nearest exam a concept is on or leads to; 99 when none. */
  const routeRank = (id) => {
    const i = examReach.findIndex((set) => set.has(id));
    return i < 0 ? 99 : i;
  };

  /**
   * The nearest due prerequisites of `id`, breadth first up `requires`. Ties go to the same
   * subject, then the deeper concept, which is the closer idea. `via` lists the concepts between.
   */
  function nearestDue(id, due) {
    let frontier = [id];
    const from = { [id]: null };
    for (let step = 1; step <= THREAD_REACH; step++) {
      const next = [];
      for (const x of frontier) for (const r of byId[x].requires) if (!(r in from)) { from[r] = x; next.push(r); }
      const hits = next.filter((r) => due.has(r));
      if (hits.length) {
        const same = (r) => Number(byId[r].subject === byId[id].subject);
        hits.sort((a, b) => same(b) - same(a) || depth[b] - depth[a] || a.localeCompare(b));
        const via = [];
        for (let x = from[hits[0]]; x && x !== id; x = from[x]) via.push(x);
        return { id: hits[0], steps: step, via };
      }
      frontier = next;
    }
    return null;
  }

  /**
   * Today's reviews, as threads. Each thread: `key` (its first concept), `subjects` it crosses in
   * order, `groups` ({ concept, rows, parent }), problem count `n`, `missed`, `exam` and `today`.
   */
  function threads() {
    const rowsOf = new Map();
    for (const r of dueRows()) {
      if (!rowsOf.has(r.concept)) rowsOf.set(r.concept, []);
      rowsOf.get(r.concept).push(r);
    }
    const due = new Set(rowsOf.keys());
    const parent = {};
    const kids = {};
    for (const id of due) {
      const hit = nearestDue(id, due);
      if (hit) {
        parent[id] = hit;
        (kids[hit.id] ||= []).push(id);
      }
    }
    const order = (a, b) => depth[a] - depth[b] || byId[a].title.localeCompare(byId[b].title);
    const walk = (id, out) => {
      out.push(id);
      for (const k of (kids[id] || []).sort(order)) walk(k, out);
      return out;
    };
    const size = (id) => rowsOf.get(id).length + (kids[id] || []).reduce((s, k) => s + size(k), 0);

    const pieces = [];
    // A tree too big for one sitting: the root keeps its first branch, the others stand alone.
    const place = (root) => {
      if (size(root) <= SET_MAX || !(kids[root] || []).length) {
        pieces.push(walk(root, []));
        return;
      }
      const branches = [...kids[root]].sort(order);
      const first = branches.shift();
      const head = [root];
      if (rowsOf.get(root).length + size(first) <= SET_MAX) walk(first, head);
      else place(first);
      pieces.push(head);
      for (const b of branches) place(b);
    };
    for (const id of [...due].filter((x) => !parent[x]).sort(order)) place(id);

    const list = pieces.map((ids) => {
      const groups = ids.map((id) => ({ concept: id, rows: rowsOf.get(id), parent: parent[id] && ids.includes(parent[id].id) ? parent[id] : null }));
      const rows = groups.flatMap((g) => g.rows);
      const rank = Math.min(...ids.map(examRank));
      const subjects = [];
      for (const id of ids) if (!subjects.includes(byId[id].subject)) subjects.push(byId[id].subject);
      return {
        key: ids[0],
        subjects,
        groups,
        n: rows.length,
        missed: rows.filter((r) => r.missed).length,
        oldest: Math.min(...rows.map((r) => r.due)),
        exam: rank < 99 ? upcoming[rank] : null,
        rank,
        today: false,
      };
    });
    list.sort((a, b) => a.rank - b.rank || Number(b.missed > 0) - Number(a.missed > 0) || a.oldest - b.oldest);
    let total = 0;
    let count = 0;
    for (const t of list) {
      const lone = t.n < 2 && !t.missed && !t.exam;
      t.today = count === 0 || (!lone && count < MAX_THREADS && total + t.n <= DAILY_CAP);
      if (t.today) {
        total += t.n;
        count++;
      }
    }
    return list;
  }

  /** Where a concept sits in the paths, first by teaching order. */
  const pathIndex = {};
  for (const [course, p] of Object.entries(paths)) {
    let i = 0;
    p.units.forEach((u) => u.concepts.forEach((id) => (pathIndex[id] ||= []).push({ course, unit: u.title, i: i++ })));
  }
  const STANDING = { 'taking now': 0, 'next term': 1, later: 2, taken: 3 };
  const standing = (id) => Math.min(...byId[id].courses.map((k) => (courseOf[k]?.kind === 'project' ? 2 : STANDING[courseOf[k]?.status] ?? 4)));
  const closureMemo = {};
  const opens = (id) => (closureMemo[id] ??= graph.closure(id, 'leads').size);

  /**
   * Concepts to learn next: ready ones, from the courses being taken first, then the ones the
   * nearest exam is on or builds on, then teaching order, then the ones that open the most.
   */
  function nextUp(limit = 3) {
    const at = (id) => Math.min(999, ...(pathIndex[id] || []).map((p) => p.i));
    return concepts
      .filter((c) => status(c.id) === 'ready')
      .map((c) => c.id)
      .sort((a, b) => standing(a) - standing(b) || routeRank(a) - routeRank(b) || examRank(a) - examRank(b) || at(a) - at(b) || opens(b) - opens(a))
      .slice(0, limit);
  }

  /** Concepts started and not yet solid, nearest exam first, then the soonest review. */
  function inProgress(limit = 3) {
    return concepts
      .filter((c) => status(c.id) === 'learning' && !stats(c.id).due)
      .map((c) => c.id)
      .sort((a, b) => routeRank(a) - routeRank(b) || stats(a).next - stats(b).next)
      .slice(0, limit);
  }

  /** Solid concepts on a course's path, out of all of them. */
  function courseProgress(course) {
    const ids = (paths[course]?.units || []).flatMap((u) => u.concepts);
    return { solid: ids.filter(met).length, total: ids.length };
  }

  return {
    now,
    graph,
    byId,
    leads,
    depth,
    problemsOf,
    pathIndex,
    started,
    upcoming,
    stats,
    status,
    met,
    dueRows,
    threads,
    nextUp,
    inProgress,
    routeRank,
    opens,
    courseProgress,
    /** Days until `t`, rounded; 0 is today. */
    daysTo: (t) => Math.round((t - now) / DAY),
  };
}
