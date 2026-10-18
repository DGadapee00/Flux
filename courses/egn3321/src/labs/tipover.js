import { defineLab } from './define2d.js';

/** Placeholder until this unit's application lab is written (Phase R, R2). */
export default defineLab({
  id: 'tipover',
  exam: 'u7',
  title: 'Tip-over',
  scenarios: [{ id: 'todo', name: 'To be written' }],
  applyScenario(id, state) {
    state.scenarioId = id;
  },
  compute: () => ({ gap: 0 }),
  draw() {},
  predictions: [],
});
