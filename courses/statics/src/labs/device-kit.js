import { defineLab } from './define2d.js';
import { begin, sceneIn, seg, arrow as pixelArrow, note, poly, C } from './diagram.js';
import { slider, bindSlider } from './widgets.js';
import { cells, kv } from '../ui/shared.js';
import { SOURCES } from '../data/textbook.js';
const fmt = (v) => Number(v.toPrecision(4));
/** Shared authoring helper; all panels and predict-first controls come from the engineering shell. */
export function device(spec) {
  const {
    id,
    exam,
    title,
    fields,
    scenarios,
    compute,
    explanation,
    leavesOut,
    draw,
    law,
    predictions,
    rows,
  } = spec;
  return defineLab({
    id,
    exam,
    title,
    hint: spec.hint,
    scenarios,
    compute,
    predictions,
    law: () => law,
    defaultState: () => ({ ...scenarios[0], scenarioId: scenarios[0].id }),
    applyScenario(key, s) {
      Object.assign(s, scenarios.find((x) => x.id === key) || scenarios[0]);
      s.scenarioId = s.id;
    },
    controls: () =>
      fields
        .map(([k, label, min, max, step]) => slider(`dv-${k}`, label, scenarios[0][k], min, max, step))
        .join(''),
    bind(api) {
      fields.forEach(([k]) =>
        bindSlider(
          `dv-${k}`,
          (s, v) => {
            s[k] = v;
            api.bump();
          },
          api,
        ),
      );
    },
    syncControls(s) {
      fields.forEach(([k]) => {
        const el = document.getElementById(`dv-${k}`);
        if (el && document.activeElement !== el) el.value = s[k];
      });
    },
    liveRows(s, c) {
      return rows(s, c)
        .map(([label, val, unit]) => kv(label, `${fmt(val)} ${unit}`))
        .join('');
    },
    readout(s, c) {
      return cells(
        rows(s, c)
          .slice(0, 3)
          .map(([label, val, unit]) => [label, `${fmt(val)} ${unit}`]),
      );
    },
    coach() {
      const src = SOURCES[id];
      return {
        title: spec.hint,
        body: `${explanation} <a href="${src.url}" target="_blank" rel="noopener">Data source</a>: ${src.text} <b>What the course model leaves out.</b> ${leavesOut}`,
      };
    },
    draw(canvas, s, c) {
      const B = begin(canvas);
      const P = sceneIn(B, B.free, spec.bounds(s));
      draw(P, s, c);
    },
  });
}
export { seg, note, poly, C };
export const arrow = (P, at, angle, length, options = {}) =>
  pixelArrow(P, at, angle, length * P.k, { head: 6, ...options });
export const prediction = (id, scenario, ask, apply, get, expect, why, prep) => ({
  id,
  scenario,
  ask,
  apply,
  prep,
  mode: 'compare',
  watch: [{ id: 'q', label: 'The requested quantity', get }],
  expect: { q: expect },
  why,
});
