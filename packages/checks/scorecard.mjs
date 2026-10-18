#!/usr/bin/env node
/**
 * The course scorecard (docs/COURSE-STANDARD.md, section 6).
 *
 *   npm run scorecard              every course, one row each
 *   npm run scorecard -- --units   one row per unit as well
 *   npm run scorecard -- --md      the table as Markdown, for a PR
 *   --quiet                        only the verdict (npm test runs it this way)
 *   --mark <id>                    treat that course as marked, to see what CI would say
 *
 * Each course is measured against the standard's thresholds, unit by unit. A course row shows its
 * weakest unit for the per-unit checks and the bank's share for the per-template ones. The exit
 * code is non-zero only when a course marked `standard: true` in its manifest falls short, so a
 * course is marked once it passes and stays honest after that.
 *
 * Measured from the data each course already has: the manifest's units and labs, the problem
 * bank, the lab catalog (`app: true` marks an application lab), the labs' predictions, the notes
 * registry and its files, and the notes' lab setups. Smoke, overflow and layout run in each
 * course's own browser scripts, not here.
 *
 * "Variety from structure" counts a template when it declares `variety` (what it varies: the
 * configuration, the unknown, the representation), or when one of its `choice` variables picks
 * among non-numeric options. Number ranges alone do not count.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COURSES = ['phy2049', 'phy2048', 'mac2311', 'mac2312', 'mac2313', 'statics', 'egn3321', 'egn3331', 'eml3100', 'sta3032'];
const argv = process.argv.slice(2);
const args = new Set(argv);
const marked = new Set(argv.flatMap((a, i) => (a === '--mark' ? [argv[i + 1]] : [])));

/** The thresholds, in the standard's words. */
export const T = {
  wordsCore: 5000,
  wordsReview: 3000,
  examples: 6,
  predictions: 2,
  apps: 1,
  conceptual: 0.25,
  why: 1,
  traps: 1,
  principles: 1,
  hints: 1,
  structure: 0.6,
  cited: 1,
};

