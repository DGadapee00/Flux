/**
 * The 2D lab contract. A lab is a plain object:
 *
 *   id, title, ch (chapters), blurb     — what it is, for the Explore list
 *   params: [...]                        — the controls, in order (see below)
 *   scenarios: [{ id, label, state }]    — presets for the Scenario menu
 *   actions: [{ id, label, run(state), show? }] — buttons (Resample, Clear…)
 *   compute(state, rng) → result         — pure: every number the lab shows comes from here
 *   draw(canvas, state, result) → view   — paints the plot; returns what pointer handling needs
 *   pointer: { down(view, state, x, y) → handled, move, up }  (optional; x, y in CSS px)
 *   tap(view, state, x, y) → new state or null   (optional; a tap that is not a drag, page still scrolls)
 *   readout(state, result) → [[label, value], …]   — labels and values in the panel markup ($…$)
 *   explain(state, result) → [paragraphs]          — the explainer under the controls
 *   predictions: [{ id, setup, change, prompt, options, outcome(before, after), expect, why }]
 *   height: plot height as a fraction of its width (default 0.72)
 *
 * A param is { id, label, type: 'range' | 'choice' | 'toggle', … }:
 *   range  { min, max, step }  (each may be a function of the state)
 *   choice { options: [[value, label], …], select?, reset?(value) → state to apply when it changes }
 *   show(state) hides it when false.
 *
 * `compute` gets a seeded generator (src/stats/rng.js) built from state.seed, so a lab's picture
 * is reproducible and scripts/labs-check.mjs can run it headless.
 */
export function defineLab(spec) {
  return {
    ch: [],
    blurb: '',
    params: [],
    scenarios: [],
    actions: [],
    predictions: [],
    height: 0.72,
    pointer: null,
    readout: () => [],
    explain: () => [],
    ...spec,
    defaults() {
      const s = { seed: 1 };
      for (const p of this.params) s[p.id] = p.value;
      return { ...s, ...(spec.initial || {}) };
    },
  };
}
