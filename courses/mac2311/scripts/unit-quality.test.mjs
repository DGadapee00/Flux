import test from 'node:test';
import assert from 'node:assert/strict';
import { REWORKED_UNITS } from '../src/data/rework.js';
import { EXAMS, LAB_META } from '../src/data/catalog.js';
import { PROBLEMS } from '../src/problems/index.js';
import { instance, grade, render } from '../src/problems/engine.js';
import { SETUPS } from '../src/notes/setups.js';
import { predictionsFor } from '../src/data/predictions.js';
for (const unit of REWORKED_UNITS)
  test(`${unit}: the content floor and feedback contracts hold`, () => {
    const exam = EXAMS.find((e) => e.id === unit),
      bank = PROBLEMS.filter((t) => t.exam === unit);
    assert.ok(Object.values(SETUPS[unit]).flat().length >= 6);
    assert.ok(exam.labs.some((id) => LAB_META[id].app));
    for (const id of exam.labs) assert.ok(predictionsFor(id).length >= 2, id);
    assert.ok(bank.filter((t) => t.kind === 'conceptual').length / bank.length >= 0.25);
    assert.ok(bank.filter((t) => t.variety?.length).length / bank.length >= 0.6);
    for (const t of bank) {
      assert.ok(t.hints.length >= 2, t.id);
      assert.ok(
        t.cases.some((c) => c.src?.includes('OCW') || c.src?.includes('OpenStax')),
        t.id,
      );
      for (const seed of [0, 7, 19, 41]) {
        const inst = instance(t, seed),
          out = render(inst);
      assert.ok(out.steps.some(step=>step.includes('Sources for this family:')),`${t.id}: citations must be visible in the solution`);
        for (const p of t.parts) {
          if (p.kind === 'choice') {
            const options = typeof p.options === 'function' ? p.options(inst.$) : p.options;
            assert.ok(
              options.every((o) => o.why),
              t.id,
            );
            assert.ok(
              out.parts.find((q) => q.id === p.id).options.every((o) => o.why),
              `${t.id}: why must reach the UI`,
            );
          }
          if (p.kind === 'numeric') {
            assert.ok(p.traps?.length >= 2, t.id);
            for (const [value, message] of p.traps) {
              const wrong = value(inst.$);
              assert.ok(Number.isFinite(wrong), t.id);
              assert.ok((typeof message === 'function' ? message(inst.$) : message).length > 20);
              if (Math.abs(wrong - p.get(inst.$)) > Math.max(1e-6, Math.abs(p.get(inst.$)) * 0.01)) {
                const g = grade(p, inst.$, String(wrong));
                assert.equal(g.correct, false, t.id);
                assert.ok(g.feedback?.length > 0, t.id);
              }
            }
          }
        }
      }
    }
  });
