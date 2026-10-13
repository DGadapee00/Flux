/**
 * Pull a later flux-phy2049 commit into courses/phy2049.
 *
 *   node scripts/sync-phy.mjs <to-commit>
 *
 * Reads the commit in courses/phy2049/SOURCE, diffs SOURCE..<to-commit> in the
 * PHY repo, and applies it under courses/phy2049. `incoming/` and raw course
 * files (pdf, pptx, doc, docx) are skipped. Before Phase 2 every other path
 * applies. After files move, a drop that no longer sits at its old path is
 * reported and left unapplied. SOURCE advances to <to-commit> when the
 * placeable patch applies.
 *
 * The PHY repo is $PHY_REPO, or reference/flux-phy2049, or ../flux-phy2049.
 * This script only reads that repo.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COURSE_DIR = 'courses/phy2049';
const RAW_EXT = new Set(['.pdf', '.pptx', '.docx', '.doc']);

/**
 * @param {string} rel
 * @returns {'incoming'|'raw'|null}
 */
export function skipReason(rel) {
  const parts = rel.split('/');
  if (parts.some((part) => part.toLowerCase() === 'incoming')) return 'incoming';
  if (RAW_EXT.has(path.posix.extname(rel).toLowerCase())) return 'raw';
  return null;
}

/**
 * @param {string} repo
 * @param {string[]} args
 * @param {{ input?: Buffer | string }} [opts]
 */
function git(repo, args, opts = {}) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    input: opts.input,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/**
 * @param {string} line A `git diff --name-status -M` line.
 * @returns {{ status: string, paths: string[] } | null}
 */
export function parseNameStatus(line) {
  const parts = line.split('\t');
  if (parts.length < 2) return null;
  const status = parts[0];
  if (status.startsWith('R') || status.startsWith('C')) {
    if (parts.length < 3) return null;
    return { status, paths: [parts[1], parts[2]] };
  }
  return { status, paths: [parts[1]] };
}

/**
 * A change can be placed when the platform still has the file it edits,
 * or the parent directory of a file it adds.
 * @param {string} dest Course directory.
 * @param {{ status: string, paths: string[] }} change
 */
export function canPlace(dest, change) {
  const status = change.status;
  // A new file can be written, and git creates the directories. An edit or
  // delete needs the path still in this tree; after Phase 2 a moved file is unplaced.
  if (status.startsWith('A')) return true;
  if (status.startsWith('R') || status.startsWith('C')) {
    return fs.existsSync(path.join(dest, change.paths[0]));
  }
  return fs.existsSync(path.join(dest, change.paths[0]));
}

/**
 * @param {{ phyRepo: string, toCommit: string, root?: string }} options
 */
export function syncPhy({ phyRepo, toCommit, root = ROOT }) {
  const course = path.join(root, COURSE_DIR);
  const sourceFile = path.join(course, 'SOURCE');
  if (!fs.existsSync(sourceFile)) throw new Error(`missing ${sourceFile}`);
  const from = fs.readFileSync(sourceFile, 'utf8').trim();
  const to = git(phyRepo, ['rev-parse', '--verify', `${toCommit}^{commit}`]).trim();
  if (from === to) {
    return { from, to, placed: [], skipped: [], unplaced: [], updated: false };
  }

  const listed = git(phyRepo, ['diff', '--name-status', '-M', `${from}..${to}`]).trim();
  const changes = listed ? listed.split('\n').map(parseNameStatus).filter(Boolean) : [];

  const skipped = [];
  const unplaced = [];
  const placed = [];
  for (const change of changes) {
    const reason = change.paths.map(skipReason).find(Boolean);
    if (reason) {
      skipped.push({ paths: change.paths, reason });
      continue;
    }
    if (!canPlace(course, change)) {
      unplaced.push(change);
      continue;
    }
    placed.push(change);
  }

  if (placed.length) {
    const paths = [...new Set(placed.flatMap((change) => change.paths))];
    const patch = git(phyRepo, ['diff', '--binary', `${from}..${to}`, '--', ...paths]);
    execFileSync('git', ['apply', `--directory=${COURSE_DIR}`, '--whitespace=nowarn'], {
      cwd: root,
      input: patch,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  fs.writeFileSync(sourceFile, `${to}\n`);
  return { from, to, placed, skipped, unplaced, updated: true };
}

/**
 * @param {string} root
 * @returns {string}
 */
export function findPhyRepo(root = ROOT) {
  const candidates = [
    process.env.PHY_REPO,
    path.join(root, 'reference/flux-phy2049'),
    path.resolve(root, '../flux-phy2049'),
  ].filter(Boolean);
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'HEAD'))) return dir;
  }
  throw new Error(
    `No PHY repo. Set PHY_REPO, or clone https://github.com/DGadapee00/flux-phy2049 into reference/flux-phy2049.`,
  );
}

function printResult(result) {
  if (!result.updated) {
    console.log(`courses/phy2049 is already at ${result.to}`);
    return;
  }
  console.log(`SOURCE ${result.from} -> ${result.to}`);
  console.log(`placed ${result.placed.length}, skipped ${result.skipped.length}, unplaced ${result.unplaced.length}`);
  for (const item of result.skipped) console.log(`skip ${item.reason}: ${item.paths.join(' -> ')}`);
  for (const item of result.unplaced) console.log(`unplaced ${item.status}: ${item.paths.join(' -> ')}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const toCommit = process.argv[2];
  if (!toCommit) {
    console.error('usage: node scripts/sync-phy.mjs <to-commit>');
    process.exit(1);
  }
  try {
    const result = syncPhy({ phyRepo: findPhyRepo(), toCommit });
    printResult(result);
    if (result.unplaced.length) process.exit(1);
  } catch (err) {
    const stderr = err && err.stderr ? err.stderr.toString() : '';
    console.error(stderr || (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
}
