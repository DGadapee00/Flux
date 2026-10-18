#!/usr/bin/env node
/**
 * Notes check: src/notes/index.js against src/notes/content/.
 * Section ids and titles match. Labs, chapters, and topics exist.
 * Every setup matches one worked example, and the lab agrees within 2%.
 * Every \( \) and \[ \] typesets.
 * Every section but the formula sheet has a worked example and ends with what the model leaves out,
 * and each unit runs to at least 3,000 words.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { NOTES, sectionForProblem } from '../src/notes/index.js';
import { SETUPS, applyExample, matchExamples, setupsFor } from '../src/notes/setups.js';
import { CHAPTER_ORDER, PROBLEMS } from '../src/problems/index.js';
import { headlessCtx } from '../src/problems/simbridge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The registry is one file per unit (src/notes/units/), each loading its own HTML.
const src = fs.readdirSync(path.join(root, 'src/notes/units')).map((f) => fs.readFileSync(path.join(root, 'src/notes/units', f), 'utf8')).join('\n');
const onlyAt = process.argv.indexOf('--only');
const ONLY = onlyAt >= 0 ? process.argv[onlyAt + 1] : '';
const topics = new Set(PROBLEMS.flatMap((p) => p.topics || []));
const fails = [];
const fail = (set, msg) => fails.push(`${set}: ${msg}`);

const unescape = (s) => s
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');
const text = (html) => unescape(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

let sections = 0;
let formulas = 0;
let shown = 0;
let readings = 0;
const words = {};
const MIN_WORDS = 3000;
for (const [key, set] of Object.entries(NOTES)) {
  if (ONLY && key !== ONLY) continue;
  const name = `${key} (${set.title})`;
  const exam = EXAMS.find((e) => e.id === set.exam);
  if (key !== set.exam) fail(name, `registered under "${key}" but says exam "${set.exam}"`);
  if (!exam) fail(name, `exam "${set.exam}" is not in the catalog`);
  if (!src.includes(`import('../content/${set.file}?raw')`)) fail(name, `load() does not import ../content/${set.file}`);
  const file = path.join(root, 'src/notes/content', set.file);
  if (!fs.existsSync(file)) {
    fail(name, `missing file src/notes/content/${set.file}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('$')) fail(name, 'a dollar sign is not a math delimiter in the notes');

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

  words[key] = text(html.replace(/<head>[\s\S]*?<\/head>/, '')).split(' ').filter(Boolean).length;
  if (words[key] < MIN_WORDS) fail(name, `${words[key]} words; a unit needs at least ${MIN_WORDS}`);
  for (const s of set.sections) {
    if (s.title === 'Formula sheet') continue;
    const sec = html.match(new RegExp(`<section class="topic" id="${s.id}">([\\s\\S]*?)</section>`))?.[1] || '';
    if (!/<div class="box ex">/.test(sec)) fail(name, `${s.id}: no worked example`);
    const last = [...sec.matchAll(/<div class="box ([a-z]+)">/g)].pop();
    const tail = last ? sec.slice(last.index) : '';
    if (!last || last[1] !== 'out' || /<\/div>[\s\S]*<(p|div|ul|ol)\b/.test(tail)) fail(name, `${s.id}: does not end with a "What the model leaves out" box`);
  }

  for (const s of set.sections) {
    sections++;
    if (s.lab && !LAB_META[s.lab]) fail(name, `${s.id}: no lab "${s.lab}"`);
    if (s.lab && exam && !exam.labs.includes(s.lab)) fail(name, `${s.id}: lab "${s.lab}" is not one of ${exam.id}'s labs`);
    for (const ch of s.ch) if (!CHAPTER_ORDER.includes(ch)) fail(name, `${s.id}: no chapter "${ch}"`);
    for (const t of s.topics || []) if (!topics.has(t)) fail(name, `${s.id}: no problem carries the topic "${t}"`);
  }

  for (const s of set.sections) {
    const list = setupsFor(set.exam, s.id);
    if (!list.length) continue;
    const sec = html.match(new RegExp(`<section class="topic" id="${s.id}">([\\s\\S]*?)</section>`))?.[1] || '';
    const tags = [...sec.matchAll(/<div class="box ex"><span class="tag">([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
    const hits = matchExamples(set.exam, s.id, tags);
    list.forEach((ex, i) => {
      const who = `${s.id} example "${ex.tag ?? `#${ex.n}`}"`;
      const n = hits.filter((h) => h === i).length;
      if (n !== 1) fail(name, `${who}: matches ${n} worked examples in the section, not 1`);
      if (!LAB_META[ex.lab]) fail(name, `${who}: no lab "${ex.lab}"`);
      if (typeof ex.read !== 'function') fail(name, `${who}: no read()`);
    });
    for (const ex of list) {
      if (!LAB_META[ex.lab]) continue;
      const who = `${s.id} example "${ex.tag ?? `#${ex.n}`}"`;
      const lab = await loadLab(ex.lab);
      const state = lab.defaultState();
      const computed = {};
      try {
        applyExample(lab, state, ex);
        lab.recompute(state, computed, headlessCtx());
      } catch (error) {
        fail(name, `${who}: the lab throws on this setup: ${error.message}`);
        continue;
      }
      if (ex.scenario && state.scenarioId !== ex.scenario) {
        fail(name, `${who}: the ${ex.lab} lab has no scenario "${ex.scenario}"`);
        continue;
      }
      shown++;
      for (const [k, [got, want]] of Object.entries(ex.read(computed, state) || {})) {
        readings++;
        const ok = Number.isFinite(got) && (want === 0 ? Math.abs(got) < 1e-6 : Math.abs(got - want) <= 0.02 * Math.abs(want));
        if (!ok) fail(name, `${who}: the lab reads ${k} = ${got}, the notes say ${want}`);
      }
    }
  }

  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
  let rest = body;
  for (const [open, close, display] of [['\\[', '\\]', true], ['\\(', '\\)', false]]) {
    const re = new RegExp(`${open.replace(/[\\[()\]]/g, '\\$&')}([\\s\\S]*?)${close.replace(/[\\[()\]]/g, '\\$&')}`, 'g');
    rest = rest.replace(re, (_, tex) => {
      formulas++;
      if (/<[A-Za-z]/.test(tex)) fail(name, `"<" before a letter in ${open}${tex.slice(0, 40)}${close}`);
      try {
        katex.renderToString(unescape(tex.replace(/<[^>]+>/g, '')), { displayMode: display, throwOnError: true });
      } catch (error) {
        fail(name, `formula does not typeset: ${open}${tex.slice(0, 60)}${close} — ${String(error.message).split('\n')[0]}`);
      }
      return ' ';
    });
  }
  for (const d of ['\\(', '\\)', '\\[', '\\]']) if (rest.includes(d)) fail(name, `unpaired "${d}" left after typesetting`);
}

for (const [exam, bySec] of Object.entries(SETUPS)) {
  for (const sid of Object.keys(bySec)) {
    if (!NOTES[exam]?.sections.some((s) => s.id === sid)) fails.push(`setups: ${exam} ${sid} is not a notes section`);
  }
}

const covered = PROBLEMS.filter((p) => Object.values(NOTES).some((set) => set.sections.some((s) => s.ch.includes(p.ch))));
const linked = covered.filter((p) => sectionForProblem(p));

if (fails.length) {
  console.error(`notes: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`notes: ${Object.keys(NOTES).length} sets (${Object.entries(words).map(([k, n]) => `${k} ${n}`).join(', ')} words) · ${sections} sections · ${formulas} formulas typeset · ${linked.length}/${covered.length} problems link to a section · ${shown} worked examples shown in a lab (${readings} readings)`);
