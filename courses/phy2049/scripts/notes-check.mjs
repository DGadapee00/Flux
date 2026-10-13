#!/usr/bin/env node
/**
 * Notes check (no browser): every set in src/notes/index.js against its file in src/notes/content/.
 *
 *   1. the file exists, and the registry's load() imports that same file
 *   2. the file's <section class="topic" id="…"> list matches the registry, in order, with the same
 *      titles (the <h2> text after its number)
 *   3. every lab, chapter, topic and pinned problem a section names exists, and the lab is one the
 *      set's exam lists
 *   4. every \( … \) and \[ … \] in the file typesets with KaTeX, with no stray delimiters left over
 *   5. the file has no <script> the panel would have to strip beyond MathJax's own
 *
 * A new set of notes has to pass this before it can ship (npm test runs it). Exit 1 on any failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { NOTES, sectionForProblem } from '../src/notes/index.js';
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { PROBLEMS, CHAPTER_ORDER } from '../src/problems/index.js';
import { SETUPS, setupsFor, matchExamples, applyExample } from '../src/notes/setups.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx } from '../src/problems/simbridge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/notes/index.js'), 'utf8');
const topics = new Set(PROBLEMS.flatMap((p) => p.topics || []));
const problemIds = new Set(PROBLEMS.map((p) => p.id));
const fails = [];
const fail = (set, msg) => fails.push(`${set}: ${msg}`);

const unescape = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const text = (html) => unescape(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

let sets = 0;
let sections = 0;
let formulas = 0;
let shown = 0;
let readings = 0;
for (const [key, set] of Object.entries(NOTES)) {
  sets++;
  const name = `${key} (${set.title})`;
  const exam = EXAMS.find((e) => e.id === set.exam);
  if (key !== set.exam) fail(name, `registered under "${key}" but says exam "${set.exam}"`);
  if (!exam) fail(name, `exam "${set.exam}" is not in the catalog`);
  if (!set.file) {
    fail(name, 'no `file` field');
    continue;
  }
  if (!src.includes(`import('./content/${set.file}?raw')`)) fail(name, `load() does not import ./content/${set.file}`);
  const file = path.join(root, 'src/notes/content', set.file);
  if (!fs.existsSync(file)) {
    fail(name, `missing file src/notes/content/${set.file}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');

  // 2. sections, in order, with matching titles
  const found = [...html.matchAll(/<section class="topic" id="([^"]+)">\s*<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({
    id: m[1],
    title: text(m[2].replace(/<span class="n">[^<]*<\/span>/, '')),
  }));
  const ids = set.sections.map((s) => s.id);
  if (found.map((f) => f.id).join() !== ids.join()) fail(name, `sections in the file (${found.map((f) => f.id).join(' ')}) differ from the registry (${ids.join(' ')})`);
  for (const f of found) {
    const reg = set.sections.find((s) => s.id === f.id);
    if (reg && reg.title !== f.title) fail(name, `${f.id} is titled "${f.title}" in the file but "${reg.title}" in the registry`);
  }

  // 3. what each section points at
  for (const s of set.sections) {
    sections++;
    if (s.lab && !LAB_META[s.lab]) fail(name, `${s.id}: no lab "${s.lab}"`);
    if (s.lab && exam && !exam.labs.includes(s.lab)) fail(name, `${s.id}: lab "${s.lab}" is not one of ${exam.id}'s labs (${exam.labs.join(', ')})`);
    for (const ch of s.ch) if (!CHAPTER_ORDER.includes(ch)) fail(name, `${s.id}: no chapter "${ch}"`);
    for (const t of s.topics || []) if (!topics.has(t)) fail(name, `${s.id}: no problem carries the topic "${t}"`);
    for (const id of s.problems || []) if (!problemIds.has(id)) fail(name, `${s.id}: no problem "${id}"`);
  }

  // 3b. "Show this in the lab": every setup belongs to one worked example, and the lab, run on it,
  //     agrees with the numbers the notes give (src/notes/setups.js).
  for (const s of set.sections) {
    const list = setupsFor(set.exam, s.id);
    if (!list.length) continue;
    const sec = html.match(new RegExp(`<section class="topic" id="${s.id}">([\\s\\S]*?)</section>`))?.[1] || '';
    const tags = [...sec.matchAll(/<div class="box ex"><span class="tag">([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
    const hits = matchExamples(set.exam, s.id, tags);
    list.forEach((ex, i) => {
      const who = `${s.id} example "${ex.tag ?? `#${ex.n}`}"`;
      const n = hits.filter((h) => h === i).length;
      if (n !== 1) return fail(name, `${who}: matches ${n} worked examples in the section, not 1`);
      if (!LAB_META[ex.lab]) return fail(name, `${who}: no lab "${ex.lab}"`);
      if (typeof ex.read !== 'function') fail(name, `${who}: no read(), so nothing checks the lab against the notes`);
    });
    for (const ex of list) {
      if (!LAB_META[ex.lab]) continue;
      const who = `${s.id} example "${ex.tag ?? `#${ex.n}`}"`;
      const lab = await loadLab(ex.lab);
      const slice = lab.defaultState();
      const computed = {};
      try {
        applyExample(lab, slice, ex);
        lab.recompute(slice, computed, headlessCtx());
      } catch (err) {
        fail(name, `${who}: the lab throws on this setup: ${err.message}`);
        continue;
      }
      // Labs fall back to their first scenario on an unknown id; that would load the wrong picture.
      if (ex.scenario && slice.scenarioId !== ex.scenario) {
        fail(name, `${who}: the ${ex.lab} lab has no scenario "${ex.scenario}"`);
        continue;
      }
      shown++;
      for (const [k, [got, want]] of Object.entries(ex.read?.(computed, slice) || {})) {
        readings++;
        // A zero in the notes (a balance point, a null field) is checked as |lab| < 10⁻⁶ of the scale it names.
        const ok = Number.isFinite(got) && (want === 0 ? Math.abs(got) < 1e-6 : Math.abs(got - want) <= 0.02 * Math.abs(want));
        if (!ok) fail(name, `${who}: the lab reads ${k} = ${got}, the notes say ${want}`);
      }
    }
  }

  // 4. math: every delimited formula typesets, and no delimiter is left unpaired
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  let rest = body;
  for (const [open, close, display] of [
    ['\\[', '\\]', true],
    ['\\(', '\\)', false],
  ]) {
    const re = new RegExp(`${open.replace(/[\\[()\]]/g, '\\$&')}([\\s\\S]*?)${close.replace(/[\\[()\]]/g, '\\$&')}`, 'g');
    rest = rest.replace(re, (_, tex) => {
      formulas++;
      // "<" before a letter opens an HTML tag in the browser (s<R reads as <R>), and the formula and
      // the text after it vanish. Write &lt;. (Markup inside a formula is stripped below, so this
      // would otherwise typeset here and break only in the app.)
      if (/<[A-Za-z]/.test(tex) && !/^<(?:span|b|i|sub|sup)\b/.test(tex.match(/<[A-Za-z][^>]*/)[0])) {
        fail(name, `"<" before a letter in ${open}${tex.slice(0, 50)}${close}: the browser reads it as a tag; write &lt;`);
      }
      try {
        katex.renderToString(unescape(tex.replace(/<[^>]+>/g, '')), { displayMode: display, throwOnError: true });
      } catch (err) {
        fail(name, `formula does not typeset: ${open}${tex.slice(0, 60)}${close} — ${String(err.message).split('\n')[0]}`);
      }
      return ' ';
    });
  }
  for (const d of ['\\(', '\\)', '\\[', '\\]']) if (rest.includes(d)) fail(name, `unpaired "${d}" left after typesetting`);

  // 5. scripts other than MathJax's own config and loader
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => !/mathjax/i.test(m[1] + m[2]));
  if (scripts.length) fail(name, `${scripts.length} script tag(s) besides MathJax`);
}

// Coverage: how many problems in the chapters the notes cover have a section to point to.
const covered = new Set(Object.values(NOTES).flatMap((s) => s.sections.flatMap((x) => x.ch)));
const inCovered = PROBLEMS.filter((p) => covered.has(p.ch));
const linked = inCovered.filter((p) => sectionForProblem(p));

// A setup filed under a section or exam the notes don't have would never show.
for (const [exam, bySec] of Object.entries(SETUPS)) {
  for (const sid of Object.keys(bySec)) {
    if (!NOTES[exam]?.sections.some((s) => s.id === sid)) fails.push(`setups: ${exam} ${sid} is not a notes section`);
  }
}
if (fails.length) {
  console.error(`notes: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`notes: ${sets} sets · ${sections} sections · ${formulas} formulas typeset · ${linked.length}/${inCovered.length} problems in covered chapters link to a section · ${shown} worked examples shown in a lab (${readings} readings checked)`);
