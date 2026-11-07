#!/usr/bin/env node
/**
 * `npm run map-gaps`: the concepts with no Flux lab, ranked by how much a lab would serve.
 *
 * A gap scores one point for every concept that builds on it (directly or further along), and more
 * for each course that teaches it, by where the owner stands in that course: taking now 3, next
 * term 2, later 1, taken 0. A project counts 0. Each application recipe that names the concept adds 2,
 * so a gap a project needs now ranks with a course taught next term. Concepts that have a lab but
 * still carry a `candidate` are listed after the gaps, as labs worth adding.
 */
import { pathToFileURL } from 'node:url';
import { APPLICATIONS, recipesOf } from './applications/index.js';
import { COURSES } from './courses.js';
import { buildGraph } from './graph.js';
import { loadConcepts } from './load.mjs';

// The owner's projects weigh like next term's courses: they are what the owner is building toward
// (6 November 2026).
const WEIGHT = { 'taking now': 3, 'next term': 2, later: 1, taken: 0, project: 2 };
const RECIPE_WEIGHT = 2;
// A project has no status; it prints as one and adds no weight.
const status = Object.fromEntries(COURSES.map((c) => [c.id, c.kind === 'project' ? 'project' : c.status]));

/**
 * The recipes that name each concept, as `<application>/<recipe>`.
 * @param {any[]} applications
 */
export function recipeUses(applications) {
  /** @type {Record<string, string[]>} */
  const uses = {};
  for (const app of applications) {
    for (const r of recipesOf(app)) for (const id of r.concepts || []) (uses[id] ||= []).push(`${app.id}/${r.id}`);
  }
  return uses;
}

/**
 * @param {any[]} concepts
 * @param {any[]} [applications]
 */
export function rankGaps(concepts, applications = APPLICATIONS) {
  const graph = buildGraph(concepts);
  const uses = recipeUses(applications);
  const used = (c) => uses[c.id] || [];
  const score = (c) =>
    graph.closure(c.id, 'leads').size + c.courses.reduce((s, id) => s + (WEIGHT[status[id]] ?? 0), 0) + RECIPE_WEIGHT * used(c).length;
  const row = (c) => ({ id: c.id, title: c.title, score: score(c), leads: graph.closure(c.id, 'leads').size, courses: c.courses, uses: used(c), candidate: c.candidate });
  const gaps = concepts.filter((c) => c.labs.length === 0).map(row).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const more = concepts.filter((c) => c.labs.length > 0 && c.candidate).map(row).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { gaps, more };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const concepts = (await loadConcepts()).map((x) => x.concept);
  const { gaps, more } = rankGaps(concepts);
  const line = (r) =>
    `${String(r.score).padStart(3)}  ${r.title} (${r.id}): ${r.leads} ${r.leads === 1 ? 'concept builds' : 'concepts build'} on it; ${r.courses.map((id) => `${id} ${status[id]}`).join(', ')}${r.uses.length ? `; used by ${r.uses.join(', ')}` : ''}\n     ${r.candidate}`;
  console.log(`${concepts.length} concepts, ${concepts.length - gaps.length} with a lab, ${gaps.length} gaps.\n\nGaps, most worth a lab first:`);
  gaps.forEach((r) => console.log(line(r)));
  if (more.length) {
    console.log('\nHave a lab, and a second one is worth adding:');
    more.forEach((r) => console.log(line(r)));
  }
}
