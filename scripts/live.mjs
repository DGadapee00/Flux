/**
 * What is on the live hub, and how far behind this checkout it is.
 * Pages is a direct upload, so a commit does not move the site.
 */
import { execSync } from 'node:child_process';

const SITE = process.env.FLUX_SITE || 'https://flux-study.pages.dev';

const git = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
};

let live;
try {
  const res = await fetch(new URL('version.json', `${SITE}/`), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  live = await res.json();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Could not read ${SITE}/version.json — ${message}`);
  process.exit(2);
}

const head = git('git rev-parse --short HEAD', 'unknown');
const bare = String(live.commit || '').replace('+local', '');

console.log(`live   ${live.commit}  ${live.subject || ''}`);
console.log(`       built ${live.built}`);
console.log(`local  ${head}  ${git('git log -1 --pretty=%s')}`);

if (!bare || bare === 'unknown') {
  console.log('\nThe live build has no usable commit stamp.');
  process.exit(1);
}
if (bare === head) {
  console.log('\nIn sync.');
  process.exit(0);
}

const behind = git(`git rev-list --count ${bare}..HEAD`);
if (behind) {
  console.log(`\nThe live site is ${behind} commit(s) behind this checkout:`);
  console.log(git(`git log --oneline ${bare}..HEAD`));
} else {
  console.log('\nOut of sync (the live commit is not in this checkout).');
}
process.exit(1);
