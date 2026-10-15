import assert from 'node:assert/strict';
import test from 'node:test';
import { BANK_CHAPTERS, CHAPTERS, UNITS } from '../src/catalog.js';
import { course } from '../src/manifest.js';
import { PROBLEMS } from '../src/problems/index.js';

test('manifest is PHY 2048, first in the physics track', async () => {
  assert.equal(course.id, 'phy2048');
  assert.equal(course.code, 'PHY 2048');
  assert.equal(course.title, 'Physics I');
  assert.equal(course.subject, 'mechanics');
  assert.equal(course.track, 'physics');
  assert.equal(course.order, 1);
  assert.equal(course.term, '');
  assert.equal(course.text, 'OpenStax, University Physics Volume 1');
  assert.equal(course.units.length, 8);
  assert.deepEqual(course.units.map((unit) => unit.labs), [
    ['projectile'],
    ['incline'],
    ['track'],
    ['collide'],
    ['rotor'],
    [],
    [],
    [],
  ]);
  const labs = await course.labs();
  assert.equal(typeof labs.loadLab, 'function');
  for (const id of ['projectile', 'incline', 'track', 'collide', 'rotor']) {
    const lab = await labs.loadLab(id);
    assert.equal(lab.id, id);
    assert.equal(lab.kind, 'scene3d');
  }
  assert.equal(await labs.loadLab('missing'), null);
  const loaded = await course.problems();
  assert.equal(loaded.PROBLEMS.length, PROBLEMS.length);
});

test('the catalog follows the OpenStax chapters named for this course', () => {
  assert.deepEqual(UNITS.map((unit) => unit.chapters), [
    ['2', '3', '4'],
    ['5', '6'],
    ['7', '8'],
    ['9'],
    ['10', '11'],
    ['12'],
    ['13'],
    ['15'],
  ]);
  for (const ch of ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15']) {
    assert.equal(typeof CHAPTERS[ch], 'string');
    assert.equal(course.chapters[ch], CHAPTERS[ch]);
  }
});

test('each banked chapter has at least four problems', () => {
  for (const ch of BANK_CHAPTERS) {
    const n = PROBLEMS.filter((problem) => problem.ch === ch).length;
    assert.ok(n >= 4, `chapter ${ch} has ${n} problems`);
  }
  assert.ok(PROBLEMS.every((problem) => BANK_CHAPTERS.includes(problem.ch)));
});
