import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { courseMarker, importSpecifiers, scan } from '../deps.mjs';

test('import specifiers ignore comments and keep real imports', () => {
  const source = `
    // import x from '@flux/subjects'
    /* import y from '@flux/site' */
    import { a } from '@flux/core';
    import '@flux/subjects/math';
    export { b } from '../course/index.js';
    const load = () => import('./labs/index.js');
  `;
  assert.deepEqual(importSpecifiers(source).sort(), [
    '../course/index.js',
    './labs/index.js',
    '@flux/core',
    '@flux/subjects/math',
  ]);
});

test('core may not name a course', () => {
  assert.equal(courseMarker('a study platform for a course'), null);
  assert.equal(courseMarker('see PHY 2049'), 'PHY 2049');
  assert.equal(courseMarker('package phy2049'), 'phy2049');
});

test('a wrong-way import fails, and the real tree does not', () => {
  assert.deepEqual(scan(), []);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-deps-'));
  write(root, 'packages/core/package.json', { name: '@flux/core' });
  write(root, 'packages/subjects/package.json', { name: '@flux/subjects' });
  write(root, 'packages/core/src/leak.js', "import { SUBJECTS } from '@flux/subjects';\n");
  write(root, 'packages/subjects/src/ok.js', "import { problem } from '@flux/core';\n");
  write(root, 'packages/core/src/named.js', 'export const note = "MAC 2313";\n');
  write(root, 'courses/demo/index.js', "import { problem } from '@flux/core';\n");

  const violations = scan(root);
  const messages = violations.map((v) => v.message).sort();
  assert.deepEqual(messages, [
    "core imports subjects via '@flux/subjects'",
    'core names a course (MAC 2313)',
  ]);
});

/**
 * @param {string} root
 * @param {string} rel
 * @param {string|object} contents
 */
function write(root, rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = typeof contents === 'string' ? contents : `${JSON.stringify(contents)}\n`;
  fs.writeFileSync(file, text);
}
