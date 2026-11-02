/**
 * The concept map's shared data. Concepts are one file each in concepts/; the hub reads them with
 * import.meta.glob and Node reads them with load.mjs.
 */
export { SUBJECTS } from './subjects.js';
export { COURSES, STATUSES } from './courses.js';
export { LAB_CATALOGS } from './catalog.js';
export { labHref } from './routes.js';
export { buildGraph, findCycle } from './graph.js';
