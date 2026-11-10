import assert from 'node:assert/strict';
import test from 'node:test';
import { LABS as STA_LABS } from '../../../courses/sta3032/src/labs/index.js';
import { NOTES as satelliteNotes } from '../../../courses/satellite/src/notes/index.js';
import { NOTES as domeNotes } from '../../../courses/dome/src/notes/index.js';
import { LAB_CATALOGS, STA3032_TITLES, notesIndexes } from '../catalogs.mjs';
import { labHref, notesHref } from '../../tracks/routes.js';
import { TRACKS } from '../../tracks/tracks.js';

test("STA 3032's registered lab titles match its definitions", () => {
  assert.deepEqual(STA3032_TITLES, Object.fromEntries(STA_LABS.map(l => [l.id, l.title])));
});

test('the project courses open the standard course app and their notes name existing labs', () => {
  for (const [course, notes] of [['satellite', satelliteNotes], ['dome', domeNotes]]) {
    assert.equal(TRACKS.flatMap(t => t.courses).find(c => c.id === course).href, `${course}/`);
    for (const [unit, set] of Object.entries(notes)) {
      for (const section of set.sections) {
        if (!section.lab) continue;
        assert.equal(LAB_CATALOGS[course][section.lab]?.unit, unit, `${course}/${unit}/${section.lab}`);
        const ref = { course, unit, lab: section.lab, notes: section.id };
        assert.equal(notesHref(ref, unit), labHref(ref));
      }
    }
  }
  assert.equal(Object.keys(satelliteNotes).length, 7);
  assert.equal(Object.keys(domeNotes).length, 4);
  assert.ok(satelliteNotes.u7.sections.every(s => !s.lab), 'integration is notes-only');
});

test('the new physics courses register all four labs and all notes sections', async () => {
  const notes = await notesIndexes(['modern', 'quantum', 'nuclear']);
  for (const course of ['modern', 'quantum', 'nuclear']) {
    assert.equal(Object.keys(LAB_CATALOGS[course]).length, 4);
    assert.deepEqual(Object.keys(notes[course]), ['u1', 'u2', 'u3', 'u4']);
    for (const sections of Object.values(notes[course])) assert.deepEqual(sections, ['s1', 's2', 's3']);
  }
});
