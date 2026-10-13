import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { canPlace, parseNameStatus, skipReason, syncPhy } from './sync-phy.mjs';

test('raw files and incoming are skipped, and a moved path cannot be placed', () => {
  assert.equal(skipReason('src/labs/gauss.js'), null);
  assert.equal(skipReason('incoming/notes.pdf'), 'incoming');
  assert.equal(skipReason('lessons/e1.docx'), 'raw');
  assert.equal(parseNameStatus('M\tsrc/a.js').status, 'M');
  assert.deepEqual(parseNameStatus('R100\told.js\tnew.js').paths, ['old.js', 'new.js']);

  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-place-'));
  fs.writeFileSync(path.join(dest, 'keep.js'), 'x');
  assert.equal(canPlace(dest, { status: 'M', paths: ['keep.js'] }), true);
  assert.equal(canPlace(dest, { status: 'M', paths: ['gone.js'] }), false);
  assert.equal(canPlace(dest, { status: 'A', paths: ['notes/new.html'] }), true);
  assert.equal(canPlace(dest, { status: 'D', paths: ['keep.js'] }), true);
});

test('a clean drop applies, and incoming plus docx stay out', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-sync-'));
  const phy = path.join(tmp, 'phy');
  const root = path.join(tmp, 'flux');
  const course = path.join(root, 'courses/phy2049');
  fs.mkdirSync(phy, { recursive: true });
  git(phy, ['init', '-b', 'main']);
  git(phy, ['config', 'user.email', 'sync@example.com']);
  git(phy, ['config', 'user.name', 'sync']);
  write(phy, 'hello.txt', 'a\n');
  write(phy, 'incoming/secret.pdf', 'nope');
  write(phy, 'lessons/e1.docx', 'nope');
  git(phy, ['add', '.']);
  git(phy, ['commit', '-m', 'base']);
  const base = git(phy, ['rev-parse', 'HEAD']).trim();

  fs.mkdirSync(course, { recursive: true });
  fs.writeFileSync(path.join(course, 'SOURCE'), `${base}\n`);
  fs.writeFileSync(path.join(course, 'hello.txt'), 'a\n');

  write(phy, 'hello.txt', 'b\n');
  write(phy, 'notes/new.html', '<p>new</p>\n');
  write(phy, 'incoming/more.pdf', 'still nope');
  write(phy, 'lessons/e1.docx', 'regenerated');
  git(phy, ['add', '.']);
  git(phy, ['commit', '-m', 'drop']);
  const next = git(phy, ['rev-parse', 'HEAD']).trim();

  const result = syncPhy({ phyRepo: phy, toCommit: next, root });
  assert.equal(result.updated, true);
  assert.equal(fs.readFileSync(path.join(course, 'hello.txt'), 'utf8'), 'b\n');
  assert.equal(fs.readFileSync(path.join(course, 'notes/new.html'), 'utf8'), '<p>new</p>\n');
  assert.equal(fs.existsSync(path.join(course, 'incoming')), false);
  assert.equal(fs.existsSync(path.join(course, 'lessons/e1.docx')), false);
  assert.equal(fs.readFileSync(path.join(course, 'SOURCE'), 'utf8').trim(), next);
  assert.equal(result.unplaced.length, 0);
  assert.ok(result.skipped.some((item) => item.reason === 'incoming'));
  assert.ok(result.skipped.some((item) => item.reason === 'raw'));

  const again = syncPhy({ phyRepo: phy, toCommit: 'HEAD', root });
  assert.equal(again.updated, false);
});

test('a file that has moved is reported and not invented', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-sync-miss-'));
  const phy = path.join(tmp, 'phy');
  const root = path.join(tmp, 'flux');
  const course = path.join(root, 'courses/phy2049');
  fs.mkdirSync(phy, { recursive: true });
  git(phy, ['init', '-b', 'main']);
  git(phy, ['config', 'user.email', 'sync@example.com']);
  git(phy, ['config', 'user.name', 'sync']);
  write(phy, 'src/old.js', 'v1\n');
  git(phy, ['add', '.']);
  git(phy, ['commit', '-m', 'base']);
  const base = git(phy, ['rev-parse', 'HEAD']).trim();

  fs.mkdirSync(path.join(course, 'src'), { recursive: true });
  fs.writeFileSync(path.join(course, 'SOURCE'), `${base}\n`);
  // The platform moved the file. The drop must not recreate the old path.
  fs.writeFileSync(path.join(course, 'src/moved.js'), 'v1\n');

  write(phy, 'src/old.js', 'v2\n');
  git(phy, ['add', '.']);
  git(phy, ['commit', '-m', 'edit']);
  const next = git(phy, ['rev-parse', 'HEAD']).trim();

  const result = syncPhy({ phyRepo: phy, toCommit: next, root });
  assert.equal(result.unplaced.length, 1);
  assert.equal(result.unplaced[0].paths[0], 'src/old.js');
  assert.equal(fs.existsSync(path.join(course, 'src/old.js')), false);
  assert.equal(fs.readFileSync(path.join(course, 'src/moved.js'), 'utf8'), 'v1\n');
  assert.equal(fs.readFileSync(path.join(course, 'SOURCE'), 'utf8').trim(), next);
});

/**
 * @param {string} repo
 * @param {string[]} args
 */
function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
}

/**
 * @param {string} repo
 * @param {string} rel
 * @param {string} text
 */
function write(repo, rel, text) {
  const file = path.join(repo, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
