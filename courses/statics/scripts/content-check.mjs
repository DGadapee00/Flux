import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import { NOTES } from '../src/notes/index.js';
import { SETUPS } from '../src/notes/setups.js';
import { loadLab } from '../src/labs/load.js';
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { run, outcomes, matchesExpect } from '@flux/shells/engineering/predict.js';
import { PROBLEMS } from '../src/problems/index.js';
import { instance, grade, render, expected } from '../src/problems/engine.js';
let examples = 0,
  predictions = 0;
for (const [unit, set] of Object.entries(NOTES)) {
  const html = fs.readFileSync(new URL(`../src/notes/content/${set.file}`, import.meta.url), 'utf8');
  assert.ok(html.includes('class="top"') && html.includes('class="legend"') && html.includes('class="part"'));
  assert.ok(!html.includes('$') && !html.includes('—'), unit + ' notes delimiters and voice');
  for (const match of html.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g))
    katex.renderToString(match[1] ?? match[2], { throwOnError: true });
  const sections = [...html.matchAll(/<section class="topic" id="(s\d+)"/g)].map((x) => x[1]);
  assert.deepEqual(
    sections,
    set.sections.map((s) => s.id),
  );
  let count = 0;
  for (const [section, list] of Object.entries(SETUPS[unit]))
    for (const ex of list) {
      assert.ok(html.includes(`Worked example · ${ex.tag}`), `${unit}/${section}/${ex.tag}`);
      const lab = await loadLab(ex.lab);
      assert.ok(lab, ex.lab);
      const s = lab.defaultState();
      lab.applyScenario?.(ex.scenario, s);
      ex.setup?.(s);
      const c = {};
      lab.recompute(s, c);
      const pairs = ex.read(c, s);
      assert.ok(pairs.length, ex.tag + ' must check a computed value');
      for (const [got, want] of pairs)
        assert.ok(
          Number.isFinite(got) && Math.abs(got - want) <= 0.02 * Math.max(1, Math.abs(want)),
          `${ex.tag}: ${got} vs ${want}`,
        );
      count++;
      examples++;
    }
  assert.ok(count >= 6, unit);
}
for (const exam of EXAMS) {
  assert.ok(exam.labs.some((id) => LAB_META[id].app));
  for (const id of exam.labs) {
    const lab = await loadLab(id);
    assert.ok(lab.predictions.length >= 2, id);
    for (const p of lab.predictions) {
      const s = lab.defaultState();
      lab.applyScenario(p.scenario, s);
      p.prep?.(s);
      const { before, after } = run(lab, s, p);
      const got = outcomes(p, before, after);
      assert.ok(matchesExpect(p, got), `${id}/${p.id}: ${JSON.stringify(got)}`);
      predictions++;
    }
  }
  const bank = PROBLEMS.filter((t) => t.exam === exam.id);
  assert.ok(bank.filter((t) => t.kind === 'conceptual').length / bank.length >= 0.25, exam.id);
}
for (const tpl of PROBLEMS) {
  assert.ok(tpl.hints.length >= 2, tpl.id);
  for (const p of tpl.parts.filter((p) => p.kind === 'choice'))
    assert.ok(
      p.options.every((o) => o.why),
      tpl.id + ' missing why',
    );
  const numeric = tpl.parts.filter((p) => p.kind === 'numeric');
  if (numeric.length) assert.ok(numeric.reduce((n, p) => n + (p.traps?.length || 0), 0) >= 2, tpl.id);
  for (let seed = 1; seed <= 30; seed++) {
    const inst = instance(tpl, seed);
    const rendered = render(inst);
    for (const p of numeric)
      for (const [trap, message] of p.traps || []) {
        const v = trap(inst.$);
        assert.ok(Number.isFinite(v), `${tpl.id}/${p.id}: trap is not finite`);
        const why = typeof message === 'function' ? message(inst.$) : message;
        assert.ok(typeof why === 'string' && why.length > 15, tpl.id + ' trap feedback');
        const want = expected(p, inst.$);
        if (Math.abs(v - want) > 0.05 * Math.max(1, Math.abs(want))) {
          const result = grade(p, inst.$, String(v));
          assert.equal(result.correct, false, `${tpl.id} accepts trap`);
          assert.ok(result.feedback?.length > 10, `${tpl.id} trap has no rendered feedback`);
        }
      }
    for (const p of rendered.parts.filter((p) => p.kind === 'choice'))
      assert.ok(
        p.options.every((o) => typeof o.why === 'string' && o.why.length > 10),
        tpl.id + ' rendered why',
      );
  }
}
console.log(
  `content-check: ${examples} lab examples, ${predictions} verified predictions, all units and coaching checked`,
);

// The cancellation prediction must not present a zero resultant as having three 90° angles.
const vectorLab = await loadLab('vectors');
const cancelled = vectorLab.defaultState();
Object.assign(cancelled, { F1: [100, 0, 0], F2: [-100, 0, 0], F3: null });
const zero = {};
vectorLab.recompute(cancelled, zero);
assert.match(vectorLab.readout(cancelled, zero), /undefined \(zero resultant\)/);
assert.match(vectorLab.liveRows(cancelled, zero), /undefined \(zero resultant\)/);
