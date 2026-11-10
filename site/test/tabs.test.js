import assert from 'node:assert/strict';
import test from 'node:test';
import { tabFor } from '../src/tabs.js';

const isConcept = (id) => ['gauss-law', 'divergence-theorem'].includes(id);

test('the address picks the tab, and old section anchors still land', () => {
  assert.equal(tabFor('', '', isConcept), 'today', 'the hub opens on Today');
  assert.equal(tabFor('#today', '', isConcept), 'today');
  assert.equal(tabFor('#review-gauss-law', '', isConcept), 'today', 'a thread review is on Today');
  assert.equal(tabFor('#gauss-law', '', isConcept), 'map', 'a concept opens the Map');
  assert.equal(tabFor('#map', '', isConcept), 'map');
  assert.equal(tabFor('#explore', '', isConcept), 'map');
  assert.equal(tabFor('#applications', '?application=satellite&component=orbit', isConcept), 'build');
  assert.equal(tabFor('#build', '', isConcept), 'build');
  assert.equal(tabFor('#courses', '', isConcept), 'courses');
  assert.equal(tabFor('#progress', '', isConcept), 'courses', 'the backup sits on Courses');
});

test('with no hash, the query says where a link was going; an unknown hash keeps the tab', () => {
  assert.equal(tabFor('', '?application=satellite', isConcept), 'build');
  assert.equal(tabFor('', '?traveler=fsw-dome&station=proof', isConcept), 'build', 'a traveler is on Build');
  assert.equal(tabFor('', '?path=phy2049', isConcept), 'map');
  assert.equal(tabFor('', '?view=all', isConcept), 'map');
  assert.equal(tabFor('#nothing-here', '', isConcept), null);
});
