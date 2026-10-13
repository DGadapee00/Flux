import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M } from './manim.js';

/** Small tangent-plane patch at P. */
export class TangentPlaneView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const geo = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.mesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color: M.gold,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
    );
    this.group.add(this.mesh);
    this._n = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ probe, fP, fx, fy, show, half = 0.6 }) {
    this.group.visible = !!show;
    if (!show) return;
    const u = sceneScale();
    const at = mathToWorld(probe.x, probe.y, fP, u);
    this.mesh.position.set(at.x, at.y, at.z);
    // z = f + fx(x-x0) + fy(y-y0)  →  world normal from (−fx, 1, −fy) in (x, z_up, y).
    this._n.set(-fx, 1, -fy).normalize();
    this._q.setFromUnitVectors(this._up, this._n);
    this.mesh.quaternion.copy(this._q);
    const s = half * u;
    this.mesh.scale.set(s, s, 1);
  }
}
