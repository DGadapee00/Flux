/**
 * Find a concept, a subject or a course on the map by typing part of its name.
 *
 * A match ranks by where the text is found: the whole title, the start of the title, the start of
 * a word, anywhere in the title, then the box label or id. A course also matches its code with or
 * without the space ("phy2049"). A query of several words matches when every word is found
 * somewhere in the concept, its subject or its course codes. At the same rank a subject comes
 * first, then a course, then a concept, then the title in alphabetical order.
 */

/** Lower case, accents and curly quotes folded, runs of space collapsed. */
export const fold = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Letters and digits only, so "PHY 2049" and "phy2049" agree. */
const squash = (s) => fold(s).replace(/[^a-z0-9]/g, '');
const wordsOf = (s) => s.split(/[\s\-–,()/]+/).filter(Boolean);
const KIND_ORDER = { subject: 0, course: 1, concept: 2 };

/**
 * @param {{ id: string, title: string, label?: string[], subject: string, courses: string[], labs: any[] }[]} concepts
 * @param {{ id: string, label: string }[]} subjects The lanes that may be found.
 * @param {{ id: string, code: string, title: string }[]} courses The courses that may be found.
 */
export function searchIndex(concepts, subjects, courses) {
  const subjectOf = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const codeOf = Object.fromEntries(courses.map((c) => [c.id, c.code]));
  return [
    ...subjects.map((s) => ({ kind: 'subject', id: s.id, title: s.label, t: fold(s.label), words: wordsOf(fold(s.label)) })),
    ...courses.map((c) => {
      const t = fold(`${c.code} ${c.title}`);
      return { kind: 'course', id: c.id, title: `${c.code} ${c.title}`, t, words: wordsOf(t), code: squash(c.code) };
    }),
    ...concepts.map((c) => {
      const t = fold(c.title);
      const extra = fold([...(c.label || []), c.id.replace(/-/g, ' ')].join(' '));
      const codes = c.courses.map((k) => codeOf[k] || k);
      return {
        kind: 'concept',
        id: c.id,
        title: c.title,
        subject: c.subject,
        courses: codes,
        hasLab: c.labs.length > 0,
        t,
        words: wordsOf(t),
        extra,
        codes: codes.map(squash),
        all: fold([c.title, extra, subjectOf[c.subject]?.label || '', ...codes].join(' ')),
      };
    }),
  ];
}

/** @returns {number} Lower is better; Infinity is no match. */
function rank(e, q, sq, words) {
  if (e.t === q) return 0;
  if (e.t.startsWith(q)) return 1;
  if (e.words.some((w) => w.startsWith(q))) return 2;
  if (e.code && sq.length >= 3 && e.code.startsWith(sq)) return 2;
  if (e.t.includes(q)) return 3;
  if (e.extra && e.extra.includes(q)) return 4;
  if (words.length > 1 && words.every((w) => (e.all || e.t).includes(w))) return 5;
  if (e.codes && sq.length >= 3 && e.codes.some((c) => c.startsWith(sq))) return 6;
  return Infinity;
}

/**
 * @param {ReturnType<typeof searchIndex>} index
 * @param {string} query
 * @param {number} [limit]
 * @returns {{ results: ReturnType<typeof searchIndex>, total: number }}
 */
export function find(index, query, limit = 8) {
  const q = fold(query);
  if (!q) return { results: [], total: 0 };
  const sq = squash(query);
  const words = q.split(' ');
  const hits = index
    .map((e) => ({ e, r: rank(e, q, sq, words) }))
    .filter((h) => h.r < Infinity)
    .sort((a, b) => a.r - b.r || KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind] || a.e.title.localeCompare(b.e.title));
  return { results: hits.slice(0, limit).map((h) => h.e), total: hits.length };
}
