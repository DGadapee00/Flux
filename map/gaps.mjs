#!/usr/bin/env node
/**
 * `npm run map-gaps`: the concepts with no Flux lab, ranked by how much a lab would serve.
 *
 * A gap scores one point for every concept that builds on it (directly or further along), and more
 * for each course that teaches it, by where the owner stands in that course: taking now 3, next
 * term 2, later 1, taken 0. Concepts that have a lab but still carry a `candidate` are listed after
 * the gaps, as labs worth adding.
 */
import { COURSES } from './courses.js';
import { buildGraph } from './graph.js';
import { loadConcepts } from './load.mjs';

const WEIGHT = { 'taking now': 3, 'next term': 2, later: 1, taken: 0 };
const status = Object.fromEntries(COURSES.map((c) => [c.id, c.status]));

/** @param {any[]} concepts */
export function rankGaps(concepts) {
  const graph = buildGraph(concepts);
  const score = (c) => graph.closure(c.id, 'leads').size + c.courses.reduce((s, id) => s + (WEIGHT[status[id]] ?? 0), 0);
  const row = (c) => ({ id: c.id, title: c.title, score: score(c), leads: graph.closure(c.id, 'leads').size, courses: c.courses, candidate: c.candidate });
  const gaps = concepts.filter((c) => c.labs.length === 0).map(row).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const more = concepts.filter((c) => c.labs.length > 0 && c.candidate).map(row).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { gaps, more };
}

const concepts = (await loadConcepts()).map((x) => x.concept);
const { gaps, more } = rankGaps(concepts);
const line = (r) => `${String(r.score).padStart(3)}  ${r.title} (${r.id}): ${r.leads} ${r.leads === 1 ? "concept builds" : "concepts build"} on it; ${r.courses.map((id) => `${id} ${status[id]}`).join(', ')}\n     ${r.candidate}`;
console.log(`${concepts.length} concepts, ${concepts.length - gaps.length} with a lab, ${gaps.length} gaps.\n\nGaps, most worth a lab first:`);
gaps.forEach((r) => console.log(line(r)));
if (more.length) {
  console.log('\nHave a lab, and a second one is worth adding:');
  more.forEach((r) => console.log(line(r)));
}
