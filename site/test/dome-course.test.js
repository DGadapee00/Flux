import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_ORDER, LESSONS } from '../src/applications/dome-course.js';
import { travelerById } from '@flux/map/applications/travelers/index.js';

test('the beginner course covers every shop station, with design before fabrication', () => {
  const dome = travelerById['fsw-dome'];
  assert.deepEqual([...COURSE_ORDER].sort(), dome.stations.map(s => s.id).sort());
  assert.equal(COURSE_ORDER[0], 'requirement');
  assert.equal(COURSE_ORDER.at(-1), 'acceptance');
  assert.ok(COURSE_ORDER.indexOf('design') < COURSE_ORDER.indexOf('panels'));
  for (const id of COURSE_ORDER) {
    const l = LESSONS[id];
    for (const key of ['goal', 'terms', 'machine', 'setup', 'good', 'bad', 'task', 'question', 'explain']) assert.ok(l[key]?.trim(), `${id}: ${key}`);
    assert.equal(l.options.length, 3);
    assert.ok(Number.isInteger(l.answer) && l.answer >= 0 && l.answer < l.options.length);
    assert.ok(l.steps.length >= 3);
    assert.ok(dome.stations.find(s => s.id === id).sources.length, `${id}: sourced reference`);
  }
});
