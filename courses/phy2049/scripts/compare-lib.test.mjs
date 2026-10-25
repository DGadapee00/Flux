import assert from 'node:assert/strict';
import test from 'node:test';
import { changedRatio, diffLines, domSignature, servedChanges, storedLines } from './compare-lib.mjs';

const px = (...rgba) => new Uint8ClampedArray(rgba);

test('changedRatio is 0 for identical buffers', () => {
  const a = px(1, 2, 3, 255, 4, 5, 6, 255);
  assert.equal(changedRatio(a, px(...a)), 0);
});

test('changedRatio counts a pixel once however many channels differ', () => {
  const a = px(10, 10, 10, 255, 10, 10, 10, 255);
  const b = px(10, 10, 10, 255, 110, 110, 110, 255);
  assert.equal(changedRatio(a, b), 0.5);
});

test('changedRatio ignores a channel difference within the tolerance', () => {
  const a = px(10, 10, 10, 255);
  assert.equal(changedRatio(a, px(18, 10, 10, 255)), 0);
  assert.ok(changedRatio(a, px(19, 10, 10, 255)) > 0);
});

test('changedRatio throws on different lengths', () => {
  assert.throws(() => changedRatio(px(0, 0, 0, 255), px(0, 0, 0, 255, 0, 0, 0, 255)));
});

test('diffLines reports an added, a removed and a changed line', () => {
  const msgs = diffLines(['a', 'b'], ['a', 'c', 'd']);
  const all = msgs.join('\n');
  assert.ok(all.includes('b'), all);
  assert.ok(all.includes('c'), all);
  assert.ok(all.includes('d'), all);
  assert.deepEqual(diffLines(['a'], ['a']), []);
});

const text = (t) => ({ nodeType: 3, textContent: t });
const el = (tagName, props = {}, ...childNodes) => ({
  nodeType: 1,
  tagName,
  id: props.id || '',
  className: props.className || '',
  attributes: props.attributes || [],
  childNodes,
});

test('domSignature lists tag, id, classes and sorted attributes in order, skipping script and style', () => {
  const tree = el(
    'DIV',
    { id: 'app', className: 'hud panel', attributes: [{ name: 'role', value: 'main' }, { name: 'aria-label', value: 'Lab' }] },
    el('SCRIPT', {}, text('boom()')),
    el('STYLE', {}, text('.x{}')),
    el('BUTTON', { id: 'go', className: 'btn', attributes: [{ name: 'type', value: 'button' }] }, text('  Go   now ')),
    text('   '),
  );
  assert.deepEqual(domSignature(tree), [
    'div#app.hud.panel[aria-label=Lab,role=main]',
    '  button#go.btn[type=button] "Go now"',
  ]);
});

test('domSignature skips an element, and its subtree, carrying an ignored class', () => {
  const tree = el('DIV', { id: 'app' }, el('DIV', { className: 'grid-tick' }, el('SPAN', {})), el('P', {}));
  assert.deepEqual(domSignature(tree, ['grid-tick']), ['div#app', '  p']);
  assert.equal(domSignature(tree).length, 4);
});

test('domSignature drops transform and z-index from style, keeping the rest', () => {
  const label = (x, z) =>
    el('DIV', { className: 'axis-label', attributes: [{ name: 'style', value: `color: red; position: absolute; transform: translate(${x}px, 5px); z-index: ${z};` }] });
  const a = domSignature(label(10.25, 3));
  const b = domSignature(label(10.75, 9));
  assert.deepEqual(a, b);
  assert.deepEqual(a, ['div.axis-label[style=color: red; position: absolute]']);
});

test('storedLines lists key=value in key order, so a changed value shows in diffLines', () => {
  const a = storedLines({ b: '2', a: '{"x":1}' });
  assert.deepEqual(a, ['a={"x":1}', 'b=2']);
  const msgs = diffLines(a, storedLines({ b: '2', a: '{"x":2}' }));
  assert.equal(msgs.length, 2);
  assert.ok(msgs.join('\n').includes('{"x":2}'));
  assert.deepEqual(storedLines({}), []);
});

test('servedChanges names the modules whose served text differs, including one only a side has', () => {
  const base = { '/src/main.js': 'aaa', '/src/ui/hud.js': 'bbb', '/src/old.js': 'ccc' };
  const now = { '/src/main.js': 'aaa', '/src/ui/hud.js': 'xyz', '/src/new.js': 'ddd' };
  assert.deepEqual(servedChanges(base, now).sort(), ['/src/new.js', '/src/old.js', '/src/ui/hud.js']);
  assert.deepEqual(servedChanges(base, { ...base }), []);
});
