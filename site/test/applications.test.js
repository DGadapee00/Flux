import assert from 'node:assert/strict';
import test from 'node:test';
import { LAB_CATALOGS, findCycle } from '@flux/map';
import { loadConcepts } from '@flux/map/load.mjs';
import { exportBundle, importBundle, memoryStorage } from '@flux/core';
import { RECIPES, SATELLITE } from '../src/applications/satellite.js';
import { applicationStore, cleanProgress, demonstrated, missingInputs, record, revise } from '../src/applications/progress.js';
import { backupParts, restoreHubBackup } from '../src/backup.js';

const concepts = Object.fromEntries((await loadConcepts()).map(({ concept }) => [concept.id, concept]));

test('every recipe uses existing concepts and labs that teach its foundations', () => {
  const ids = new Set(RECIPES.map((r) => r.id));
  assert.equal(ids.size, RECIPES.length);
  assert.equal(findCycle(RECIPES.map((r) => ({ id: r.id, requires: r.requires }))), null);
  for (const r of RECIPES) {
    for (const dep of r.requires) assert.ok(ids.has(dep), `${r.id}: ${dep}`);
    for (const id of r.concepts || []) assert.ok(concepts[id], id);
    for (const ref of r.labs || []) {
      assert.ok(r.concepts.includes(ref.concept));
      assert.ok(concepts[ref.concept].labs.some((l) => l.course === ref.course && l.lab === ref.lab));
      assert.ok(LAB_CATALOGS[ref.course]?.[ref.lab]);
    }
  }
  assert.deepEqual(SATELLITE.integration.requires, SATELLITE.components.map((c) => c.id));
  const submissions = SATELLITE.components.filter((c) => c.submission);
  assert.deepEqual(submissions.map((c) => c.id), ['structure']);
  assert.equal(new URL(submissions[0].submission.url).protocol, 'https:');
});

function complete(state, id) {
  return record(revise(state, id, { studied: true, evidence: `Report for ${id}: result, assumptions and independent check.` }), id);
}

test('evidence and study alone cannot skip a prerequisite or unlock integration', () => {
  let state = cleanProgress(null);
  state = complete(state, 'power');
  assert.equal(demonstrated('power', state), false);
  assert.deepEqual(missingInputs('power', state), ['orbit']);
  state = record(revise(state, 'satellite', { evidence: 'A report without subsystem records.' }), 'satellite');
  assert.equal(demonstrated('satellite', state), false);
  state = complete(state, 'orbit');
  state = record(state, 'power');
  assert.equal(demonstrated('power', state), true);
  assert.equal(demonstrated('satellite', state), false);
});

test('a shared mission needs all seven demonstrations; revising an input invalidates its dependents and keeps their notes', () => {
  let state = cleanProgress(null);
  for (const r of SATELLITE.components) state = complete(state, r.id);
  assert.deepEqual(missingInputs('satellite', state), []);
  state = record(revise(state, 'satellite', { evidence: 'Shared mission and transmitter tradeoff report.' }), 'satellite');
  assert.equal(demonstrated('satellite', state), true);
  const notes = state.communications.evidence;
  state = revise(state, 'orbit', { evidence: 'Revised orbit, new eclipse duration.' });
  for (const id of ['orbit', 'power', 'thermal', 'attitude', 'communications', 'payload', 'satellite']) {
    assert.equal(demonstrated(id, state), false, id);
  }
  assert.equal(demonstrated('structure', state), true);
  assert.equal(state.communications.evidence, notes);
});

test('blank evidence and an unread foundation cannot become a demonstration', () => {
  let state = cleanProgress(null);
  state = record(revise(state, 'orbit', { studied: true, evidence: '  ' }), 'orbit');
  assert.equal(demonstrated('orbit', state), false);
  state = record(revise(state, 'orbit', { studied: false, evidence: 'My report.' }), 'orbit');
  assert.equal(demonstrated('orbit', state), false);
});

test('application evidence survives a hub backup and a fresh browser; malformed records grant no capabilities', () => {
  const store = applicationStore(memoryStorage());
  const progress = complete(cleanProgress(null), 'orbit');
  store.writeJSON('satellite', progress);
  const blob = exportBundle([{ courseId: 'applications', store }]);
  const fresh = applicationStore(memoryStorage());
  importBundle(blob, [{ courseId: 'applications', store: fresh }]);
  assert.deepEqual(cleanProgress(fresh.readJSON('satellite')), progress);
  assert.equal(demonstrated('orbit', cleanProgress(fresh.readJSON('satellite'))), true);
  const invalid = cleanProgress({ orbit: { studied: 'true', recorded: true, evidence: 12 }, surprise: {} });
  assert.equal(demonstrated('orbit', invalid), false);
  assert.equal('surprise' in invalid, false);
});

test('old hub backups restore courses without erasing application evidence; incomplete or malformed backups write nothing', () => {
  const parts = backupParts();
  const applications = parts.find((p) => p.courseId === 'applications');
  applications.store = applicationStore(memoryStorage());
  const progress = complete(cleanProgress(null), 'orbit');
  applications.store.writeJSON('satellite', progress);
  const oldBackup = exportBundle(parts.filter((p) => p.courseId !== 'applications'));
  restoreHubBackup(oldBackup, parts);
  assert.deepEqual(applications.store.readJSON('satellite'), progress);
  const broken = structuredClone(oldBackup);
  delete broken.courses.phy2049;
  assert.throws(() => restoreHubBackup(broken, parts), /does not match this backup/);
  const invalid = structuredClone(oldBackup);
  invalid.courses.phy2049.courseId = 'bench';
  assert.throws(() => restoreHubBackup(invalid, parts), /does not match this course/);
  assert.deepEqual(applications.store.readJSON('satellite'), progress);
  assert.equal('applications' in oldBackup.courses, false, 'restoring does not modify the source backup');
});
