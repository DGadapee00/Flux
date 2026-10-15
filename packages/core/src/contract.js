/**
 * Platform contracts. JSDoc only: no TypeScript build.
 *
 * These three names are the stable surface courses will call. The engine behind them
 * (router, labs, problem generator) is still in the course repos. Phase 2 moves it here.
 * Until then each function checks the id and returns the spec. Defaults on `problem`
 * are the fields all four banks already share.
 *
 * `defineLab` covers two shapes. `kind: 'scene3d'` draws with three.js
 * (`init`, `recompute`, `syncViews`). `kind: 'plot2d'` draws on a canvas
 * (`compute(state, rng)`, `draw`). A missing or unknown kind throws.
 */

const ID = /^[a-z][a-z0-9]*$/;
/** Lab ids follow the catalog: letters, digits, and a hyphen between words (`path-nt`). */
const LAB_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const LAB_KINDS = new Set(['scene3d', 'plot2d']);

/**
 * @typedef {Object} CourseUnit
 * @property {string} id
 * @property {string} title
 * @property {string[]} chapters
 * @property {string|null} date
 * @property {string[]} labs
 */

/**
 * @typedef {Object} CourseManifest
 * @property {string} id Route segment and storage namespace.
 * @property {string} code Official course code, once confirmed.
 * @property {string} title
 * @property {string} subject Subject library this course imports.
 * @property {string} [track] Hub track this course sits under.
 * @property {number} [order] Position in that track.
 * @property {string} term
 * @property {string} [text] Textbook, when there is one.
 * @property {CourseUnit[]} units
 * @property {Record<string, string>} chapters
 * @property {() => Promise<unknown>} labs
 * @property {() => Promise<unknown>} problems
 * @property {() => Promise<unknown>} [sets]
 * @property {() => Promise<unknown>} [notes]
 * @property {() => Promise<unknown>} [formulas]
 * @property {{ canvasCourseId: string|null }} [ingest]
 */

/**
 * @param {CourseManifest} spec
 * @returns {CourseManifest}
 */
export function defineCourse(spec) {
  requireId('defineCourse', spec);
  return { ...spec };
}

/**
 * @param {Record<string, unknown> & { id: string }} spec
 */
export function defineLab(spec) {
  requireId('defineLab', spec, LAB_ID);
  if (!LAB_KINDS.has(spec.kind)) {
    throw new TypeError("defineLab requires kind 'scene3d' or 'plot2d'");
  }
  return { ...spec };
}

/**
 * @param {Record<string, unknown>} spec
 */
export function problem(spec) {
  return {
    level: 1,
    topics: [],
    vars: {},
    derive: () => ({}),
    valid: () => true,
    hints: [],
    steps: () => [],
    cases: [],
    ...spec,
  };
}

/**
 * @param {string} fn
 * @param {{ id?: unknown }} spec
 */
function requireId(fn, spec, pattern = ID) {
  if (typeof spec?.id !== 'string' || !pattern.test(spec.id)) {
    const extra = pattern === ID ? '' : ', with a hyphen allowed between words';
    throw new TypeError(`${fn} requires an id of lowercase letters and digits, starting with a letter${extra}`);
  }
}
