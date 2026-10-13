import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M } from './manim.js';

/** Point P on the surface, labeled. */
export class ProbeView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 14),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    this.group.add(core);

    this.el = document.createElement('div');
    this.el.className = 'probe-label';
    this.label = new CSS2DObject(this.el);
    this.label.position.set(0, 0.28, 0);
    this.group.add(this.label);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync(probe, fP, text = 'P') {
    const u = sceneScale();
    const w = mathToWorld(probe.x, probe.y, fP, u);
    this.group.position.set(w.x, w.y, w.z);
    this.el.textContent = text;
    this.group.scale.setScalar(Math.max(0.7, Math.min(1.4, u * 0.12)));
  }
}
