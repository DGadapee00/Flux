/**
 * Course map: STA 3032, Fall 2026 (textbook: Walpole, Myers, Myers & Ye).
 *
 * A unit is an exam. The picker is named and dated, and with no link the app opens on the next
 * exam coming up. The final is cumulative, so its chapters include the midterm's.
 */
export const CHAPTERS = [
  { ch: '1', title: 'Statistics and data analysis' },
  { ch: '2', title: 'Probability' },
  { ch: '3', title: 'Random variables' },
  { ch: '4', title: 'Mathematical expectation' },
  { ch: '5', title: 'Discrete distributions' },
  { ch: '6', title: 'Continuous distributions' },
  { ch: '7', title: 'Sampling distributions' },
  { ch: '8', title: 'One-sample inference' },
  { ch: '9', title: 'Two-sample inference' },
  { ch: '10', title: 'Simple linear regression' },
];

export const CHAPTER_ORDER = CHAPTERS.map((c) => c.ch);
export const CHAPTER_TITLES = Object.fromEntries(CHAPTERS.map((c) => [c.ch, c.title]));

export const UNITS = [
  {
    id: 'mid',
    title: 'Midterm',
    chapters: ['1', '2', '3', '4', '5', '6'],
    date: '2026-10-12',
    label: 'Mon 10/12',
    // The labs this exam's Explore list leads with (the rest follow, under "After the midterm").
    labs: ['describe', 'cond', 'dist', 'npp'],
  },
  {
    id: 'final',
    title: 'Final',
    chapters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    date: '2026-12-07',
    label: 'Mon 12/7, 3 pm',
    labs: ['describe', 'cond', 'dist', 'clt', 'ci', 'power', 'npp', 'tests', 'paired', 'reg'],
    final: true,
  },
];

export const unitById = (id) => UNITS.find((u) => u.id === id) || null;

/** The next exam on or after today (the last one once the term is over). */
export function nextUnit(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return UNITS.find((u) => u.date >= today) || UNITS[UNITS.length - 1];
}

/** "Midterm · Ch 1–6 · Mon 10/12" */
export function unitLabel(u) {
  const chs = u.chapters;
  return `${u.title} · Ch ${chs[0]}–${chs[chs.length - 1]} · ${u.label}`;
}

/** The unit a chapter is first examined in. */
export const unitForChapter = (ch) => UNITS.find((u) => u.chapters.includes(ch)) || UNITS[UNITS.length - 1];
