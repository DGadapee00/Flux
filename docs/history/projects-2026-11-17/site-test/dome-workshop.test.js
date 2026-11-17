import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_ORDER } from '../src/applications/dome-course.js';
import { WORKSHOPS, CAPABILITIES, gradePractice, practiceValue, practicePlot } from '../src/applications/dome-workshop.js';
import { noteTemplate, traceReading } from '../src/applications/dome-workshop-ui.js';

// Independent arithmetic and force-balance checks, rather than an answer copied from the grader.
const expected = {
  requirement: 240000 * (4 * 1) / (2 * 1) / 1000, // projected pressure force divided by both cut lengths
  design: [8000, 8000, 8000, 8000, 8000, 12000].reduce((a,b) => a+b),
  material: 14400 / (0.012 * 0.004) / 1e6, // SI force/area, then Pa to MPa
  panels: (600 - 15) / 100,
  fitup: [0.12, 0.18, 0.29, 0.16].sort((a,b) => b-a)[0],
  schedule: (360 / 60) / (120 / 60),
  weld: 128 / 10 - 120 / 10,
  inspection: 100 - (90 / 12),
  nonconformance: 100 - (400 - 280) / 4,
  proof: (50024 - 50000) / 100,
  acceptance: 2 + 1
};

test('every station has worked reasoning, an applied case, a build record and transfer', () => {
  assert.deepEqual(Object.keys(WORKSHOPS).sort(), [...COURSE_ORDER].sort());
  assert.deepEqual(CAPABILITIES.flatMap(c => c.stations).sort(), [...COURSE_ORDER].sort());
  for (const id of COURSE_ORDER) {
    const w = WORKSHOPS[id];
    assert.ok(w.story && w.transfer && w.worked.length >= 3);
    assert.equal(w.record.length, 4);
    assert.equal(w.rubric.length, 4);
    assert.ok(w.practice.rows.length >= 3);
    assert.ok(noteTemplate(id).includes(w.record[0]));
    assert.equal(w.practice.options.length, 3);
    assert.ok(w.practice.reason && w.practice.formula && w.practice.unit);
  }
});

test('training calculations agree with independent methods and require a justified decision', () => {
  for (const id of COURSE_ORDER) {
    const p = WORKSHOPS[id].practice;
    assert.ok(Math.abs(practiceValue(p) - expected[id]) < 1e-9, id);
    assert.deepEqual(gradePractice(id, String(expected[id]), p.answer), {numeric:true, decision:true, passed:true}, id);
    assert.equal(gradePractice(id, String(expected[id]), (p.answer + 1) % 3).passed, false, id);
    for (const invalid of ['', ' ', 'NaN', 'Infinity', '300 MPa', String(expected[id] + 2)]) assert.equal(gradePractice(id, invalid, p.answer).passed, false, `${id}: ${invalid}`);
    assert.equal(gradePractice(id, String(expected[id]), null).passed, false, id);
  }
});

test('trace readings use the case data and flag the actual out-of-band sample', () => {
  for (const id of ['fitup', 'weld']) {
    assert.deepEqual(practicePlot(id).points.map(p => p[1]), WORKSHOPS[id].practice.data.values);
    assert.match(traceReading(id, 0), /Inside the band/);
    assert.match(traceReading(id, 2), /Outside the band/);
  }
  assert.match(traceReading('weld', 2), /300 mm: 12.8 kN/);
  assert.match(traceReading('fitup', 2), /500 mm: 0.29 mm/);
});
