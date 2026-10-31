import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { PROBLEMS, problemById } from '../src/problems/index.js';
import { instance, expected } from '../src/problems/engine.js';
import { calculusProblemId } from '@flux/tracks/calculus';
const originals = JSON.parse(
  fs.readFileSync(new URL('./fixtures/legacy-seeds.json', import.meta.url), 'utf8'),
);
test('all 87 templates retain the original seeded questions and answers', () => {
  assert.equal(PROBLEMS.length, 87);
  assert.equal(new Set(PROBLEMS.map((t) => t.id)).size, 87);
  for (const saved of originals) {
    const tpl = problemById(calculusProblemId(saved.source, saved.id));
    assert.ok(tpl, saved.id);
    const inst = instance(tpl, saved.seed);
    assert.deepEqual(inst.values, saved.values, `${saved.source}/${saved.id}: seed ${saved.seed}`);
    const answers = Object.fromEntries(tpl.parts.map((p) => [p.id, expected(p, inst.$)]));
    assert.deepEqual(answers, saved.answers, `${saved.source}/${saved.id}: answers for ${saved.seed}`);
  }
});
