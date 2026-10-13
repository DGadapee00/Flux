import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M } from './manim.js';

const MAX = 8;
const COLOR = { min: M.gold, max: M.red, saddle: M.teal, inconclusive: M.grey };

/**
 * Critical points on the surface, labelled. Capacity is fixed.
 */
export class CritView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.dots = [];
    for (let i = 0; i < MAX; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 12),
        new THREE.MeshBasicMaterial({ color: M.gold, toneMapped: false }),
      );
      const el = document.createElement('div');
      el.className = 'probe-label';
      const label = new CSS2DObject(el);
      label.position.set(0, 0.22, 0);
      mesh.add(label);
      mesh.visible = false;
      this.group.add(mesh);
      this.dots.push({ mesh, el });
    }
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ points, show = true }) {
    this.group.visible = !!show;
    const u = sceneScale();
    for (let i = 0; i < MAX; i++) {
      const p = show ? points[i] : null;
      const d = this.dots[i];
      if (!p) {
        d.mesh.visible = false;
        continue;
      }
      const w = mathToWorld(p.x, p.y, p.f, u);
      d.mesh.position.set(w.x, w.y, w.z);
      d.mesh.material.color.setHex(COLOR[p.kind] || M.white);
      d.el.textContent = p.label || p.kind;
      d.mesh.visible = true;
    }
  }
}
