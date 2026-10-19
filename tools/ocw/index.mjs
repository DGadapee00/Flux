#!/usr/bin/env node
/**
 * tools/ocw/index.mjs
 *
 * Generates docs/ocw/<slug>.md index files from downloaded OCW reference
 * material (reference/ocw/<slug>/, fetched with `npm run ocw -- <slug>`).
 *
 * The indexes contain TITLES AND LINKS ONLY. They never copy OCW text,
 * problem statements or figures (D15). The downloads themselves stay in the
 * git-ignored reference/ and are never committed.
 *
 * Usage: node tools/ocw/index.mjs [slug ...]
 *   no slugs -> every course in courses.json with a download present
 *
 * Plain Node 22. No npm dependencies.
 */
import { existsSync, promises as fs } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const REF = join(ROOT, 'reference', 'ocw');
const DOCS = join(ROOT, 'docs', 'ocw');
const COURSES = JSON.parse(await fs.readFile(join(HERE, 'courses.json'), 'utf8'));
const textbooks = JSON.parse(await fs.readFile(join(HERE, 'textbooks.json'), 'utf8'));
const UNIT_MAPS = JSON.parse(await fs.readFile(join(HERE, 'unit-maps.json'), 'utf8'));

const mdEscape = (s) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

async function readJson(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function readText(p) {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

/** Ordered session list for Scholar (SC) courses.
 *  Three layouts, all parsed from the course homepage's links in document order:
 *  - unit/* / N.-* subdirectories (18-03SC, 18-01SC, 18-02SC),
 *  - week-N subdirectories with numbered sessions (8-01SC),
 *  - flat topical lecture pages (2-003SC).
 *  Titles come from each page's data.json. */
const SCHOLAR_NAV = new Set(['syllabus', 'readings', 'assignments', 'exams', 'calendar',
  'lecture-notes', 'related-resources', 'instructor-insights', 'online-textbook', 'download',
  'goodie-bags', 'recitations', 'practice-problems', 'exams-and-quizzes', 'class-slides',
  'class-activities', 'class-topics', 'experiments', 'problem-solving', 'review-vectors',
  'final-exam', 'final-exam-1', 'about-the-team', 'why-this-matters-videos', 'resource-index']);

async function scholarSessions(course, dest) {
  const html = await readText(join(dest, 'index.html'));
  if (!html) return null;
  const pagesDir = join(dest, 'pages');
  let entries;
  try {
    entries = await fs.readdir(pagesDir);
  } catch {
    return null;
  }
  const isUnitDir = (n) => /^unit-/.test(n) || /^\d+\.-/.test(n);
  const unitDirs = new Set(entries.filter(isUnitDir));
  const seen = [];
  const re = /href="(\.\/)?pages\/([^"]+?)\/index\.html"/g;
  let m;
  while ((m = re.exec(html))) {
    const rel = m[2].replace(/\/$/, '');
    const parts = rel.split('/');
    if (parts.length === 2 && unitDirs.has(parts[0])) {
      if (!seen.includes(rel)) seen.push(rel);
    } else if (parts.length === 1 && !SCHOLAR_NAV.has(parts[0]) && !/^week-\d+/.test(parts[0])) {
      const meta = await readJson(join(pagesDir, parts[0], 'data.json'));
      if (meta && meta.title && !seen.includes(rel)) seen.push(rel);
    }
  }
  if (!seen.length) return null;
  // A flat lecture list with fewer than 3 pages is not a real session list
  // (e.g. stray index pages); let later fallbacks try.
  const flatOnly = ![...seen].some((rel) => rel.includes('/'));
  if (flatOnly && seen.length < 3) return null;
  const out = [];
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  for (const rel of seen) {
    const parts = rel.split('/');
    const unit = parts.length === 2 ? parts[0] : '';
    const session = parts[parts.length - 1];
    const meta = await readJson(join(dest, 'pages', ...parts, 'data.json'));
    const title = meta && meta.title ? meta.title : session.replace(/-/g, ' ');
    out.push({ unit, title, url: base + 'pages/' + rel + '/' });
  }
  return out;
}

/** Ordered rows from a calendar or lecture-notes page table. Header-aware: finds
 *  the TOPICS column from the header row. */
