import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  applyCutFace,
  coupleCurl,
  fixedWallSegments,
  pinnedGroundSegments,
  placeIncomingArrow,
  segmentPairs,
} from '../engineering/fbd.js';

function stubArrow() {
  return {
    visible: false,
    position: new THREE.Vector3(),
    setDirection(dir) {
      this.dir = dir.clone();
    },
    setLength(...args) {
      this.lenArgs = args;
    },
  };
}

test('a fixed wall is a post with five hatch ticks', () => {
  const wall = fixedWallSegments(1.5, 2.35);
  assert.deepEqual(wall.slice(0, 6), [1.5, 1.75, 0, 1.5, 2.95, 0]);
  assert.equal(wall.length, 36);
  assert.deepEqual(wall.slice(6, 12), [1.5, 1.8, 0, 1.3, 1.62, 0]);
});

test('pinned ground hangs a hatched base under the joint', () => {
  const g = pinnedGroundSegments(2, 4);
  assert.equal(g.length, 42);
  assert.deepEqual(g.slice(0, 6), [2, 4, 0, 1.78, 3.66, 0]);
  assert.deepEqual(g.slice(12, 18), [1.66, 3.66, 0, 2.34, 3.66, 0]);
});

test('a member is the segments joining its points', () => {
  assert.deepEqual(segmentPairs([{ x: 0, y: 0, z: 1 }, { x: 2, y: 0, z: 1 }, { x: 2, y: 3, z: 0 }]), [
    0, 0, 1, 2, 0, 1, 2, 0, 1, 2, 3, 0,
  ]);
});

test('an incoming arrow ends short of the point it acts on', () => {
  const arrow = stubArrow();
  const at = new THREE.Vector3(1, 2, 0);
  const placed = placeIncomingArrow(arrow, at, 0, -4, { scale: 0.5, minLength: 0.3, gap: 0.1 });
  assert.equal(placed.len, 2);
  assert.ok(arrow.position.distanceTo(new THREE.Vector3(1, 4.1, 0)) < 1e-9);
  assert.ok(arrow.dir.distanceTo(new THREE.Vector3(0, -1, 0)) < 1e-9);
});

test('positive shear on the left face points down, and positive axial force points away', () => {
  const face = new THREE.Vector3(1, 2, 0);
  const cutV = stubArrow();
  const cutN = stubArrow();
  const head = stubArrow();
  const arc = applyCutFace({
    show: true,
    cutV,
    cutN,
    momentHead: head,
    face,
    N: 5,
    V: 10,
    M: 0,
  });
  assert.equal(arc.length, 0);
  assert.equal(head.visible, false);
  assert.ok(cutV.position.distanceTo(new THREE.Vector3(1.12, 2.75, 0)) < 1e-9);
  assert.ok(cutV.dir.distanceTo(new THREE.Vector3(0, -1, 0)) < 1e-9);
  assert.ok(cutN.position.distanceTo(face) < 1e-9);
  assert.ok(cutN.dir.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-9);
  assert.equal(cutN.lenArgs[0], 0.7);
});

test('a positive moment is a counterclockwise curl, and a hidden cut draws nothing', () => {
  const face = new THREE.Vector3(0, 0, 0);
  const head = stubArrow();
  const arc = applyCutFace({
    show: true,
    cutV: stubArrow(),
    cutN: stubArrow(),
    momentHead: head,
    face,
    N: 0,
    V: 0,
    M: 3,
  });
  assert.equal(head.visible, true);
  assert.equal(arc.length, 36 * 6);
  const sweep = 1.4 * Math.PI;
  const endA = Math.PI / 2 + sweep / 2;
  const end = new THREE.Vector3(0.38 * Math.cos(endA), 0.38 * Math.sin(endA), 0);
  const tangent = new THREE.Vector3(-Math.sin(endA), Math.cos(endA), 0);
  end.addScaledVector(tangent, -0.22);
  assert.ok(head.position.distanceTo(end) < 1e-9);

  const hidden = stubArrow();
  const none = applyCutFace({
    show: false,
    cutV: hidden,
    cutN: stubArrow(),
    momentHead: stubArrow(),
    face,
    N: 4,
    V: 4,
    M: 4,
  });
  assert.deepEqual(none, []);
  assert.equal(hidden.visible, false);
});

test('couple curl uses the same tip the beam used', () => {
  const head = stubArrow();
  const c = new THREE.Vector3(1, 2, 0);
  const arc = coupleCurl(head, c, 0.42, -1);
  assert.equal(arc.length, 216);
  assert.equal(head.lenArgs[0], 0.22);
  assert.equal(head.lenArgs[1], 0.2);
  assert.equal(head.lenArgs[2], 0.16);
});
