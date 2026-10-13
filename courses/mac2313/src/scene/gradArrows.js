import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { VectorBatch } from './arrows.js';
import { M } from './manim.js';

/**
 * Two arrows at P on the floor: ∇f (yellow) and the student's unit direction û (teal).
 */
export class GradArrowView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.grad = new VectorBatch(this.group, M.yellow);
    this.dir = new VectorBatch(this.group, M.teal);
    this._o = new THREE.Vector3();
    this._d = new THREE.Vector3();
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ probe, fP, fx, fy, ux, uy, showGrad, showDir }) {
    const u = sceneScale();
    const origin = mathToWorld(probe.x, probe.y, 0, u);
    this._o.set(origin.x, origin.y + 0.02 * u, origin.z);
    const gmag = Math.hypot(fx, fy);
    this.grad.begin();
    if (showGrad && gmag > 1e-10) {
      // Floor mapping: math (fx, fy) → world (fx, 0, fy).
      this._d.set(fx, 0, fy).normalize();
      const L = (0.35 + 0.55 * Math.tanh(gmag / 4)) * u;
      this.grad.push(this._o, this._d, L, null);
    }
    this.grad.end(!!showGrad);

    this.dir.begin();
    if (showDir) {
      this._d.set(ux, 0, uy).normalize();
      this.dir.push(this._o, this._d, 0.7 * u, null);
    }
    this.dir.end(!!showDir);
    void fP;
  }
}
