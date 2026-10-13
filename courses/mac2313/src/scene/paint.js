import * as THREE from 'three';
import { rampColor, M } from './manim.js';

const NEG_DEEP = new THREE.Color(M.blueE);
const NEG = new THREE.Color(M.blue);
const FLAT = new THREE.Color(M.teal);
const ZERO = new THREE.Color(M.grey);

/** Color by value on a fixed scale. Negative values stay in the blue family. */
export function paintValue(v, lo, hi, out = new THREE.Color()) {
  if (!Number.isFinite(v)) return out.copy(ZERO);
  const span = hi - lo;
  if (!(span > 1e-8 * Math.max(1, Math.abs(lo), Math.abs(hi)))) {
    return out.copy(v < -1e-8 ? NEG : FLAT);
  }
  if (v < 0) {
    const denom = Math.min(lo, -1e-8);
    const t = Math.max(0, Math.min(1, v / denom));
    return out.copy(NEG).lerp(NEG_DEEP, t);
  }
  const bot = Math.max(lo, 0);
  const top = Math.max(hi, bot + 1e-8);
  return rampColor((v - bot) / (top - bot), out);
}

export function setTriangles(mesh, positions) {
  const prev = mesh.geometry;
  if (!positions || positions.length < 9) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(positions), 3));
  geo.computeVertexNormals();
  mesh.geometry = geo;
  if (prev) prev.dispose();
}

export function setColoredTriangles(mesh, positions, colors) {
  const prev = mesh.geometry;
  if (!positions || positions.length < 9) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(positions), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(colors), 3));
  geo.computeVertexNormals();
  mesh.geometry = geo;
  if (prev) prev.dispose();
}
