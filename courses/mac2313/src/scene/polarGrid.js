import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

/**
 * Polar paper on the floor: concentric circles and radial rays.
 * Segment budget is fixed; unused tail is zeroed.
 */
const CIRCLES = 4;
const CIRC_SEGS = 64;
const RAYS = 8;
const RAY_SEGS = 1;
const CAP = CIRCLES * CIRC_SEGS + RAYS * RAY_SEGS;

export class PolarGridView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.line = fatSegments(segmentCapacity(CAP), { color: M.blueD, width: 1.2, opacity: 0.45 });
    this.group.add(this.line);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ rMax = 2.5, show = true } = {}) {
    this.group.visible = !!show;
    if (!show) return;
    const u = sceneScale();
    const flat = [];
    for (let k = 1; k <= CIRCLES; k++) {
      const r = (k / CIRCLES) * rMax;
      for (let i = 0; i < CIRC_SEGS; i++) {
        const t0 = (2 * Math.PI * i) / CIRC_SEGS;
        const t1 = (2 * Math.PI * (i + 1)) / CIRC_SEGS;
        const a = mathToWorld(r * Math.cos(t0), r * Math.sin(t0), 0, u);
        const b = mathToWorld(r * Math.cos(t1), r * Math.sin(t1), 0, u);
        flat.push(a.x, a.y + 0.008 * u, a.z, b.x, b.y + 0.008 * u, b.z);
      }
    }
    for (let k = 0; k < RAYS; k++) {
      const th = (k * Math.PI) / 4;
      const a = mathToWorld(0, 0, 0, u);
      const b = mathToWorld(rMax * Math.cos(th), rMax * Math.sin(th), 0, u);
      flat.push(a.x, a.y + 0.008 * u, a.z, b.x, b.y + 0.008 * u, b.z);
    }
    setFatSegments(this.line, flat);
  }
}
