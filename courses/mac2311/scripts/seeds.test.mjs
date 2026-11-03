import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { LEGACY_PROBLEMS as PROBLEMS, problemById } from '../src/problems/index.js';
import { instance, expected } from '../src/problems/engine.js';
import { calculusProblemId } from '@flux/tracks/calculus';
const originals = JSON.parse(
  fs.readFileSync(new URL('./fixtures/legacy-seeds.json', import.meta.url), 'utf8'),
);

/** A seeded number may move by an ulp. 1e-12 still rejects a wrong value. */
function sameSeed(actual, expected, label) {
  if (typeof expected === 'number' && typeof actual === 'number') {
    const tol = 1e-12 * Math.max(1, Math.abs(expected));
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
    return;
  }
  if (expected && typeof expected === 'object' && actual && typeof actual === 'object') {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), label);
    for (const key of Object.keys(expected)) sameSeed(actual[key], expected[key], `${label}.${key}`);
    return;
  }
  assert.deepEqual(actual, expected, label);
}

test('all 87 templates retain the original seeded questions and answers', () => {
  assert.equal(PROBLEMS.length, 87);
  assert.equal(new Set(PROBLEMS.map((t) => t.id)).size, 87);
  for (const saved of originals) {
    const tpl = problemById(calculusProblemId(saved.source, saved.id));
    assert.ok(tpl, saved.id);
    const inst = instance(tpl, saved.seed);
    sameSeed(inst.values, saved.values, `${saved.source}/${saved.id}: seed ${saved.seed}`);
    const answers = Object.fromEntries(tpl.parts.map((p) => [p.id, expected(p, inst.$)]));
    sameSeed(answers, saved.answers, `${saved.source}/${saved.id}: answers for ${saved.seed}`);
  }
});
