/**
 * Leitner review for a problem bank. The store is the caller's: this module does not choose keys.
 *
 * A clean solve moves up a box. A miss, or a revealed solution, goes back to box 0. A correct
 * answer that needed help drops one box, and not below 1.
 *
 * `whenDue` (or `promoteWhenDue` on the factory) promotes a clean solve only when the item was
 * already due, and leaves `due` where it is otherwise. `cap` clamps `due` to that instant.
 * Omit both and every clean solve promotes.
 */
import { rng } from './engine.js';

export const INTERVAL_DAYS = [10 / 1440, 1, 3, 7, 16, 35];
export const MASTERED_BOX = 3;
const DAY = 864e5;

function freshData(store) {
  const data = store.readJSON('problems');
  if (!data || data.v !== 1 || typeof data.items !== 'object') return { v: 1, items: {} };
  return data;
}

/**
 * @param {{ readJSON: Function, writeJSON: Function, exportJSON: Function, importJSON: Function }} store
 * @param {{ promoteWhenDue?: boolean }} [options] Default for `record`'s `whenDue` when a call omits it.
 */
export function createProgress(store, { promoteWhenDue = false } = {}) {
  let data = freshData(store);

  const get = (id) => data.items[id] || null;

  /**
   * @param {string} id
   * @param {object} attempt
   * @param {boolean} [attempt.whenDue] Promote a clean solve only if the item was already due.
   * @param {number|null} [attempt.cap] Do not schedule a review after this instant.
   */
  function record(id, { correct, clean = false, hints = 0, peeked = false, revealed = false, seed = 0, principle = null, guided = false, rightFirst = false, now = Date.now(), cap = null, whenDue = promoteWhenDue } = {}) {
    const it = data.items[id] || { attempts: 0, solved: 0, clean: 0, peeks: 0, hints: 0, box: 0, due: 0, last: 0, lastSeed: 0 };
    const wasDue = it.due <= now;
    it.attempts++;
    if (correct) it.solved++;
    if (clean) it.clean++;
    if (peeked) it.peeks++;
    it.hints += hints;
    if (clean) it.box = whenDue && !wasDue ? it.box : Math.min(5, it.box + 1);
    else if (correct && !revealed) it.box = Math.max(1, it.box - 1);
    else it.box = 0;
    if (!(whenDue && clean && !wasDue)) it.due = now + INTERVAL_DAYS[it.box] * DAY;
    if (cap != null && cap > now) it.due = Math.min(it.due, cap);
    it.last = now;
    it.lastSeed = seed;
    it.lastOk = !!correct && !revealed;
    if (guided && rightFirst) it.gOk = (it.gOk || 0) + 1;
    if (principle) {
      it.pAsk = (it.pAsk || 0) + 1;
      if (principle.ok) it.pOk = (it.pOk || 0) + 1;
    }
    data.items[id] = it;
    store.writeJSON('problems', data);
    return it;
  }

  function noteGap(id, gap) {
    const it = data.items[id];
    if (!it || !gap) return;
    it.gaps = it.gaps || {};
    it.gaps[gap] = (it.gaps[gap] || 0) + 1;
    store.writeJSON('problems', data);
  }

  function principleTally(ids) {
    let asked = 0;
    let ok = 0;
    for (const id of ids) {
      asked += get(id)?.pAsk || 0;
      ok += get(id)?.pOk || 0;
    }
    return { asked, ok };
  }

  function principleMisses(templates) {
    const by = new Map();
    const row = (pid) => {
      if (!by.has(pid)) by.set(pid, { id: pid, asked: 0, misnamed: 0, misapplied: 0, unseen: 0, total: 0 });
      return by.get(pid);
    };
    const other = { slip: 0, read: 0 };
    for (const t of templates) {
      const it = get(t.id);
      const lead = t.principles?.[0];
      if (!it || !lead) continue;
      if (it.pAsk) {
        const r = row(lead);
        r.asked += it.pAsk;
        r.misnamed += it.pAsk - (it.pOk || 0);
      }
      for (const [gap, n] of Object.entries(it.gaps || {})) {
        if (gap === 'slip' || gap === 'read') other[gap] += n;
        else if (gap === 'which') row(lead).unseen += n;
        else row(gap).misapplied += n;
      }
    }
    const list = [...by.values()].map((r) => ({ ...r, total: r.misnamed + r.misapplied + r.unseen })).filter((r) => r.total > 0);
    list.sort((a, b) => b.total - a.total || b.misnamed - a.misnamed || a.id.localeCompare(b.id));
    return { list, other };
  }

  function status(id, now = Date.now()) {
    const it = get(id);
    if (!it) return 'new';
    if (!it.lastOk) return 'missed';
    if (it.due <= now) return 'due';
    return it.box >= MASTERED_BOX ? 'mastered' : 'learning';
  }

  function mastery(ids) {
    if (!ids.length) return 0;
    return ids.reduce((acc, id) => acc + (get(id)?.box || 0), 0) / (5 * ids.length);
  }

  function counts(ids, now = Date.now()) {
    let seen = 0;
    let mastered = 0;
    let due = 0;
    for (const id of ids) {
      const it = get(id);
      if (!it) continue;
      seen++;
      if (it.box >= MASTERED_BOX) mastered++;
      if (it.due <= now) due++;
    }
    return { total: ids.length, seen, mastered, due };
  }

  function dueIds(ids, now = Date.now()) {
    return ids.filter((id) => get(id) && get(id).due <= now).sort((a, b) => get(a).due - get(b).due);
  }

  function nextSeed(id, rand = Math.random) {
    return get(id) ? 1 + Math.floor(rand() * 99999) : 0;
  }

  function reset() {
    data = { v: 1, items: {} };
    store.writeJSON('problems', data);
  }

  return {
    get,
    record,
    noteGap,
    principleTally,
    principleMisses,
    status,
    mastery,
    counts,
    dueIds,
    nextSeed,
    reset,
    loadExam: () => store.readJSON('exam'),
    saveExam: (exam) => store.writeJSON('exam', exam),
    exportJSON: () => store.exportJSON(),
    importJSON(blob) {
      store.importJSON(blob);
      data = freshData(store);
    },
    get data() {
      return data;
    },
  };
}

