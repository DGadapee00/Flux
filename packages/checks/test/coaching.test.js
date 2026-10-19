import assert from 'node:assert/strict';
import test from 'node:test';
import { withCoaching } from '../coaching.mjs';

const trap = [($) => $.x, 'forgot the factor'];
const template = () => ({
  id: 't',
  hints: ['a'],
  parts: [
    { id: 'pick', kind: 'choice', options: [{ value: 1, label: 'one' }, { value: 2, label: 'two', why: 'own' }] },
    { id: 'n', kind: 'numeric', traps: [] },
  ],
});
const coaching = { hints: ['a', 'b'], why: { pick: { 1: 'folded', 2: 'ignored' } }, traps: { n: [trap] } };

test('a template without a coaching entry is returned as it is', () => {
  const t = template();
  assert.equal(withCoaching(t, undefined), t);
});

test('hints, wrong-answer why and traps from the coaching entry are counted', () => {
  const t = withCoaching(template(), coaching);
  assert.deepEqual(t.hints, ['a', 'b']);
  assert.deepEqual(t.parts[0].options.map((o) => o.why), ['folded', 'own']);
  assert.deepEqual(t.parts[1].traps, [trap]);
});

test('coaching that is already folded in is not counted twice', () => {
  const once = withCoaching(template(), coaching);
  const twice = withCoaching(once, coaching);
  assert.deepEqual(twice.hints, once.hints);
  assert.equal(twice.parts[1].traps.length, 1);
});

test('a function of options gets the coaching why too', () => {
  const t = template();
  t.parts[0].options = () => [{ value: 1, label: 'one' }];
  const merged = withCoaching(t, coaching);
  assert.equal(merged.parts[0].options({})[0].why, 'folded');
});
