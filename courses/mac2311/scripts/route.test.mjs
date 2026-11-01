import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoute, courseHash } from '../src/engine/router.js';
import { EXAMS, LAB_META } from '../src/data/catalog.js';
import {
  calculusDestination,
  CALCULUS_SECTIONS,
  CALCULUS_LAB_UNITS,
  CALCULUS_PROBLEM_UNITS,
} from '@flux/tracks/calculus';

test('six units follow the merged plan and every lab belongs to exactly one', () => {
  assert.deepEqual(
    EXAMS.map((e) => e.id),
    ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
  );
  const labs = EXAMS.flatMap((e) => e.labs);
  assert.equal(labs.length, 14);
  assert.equal(new Set(labs).size, 14);
  for (const [id, meta] of Object.entries(LAB_META)) {
    assert.equal(CALCULUS_LAB_UNITS[id], meta.exam);
    assert.ok(EXAMS.find((e) => e.id === meta.exam).labs.includes(id));
  }
});
test('canonical unit IDs do not collide with old unit and notes IDs', () => {
  const legacy = parseRoute('#/mac2311/u2/secant?n=s7');
  assert.equal(legacy.examId, 'c1');
  assert.equal(legacy.notes, 's12');
  assert.equal(legacy.legacy, true);
  const current = parseRoute('#/mac2311/c2/rates?n=s7');
  assert.equal(current.examId, 'c2');
  assert.equal(current.notes, 's7');
  assert.equal(current.legacy, false);
});
test('both old course prefixes, bare labs, and unit-only links have destinations', () => {
  for (const [old, unit, lab] of [
    ['#/mac2311/u1', 'c1', 'limits'],
    ['#/mac2311/u2', 'c1', 'secant'],
    ['#/mac2311/u3', 'c2', 'box'],
    ['#/mac2311/u4', 'c3', 'riemann'],
    ['#/mac2312/u1', 'c3', 'solids'],
    ['#/mac2312/u2', 'c3', 'numint'],
    ['#/mac2312/u3', 'c6', 'taylor'],
    ['#/mac2312/u4', 'c5', 'parametric'],
    ['#/mac2312/u1/arc', 'c4', 'arc'],
    ['#/mac2312/u2/improper', 'c6', 'improper'],
    ['#/polar', 'c5', 'polar'],
    ['#/rates', 'c2', 'rates'],
  ]) {
    const route = parseRoute(old);
    assert.equal(route.examId, unit, old);
    assert.equal(route.labId, lab, old);
  }
  assert.equal(courseHash('c5', 'polar'), '#/mac2311/c5/polar');
});
test('all original problem links preserve seeds and use an unambiguous ID', () => {
  for (const [source, ids] of Object.entries(CALCULUS_PROBLEM_UNITS))
    for (const [id, unit] of Object.entries(ids)) {
      const route = parseRoute(`#/${source}/u1?p=${id}&s=53`);
      assert.equal(route.examId, unit);
      assert.equal(route.seed, 53);
      assert.equal(route.problemId, source === 'mac2312' ? `ii.${id}` : id);
    }
});
test('every legacy notes anchor maps to its recut section, including moved topics', () => {
  for (const [source, units] of Object.entries(CALCULUS_SECTIONS))
    for (const [oldUnit, sections] of Object.entries(units))
      for (const [oldSection, target] of Object.entries(sections)) {
        const route = parseRoute(`#/${source}/${oldUnit}?n=${oldSection}`);
        assert.equal(route.examId, target.unit);
        assert.equal(route.notes, target.section);
      }
  const limit = parseRoute('#/mac2311/u3/box?n=s7');
  assert.equal(limit.examId, 'c6');
  assert.equal(limit.notes, 's1');
});
test('redirect rewriting is idempotent and preserves unknown query values', () => {
  const once = calculusDestination('#/mac2312/u4/polar?p=u4.pol.disk&s=7&from=saved+link');
  assert.equal(calculusDestination(once), once);
  assert.equal(new URLSearchParams(once.split('?')[1]).get('from'), 'saved link');
  assert.equal(calculusDestination('', 'mac2312'), '#/mac2311/c3/solids');
});
