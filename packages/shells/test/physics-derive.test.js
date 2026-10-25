import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { renderChrome } from '../physics/chrome.js';
import { createDerive } from '../physics/derive.js';
import { installDOM } from './dom.js';

const COLORS = { mark: 0x111111, I: 0x123456, B: 0x00aa00, white: 0xffffff };

const DERIVATION = {
  id: 'd1',
  lab: 'demo',
  title: 'Set it up',
  goal: 'Find the thing.',
  applies: () => true,
  scenario: 'base',
  steps: [
    {
      ask: 'Which line comes first?',
      options: [{ text: 'this one', ok: true }, { text: 'that one', why: 'Not yet.' }],
      line: 'x = 1',
      values: () => ({ show: '1', eq: [] }),
      show: 'dot',
    },
  ],
  done: 'Done.',
  overlay: () => [{ kind: 'dot', at: [0, 0, 0], color: 'I' }],
};

function page() {
  installDOM();
  document.body.innerHTML = '<div id="app"></div>';
  renderChrome(document.getElementById('app'), { code: 'FIX 1000', setupHint: '', unitName: 'Unit' });
}

function make(extra = {}) {
  const scene = new THREE.Scene();
  const list = extra.list ?? [DERIVATION];
  const derive = createDerive(
    { scene, slice: () => ({}), computed: () => ({}), setScenario() {}, bump() {} },
    {
      derivationsFor: (labId) => list.filter((d) => d.lab === labId),
      derivationById: (id) => list.find((d) => d.id === id),
      agrees: () => true,
      colors: COLORS,
    },
  );
  return { derive, scene };
}

test('derive shows the opener only where the lab has derivations', () => {
  page();
  const { derive } = make();
  derive.update({}, {}, { id: 'demo' });
  assert.equal(document.getElementById('eq-derive').hidden, false);
  derive.update({}, {}, { id: 'elsewhere' });
  assert.equal(document.getElementById('eq-derive').hidden, true);
});

test('derive.open is a no-op when the lab has no derivation', () => {
  page();
  const { derive } = make({ list: [] });
  derive.update({}, {}, { id: 'demo' });
  assert.doesNotThrow(() => derive.open(null));
  assert.equal(derive.isOpen(), false);
  assert.equal(document.getElementById('eq-panel').classList.contains('deriving'), false);
});

test('derive draws the picture in the colours it is given', () => {
  page();
  const { derive, scene } = make();
  derive.update({}, {}, { id: 'demo' });
  derive.open('d1');
  derive.syncScene({}, {});
  const overlay = scene.children[0];
  assert.equal(overlay.children.length, 1);
  assert.equal(overlay.children[0].material.color.getHex(), COLORS.I);
});

test('derive runs with no derivationsFor, derivationById, agrees or colors', () => {
  page();
  const derive = createDerive({ scene: new THREE.Scene(), slice: () => ({}), computed: () => ({}), setScenario() {}, bump() {} }, {});
  assert.doesNotThrow(() => derive.update({}, {}, { id: 'demo' }));
  assert.equal(document.getElementById('eq-derive').hidden, true);
  assert.doesNotThrow(() => derive.open(null));
  assert.equal(derive.isOpen(), false);
});
