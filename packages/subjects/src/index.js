/**
 * Shared subject libraries. Each one is pure functions plus a selftest.
 * em, mechanics, math, and stats moved here from the courses. A course re-exports
 * the modules it still imports by the old path. thermo was written here, for the thermal courses
 * and the rocket pages.
 */
export const SUBJECTS = Object.freeze(['em', 'math', 'mechanics', 'stats', 'thermo']);
