import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve(import.meta.dirname, '../scorecard.mjs');
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('no course is marked yet, so the scorecard passes and prints every course', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  for (const code of ['PHY 2049', 'EGN 3321', 'EGN 3331', 'EML 3100', 'MAC 2311', 'STA 3032']) assert.match(r.stdout, new RegExp(code));
});

test('a course marked standard: true that falls short fails, and names what it misses', () => {
  // Statics has no application lab. Marking it standard must fail and name that miss.
  const r = run('--quiet', '--mark', 'statics');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /EGN 3311 is marked standard: true but misses .*app labs\/unit 0/);
});

test('the Markdown table has a header row and one row per course', () => {
  const r = run('--md');
  assert.equal(r.status, 0, r.stderr);
  const rows = r.stdout.trim().split('\n');
  assert.match(rows[0], /^\| course \| std \|/);
  assert.equal(rows.length, 2 + 11);
});
