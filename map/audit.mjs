#!/usr/bin/env node
/**
 * `npm run map-audit`: every lab (each course's LAB_META) and every notes section (each notes
 * index) that no concept on the map references, grouped by course.
 *
 *   npm run map-audit                   every course
 *   npm run map-audit -- --course <id>  one course
 *   npm run map-audit -- --summary      counts only, one line per course
 *
 * A notes section counts as referenced when a concept's lab reference names it in `notes`.
 * Formula sheets and reviews are summaries, not concepts, so they are counted apart and not listed.
 * The exit code is always 0: the audit is a to-do list, not a gate.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { notesOf } from './routes.js';

const SUMMARY = /\b(formula sheet|review|summary|cheat sheet)\b/i;

/**
 * @param {{
 *   concepts: any[],
 *   labCatalogs: Record<string, Record<string, { unit: string, title: string }>>,
 *   notesIndexes: Record<string, Record<string, { id: string, title: string, lab: string|null }[]>>,
 * }} data
 */
export function auditMap({ concepts, labCatalogs, notesIndexes }) {
  const labsUsed = new Set();
  const notesUsed = new Set();
  for (const c of concepts) {
    for (const ref of c.labs || []) {
      labsUsed.add(`${ref.course}/${ref.lab}`);
      const unit = labCatalogs[ref.course]?.[ref.lab]?.unit;
      for (const id of notesOf(ref)) notesUsed.add(`${ref.course}/${unit}/${id}`);
    }
  }
  /** @type {Record<string, any>} */
  const out = {};
  for (const [course, catalog] of Object.entries(labCatalogs)) {
    const labs = Object.entries(catalog).map(([id, m]) => ({ id, unit: m.unit, title: m.title }));
    const sections = Object.entries(notesIndexes[course] || {}).flatMap(([unit, list]) => list.map((s) => ({ unit, ...s })));
    const summaries = sections.filter((s) => SUMMARY.test(s.title));
    const content = sections.filter((s) => !SUMMARY.test(s.title));
    out[course] = {
      labs: { total: labs.length, missing: labs.filter((l) => !labsUsed.has(`${course}/${l.id}`)) },
      notes: { total: content.length, missing: content.filter((s) => !notesUsed.has(`${course}/${s.unit}/${s.id}`)) },
      summaries: summaries.length,
    };
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const only = argv.includes('--course') ? argv[argv.indexOf('--course') + 1] : null;
  const summary = argv.includes('--summary');
  const { LAB_CATALOGS } = await import('./catalog.js');
  const { loadConcepts, loadNotesIndexes } = await import('./load.mjs');
  const concepts = (await loadConcepts()).map((x) => x.concept);
  const notesIndexes = await loadNotesIndexes(Object.keys(LAB_CATALOGS));
  const report = auditMap({ concepts, labCatalogs: LAB_CATALOGS, notesIndexes });
  if (only && !report[only]) {
    console.error(`no course ${only}; courses: ${Object.keys(report).join(', ')}`);
    process.exit(1);
  }
  let labsLeft = 0;
  let notesLeft = 0;
  for (const [course, r] of Object.entries(report)) {
    if (only && course !== only) continue;
    labsLeft += r.labs.missing.length;
    notesLeft += r.notes.missing.length;
    const head = `${course}: ${r.labs.missing.length} of ${r.labs.total} labs and ${r.notes.missing.length} of ${r.notes.total} notes sections on no concept`;
    console.log(r.summaries ? `${head} (${r.summaries} summary sections not counted)` : head);
    if (summary) continue;
    for (const l of r.labs.missing) console.log(`  lab   ${l.unit}/${l.id}  ${l.title}`);
    for (const s of r.notes.missing) console.log(`  notes ${s.unit}/${s.id}  ${s.title}${s.lab ? `  (lab ${s.lab})` : ''}`);
  }
  console.log(`\n${labsLeft} labs and ${notesLeft} notes sections are on no concept.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