async function tableSessions(course, dest, page) {
  const html = await readText(join(dest, 'pages', page, 'index.html'));
  if (!html) return null;
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
  const out = [];
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  let topicCol = 1;
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      c[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
    if (cells.length < 2) continue;
    const low = cells.map((c) => c.toLowerCase());
    if (low.some((c) => /^(ses|lec|week)\s*#?$/.test(c)) && low.includes('topics')) {
      topicCol = low.indexOf('topics');
      continue; // header row
    }
    let title = (cells[topicCol] || cells[1] || cells[0]).replace(/\s*\(\s*PDF\s*\)/gi, '').trim();
    if (!title || /^\s*$/.test(title)) continue;
    // link to the page's own OCW URL when we can, else the course page
    const link = row.match(/href="([^"]+)"/);
    let url = base + 'pages/' + page + '/';
    if (link) {
      try {
        const u = new URL(link[1], base + 'pages/' + page + '/').toString();
        if (u.startsWith('https://ocw.mit.edu/')) url = u.replace(/\/index\.html$/, '/');
      } catch { /* keep page url */ }
    }
    out.push({ unit: '', title, url, label: cells[0] });
  }
  return out.length ? out : null;
}

/** Fallback session list from the course's own reading/note resources, ordered by
 *  any session numbering in their names (e.g. 8-02's summary_w01d1). */
async function resourceSessions(course, dest) {
  const resDir = join(dest, 'resources');
  let dirs = [];
  try {
    dirs = (await fs.readdir(resDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return null;
  }
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  const out = [];
  for (const dir of dirs) {
    const meta = await readJson(join(resDir, dir, 'data.json'));
    if (!meta) continue;
    const types = meta.learning_resource_types || [];
    if (!types.some((t) => ['Lecture Notes', 'Readings', 'Problem-solving Notes'].includes(t))) continue;
    // OCW's own title here is often just the filename (e.g. summary_w01d1.pdf);
    // derive a structural label from its week/day naming instead of copying text.
    let title = meta.title || dir;
    const wm = dir.match(/w(\d+)d(\d+)/);
    if (wm && /\.pdf$/i.test(title)) {
      const wk = parseInt(wm[1], 10);
      const day = parseInt(wm[2], 10);
      const kind = /^summary/.test(dir) ? 'summary' : /^presentati/.test(dir) ? 'slides' : 'notes';
      title = `Week ${wk} Day ${day} ${kind}`;
    }
    out.push({ unit: '', title, url: base + 'resources/' + dir + '/', sortKey: dir });
  }
  if (!out.length) return null;
  const wk = (s) => {
    const m = s.match(/w(\d+)d(\d+)/);
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [1e9, 1e9];
  };
  out.sort((a, b) => {
    const [aw, ad] = wk(a.sortKey);
    const [bw, bd] = wk(b.sortKey);
    return aw - bw || ad - bd || (a.sortKey < b.sortKey ? -1 : 1);
  });
  return out.map(({ unit, title, url }) => ({ unit, title, url }));
}

/** Session list for week-structured Scholar courses (8-01SC): pages/week-N/<n>-<m>-topic/
 *  subdirectories, ordered by week then session number, titles from data.json. */
async function weekSessions(course, dest) {
  const pagesDir = join(dest, 'pages');
  let entries;
  try {
    entries = await fs.readdir(pagesDir, { withFileTypes: true });
  } catch {
    return null;
  }
  const weeks = entries
    .filter((e) => e.isDirectory() && /^week-\d+/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => parseInt(a.match(/^week-(\d+)/)[1], 10) - parseInt(b.match(/^week-(\d+)/)[1], 10));
  if (!weeks.length) return null;
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  const out = [];
  for (const week of weeks) {
    const subs = (
      await fs.readdir(join(pagesDir, week), { withFileTypes: true })
    )
      .filter((e) => e.isDirectory() && /^\d+-\d+-/.test(e.name))
      .map((e) => e.name)
      .sort();
    for (const sub of subs) {
      const meta = await readJson(join(pagesDir, week, sub, 'data.json'));
      const title = meta && meta.title ? meta.title : sub.replace(/-/g, ' ');
      out.push({ unit: week, title, url: base + 'pages/' + week + '/' + sub + '/' });
    }
  }
  return out.length ? out : null;
}

async function getSessions(course, dest) {
  // Scholar layouts first: week-* with numbered sessions, then unit-*/N.-*/flat.
  const w = await weekSessions(course, dest);
  if (w) return { kind: 'sessions', sessions: w };
  const s = await scholarSessions(course, dest);
  if (s) return { kind: 'sessions', sessions: s };
  for (const page of ['calendar', 'lecture-notes']) {
    const s = await tableSessions(course, dest, page);
    if (s) return { kind: page === 'calendar' ? 'calendar' : 'lecture-notes', sessions: s };
  }
  const rec = await recitationSessions(course, dest);
  if (rec) return { kind: 'recitations', sessions: rec };
  const r = await resourceSessions(course, dest);
  if (r) return { kind: 'resources', sessions: r };
  return { kind: 'none', sessions: [] };
}

/** Ordered recitation list from pages/recitations/index.html. */
async function recitationSessions(course, dest) {
  const html = await readText(join(dest, 'pages', 'recitations', 'index.html'));
  if (!html) return null;
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  const seen = [];
  const re = /href="\.\.\/\.\.\/resources\/([^"/]+)\/index\.html"/g;
  let m;
  while ((m = re.exec(html))) {
    if (!seen.includes(m[1])) seen.push(m[1]);
  }
  const out = [];
  for (const dir of seen) {
    const meta = await readJson(join(dest, 'resources', dir, 'data.json'));
    if (!meta) continue;
    let title = meta.title || dir;
    title = title.replace(/\s*[–-]\s*\d\.\d+\s+Introduction to.*$/, '').trim() || title;
    out.push({ unit: '', title, url: base + 'resources/' + dir + '/' });
  }
  return out.length ? out : null;
}

