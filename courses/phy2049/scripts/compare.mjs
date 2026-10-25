/**
 * The gate for moving PHY 2049's UI into the physics shell: capture the running app, then prove a
 * later commit looks and behaves the same.
 *
 *   node scripts/compare.mjs --save <dir>      capture this commit into <dir>
 *   node scripts/compare.mjs --against <dir>   capture again into <dir>.new and compare
 *   --only vectors,gauss                       limit the lab screenshots (the DOM checks still run)
 *
 * It captures, at 1440×900 and 380×820: a screenshot of every lab and scenario, the structure of the
 * page in Practice, Notes and Explore, a practice and a notes deep link, the localStorage keys the
 * app writes, and whether the phone layout scrolls sideways. Needs the dev server on port 5174.
 * Exit 2 means a difference: the DOM, the keys, an overflow, or a screenshot over TOLERANCE.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';
import { TOLERANCE, changedRatio, diffLines, domSignature } from './compare-lib.mjs';

const BASE = process.env.FLUX_URL || 'http://localhost:5174/';
const COURSE = 'phy2049';
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '380x820', width: 380, height: 820 },
];
const MODES = ['explore', 'practice', 'notes'];
const DEEP_LINKS = {
  practice: `#/${COURSE}/e1/vectors?p=e1.v.mag-dir&s=1`,
  notes: `#/${COURSE}/e1/vectors?n=s2`,
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const saveDir = flag('--save');
const againstDir = flag('--against');
const only = new Set((flag('--only') || '').split(',').filter(Boolean));
if (!saveDir === !againstDir) {
  console.error('Usage: compare.mjs --save <dir> | --against <dir> [--only lab,lab]');
  process.exit(1);
}

const outDir = path.resolve(saveDir || `${againstDir}.new`);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// grid-tick: the number plane's axis labels, created lazily and moved every frame.
const IGNORE = ['grid-tick'];
const SIGNATURE = `(${domSignature.toString()})(document.getElementById('app'), ${JSON.stringify(IGNORE)})`;

async function open(page, hash) {
  await page.goto('about:blank');
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gauss?.state?.lab, null, { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function captureViewport(browser, vp, manifest) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  const rec = { dom: {}, keys: [], overflow: [] };
  const overflows = async (label) => {
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    if (!ok && vp.width <= 400) rec.overflow.push(label);
  };

  await open(page, `#/${COURSE}/e1/vectors`);
  for (const mode of MODES) {
    await page.click(`#btn-${mode}`);
    await page.waitForTimeout(400);
    rec.dom[mode] = await page.evaluate(SIGNATURE);
    await overflows(mode);
  }
  await page.click('#btn-explore');
  await page.waitForTimeout(300);

  for (const [kind, hash] of Object.entries(DEEP_LINKS)) {
    await open(page, hash);
    await page.waitForTimeout(500);
    rec.dom[`deep-${kind}`] = await page.evaluate(SIGNATURE);
    await overflows(`deep-${kind}`);
    if (kind === 'practice') {
      // Opening the solution is what writes a student's progress, so it is what the key check needs.
      await page.click('#problems button:has-text("Show solution")');
      await page.waitForTimeout(600);
      rec.dom['deep-practice-solved'] = await page.evaluate(SIGNATURE);
      rec.keys = await page.evaluate(() => Object.keys(localStorage).sort());
    }
  }

  await open(page, `#/${COURSE}/e1/vectors`);
  const catalog = await page.evaluate(async () => {
    const mod = await import('/src/data/catalog.js');
    return mod.EXAMS.map((e) => ({ id: e.id, labs: e.labs }));
  });
  for (const exam of catalog) {
    for (const lab of exam.labs) {
      if (only.size && !only.has(lab)) continue;
      await page.evaluate((h) => (location.hash = h), `#/${COURSE}/${exam.id}/${lab}`);
      await page.waitForFunction((id) => window.__gauss?.state?.lab === id, lab, { timeout: 10000 });
      await page.waitForTimeout(400);
      const all = await page.$$eval('#scenario option', (os) => os.map((o) => o.value));
      // __custom and __problem are the lab's own states, not scenarios a student picks.
      const ids = all.filter((id) => !id.startsWith('__'));
      for (const id of ids.length ? ids : ['default']) {
        if (id !== 'default') await page.selectOption('#scenario', id);
        await page.waitForTimeout(1300);
        const name = `${vp.name}-${exam.id}-${lab}-${id}.png`;
        await page.screenshot({ path: path.join(outDir, name) });
        manifest.shots.push(name);
      }
    }
  }
  if (errors.length) rec.errors = errors;
  manifest.viewports[vp.name] = rec;
  await page.close();
}

const browser = await chromium.launch({ headless: true });
const manifest = { viewports: {}, shots: [] };
for (const vp of VIEWPORTS) await captureViewport(browser, vp, manifest);
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

if (saveDir) {
  await browser.close();
  console.log(`Saved ${manifest.shots.length} screenshots and the page structure to ${outDir}`);
  process.exit(0);
}

// --against: compare the new capture with the saved one.
const baseDir = path.resolve(againstDir);
const base = JSON.parse(fs.readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'));
const problems = [];

for (const vp of VIEWPORTS) {
  const a = base.viewports[vp.name];
  const b = manifest.viewports[vp.name];
  for (const key of new Set([...Object.keys(a.dom), ...Object.keys(b.dom)])) {
    const diff = diffLines(a.dom[key] || [], b.dom[key] || []);
    if (diff.length) problems.push(`DOM ${vp.name} ${key}:\n    ${diff.slice(0, 12).join('\n    ')}`);
  }
  if (JSON.stringify(a.keys) !== JSON.stringify(b.keys)) {
    problems.push(`localStorage keys ${vp.name}: ${JSON.stringify(a.keys)} -> ${JSON.stringify(b.keys)}`);
  }
  if (b.overflow.length) problems.push(`sideways scroll at ${vp.name}: ${b.overflow.join(', ')}`);
  if (b.errors?.length) problems.push(`page errors at ${vp.name}: ${b.errors.slice(0, 3).join(' | ')}`);
}

// Pixel data comes from the browser's own PNG decoder; the ratio is computed in the page too,
// so the images never cross into Node.
const names = manifest.shots.filter((n) => base.shots.includes(n));
for (const n of manifest.shots) if (!base.shots.includes(n)) problems.push(`new screenshot ${n}`);
for (const n of base.shots) if (!manifest.shots.includes(n) && (!only.size || [...only].some((l) => n.includes(`-${l}-`)))) problems.push(`missing screenshot ${n}`);

const scratch = await browser.newPage();
await scratch.goto('about:blank');
const ratios = [];
for (const name of names) {
  const a64 = fs.readFileSync(path.join(baseDir, name)).toString('base64');
  const b64 = fs.readFileSync(path.join(outDir, name)).toString('base64');
  const ratio = await scratch.evaluate(
    async ({ a64, b64, src }) => {
      const ratioOf = new Function(`return (${src})`)();
      const pixels = async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      try {
        return ratioOf(await pixels(a64), await pixels(b64));
      } catch {
        return 1;
      }
    },
    { a64, b64, src: changedRatio.toString() },
  );
  ratios.push({ name, ratio });
  if (ratio > TOLERANCE) problems.push(`screenshot ${name} changed ${(ratio * 100).toFixed(3)}% of its pixels (limit ${(TOLERANCE * 100).toFixed(3)}%)`);
}
await browser.close();

ratios.sort((x, y) => y.ratio - x.ratio);
console.log(`Compared ${ratios.length} screenshots. Worst five:`);
for (const r of ratios.slice(0, 5)) console.log(`  ${(r.ratio * 100).toFixed(4)}%  ${r.name}`);
if (problems.length) {
  console.error(`\n${problems.length} difference(s):`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  process.exit(2);
}
console.log('No differences.');
