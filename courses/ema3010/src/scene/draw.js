import * as THREE from 'three';
import { M } from '@flux/core/scene3d/manim.js';

export { M };

export function makeLine(color) {
  return new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color }),
  );
}

export function setLine(line, points) {
  const arr = new Float32Array(Math.max(1, points.length) * 3);
  points.forEach((p, i) => {
    arr[i * 3] = p.x;
    arr[i * 3 + 1] = p.y;
    arr[i * 3 + 2] = p.z || 0;
  });
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry();
  line.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
}

export function makeArrow(color) {
  return new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.28, 0.16);
}

/** Draw `vector` from `origin`, capped so a large magnitude stays on screen. */
export function setArrow(arrow, origin, vector, maxLen = 3.2) {
  const len = Math.hypot(vector.x, vector.y, vector.z || 0);
  if (!(len > 1e-6)) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;
  const show = Math.min(len, maxLen);
  arrow.position.set(origin.x, origin.y, origin.z || 0);
  arrow.setDirection(new THREE.Vector3(vector.x / len, vector.y / len, (vector.z || 0) / len));
  const head = Math.min(0.38, show * 0.28);
  arrow.setLength(show, head, head * 0.62);
}

export function makeDot(color, radius = 0.12) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 12),
    new THREE.MeshBasicMaterial({ color }),
  );
}