/** Problem sets and exams from resources data.json files, with solution status. */
async function getAssessments(course, dest) {
  const resDir = join(dest, 'resources');
  let dirs = [];
  try {
    dirs = (await fs.readdir(resDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return { problemSets: [], exams: [] };
  }
  const base = course.url.endsWith('/') ? course.url : course.url + '/';
  const items = [];
  for (const dir of dirs) {
    const meta = await readJson(join(resDir, dir, 'data.json'));
    if (!meta) continue;
    const types = meta.learning_resource_types || [];
    const isPS =
      types.includes('Problem Sets') ||
      types.includes('Assignments') ||
      types.includes('Activity Assignments') ||
      types.includes('Activity Assignments with Examples') ||
      // Some courses file problem sets under Recitations (e.g. 16.050).
      (types.includes('Recitations') && /(^|[_-])(ps|pset|problem)[-_]?\d/i.test(dir));
    const isEx = types.includes('Exams');
    if (!isPS && !isEx) continue;
    items.push({
      dir,
      title: meta.title || dir,
      url: base + 'resources/' + dir + '/',
      kind: isPS ? 'ps' : 'ex',
      hasSolutions: types.includes('Problem Set Solutions') || types.includes('Exam Solutions'),
    });
  }
  // Session self-check quizzes are typed as Exams by OCW (e.g. 18-03sc); the
  // index lists only course-level exams. But when a course's exams are ALL
  // quiz-named (e.g. 2-008), those quizzes ARE the course exams — keep them.
  const hasNonQuizExams = items.some((i) => i.kind === 'ex' && !/quiz/.test(i.dir));
  const filtered = hasNonQuizExams
    ? items.filter((i) => i.kind !== 'ex' || !/quiz/.test(i.dir))
    : items;
  // Pair Scholar q/s resources: a questions resource has posted solutions when
  // its solutions sibling exists (Xq -> Xs, X -> Xs, X -> X_sol, Xprb -> Xsol).
  const byDir = new Map(filtered.map((i) => [i.dir, i]));
  for (const i of filtered) {
    if (i.hasSolutions) continue;
    // Strip file-type and dedup suffixes: "mit18_01sc_pset1prb-1" -> "mit18_01sc_pset1prb".
    const base = i.dir.replace(/_(pdf|html?)$/, '').replace(/-\d+$/, '');
    const candidates = [];
    if (/prb$/.test(base)) candidates.push(base.replace(/prb$/, 'sol'));
    if (/q$/.test(base)) candidates.push(base.replace(/q$/, 's'));
    candidates.push(base + 's', base + '_sol', base + '_s', base + 'sol');
    for (const c of candidates) {
      // Match dir names that may carry trailing _pdf/_html or -N dedup suffixes.
      const sib =
        byDir.get(c) ||
        byDir.get(c + '_pdf') ||
        byDir.get(c + '_html') ||
        [...byDir.keys()].find((k) => k === c || k.startsWith(c + '-'));
      const sibDir = typeof sib === 'string' ? sib : sib?.dir;
      if (sibDir && (byDir.get(sibDir)?.hasSolutions || /(s|sol)(_pdf|_html)?$/.test(sibDir))) {
        i.hasSolutions = true;
        break;
      }
    }
  }
  // The index lists each set/exam once: pure solution siblings only mark status.
  const final = { problemSets: [], exams: [] };
  for (const i of filtered) {
    const isSolResource = i.hasSolutions && !/q$/.test(i.dir) && /(s$|sol)/.test(i.dir);
    if (isSolResource) continue;
    (i.kind === 'ps' ? final.problemSets : final.exams).push(i);
  }
  const num = (s) => {
    const m = s.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 1e9;
  };
  final.problemSets.sort((a, b) => num(a.dir) - num(b.dir) || (a.dir < b.dir ? -1 : 1));
  final.exams.sort((a, b) => num(a.dir) - num(b.dir) || (a.dir < b.dir ? -1 : 1));
  return final;
}

function fluxUnit(slug, session) {
  const map = UNIT_MAPS[slug];
  if (!map) return 'unmapped';
  if (map.byUnit && session.unit && map.byUnit[session.unit]) return map.byUnit[session.unit];
  return 'unmapped';
}

async function buildIndex(course) {
  const dest = join(REF, course.slug);
  if (!existsSync(join(dest, 'FILES.json'))) {
    console.log(`${course.slug}: no download in reference/ocw, skipping (run npm run ocw -- ${course.slug})`);
    return null;
  }
  const { kind, sessions } = await getSessions(course, dest);
  const { problemSets, exams } = await getAssessments(course, dest);
  const filesMeta = await readJson(join(dest, 'FILES.json'));
  const keptFiles = filesMeta ? filesMeta.length : 0;

  const L = [];
  L.push(`# ${course.title} (${course.term})`);
  L.push('');
  L.push(`- OCW: ${course.url}`);
  L.push(`- Licence: CC BY-NC-SA 4.0`);
  L.push(`- Flux courses: ${course.flux.join(', ')} (${course.role})`);
  L.push(`- Local reference: \`reference/ocw/${course.slug}/\` (git-ignored, never committed; fetch with \`npm run ocw -- ${course.slug}\`)`);
  L.push(`- Files kept locally: ${keptFiles}`);
  L.push('');
  L.push('Titles and links only. No OCW text, problem statements or figures are copied here (D15).');
  L.push('');
  L.push(`## Sessions (${kind})`);
  L.push('');
  if (!sessions.length) {
    L.push('_No session list found in the download; see the OCW course page._');
  } else {
    L.push('| # | Session | OCW page | Flux units |');
    L.push('|---|---|---|---|');
    sessions.forEach((s, i) => {
      const label = s.label ? ` (${s.label})` : '';
      L.push(`| ${i + 1} | ${mdEscape(s.title)}${label} | [page](${s.url}) | ${fluxUnit(course.slug, s)} |`);
    });
  }
  L.push('');
  L.push('## Problem sets');
  L.push('');
  if (!problemSets.length) {
    L.push('_No problem-set resources found in the download._');
  } else {
    L.push('| Set | Solutions posted | OCW page |');
    L.push('|---|---|---|');
    for (const p of problemSets) {
      L.push(`| ${mdEscape(p.title)} | ${p.hasSolutions ? 'yes' : 'no'} | [page](${p.url}) |`);
    }
  }
  L.push('');
  L.push('## Exams');
  L.push('');
  if (!exams.length) {
    L.push('_No exam resources found in the download._');
  } else {
    L.push('| Exam | Solutions posted | OCW page |');
    L.push('|---|---|---|');
    for (const e of exams) {
      L.push(`| ${mdEscape(e.title)} | ${e.hasSolutions ? 'yes' : 'no'} | [page](${e.url}) |`);
    }
  }
  L.push('');
  // Free/open textbook, if one was paired with this course (tools/ocw/textbooks.json).
  const book = textbooks.find((b) => b.slug === course.slug);
  // 3-11 ships its open textbook inside the OCW download itself.
  const ocwBook =
    course.slug === '3-11'
      ? {
          title: 'Modules in Mechanics of Materials (Roylance) — OCW open textbook',
          url: course.url + 'resources/3_11_f_99_coursetextbook_pdf/',
          license: 'OCW / CC BY-NC-SA 4.0',
        }
      : null;
  const tb = book
    ? { title: book.title, url: book.source, license: book.license, note: book.note }
    : ocwBook;
  L.push('## Free textbook');
  L.push('');
  if (tb) {
    L.push(`**[${mdEscape(tb.title)}](${tb.url})** — ${tb.license}.`);
    if (tb.note) L.push(mdEscape(tb.note));
    L.push('');
    L.push(
      `Local copy (not committed): \`reference/textbooks/${course.slug}/textbook.pdf\`` +
        (book ? '' : ' — inside the OCW download at `reference/ocw/3-11/`.')
    );
  } else {
    L.push('_No paired free textbook — the OCW material above is the reference._');
  }
  L.push('');
  return L.join('\n') + '\n';
}

const args = process.argv.slice(2).filter((a) => a !== '--force');
const unknown = args.filter((s) => !COURSES.some((c) => c.slug === s));
if (unknown.length) {
  console.error(`unknown course slug(s): ${unknown.join(', ')}`);
  process.exit(1);
}
await fs.mkdir(DOCS, { recursive: true });
let done = 0;
for (const course of COURSES) {
  if (args.length && !args.includes(course.slug)) continue;
  const md = await buildIndex(course);
  if (!md) continue;
  await fs.writeFile(join(DOCS, course.slug + '.md'), md);
  console.log(`${course.slug}: wrote docs/ocw/${course.slug}.md`);
  done++;
}
console.log(`done: ${done} index files`);
