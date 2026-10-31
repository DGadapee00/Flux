import test from 'node:test';
import assert from 'node:assert/strict';
import { PREDICTIONS } from '../src/data/predictions.js';
import { loadLab } from '../src/labs/load.js';
import { run, outcomes, matchesExpect } from '@flux/shells/engineering/predict.js';
for (const [id, prompts] of Object.entries(PREDICTIONS))
  test(`${id}: predictions are computed by the actual lab`, async () => {
    const lab = await loadLab(id);
    for (const p of prompts) {
      const s = lab.defaultState();
      lab.applyScenario(p.scenario, s);
      p.prep?.(s);
      const before = structuredClone(s);
      const r = run(lab, s, p);
      assert.deepEqual(s, before);
      assert.ok(matchesExpect(p, outcomes(p, r.before, r.after)), p.id + ': ' + JSON.stringify(r));
    }
  });
