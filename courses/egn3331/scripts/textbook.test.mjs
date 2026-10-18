import assert from 'node:assert/strict';
import test from 'node:test';
import { BOOKS, SECTIONS, cite, citeLong } from '../src/data/textbook.js';

test('the book and its licence (DECISIONS.md, D14)', () => {
  assert.equal(BOOKS.roylance.license, 'CC BY-NC-SA 4.0');
  assert.match(BOOKS.roylance.url, /^https:\/\/ocw\.mit\.edu\/courses\/3-11-mechanics-of-materials-fall-1999\/$/);
});

test('every entry names a known book with a section or chapter, or is a topic with no source yet', () => {
  for (const [topic, e] of Object.entries(SECTIONS)) {
    if (!e.book) {
      assert.ok(e.title && !e.section && !e.chapter, topic);
      continue;
    }
    assert.ok(BOOKS[e.book], `${topic}: unknown book ${e.book}`);
    assert.ok(!!e.section !== !!e.chapter, `${topic}: give a section or a chapter`);
    if (e.section) assert.match(e.section, /^[1-6]\.\d$/, `${topic}: Roylance has six chapters`);
  }
});

test('citations read the same way everywhere', () => {
  assert.equal(cite('trusses'), 'Roylance §2.1');
  assert.equal(cite('inclined-plane'), 'Roylance §3.3');
  assert.equal(citeLong('flexure'), 'Roylance §4.2, Stresses in Beams');
  assert.equal(cite('buckling'), 'Buckling of columns');
  assert.match(citeLong('bearing'), /no textbook chosen yet/);
  assert.throws(() => cite('no-such-topic'), /no citation/);
});