const exists = (p) => fs.existsSync(path.join(ROOT, p));
const load = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
async function tryLoad(...paths) {
  for (const p of paths) if (exists(p)) return load(p);
  return null;
}

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const words = (html) => unescape(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ')).split(/\s+/).filter(Boolean).length;

const isChoice = (p) => p.kind === 'choice' || p.kind === 'tf' || p.kind === 'order';
const isNumeric = (p) => p.kind === 'numeric';

/** A template is conceptual when the bank says so, or when every part is answered by choosing. */
const conceptual = (t) => t.kind === 'conceptual' || ((t.parts || []).length > 0 && t.parts.every((p) => isChoice(p) || p.kind === 'self'));

function structural(t) {
  if (Array.isArray(t.variety) ? t.variety.length : t.variety) return true;
  return Object.values(t.vars || {}).some((v) => v?.type === 'choice' && v.options?.some((o) => typeof o.value !== 'number'));
}

/** Every option of every choice part carries a `why`. Options built per version are drawn once. */
function allWhy(t, sample) {
  const parts = (t.parts || []).filter(isChoice);
  if (!parts.length) return null;
  for (const p of parts) {
    let opts = p.options;
    if (typeof opts === 'function') {
      const $ = sample(t);
      if (!$) return false;
      try {
        opts = opts($);
      } catch {
        return false;
      }
    }
    if (!Array.isArray(opts) || !opts.every((o) => o.why)) return false;
  }
  return true;
}

function trapCount(t) {
  const parts = (t.parts || []).filter(isNumeric);
  if (!parts.length) return null;
  return parts.reduce((n, p) => n + (Array.isArray(p.traps) ? p.traps.length : 0), 0);
}

const share = (list, test) => {
  const scored = list.map(test).filter((x) => x !== null);
  return scored.length ? scored.filter(Boolean).length / scored.length : null;
};

async function measure(id) {
  const dir = `courses/${id}/src`;
  const { course } = await load(`${dir}/manifest.js`);
  const units = course.units || [];
  const review = !!course.review;
  const P = await course.problems();
  const problems = P.PROBLEMS || [];
  const engine = await tryLoad(`${dir}/problems/engine.js`);
  const instance = P.instance || engine?.instance;
  const sample = (t) => {
    try {
      return instance ? instance(t, 1).$ : null;
    } catch {
      return null;
    }
  };

  const catalog = await tryLoad(`${dir}/data/catalog.js`, `${dir}/catalog.js`);
  const meta = catalog?.LAB_META || {};
  const labsMod = course.labs ? await course.labs() : null;
  const staticPredictions = await tryLoad(`${dir}/labs/predictions.js`);
  const dataPredictions = await tryLoad(`${dir}/data/predictions.js`);
  async function predictionsOf(labId) {
    if (dataPredictions?.predictionsFor) return dataPredictions.predictionsFor(labId).length;
    if (staticPredictions?.PREDICTIONS?.[labId]) return staticPredictions.PREDICTIONS[labId].length;
    try {
      const lab = labsMod?.loadLab ? await labsMod.loadLab(labId) : labsMod?.labById?.(labId);
      return lab?.predictions?.length ?? 0;
    } catch {
      return 0;
    }
  }

  const notesMod = course.notes ? await course.notes() : null;
  const NOTES = notesMod?.NOTES || {};
  const setupsMod = notesMod ? await tryLoad(`${dir}/notes/setups.js`) : null;
  const SETUPS = setupsMod?.SETUPS || {};

  // A template belongs to the unit it names. One that names none (STA 3032's cumulative exams)
  // belongs to every unit whose chapters hold its chapter.
  const chaptersOf = (u) => new Set(String((u.chapters || []).join(',')).split(/[,\s]+/).filter(Boolean));
  const inUnit = (t, u) => (t.exam || t.unit ? (t.exam || t.unit) === u.id : chaptersOf(u).has(String(t.ch)));

  const rows = [];
  for (const u of units) {
    const tpls = problems.filter((t) => inUnit(t, u));
    const notes = NOTES[u.id];
    const file = notes?.file ? `${dir}/notes/content/${notes.file}` : null;
    const w = file && exists(file) ? words(fs.readFileSync(path.join(ROOT, file), 'utf8')) : 0;
    const examples = Object.values(SETUPS[u.id] || {}).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);
    const labs = u.labs || [];
    const preds = [];
    for (const l of labs) preds.push(await predictionsOf(l));
    rows.push({
      unit: u.id,
      templates: tpls.length,
      words: w,
      examples,
      labs: labs.length,
      minPredictions: labs.length ? Math.min(...preds) : 0,
      apps: labs.filter((l) => meta[l]?.app).length,
      conceptual: tpls.length ? tpls.filter(conceptual).length / tpls.length : 0,
    });
  }

  const bank = {
    templates: problems.length,
    why: share(problems, (t) => allWhy(t, sample)),
    traps: share(problems, (t) => {
      const n = trapCount(t);
      return n === null ? null : n >= 2;
    }),
    principles: share(problems, (t) => Array.isArray(t.principles) && t.principles.length > 0),
    hints: share(problems, (t) => Array.isArray(t.hints) && t.hints.length >= 2),
    structure: share(problems, structural),
    cited: share(problems, (t) => (t.cases || []).some((c) => typeof c.src === 'string' && c.src.trim())),
  };

  const wordsNeed = review ? T.wordsReview : T.wordsCore;
  const minOf = (k) => (rows.length ? Math.min(...rows.map((r) => r[k])) : 0);
  const checks = {
    words: [minOf('words'), minOf('words') >= wordsNeed, wordsNeed],
    examples: [minOf('examples'), minOf('examples') >= T.examples],
    predictions: [minOf('minPredictions'), minOf('minPredictions') >= T.predictions],
    apps: [minOf('apps'), minOf('apps') >= T.apps],
    conceptual: [minOf('conceptual'), minOf('conceptual') >= T.conceptual],
    why: [bank.why, bank.why === null || bank.why >= T.why],
    traps: [bank.traps, bank.traps === null || bank.traps >= T.traps],
    principles: [bank.principles, bank.principles !== null && bank.principles >= T.principles],
    hints: [bank.hints, bank.hints !== null && bank.hints >= T.hints],
    structure: [bank.structure, bank.structure !== null && bank.structure >= T.structure],
    cited: [bank.cited, bank.cited !== null && bank.cited >= T.cited],
  };
  const passed = Object.values(checks).every(([, ok]) => ok);
  return { id, code: course.code, standard: course.standard === true || marked.has(id), review, units: rows, bank, checks, passed };
}

