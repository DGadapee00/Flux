#!/usr/bin/env node
/**
 * Builds the learner prototype from the real map, the course problem banks and the PHY 2049 exam
 * calendar. Nothing here changes a course app: it reads their data and writes one HTML file.
 *
 *   node docs/map/prototype-learner/build.mjs              writes docs/map/prototype-learner.html
 *   node docs/map/prototype-learner/build.mjs --fragment <out>   the same page with no document
 *                                                                 skeleton, for an Artifact publish
 *
 * TeX is rendered to MathML here, so the page needs no math fonts or scripts.
 */
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { loadConcepts, loadPaths, ROOT } from '../../../map/load.mjs';
import { SUBJECTS } from '../../../map/subjects.js';
import { COURSES } from '../../../map/courses.js';
import { LAB_CATALOGS } from '../../../map/catalog.js';
import { labHref, notesHref } from '../../../map/routes.js';
import { SATELLITE } from '../../../map/applications/satellite.js';
import { EXAMS } from '../../../courses/phy2049/src/data/catalog.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SITE = 'https://flux-study.pages.dev/';
const BANKS = ['phy2049', 'phy2048', 'mac2311', 'mac2313', 'statics', 'sta3032', 'egn3321', 'egn3331', 'eml3100', 'map2302', 'bench'];

// The TeX annotation inside each <math> repeats the source; dropping it keeps the page small.
const tex = (src, display = false) => katex.renderToString(src, { output: 'mathml', displayMode: display, throwOnError: false })
  .replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/g, '')
  .replace(/<\/?semantics>/g, '')
  // Chrome's MathML ignores mathvariant="bold", so vectors use the Unicode bold letters instead.
  .replace(/<m([in])([^>]*?) mathvariant="bold"([^>]*)>([A-Za-z0-9]+)<\/m\1>/g, (_, t, a, b, s) => `<m${t}${a}${b}>${[...s].map(bold).join('')}</m${t}>`);
function bold(ch) {
  const c = ch.codePointAt(0);
  if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d400 + c - 65);
  if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d41a + c - 97);
  if (c >= 48 && c <= 57) return String.fromCodePoint(0x1d7ce + c - 48);
  return ch;
}
/** A problem title: plain text with $…$ TeX. */
const titleHtml = (s) => String(s).split(/(\$[^$]+\$)/).map((part) => (/^\$[^$]+\$$/.test(part) ? tex(part.slice(1, -1)) : esc(part))).join('');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Prose with \( \) inline TeX, as HTML. */
const prose = (s) => String(s ?? '').split(/(\\\(.*?\\\))/s).map((part) => (part.startsWith('\\(') ? tex(part.slice(2, -2)) : esc(part))).join('');

const problems = {};
const byLab = {};
for (const course of BANKS) {
  const { PROBLEMS } = await import(path.join(ROOT, 'courses', course, 'src/problems/index.js'));
  for (const p of PROBLEMS) {
    if (!p.lab) continue;
    // Problem ids are unique within a course, so the key carries the course.
    const id = `${course}:${p.id}`;
    (byLab[`${course}/${p.lab}`] ||= []).push(id);
    problems[id] = titleHtml(p.title || p.id);
  }
}

const concepts = (await loadConcepts()).map(({ concept: c }) => {
  const labs = (c.labs || []).map((ref) => {
    const meta = LAB_CATALOGS[ref.course]?.[ref.lab];
    const notes = meta ? notesHref(ref, meta.unit) : null;
    return {
      course: ref.course,
      title: meta?.title || ref.lab,
      href: meta ? SITE + labHref({ course: ref.course, unit: meta.unit, lab: ref.lab }) : null,
      notes: notes ? SITE + notes : null,
      note: prose(ref.note),
    };
  });
  const ids = [...new Set((c.labs || []).flatMap((ref) => byLab[`${ref.course}/${ref.lab}`] || []))];
  return {
    id: c.id,
    title: c.title,
    subject: c.subject,
    courses: c.courses,
    eq: c.eq ? tex(c.eq, true) : '',
    idea: prose(c.idea),
    requires: c.requires,
    labs,
    problems: ids,
    candidate: c.candidate ? prose(c.candidate) : null,
    sources: (c.sources || []).map((s) => ({ title: s.title, url: s.url, why: s.why, level: s.level })),
  };
});

const used = new Set(concepts.flatMap((c) => c.problems));
for (const id of Object.keys(problems)) if (!used.has(id)) delete problems[id];

const paths = Object.fromEntries((await loadPaths()).map(({ path: p }) => [p.course, p.units || [{ title: '', concepts: p.concepts }]]));

// PHY 2049's exams, matched to its path's units by number.
const exams = EXAMS.map((e) => {
  const unit = (paths.phy2049 || []).find((u) => u.title.startsWith(`Exam ${e.n}:`));
  const [, m, d] = e.date.match(/(\d+)\/(\d+)/);
  return { course: 'phy2049', n: e.n, title: e.title.replace('&', 'and'), date: `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, concepts: unit?.concepts || [] };
}).filter((e) => e.concepts.length);

const satellite = [...SATELLITE.components, SATELLITE.integration].map((r) => ({
  id: r.id,
  title: r.title,
  part: r.part || 'All seven subsystems',
  requires: r.requires,
  concepts: r.concepts || [],
  outcome: r.outcome,
  demonstrate: r.demonstrate,
  deliverable: r.deliverable,
  gap: r.gap,
}));

const DATA = {
  built: new Date().toISOString().slice(0, 10),
  site: SITE,
  subjects: SUBJECTS.map(({ id, label, dark, light }) => ({ id, label, dark, light })),
  courses: COURSES.map(({ id, code, title, status, app, kind }) => ({ id, code, title, status: kind === 'project' ? 'project' : status, app: app ? SITE + app : null })),
  concepts,
  paths,
  exams,
  problems,
  satellite,
};

const template = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8');
const json = JSON.stringify(DATA).replace(/</g, '\\u003c');
const body = template.replace('/*DATA*/null', json);

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt >= 0) {
  fs.writeFileSync(process.argv[fragmentAt + 1], body);
  console.log(`wrote ${process.argv[fragmentAt + 1]}`);
} else {
  const out = path.join(HERE, '..', 'prototype-learner.html');
  const page = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  fs.writeFileSync(out, page);
  console.log(`wrote ${path.relative(ROOT, out)}: ${concepts.length} concepts, ${Object.keys(problems).length} problems, ${exams.length} exams`);
}
