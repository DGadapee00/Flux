#!/usr/bin/env node
/**
 * The map's check. `npm test` runs it; it exits non-zero on the first run with any error.
 *
 * It fails on:
 * - a duplicate id, a `requires` that names no concept, a cycle
 * - a lab the course's catalog does not have, or a notes section its notes index does not have
 * - a missing field, a URL that is not https, TeX that KaTeX cannot parse, an em dash in our prose
 * - a concept with no lab and no `candidate`
 * - a course path (map/paths/) that names an unknown concept, misses or adds a concept relative to
 *   the concepts that list the course, repeats one, or puts a concept before its prerequisite
 * and on subjects or courses that are malformed or out of step with packages/tracks.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { findCycle } from './graph.js';

export const LEVELS = ['Intro', 'Course level', 'Deeper'];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const EM_DASH = '—';

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

/** @param {string} tex @param {boolean} display */
function texError(tex, display) {
  try {
    katex.renderToString(tex, { displayMode: display, throwOnError: true, output: 'mathml' });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message.split('\n')[0] : String(err);
  }
}

/**
 * Prose with inline TeX as \( ... \). Returns one message per problem.
 * @param {string} text
 */
export function proseErrors(text) {
  const out = [];
  const parts = text.split(/\\\(([\s\S]*?)\\\)/g);
  for (let i = 1; i < parts.length; i += 2) {
    const e = texError(parts[i], false);
    if (e) out.push(`TeX \\(${parts[i]}\\) does not parse: ${e}`);
  }
  const plain = parts.filter((_, i) => i % 2 === 0).join('');
  if (plain.includes('\\(') || plain.includes('\\)')) out.push('has an unmatched \\( or \\)');
  if (text.includes(EM_DASH)) out.push('has an em dash');
  return out;
}

/** @param {string} url */
function httpsError(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? null : `${url} is not https`;
  } catch {
    return `${url} is not a URL`;
  }
}

/**
 * @param {{
 *   subjects: any[],
 *   courses: any[],
 *   statuses: string[],
 *   concepts: { file?: string, concept: any }[],
 *   labCatalogs: Record<string, Record<string, { unit: string, title: string }>>,
 *   notesIndexes: Record<string, Record<string, { id: string }[]>>,
 *   tracks?: { courses: { id: string, code: string, href: string|null }[] }[],
 *   paths?: { file?: string, path: any }[],
 * }} data
 * @returns {string[]} errors
 */
