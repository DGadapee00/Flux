/**
 * Authoring kit. Values inside `$` are SI base units (K, Pa, m³, kg, J). A range is sampled in its
 * display unit and multiplied by `si`; temperatures in °C or °F use `celsius()` or `fahrenheit()`,
 * because those are offsets, not factors.
 *
 * A numeric part's `get` returns SI; `scale` divides it into the unit the part asks for. `alt`, when
 * given, returns the value a student reads from the generated table, already in that unit.
 */
export { cite } from '../data/textbook.js';

export const range = (min, max, step, unit = '', si = 1) => ({ type: 'range', min, max, step, unit, si });
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });

/** A temperature range in °C or °F. `$` holds the display value; derive() converts it. */
export const celsius = (min, max, step) => ({ type: 'range', min, max, step, unit: '°C', si: null });
export const fahrenheit = (min, max, step) => ({ type: 'range', min, max, step, unit: '°F', si: null });

export const num = (id, get, unit, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  unit,
  scale: o.scale ?? 1,
  tol: o.tol ?? 0.005,
  abs: o.abs ?? 1e-9,
  label: o.label ?? null,
  ...(o.alt ? { alt: o.alt } : {}),
  // A trap returns SI, like `get`; the grader compares in the part's display unit.
  ...(o.traps ? { traps: o.traps.map(([fn, msg]) => [($) => fn($) / (o.scale ?? 1), msg]) } : {}),
});

export const mc = (id, options, correct, o = {}) => ({
  id,
  kind: 'choice',
  options: options.map(([value, label, why]) => ({ value, label, ...(why ? { why } : {}) })),
  correct,
  multi: !!o.multi,
  label: o.label ?? null,
});

export function problem(spec) {
  return {
    level: 1,
    topics: [],
    vars: {},
    derive: () => ({}),
    valid: () => true,
    hints: [],
    steps: () => [],
    sim: null,
    cases: [],
    ...spec,
  };
}

export const kase = (src, v, want, o = {}) => ({ src, v, want, note: o.note ?? null });
