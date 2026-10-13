import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { rawReason, scan } from '../raw.mjs';

test('raw extensions and an incoming path are rejected', () => {
  assert.equal(rawReason('courses/phy2049/notes/e1.html'), null);
  assert.equal(rawReason('courses/phy2049/lessons/src/ch1.md'), null);
  assert.equal(rawReason('courses/phy2049/lessons/ch1.docx'), '.docx');
  assert.equal(rawReason('courses/phy2049/slides/week.PPTX'), '.pptx');
  assert.equal(rawReason('courses/phy2049/key.PDF'), '.pdf');
  assert.equal(rawReason('courses/phy2049/old.Doc'), '.doc');
  assert.equal(rawReason('courses/phy2049/incoming/readme.md'), 'under incoming');
  assert.equal(rawReason('courses/phy2049/src/Incoming/note.js'), 'under incoming');
});

test('the repo has none, and a planted file fails', () => {
  assert.deepEqual(scan(), []);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-raw-'));
  const planted = path.join(root, 'courses/phy2049/incoming/key.pdf');
  fs.mkdirSync(path.dirname(planted), { recursive: true });
  fs.writeFileSync(planted, 'not a real pdf');
  fs.writeFileSync(path.join(root, 'courses/phy2049/ok.js'), 'export {}\n');

  const violations = scan(root);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].file, 'courses/phy2049/incoming/key.pdf');
  assert.match(violations[0].message, /incoming|pdf/);
});