export function checkMap({ subjects, courses, statuses, concepts, labCatalogs, notesIndexes, tracks = [], paths = [] }) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);

  // Subjects
  const subjectIds = new Set();
  for (const s of subjects) {
    const where = `subject ${s.id ?? '?'}`;
    if (!isText(s.id) || !ID.test(s.id)) err(where, 'id is missing or not kebab-case');
    if (subjectIds.has(s.id)) err(where, 'duplicate id');
    subjectIds.add(s.id);
    if (!isText(s.label)) err(where, 'missing label');
    if (!/^--lane-[a-z]+$/.test(s.token || '')) err(where, 'token must look like --lane-<name>');
    if (!HEX.test(s.dark || '') || !HEX.test(s.light || '')) err(where, 'dark and light must be #rrggbb');
  }

  // Courses
  const trackCourses = new Map(tracks.flatMap((t) => t.courses).map((c) => [c.id, c]));
  const courseById = new Map();
  for (const c of courses) {
    const where = `course ${c.id ?? '?'}`;
    if (!isText(c.id)) err(where, 'missing id');
    if (courseById.has(c.id)) err(where, 'duplicate id');
    courseById.set(c.id, c);
    if (!isText(c.code)) err(where, 'missing code');
    if (!isText(c.title)) err(where, 'missing title');
    if (!statuses.includes(c.status)) err(where, `status must be one of ${statuses.join(', ')}`);
    if (!('app' in c)) err(where, 'missing app (null when Flux has no app for it)');
    const card = trackCourses.get(c.id);
    if (card) {
      if (card.code !== c.code) err(where, `code ${c.code} differs from tracks.js (${card.code})`);
      if ((card.href ?? null) !== (c.app ?? null)) err(where, `app ${c.app} differs from tracks.js (${card.href})`);
    }
    if (c.app && !labCatalogs[c.id]) err(where, 'has an app but no lab catalog in map/catalog.js');
  }
  for (const id of trackCourses.keys()) {
    if (!courseById.has(id)) err(`course ${id}`, 'is in tracks.js but not in map/courses.js');
  }

  // Concepts: fields
  const ids = new Map();
  for (const { file, concept: c } of concepts) {
    const where = `concept ${c?.id ?? file ?? '?'}`;
    if (!c || typeof c !== 'object') {
      err(where, 'file has no default export');
      continue;
    }
    if (!isText(c.id) || !ID.test(c.id)) err(where, 'id is missing or not kebab-case');
    if (file && file !== `${c.id}.js`) err(where, `file is ${file}, expected ${c.id}.js`);
    if (ids.has(c.id)) err(where, 'duplicate id');
    ids.set(c.id, c);

    if (!isText(c.title)) err(where, 'missing title');
    else if (c.title.includes(EM_DASH)) err(where, 'title has an em dash');
    if (c.label !== undefined) {
      const ok = Array.isArray(c.label) && c.label.length >= 1 && c.label.length <= 2 && c.label.every(isText);
      if (!ok) err(where, 'label must be one or two lines of text');
      else if (c.label.some((l) => l.includes(EM_DASH))) err(where, 'label has an em dash');
    }
    if (!subjectIds.has(c.subject)) err(where, `subject ${c.subject} is not in subjects.js`);
    if (!Array.isArray(c.courses) || c.courses.length === 0) err(where, 'courses must list at least one course id');
    else for (const id of c.courses) if (!courseById.has(id)) err(where, `course ${id} is not in courses.js`);

    if (!isText(c.eq)) err(where, 'missing eq');
    else {
      const e = texError(c.eq, true);
      if (e) err(where, `eq does not parse: ${e}`);
    }
    if (!isText(c.idea)) err(where, 'missing idea');
    else for (const e of proseErrors(c.idea)) err(where, `idea ${e}`);

    if (!Array.isArray(c.requires)) err(where, 'requires must be an array (empty for a starting point)');

    if (!Array.isArray(c.sources)) err(where, 'missing sources');
    else {
      if (c.sources.length < 2 || c.sources.length > 3) err(where, `has ${c.sources.length} sources, expected two or three`);
      c.sources.forEach((s, i) => {
        const at = `${where} source ${i + 1}`;
        for (const k of ['title', 'url', 'kind', 'level', 'why']) if (!isText(s?.[k])) err(at, `missing ${k}`);
        if (isText(s?.url)) {
          const e = httpsError(s.url);
          if (e) err(at, e);
        }
        if (isText(s?.level) && !LEVELS.includes(s.level)) err(at, `level must be one of ${LEVELS.join(', ')}`);
        if (isText(s?.why)) for (const e of proseErrors(s.why)) err(at, `why ${e}`);
      });
    }

    if (!Array.isArray(c.labs)) err(where, 'labs must be an array (empty when there is no lab yet)');
    else {
      const seen = new Set();
      c.labs.forEach((ref, i) => {
        const at = `${where} lab ${i + 1}`;
        const course = courseById.get(ref?.course);
        const catalog = labCatalogs[ref?.course];
        if (!course) return err(at, `course ${ref?.course} is not in courses.js`);
        if (!catalog) return err(at, `${ref.course} has no Flux app, so it has no labs`);
        const meta = catalog[ref.lab];
        if (!meta) return err(at, `${ref.course} has no lab ${ref.lab}`);
        const key = `${ref.course}/${ref.lab}`;
        if (seen.has(key)) err(at, `${key} is listed twice`);
        seen.add(key);
        if (ref.notes !== undefined && ref.notes !== null) {
          const sections = notesIndexes[ref.course]?.[meta.unit];
          if (!sections) err(at, `${ref.course} has no notes for unit ${meta.unit}`);
          else if (!sections.some((s) => s.id === ref.notes)) {
            err(at, `${ref.course} unit ${meta.unit} notes have no section ${ref.notes}`);
          }
        }
        if (!isText(ref.note)) err(at, 'missing note');
        else for (const e of proseErrors(ref.note)) err(at, `note ${e}`);
      });
      if (c.labs.length === 0 && !isText(c.candidate)) err(where, 'has no lab and no candidate');
    }
    if (c.candidate !== undefined) {
      if (!isText(c.candidate)) err(where, 'candidate is empty');
      else for (const e of proseErrors(c.candidate)) err(where, `candidate ${e}`);
    }
  }

  // Concepts: the graph
  const list = [...ids.values()].filter((c) => Array.isArray(c.requires));
  for (const c of list) {
    for (const r of c.requires) {
      if (r === c.id) err(`concept ${c.id}`, 'requires itself');
      else if (!ids.has(r)) err(`concept ${c.id}`, `requires ${r}, which is not a concept`);
    }
  }
  const cycle = findCycle(list);
  if (cycle) errors.push(`cycle: ${cycle.join(' → ')}`);

  // Course paths
  const pathCourses = new Set();
  for (const { file, path: p } of paths) {
    const where = `path ${p?.course ?? file ?? '?'}`;
    if (!p || typeof p !== 'object') {
      err(where, 'file has no default export');
      continue;
    }
    if (!courseById.has(p.course)) err(where, `course ${p.course} is not in courses.js`);
    if (file && file !== `${p.course}.js`) err(where, `file is ${file}, expected ${p.course}.js`);
    if (pathCourses.has(p.course)) err(where, 'duplicate path for this course');
    pathCourses.add(p.course);
    if (!Array.isArray(p.units) || p.units.length === 0) {
      err(where, 'units must list at least one unit');
      continue;
    }
    const order = [];
    p.units.forEach((u, i) => {
      if (u.title !== undefined && !isText(u.title)) err(`${where} unit ${i + 1}`, 'title is empty');
      if (u.title?.includes(EM_DASH)) err(`${where} unit ${i + 1}`, 'title has an em dash');
      if (!Array.isArray(u.concepts) || u.concepts.length === 0) err(`${where} unit ${i + 1}`, 'concepts must list at least one id');
      else order.push(...u.concepts);
    });
    const at = new Map();
    order.forEach((id, i) => {
      if (at.has(id)) err(where, `${id} appears twice`);
      else at.set(id, i);
      const c = ids.get(id);
      if (!c) err(where, `${id} is not a concept`);
      else if (!c.courses?.includes(p.course)) err(where, `${id} is on the path, but its courses do not list ${p.course}`);
    });
    for (const c of ids.values()) {
      if (c.courses?.includes(p.course) && !at.has(c.id)) err(where, `${c.id} lists ${p.course} but is not on its path`);
    }
    for (const [id, i] of at) {
      for (const r of ids.get(id)?.requires || []) {
        if (at.has(r) && at.get(r) > i) err(where, `${id} comes before its prerequisite ${r}`);
      }
    }
  }

  return errors;
}

/** Loads the real map and checks it. */
export async function checkRepo() {
  const [{ SUBJECTS }, { COURSES, STATUSES }, { LAB_CATALOGS }, { TRACKS }, { loadConcepts, loadNotesIndexes }] =
    await Promise.all([
      import('./subjects.js'),
      import('./courses.js'),
      import('./catalog.js'),
      import('@flux/tracks'),
      import('./load.mjs'),
    ]);
  const concepts = await loadConcepts();
  const paths = await (await import('./load.mjs')).loadPaths();
  const notesIndexes = await loadNotesIndexes(Object.keys(LAB_CATALOGS));
  const errors = checkMap({
    subjects: SUBJECTS,
    courses: COURSES,
    statuses: STATUSES,
    concepts,
    labCatalogs: LAB_CATALOGS,
    notesIndexes,
    tracks: TRACKS,
    paths,
  });
  const withLab = concepts.filter(({ concept }) => concept.labs?.length).length;
  return { errors, count: concepts.length, withLab, paths: paths.map((p) => p.path.course) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, count, withLab, paths } = await checkRepo();
  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(`map check: ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(`map ok: ${count} concepts, ${withLab} with a lab, ${count - withLab} gaps; paths: ${paths.join(', ') || 'none'}`);
}
