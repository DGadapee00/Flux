/**
 * Platform contracts. JSDoc only: no TypeScript build.
 *
 * These three names are the stable surface courses will call. The engine behind them
 * (router, labs, problem generator) is still in the course repos. Phase 2 moves it here.
 * Until then each function checks the id and returns the spec. Defaults on `problem`
 * are the fields all four banks already share.
 *
 * `defineLab` covers two shapes that already exist. A scene3d lab draws with three.js
 * (`init`, `recompute`, `syncViews`). A plot2d lab draws on a canvas (`compute(state, rng)`,
 * `draw`). A `kind` field that picks between them arrives with the stats port.
 */

const ID = /^[a-z][a-z0-9]*$/;

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
  requireId('defineLab', spec);
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
function requireId(fn, spec) {
  if (typeof spec?.id !== 'string' || !ID.test(spec.id)) {
    throw new TypeError(`${fn} requires an id of lowercase letters and digits, starting with a letter`);
  }
}
