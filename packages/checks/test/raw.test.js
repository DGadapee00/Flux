import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { distReason, rawReason, scan, scanDist } from '../raw.mjs';

test('raw files are allowed only in a course incoming folder', () => {
  assert.equal(rawReason('courses/phy2049/notes/e1.html'), null);
  assert.equal(rawReason('courses/phy2049/incoming/2026-wk42/Lecture Ch 53.pdf'), null);
  assert.equal(rawReason('courses/phy2049/incoming/processed/2026-wk41/key.docx'), null);
  assert.equal(rawReason('courses/phy2049/incoming/.canvas-state.json'), null);
  assert.match(rawReason('courses/phy2049/lessons/ch1.docx'), /\.docx/);
  assert.match(rawReason('courses/phy2049/slides/week.PPTX'), /\.pptx/);
  assert.match(rawReason('courses/phy2049/key.PDF'), /\.pdf/);
  assert.match(rawReason('courses/phy2049/src/incoming/note.js'), /incoming/);
  assert.match(rawReason('courses/incoming/key.pdf'), /incoming/);
});

test('nothing raw or from incoming may be in the built site', () => {
  assert.equal(distReason('phy2049/assets/index.js'), null);
  assert.match(distReason('phy2049/incoming/key.pdf'), /incoming/);
  assert.match(distReason('phy2049/lecture.pdf'), /\.pdf/);
});

test('the repo passes, and a misplaced file fails', () => {
  assert.deepEqual(scan(), []);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-raw-'));
  fs.mkdirSync(path.join(root, 'courses/phy2049/incoming'), { recursive: true });
  fs.mkdirSync(path.join(root, 'courses/phy2049/src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'courses/phy2049/incoming/ok.pdf'), 'allowed here');
  fs.writeFileSync(path.join(root, 'courses/phy2049/src/key.pdf'), 'not allowed here');

  const violations = scan(root);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].file, 'courses/phy2049/src/key.pdf');
});

test('a raw file planted in a build output fails', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-dist-'));
  fs.mkdirSync(path.join(dist, 'phy2049'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'phy2049/index.html'), '<!doctype html>');
  assert.deepEqual(scanDist(dist), []);
  fs.writeFileSync(path.join(dist, 'phy2049/notes.pdf'), 'leaked');
  assert.equal(scanDist(dist).length, 1);
});