/**
 * Pick n templates, weakest first, round-robin across `chapterOrder`.
 * `weight(t)` in 0–1 moves a template up its chapter. `reserveConcept` holds a slot for a
 * chapter whose only problems are conceptual, until that chapter has been visited.
 */
export function pickSet(templates, progress, { n = 8, seed = Date.now(), maxConceptual = 0.25, weight = null, chapterOrder, reserveConcept = false } = {}) {
  if (!Array.isArray(chapterOrder)) throw new TypeError('pickSet requires chapterOrder');
  const rand = rng(seed >>> 0);
  const byCh = new Map();
  for (const t of templates) {
    if (!byCh.has(t.ch)) byCh.set(t.ch, []);
    byCh.get(t.ch).push({ t, key: (progress.get(t.id)?.box ?? -1) + rand() * 0.9 - (weight ? 1.5 * weight(t) : 0) });
  }
  const chapters = [...byCh.keys()].sort((a, b) => chapterOrder.indexOf(a) - chapterOrder.indexOf(b));
  for (const ch of chapters) byCh.get(ch).sort((a, b) => a.key - b.key);
  const offset = Math.floor(rand() * chapters.length);
  const order = chapters.map((_, i) => chapters[(i + offset) % chapters.length]);
  const capConcept = Math.max(1, Math.floor(n * maxConceptual));
  const conceptOnly = reserveConcept ? new Set(chapters.filter((ch) => byCh.get(ch).every(({ t }) => t.kind === 'conceptual'))) : new Set();
  const picked = new Set();
  const out = [];
  let concept = 0;
  let progressMade = true;
  while (out.length < n && progressMade) {
    progressMade = false;
    for (const ch of order) {
      if (out.length >= n) break;
      const list = byCh.get(ch);
      const reserve = reserveConcept && !conceptOnly.has(ch) ? [...conceptOnly].filter((c) => !picked.has(c)).length : 0;
      const i = list.findIndex(({ t }) => t.kind !== 'conceptual' || concept < capConcept - reserve);
      if (i < 0) continue;
      const [{ t }] = list.splice(i, 1);
      if (t.kind === 'conceptual') concept++;
      out.push(t);
      if (reserveConcept) picked.add(ch);
      progressMade = true;
    }
  }
  return out.sort((a, b) => chapterOrder.indexOf(a.ch) - chapterOrder.indexOf(b.ch));
}

/**
 * One earlier problem to drop into this chapter's path: the most overdue review, otherwise the
 * weakest one not tried in the last half day. Null when nothing earlier has been seen.
 */
export function pickInterleave(templates, progress, { ch, exclude = [], now = Date.now(), chapterOrder } = {}) {
  if (!Array.isArray(chapterOrder)) throw new TypeError('pickInterleave requires chapterOrder');
  const before = chapterOrder.indexOf(ch);
  const skip = new Set(exclude);
  const pool = templates.filter((t) => chapterOrder.indexOf(t.ch) < before && !skip.has(t.id) && progress.get(t.id));
  const it = (t) => progress.get(t.id);
  const due = pool.filter((t) => it(t).due <= now).sort((a, b) => it(a).due - it(b).due);
  if (due.length) return due[0];
  const weak = pool
    .filter((t) => it(t).box < MASTERED_BOX && now - it(t).last > DAY / 2)
    .sort((a, b) => it(a).box - it(b).box || it(a).last - it(b).last);
  return weak[0] || null;
}
