import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { BOOKS, SECTIONS, cite, citeLong, knownCitations } from '../src/data/textbook.js';
import { PROBLEMS } from '../src/problems/index.js';

test('every entry names a known book and a numbered section', () => {
  for (const [topic, e] of Object.entries(SECTIONS)) {
    assert.ok(BOOKS[e.book], `${topic}: unknown book ${e.book}`);
    assert.match(e.section, e.book === 'statics' ? /^1\.[3-6]$/ : /^1[2-8]\.\d{1,2}$/, `${topic}: ${e.section}`);
    assert.ok(e.title, topic);
  }
  const numbers = Object.values(SECTIONS).map((e) => `${e.book}:${e.section}`);
  assert.equal(new Set(numbers).size, numbers.length, 'two topics share one section: give each section one topic');
});

test('citations read the same way everywhere', () => {
  assert.equal(cite('impact'), 'Hibbeler §15.4');
  assert.equal(cite('si'), 'Hibbeler Statics §1.4');
  assert.equal(citeLong('variable-mass'), 'Hibbeler §15.9, Propulsion with Variable Mass');
  assert.throws(() => cite('no-such-topic'), /no citation/);
});

test('the sections the course leaves out are marked, and only those', () => {
  const left = Object.values(SECTIONS).filter((e) => e.leftOut).map((e) => e.section).sort();
  assert.deepEqual(left, ['12.8', '12.9', '13.6', '13.7', '15.8', '16.8']);
});

test('every section a template or a worked case cites is in the map', () => {
  const known = knownCitations();
  const bad = [];
  for (const t of PROBLEMS) {
    for (const src of [t.src, ...(t.cases || []).map((c) => c.src)]) {
      const book = /Statics/.test(src) ? 'Hibbeler Statics' : 'Hibbeler';
      for (const m of String(src).matchAll(/§(\d+\.\d+)(?:–(\d+\.\d+))?/g)) {
        const [a, b] = [m[1], m[2] || m[1]];
        const [c1, s1] = a.split('.').map(Number);
        const [, s2] = b.split('.').map(Number);
        for (let s = s1; s <= s2; s++) if (!known.has(`${book} §${c1}.${s}`)) bad.push(`${t.id}: ${book} §${c1}.${s}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('the notes cite no section the map lacks', () => {
  const dir = new URL('../src/notes/content/', import.meta.url).pathname;
  const all = knownCitations({ taught: false });
  const bad = [];
  for (const f of readdirSync(dir)) {
    if (!statSync(join(dir, f)).isFile()) continue;
    const text = readFileSync(join(dir, f), 'utf8');
    for (const m of text.matchAll(/Hibbeler (Statics )?§(\d+\.\d+)/g)) {
      const key = `Hibbeler${m[1] ? ' Statics' : ''} §${m[2]}`;
      if (!all.has(key)) bad.push(`${f}: ${key}`);
    }
  }
  assert.deepEqual(bad, []);
});
