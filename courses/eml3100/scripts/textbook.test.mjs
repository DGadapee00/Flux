import assert from 'node:assert/strict';
import test from 'node:test';
import { BOOKS, SECTIONS, cite, citeLong } from '../src/data/textbook.js';

test('the two books and their licences (DECISIONS.md, D13)', () => {
  assert.equal(BOOKS.yan.license, 'CC BY-NC-SA 4.0');
  assert.equal(BOOKS.up2.license, 'CC BY 4.0');
});

test('every entry names a known book with a section or chapter, or is a topic with no source yet', () => {
  for (const [topic, e] of Object.entries(SECTIONS)) {
    if (!e.book) {
      assert.ok(e.title && !e.section && !e.chapter, topic);
      continue;
    }
    assert.ok(BOOKS[e.book], `${topic}: unknown book ${e.book}`);
    assert.ok(!!e.section !== !!e.chapter, `${topic}: give a section or a chapter`);
    if (e.book === 'up2') assert.match(e.section, /^[1-4]\./, `${topic}: OpenStax UP2 is cited for Ch 1–4 only`);
  }
});

test('citations read the same way everywhere', () => {
  assert.equal(cite('property-tables'), 'Yan §2.4');
  assert.equal(cite('adiabatic'), 'OpenStax UP2 §3.6');
  assert.equal(cite('entropy'), 'Yan Ch 6');
  assert.equal(citeLong('boundary-work'), 'Yan §4.3, Work');
  assert.equal(cite('rankine'), 'The Rankine cycle');
  assert.match(citeLong('vapour-compression'), /no textbook chosen yet/);
  assert.throws(() => cite('no-such-topic'), /no citation/);
});
