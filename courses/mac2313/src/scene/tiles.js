import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { VectorBatch } from './arrows.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const MAX_LINES = 64;
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

function toWorld(x, y, lift, u) {
  const p = mathToWorld(x, y, 0, u);
  const up = mathToWorld(0, 0, 1, u);
  return _o.set(p.x + up.x * lift, p.y + up.y * lift, p.z + up.z * lift);
}

/**
 * The inner grid of a tiled region, and the flux across each inner face: one arrow per face, along
 * the face's normal, as long as the flux. Each arrow leaves one cell and enters its neighbour.
 */
export class TilesView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lines = fatSegments(segmentCapacity(MAX_LINES), { color: M.yellow, width: 1.5, opacity: 0.55 });
    this.group.add(this.lines);
    this.faces = new VectorBatch(this.group, M.blue ?? 0x58c4dd);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /** @param {{ x0: number, y0: number, h: number, n: number, faces: { x: number, y: number, nx: number, ny: number, flux: number }[], scale: number, showFaces: boolean }} spec */
  sync({ x0, y0, h, n, faces, scale, showFaces }) {
    const u = sceneScale();
    const lift = 0.025;
    const flat = [];
    for (let i = 1; i < n; i++) {
      for (const [a, b] of [[[x0 + i * h, y0], [x0 + i * h, y0 + n * h]], [[x0, y0 + i * h], [x0 + n * h, y0 + i * h]]]) {
        const p = toWorld(a[0], a[1], lift, u);
        flat.push(p.x, p.y, p.z);
        const q = toWorld(b[0], b[1], lift, u);
        flat.push(q.x, q.y, q.z);
      }
    }
    setFatSegments(this.lines, flat);
    this.faces.begin();
    if (showFaces) {
      for (const f of faces) {
        const L = Math.min(0.45 * h, Math.abs(f.flux) * scale) * u;
        if (!(L > 0.01 * u)) continue;
        const s = Math.sign(f.flux);
        const back = (L / u) / 2;
        const o = toWorld(f.x - s * f.nx * back, f.y - s * f.ny * back, lift * 2, u).clone();
        const d = mathToWorld(s * f.nx, s * f.ny, 0, 1);
        this.faces.push(o, _d.set(d.x, d.y, d.z).normalize().clone(), L, null);
      }
    }
    this.faces.end(!!showFaces);
  }
}
