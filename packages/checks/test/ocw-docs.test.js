import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fluxUnit } from '../../../tools/ocw/unit-map.mjs';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** The session rows of an OCW index: number, title, link and the Flux-units cell. */
function rows(slug) {
  return [...read(`docs/ocw/${slug}.md`).matchAll(/^\| (\d+) \| (.*?) \| \[page\]\((.*?)\) \| (.*?) \|$/gm)].map((m) => ({
    n: Number(m[1]),
    title: m[2],
    url: m[3],
    units: m[4],
  }));
}

test('the Flux-units column of an OCW index is what unit-maps.json says', () => {
  for (const slug of ['8-01sc', '2-003sc']) {
    const list = rows(slug);
    assert.ok(list.length > 10, slug);
    for (const r of list) assert.equal(r.units, fluxUnit(slug, { title: r.title, unit: '' }, r.n - 1), `${slug} #${r.n} ${r.title}`);
  }
});

test('Dynamics maps the lectures it uses and leaves Lagrange and vibration to EML 4312', () => {
  const two = rows('2-003sc');
  assert.deepEqual(two.filter((r) => r.n >= 9).map((r) => r.units), Array(two.length - 8).fill('unmapped'));
  assert.equal(two[0].units, 'Unit 2');
  const eight = rows('8-01sc');
  const unit = (lesson) => eight.find((r) => r.title.startsWith(`${lesson} `)).units;
  assert.equal(unit('19.4'), 'Unit 3');
  assert.equal(unit('20.5'), 'Unit 4');
  assert.equal(unit('14.3'), 'Unit 2');
  assert.equal(unit('37.3'), 'Unit 8');
  assert.equal(unit('13.2'), 'unmapped');
});

test('every Another view link in the Dynamics notes is a page the OCW indexes list', () => {
  const listed = new Set([...rows('8-01sc'), ...rows('2-003sc')].map((r) => r.url));
  const dir = 'courses/egn3321/src/notes/content';
  let links = 0;
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (!f.endsWith('.html')) continue;
    const html = read(`${dir}/${f}`);
    for (const m of html.matchAll(/<p class="another-view">(.*?)<\/p>/g)) {
      for (const a of m[1].matchAll(/href="(.*?)"/g)) {
        links++;
        assert.ok(listed.has(a[1]), `${f}: ${a[1]} is not in docs/ocw`);
      }
    }
  }
  assert.ok(links > 60, `${links} links`);
});

test('every Dynamics notes section but the units one and the formula sheet has an Another view', () => {
  const dir = 'courses/egn3321/src/notes/content';
  const missing = [];
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (!f.endsWith('.html')) continue;
    const secs = read(`${dir}/${f}`).split('<section class="topic"').slice(1);
    secs.forEach((s, i) => {
      const last = i === secs.length - 1;
      const units = f.startsWith('u1-') && i === 0;
      if (!last && !units && !s.includes('class="another-view"')) missing.push(`${f} section ${i + 1}`);
    });
  }
  assert.deepEqual(missing, []);
});
