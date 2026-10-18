#!/usr/bin/env node
/**
 * Copies the engine repo's thermo fixtures from one commit into test/fixtures/engine/.
 * The engine repo is only read: `git show <commit>:<path>`.
 *
 *   node scripts/engine-fixtures.mjs <engine checkout> <commit>
 *
 * Then update test/fixtures/engine/SOURCE.md and the hashes in test/thermo.test.js.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = {
  'thermo_nasa7.json': 'Sim/data/thermo_nasa7.json',
  'design_point.txt': 'Phase1_Calculations/cea/design_point.txt',
};
const [repo, commit] = process.argv.slice(2);
if (!repo || !commit) {
  console.error('usage: node scripts/engine-fixtures.mjs <engine checkout> <commit>');
  process.exit(2);
}
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../test/fixtures/engine');
for (const [name, src] of Object.entries(FILES)) {
  const body = execFileSync('git', ['-C', repo, 'show', `${commit}:${src}`]);
  fs.writeFileSync(path.join(out, name), body);
  console.log(`${name}  ${crypto.createHash('sha256').update(body).digest('hex')}  (${src} at ${commit})`);
}
