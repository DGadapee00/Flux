import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { calculusDestination } from '@flux/tracks/calculus';
import { courseStore, memoryStorage } from '../src/storage.js';
test('legacy II page is a redirect with a usable no-script link', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\.\.\/mac2311\/"/);
  assert.match(html, /src\/redirect\.js/);
  assert.ok(!html.includes('canvas'));
});
test('legacy route keeps the seed and moves polar ahead of the infinite unit', () => {
  assert.equal(
    calculusDestination('#/u4/polar?p=u4.pol.disk&s=7', 'mac2312'),
    '#/mac2311/c5/polar?p=ii.u4.pol.disk&s=7',
  );
});
test('legacy II backup keys remain available for existing hub files', () => {
  const s = courseStore(memoryStorage());
  s.writeJSON('problems', { v: 1, items: { saved: { box: 4 } } });
  const fresh = courseStore(memoryStorage());
  fresh.importJSON(s.exportJSON());
  assert.deepEqual(fresh.readJSON('problems'), s.readJSON('problems'));
  assert.equal(fresh.exportJSON().courseId, 'mac2312');
});
