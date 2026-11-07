import assert from 'node:assert/strict';
import test from 'node:test';
import { LAB_CATALOGS, findCycle } from '@flux/map';
import { loadConcepts } from '@flux/map/load.mjs';
import { exportBundle, importBundle, memoryStorage } from '@flux/core';
import { RECIPES, SATELLITE, recipeById } from '@flux/map/applications/satellite.js';
import { projectInstructions, reviewBrief } from '../src/applications/brief.js';
import { applicationStore, cleanProgress, demonstrated, missingInputs, record, revise, wouldClear } from '../src/applications/progress.js';
import { backupParts, restoreHubBackup } from '../src/backup.js';
import { courseStore as fluidsStore } from '@flux/eml3015/src/storage.js';

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
  // Numbered in build order: working 01 to 07 never meets a subsystem that is still locked.
  SATELLITE.components.forEach((c, i) => {
    for (const dep of c.requires) assert.ok(SATELLITE.components.findIndex((d) => d.id === dep) < i, `${c.id} before ${dep}`);
  });
  // Work is reviewed in a Claude Project, not submitted to another site.
  assert.deepEqual(SATELLITE.components.filter((c) => c.submission), []);
  for (const r of RECIPES) {
    assert.ok(r.method?.length >= 3, `${r.id} method`);
    assert.ok(r.checklist?.length >= 3, `${r.id} checklist`);
    assert.ok(r.references?.length >= 1, `${r.id} references`);
    for (const ref of r.references) assert.equal(new URL(ref.url).protocol, 'https:', ref.url);
  }
});

test('a review brief stands on its own: task, method, every checklist item and reference', () => {
  for (const r of RECIPES) {
    const text = reviewBrief(r, { byId: concepts, recipeById, standing: (id) => (id === r.concepts?.[0] ? 'solid' : null) });
    assert.match(text, new RegExp(`^# Review: ${r.title}`));
    assert.ok(text.includes(r.demonstrate), r.id);
    for (const item of r.checklist) assert.ok(text.includes(item), `${r.id}: ${item}`);
    for (const ref of r.references) assert.ok(text.includes(ref.url), `${r.id}: ${ref.url}`);
    for (const dep of r.requires) assert.ok(text.includes(recipeById[dep].title), `${r.id} names ${dep}`);
    if (r.concepts?.length) assert.ok(text.includes('(my standing in Flux: solid)'), r.id);
    assert.match(text, /## My work\n\[Paste/);
    assert.ok(!/<[a-z]/i.test(text), `${r.id} brief is plain text`);
  }
  const rules = projectInstructions();
  assert.match(rules, /second method/);
  assert.match(rules, /not .*flight qualification|Do not treat it as flight qualification/);
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

test('a recipe depends on every subsystem whose numbers it uses, so a payload edit reaches Thermal and Communications', () => {
  let state = cleanProgress(null);
  for (const r of SATELLITE.components) state = complete(state, r.id);
  assert.deepEqual(wouldClear(state, 'payload'), ['payload', 'thermal', 'communications']);
  state = revise(state, 'payload', { evidence: 'A larger data budget.' });
  for (const id of ['thermal', 'communications', 'payload']) assert.equal(demonstrated(id, state), false, id);
  for (const id of ['orbit', 'power', 'structure', 'attitude']) assert.equal(demonstrated(id, state), true, id);
  assert.deepEqual(wouldClear(state, 'payload'), [], 'nothing left to clear');
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

test('a hub backup from before Fluids was added restores and keeps the Fluids record', () => {
  const parts = backupParts();
  const fluids = parts.find((p) => p.courseId === 'eml3015');
  fluids.store = fluidsStore(memoryStorage(), () => 0);
  fluids.store.writeJSON('problems', { v: 1, kept: true });
  const before = exportBundle(parts.filter((p) => !['eml3015', 'design', 'egn3203', 'ema3010', 'eml4140', 'eel3111', 'satellite', 'eml3101', 'applications'].includes(p.courseId)));
  assert.equal('eml3015' in before.courses, false);
  restoreHubBackup(before, parts);
  assert.deepEqual(fluids.store.readJSON('problems'), { v: 1, kept: true });
});