const pct = (x) => (x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`);
const COLS = [
  ['words', 'words/unit', (v) => String(v)],
  ['examples', 'lab examples/unit', (v) => String(v)],
  ['predictions', 'predictions/lab', (v) => String(v)],
  ['apps', 'app labs/unit', (v) => String(v)],
  ['conceptual', 'conceptual', pct],
  ['why', 'why', pct],
  ['traps', '≥2 traps', pct],
  ['principles', 'principles', pct],
  ['hints', '≥2 hints', pct],
  ['structure', 'structure', pct],
  ['cited', 'cited case', pct],
];

function table(results, md) {
  const head = ['course', 'std', 'templates', ...COLS.map(([, h]) => h), 'passes'];
  const body = results.map((r) => [
    r.code + (r.review ? ' (review)' : ''),
    r.standard ? 'true' : 'false',
    String(r.bank.templates),
    ...COLS.map(([k, , f]) => `${r.checks[k][1] ? '✓' : '✗'} ${f(r.checks[k][0])}`),
    r.passed ? 'yes' : 'no',
  ]);
  if (md) return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((row) => `| ${row.join(' | ')} |`)].join('\n');
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (row) => row.map((c, i) => c.padEnd(widths[i])).join('  ');
  return [line(head), line(widths.map((w) => '-'.repeat(w))), ...body.map(line)].join('\n');
}

function unitTable(r) {
  const head = ['unit', 'templates', 'words', 'lab examples', 'labs', 'min predictions', 'app labs', 'conceptual'];
  const body = r.units.map((u) => [u.unit, u.templates, u.words, u.examples, u.labs, u.minPredictions, u.apps, pct(u.conceptual)].map(String));
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (row) => row.map((c, i) => c.padEnd(widths[i])).join('  ');
  return [`${r.code}`, line(head), ...body.map(line)].join('\n');
}

const results = [];
for (const id of COURSES) {
  if (!exists(`courses/${id}/src/manifest.js`)) continue;
  results.push(await measure(id));
}

const md = args.has('--md');
const quiet = args.has('--quiet');
if (!quiet) console.log(table(results, md));
if (!md && !quiet) {
  console.log(`\nThresholds: words ≥${T.wordsCore} per unit (≥${T.wordsReview} review), ≥${T.examples} lab examples per unit, ≥${T.predictions} predictions per lab, ≥${T.apps} application lab per unit, ≥${T.conceptual * 100}% conceptual per unit; why, traps, principles, hints and a cited case on every template; ≥${T.structure * 100}% varied by structure. A per-unit column shows the weakest unit. Smoke, overflow and layout run in each course's browser scripts.`);
}
if (args.has('--units') && !quiet) for (const r of results) console.log(`\n${unitTable(r)}`);

const short = results.filter((r) => r.standard && !r.passed);
if (short.length) {
  for (const r of short) {
    const missed = COLS.filter(([k]) => !r.checks[k][1]).map(([k, h, f]) => `${h} ${f(r.checks[k][0])}`);
    console.error(`scorecard: ${r.code} is marked standard: true but misses ${missed.join(', ')}`);
  }
  process.exit(1);
}
if (!md) console.log(`scorecard: ${results.filter((r) => r.standard).length} of ${results.length} courses marked standard: true, all passing`);
