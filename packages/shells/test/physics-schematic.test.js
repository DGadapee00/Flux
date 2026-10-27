import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { installDOM } from './dom.js';

installDOM();
const { SchematicView, rampColorCVD } = await import('../physics/schematic.js');

/** A battery and two resistors in series: 0 → a → b → 0, with 12 V and 4 Ω + 2 Ω. */
const LAYOUT = { nodes: { g: [0, 0], a: [0, 2], b: [3, 2], c: [3, 0] } };
const EDGES = [
  { id: 'V', type: 'V', a: 'g', b: 'a', value: 12 },
  { id: 'R1', type: 'R', a: 'a', b: 'b', value: 4 },
  { id: 'R2', type: 'R', a: 'b', b: 'c', value: 2 },
  { id: 'W', type: 'W', a: 'c', b: 'g' },
];

test('the schematic draws a netlist and labels each element', () => {
  const scene = new THREE.Scene();
  const view = new SchematicView(scene);
  view.build(LAYOUT, EDGES);
  assert.equal(view.items.length, 4);
  const sol = { V: { g: 0, a: 12, b: 4, c: 0 }, I: { V: 2, R1: 2, R2: 2, W: 2 } };
  view.update(0.1, sol, 12, { R1: 'R₁ 4 Ω', R2: 'R₂ 2 Ω', V: '12 V' }, '');
  const label = view.items.find((it) => it.e.id === 'R1').label;
  assert.equal(label.element.innerHTML, 'R₁ 4 Ω');
  // Wires at the top potential take the ramp's top colour; ground takes its bottom.
  const lead = view.items.find((it) => it.e.id === 'R1').leads[0].material.color;
  assert.equal(lead.getHex(), rampColorCVD(1).getHex());
  view.setVisible(false);
  assert.equal(view.group.visible, false);
  view.clear();
  assert.equal(view.items.length, 0);
});

test('the current colour is an option, gold by default', () => {
  const scene = new THREE.Scene();
  const a = new SchematicView(scene);
  const b = new SchematicView(scene, { current: 0x58c4dd });
  assert.notEqual(a.dotTex, b.dotTex);
});
