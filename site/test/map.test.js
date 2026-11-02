import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { buildGraph, SUBJECTS } from '@flux/map';
import { loadConcepts } from '@flux/map/load.mjs';
import { BOX, layout, wrapLabel } from '../src/layout.js';

const concepts = (await loadConcepts()).map((x) => x.concept);
const graph = buildGraph(concepts);

test('every arrow points right, and no two boxes overlap', () => {
  const { pos, W, H } = layout(concepts, SUBJECTS, graph.depth);
  for (const c of concepts) {
    for (const r of c.requires) assert.ok(pos[r].x < pos[c.id].x, `${r} → ${c.id}`);
    assert.ok(pos[c.id].x >= 0 && pos[c.id].x + BOX.NODEW <= W);
    assert.ok(pos[c.id].y >= 0 && pos[c.id].y + BOX.NODEH <= H);
  }
  for (const a of concepts) {
    for (const b of concepts) {
      if (a.id >= b.id) continue;
      const pa = pos[a.id];
      const pb = pos[b.id];
      const apart = pa.x + BOX.NODEW <= pb.x || pb.x + BOX.NODEW <= pa.x || pa.y + BOX.NODEH <= pb.y || pb.y + BOX.NODEH <= pa.y;
      assert.ok(apart, `${a.id} overlaps ${b.id}`);
    }
  }
});

test('each box sits in its own lane, and only lanes with concepts are drawn', () => {
  const { lanes, pos } = layout(concepts, SUBJECTS, graph.depth);
  assert.deepEqual(
    lanes.map((l) => l.subject.id),
    SUBJECTS.filter((s) => concepts.some((c) => c.subject === s.id)).map((s) => s.id),
  );
  for (const c of concepts) {
    const lane = lanes.find((l) => l.subject.id === c.subject);
    assert.ok(pos[c.id].y >= lane.y && pos[c.id].y + BOX.NODEH <= lane.y + lane.h, c.id);
  }
});

test('the layout does not depend on file order', () => {
  const a = layout(concepts, SUBJECTS, graph.depth).pos;
  const b = layout([...concepts].reverse(), SUBJECTS, graph.depth).pos;
  assert.deepEqual(a, b);
});

test('a long title wraps onto two balanced lines', () => {
  assert.deepEqual(wrapLabel('Gradient'), ['Gradient']);
  assert.deepEqual(wrapLabel('Steady-flow energy equation'), ['Steady-flow', 'energy equation']);
});

test('no concept id is also an id on the hub page, so #<concept> never jumps elsewhere', () => {
  const html = fs.readFileSync(path.resolve(import.meta.dirname, '../index.html'), 'utf8');
  const pageIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  pageIds.add('concept-title');
  for (const c of concepts) assert.equal(pageIds.has(c.id), false, `${c.id} is also a page id`);
});

test('the local view: one step each way, then two, without siblings', async () => {
  const { neighbourhood, subMap } = await import('../src/layout.js');
  const req = (id) => graph.byId[id].requires;
  const lead = (id) => graph.leads[id];
  const near = neighbourhood('divergence-theorem', 1, req, lead);
  assert.deepEqual([...near].sort(), ['continuity', 'divergence', 'divergence-theorem', 'heat-equation', 'maxwell-div']);
  const two = neighbourhood('divergence-theorem', 2, req, lead);
  assert.ok(two.has('surface-flux') && two.has('lumped') && two.has('em-waves'));
  assert.equal(two.has('mass-cv'), false, 'a prerequisite of a lead is a sibling path, not two steps out');
  const sub = subMap(concepts, near);
  const local = buildGraph(sub);
  assert.deepEqual([local.depth.divergence, local.depth['divergence-theorem']], [0, 1]);
  const { pos } = layout(sub, SUBJECTS, local.depth);
  assert.equal(Object.keys(pos).length, near.size);
});
