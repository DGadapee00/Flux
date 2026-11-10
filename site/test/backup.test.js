import assert from 'node:assert/strict';
import test from 'node:test';
import { exportBundle, importBundle, memoryStorage } from '@flux/core';
import { applicationStore, backupParts, restoreHubBackup } from '../src/backup.js';
import { courseStore as fluidsStore } from '@flux/eml3015/src/storage.js';

/**
 * One file backs up every course. These tests were part of the Build tab's suite
 * (docs/history/map-2026-11-10/site/test/applications.test.js) and stay with the backup.
 */

test('the retired applications section still round-trips, so a backup made with the Build tab restores', () => {
  const store = applicationStore(memoryStorage());
  const saved = { orbit: { studied: true, recorded: true, evidence: 'Report for orbit.' } };
  store.writeJSON('satellite', saved);
  const blob = exportBundle([{ courseId: 'applications', store }]);
  const fresh = applicationStore(memoryStorage());
  importBundle(blob, [{ courseId: 'applications', store: fresh }]);
  assert.deepEqual(fresh.readJSON('satellite'), saved);
});

test('old hub backups restore courses without erasing the retired applications records; incomplete or malformed backups write nothing', () => {
  const parts = backupParts();
  const applications = parts.find((p) => p.courseId === 'applications');
  applications.store = applicationStore(memoryStorage());
  // What the hub's Build tab once saved here: any JSON the slot holds rides along untouched.
  const progress = { orbit: { studied: true, recorded: true, evidence: 'Report for orbit.' } };
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
