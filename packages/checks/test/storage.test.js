import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { collectKeys, collisions, isStorageKeyName } from '../storage.mjs';

test('a storage key name is KEY or ends in _KEY', () => {
  assert.equal(isStorageKeyName('KEY'), true);
  assert.equal(isStorageKeyName('STORE_KEY'), true);
  assert.equal(isStorageKeyName('EXAM_KEY'), true);
  assert.equal(isStorageKeyName('LABEL'), false);
  assert.equal(isStorageKeyName('KEYBOARD'), false);
});

test('the repo does not share a storage key across courses', () => {
  const keys = collectKeys();
  assert.deepEqual(collisions(keys), []);
  const statics = keys.filter((key) => key.course === 'statics').map((key) => key.value).sort();
  assert.deepEqual(statics, ['flux-statics.exam.v1', 'flux-statics.problems.v1']);
  const mac = keys.filter((key) => key.course === 'mac2313').map((key) => key.value).sort();
  assert.deepEqual(mac, ['flux-mac2313.exam.v1', 'flux-mac2313.problems.v1']);
  const phy = keys.filter((key) => key.course === 'phy2049').map((key) => key.value);
  assert.ok(phy.includes('flux.problems.v1'));
  assert.ok(phy.includes('flux.exam.v1'));
});

test('two courses with the same key fail, and a non-key constant does not count', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-storage-'));
  write(root, 'courses/one/src/progress.js', "export const STORE_KEY = 'flux.shared.v1';\nconst LABEL = 'flux.not.a.key';\n");
  write(root, 'courses/two/src/progress.js', "export const STORE_KEY = 'flux.shared.v1';\nexport const EXAM_KEY = 'flux.two.exam.v1';\n");
  const shared = collisions(collectKeys(root));
  assert.equal(shared.length, 1);
  assert.equal(shared[0].value, 'flux.shared.v1');
  assert.deepEqual(
    shared[0].uses.map((use) => use.course).sort(),
    ['one', 'two'],
  );
});

/**
 * @param {string} root
 * @param {string} rel
 * @param {string} contents
 */
function write(root, rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}
