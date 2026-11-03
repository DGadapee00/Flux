import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { LAB_CATALOGS } from '../catalog.js';
import { loadConcepts, ROOT } from '../load.mjs';
import { labHref, notesHref, notesOf, notesTarget } from '../routes.js';

const router = (course) => import(pathToFileURL(path.join(ROOT, 'courses', course, 'src/engine/router.js')).href);

test("every lab link on the map opens that lab in its course's own router", async () => {
  const concepts = await loadConcepts();
  let n = 0;
  for (const { concept } of concepts) {
    for (const ref of concept.labs) {
      const meta = LAB_CATALOGS[ref.course][ref.lab];
      const first = notesOf(ref)[0];
      const own = first && notesTarget(first, meta.unit).unit === meta.unit ? notesTarget(first, meta.unit).section : null;
      const href = own ? notesHref(ref, meta.unit) : labHref({ course: ref.course, unit: meta.unit, lab: ref.lab });
      const hash = href.slice(href.indexOf('#'));
      const r = await router(ref.course);
      const route = r.parseRoute ? r.parseRoute(hash) : r.parseHash(hash);
      assert.equal(route.labId, ref.lab, href);
      assert.equal(route.legacy, false, href);
      if (r.parseRoute) {
        assert.equal(route.examId, meta.unit, href);
        assert.equal(route.notes, own, href);
      }
      n += 1;
    }
  }
  assert.ok(n > 0);
});

test('a notes id in another unit opens that unit with the section', async () => {
  const href = notesHref({ course: 'phy2049', lab: 'mirrors', notes: ['e6/s20'] }, 'e7');
  assert.equal(href, 'phy2049/#/phy2049/e6?n=s20');
  const r = await router('phy2049');
  const route = r.parseRoute(href.slice(href.indexOf('#')));
  assert.deepEqual([route.examId, route.notes, route.legacy], ['e6', 's20', false]);
});

test('a STA 3032 Explore link parses in its modes router', async () => {
  const r = await router('sta3032');
  const href = labHref({ course: 'sta3032', unit: 'final', lab: 'clt' });
  const route = r.parseHash(href.slice(href.indexOf('#')));
  assert.deepEqual([route.unitId, route.mode, route.labId, route.legacy], ['final', 'explore', 'clt', false]);
});
