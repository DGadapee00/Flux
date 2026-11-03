import assert from 'node:assert/strict';
import test from 'node:test';
import { LABS } from '../../courses/sta3032/src/labs/index.js';
import { LAB_CATALOGS, STA3032_TITLES } from '../catalog.js';

test("STA 3032's lab titles on the map match the course's own lab definitions", () => {
  assert.deepEqual(STA3032_TITLES, Object.fromEntries(LABS.map((l) => [l.id, l.title])));
  for (const [id, meta] of Object.entries(LAB_CATALOGS.sta3032)) assert.equal(meta.title, STA3032_TITLES[id], id);
});
