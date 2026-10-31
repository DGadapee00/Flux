import assert from 'node:assert/strict';
import test from 'node:test';
import { BANK_CHAPTERS, CHAPTERS, UNITS } from '../src/catalog.js';
import { course } from '../src/manifest.js';
import { PROBLEMS } from '../src/problems/index.js';
import { LEFT_OUT, SECTION_TITLES, TOPICS, citation, citationText } from '../src/data/textbook.js';

test('manifest is PHY 2048, first in the physics track', async () => {
  assert.equal(course.id, 'phy2048');
  assert.equal(course.code, 'PHY 2048');
  assert.equal(course.title, 'Physics I');
  assert.equal(course.subject, 'mechanics');
  assert.equal(course.track, 'physics');
  assert.equal(course.order, 1);
  assert.equal(course.term, '');
  assert.equal(course.text, 'OpenStax, University Physics Volume 1');
  assert.equal(course.units.length, 13);
  assert.deepEqual(course.units.map((unit) => unit.labs), [
    ['vectors', 'kinematics-graphs', 'stopping-distance'],
    ['projectile', 'circular-motion', 'relative-motion', 'wind-triangle'],
    ['incline', 'atwood', 'banked-curve', 'drag', 'elevator-scale', 'skydiver'],
    ['work-energy', 'work-path', 'track', 'energy-diagram', 'automotive-power'],
    ['impulse', 'collide', 'collide-2d', 'center-of-mass', 'rocket', 'crumple-zone', 'crash-reconstruction'],
    ['rotor', 'inertia', 'massive-pulley', 'helicopter-rotor'],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ]);
  const labs = await course.labs();
  assert.equal(typeof labs.loadLab, 'function');
  for (const id of ['vectors', 'kinematics-graphs', 'stopping-distance', 'projectile', 'circular-motion', 'relative-motion', 'wind-triangle', 'incline', 'atwood', 'banked-curve', 'drag', 'elevator-scale', 'skydiver', 'work-energy', 'work-path', 'track', 'energy-diagram', 'automotive-power', 'impulse', 'collide', 'collide-2d', 'center-of-mass', 'rocket', 'crumple-zone', 'crash-reconstruction', 'rotor', 'inertia', 'massive-pulley', 'helicopter-rotor']) {
    const lab = await labs.loadLab(id);
    assert.equal(lab.id, id);
    assert.equal(lab.kind, 'scene3d');
  }
  assert.equal(await labs.loadLab('missing'), null);
  const loaded = await course.problems();
  assert.equal(loaded.PROBLEMS.length, PROBLEMS.length);
});

test('the catalog follows the OpenStax chapters named for this course', () => {
  assert.deepEqual(UNITS.map((unit) => unit.id), Array.from({ length: 13 }, (_, i) => `u${i + 1}`));
  assert.deepEqual(UNITS.map((unit) => unit.chapters), [
    ['1', '2', '3'],
    ['4'],
    ['5', '6'],
    ['7', '8'],
    ['9'],
    ['10'],
    ['11'],
    ['12'],
    ['13'],
    ['14'],
    ['15'],
    ['16'],
    ['17'],
  ]);
  for (let ch = 1; ch <= 17; ch += 1) {
    assert.equal(typeof CHAPTERS[ch], 'string', `chapter ${ch}`);
    assert.equal(course.chapters[ch], CHAPTERS[ch]);
  }
  assert.equal(UNITS.flatMap((unit) => unit.chapters).length, 17, 'every chapter is in exactly one unit');
});

test('every problem sits in the unit that holds its chapter', () => {
  for (const problem of PROBLEMS) {
    const unit = UNITS.find((u) => u.id === problem.exam);
    assert.ok(unit, `${problem.id}: no unit ${problem.exam}`);
    assert.ok(unit.chapters.includes(problem.ch), `${problem.id}: chapter ${problem.ch} is not in ${unit.id}`);
  }
});

test('every problem cites a section of the book that this course teaches, in its own chapter', () => {
  for (const problem of PROBLEMS) {
    const m = /§(\d+)\.(\d+)/.exec(problem.src);
    assert.ok(m, `${problem.id}: src names no section`);
    const section = `${m[1]}.${m[2]}`;
    assert.ok(SECTION_TITLES[section], `${problem.id}: the book has no §${section}`);
    assert.ok(!LEFT_OUT.includes(section), `${problem.id}: §${section} is left out of this course`);
    assert.equal(m[1], problem.ch, `${problem.id}: cites §${section} but sits in chapter ${problem.ch}`);
  }
});

test('every topic tag in the bank has a citation', () => {
  const topics = new Set(PROBLEMS.flatMap((problem) => problem.topics || []));
  for (const topic of topics) assert.ok(citation(topic), `topic "${topic}" has no section`);
  for (const section of Object.values(TOPICS)) assert.ok(SECTION_TITLES[section], `no §${section}`);
  assert.equal(citationText('friction'), 'OpenStax Vol. 1 §6.2');
  assert.equal(citation('nothing'), null);
});

test('each banked chapter has at least four problems', () => {
  for (const ch of BANK_CHAPTERS) {
    const n = PROBLEMS.filter((problem) => problem.ch === ch).length;
    assert.ok(n >= 4, `chapter ${ch} has ${n} problems`);
  }
  assert.ok(PROBLEMS.every((problem) => BANK_CHAPTERS.includes(problem.ch)));
});
