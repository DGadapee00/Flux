import * as THREE from 'three';
import { M } from '@flux/core/scene3d/manim.js';

/**
 * The solid y = √x rotated about the x-axis, plus the disks or shells that build it.
 * Geometry is rebuilt when the picture changes. The volume numbers do not come from the mesh.
 */
export class SolidView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.skinMat = new THREE.MeshStandardMaterial({
      color: M.teal,
      roughness: 0.42,
      metalness: 0.04,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });
    this.diskMat = new THREE.MeshStandardMaterial({
      color: M.gold,
      roughness: 0.5,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92,
    });
    this.shellMat = new THREE.MeshBasicMaterial({
      color: M.white,
      wireframe: true,
    });
  }

  setVisible(on) {
    this.group.visible = !!on;
  }

  clear() {
    for (const child of [...this.group.children]) {
      this.group.remove(child);
      child.geometry?.dispose();
    }
  }

  sync({ b, n, upm, showSolid, showDisks, showShells }) {
    this.clear();
    const u = upm > 0 ? upm : 1;
    const slices = Math.max(2, Math.round(n));
    if (showSolid) {
      const pts = [];
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const x = (b * i) / N;
        const r = Math.sqrt(Math.max(x, 0)) * u;
        pts.push(new THREE.Vector2(Math.max(r, u * 0.02), x * u));
      }
      const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), this.skinMat);
      mesh.rotation.z = -Math.PI / 2;
      this.group.add(mesh);
    }
    if (showDisks) {
      const dx = b / slices;
      for (let i = 0; i < slices; i++) {
        const x = (i + 0.5) * dx;
        const r = Math.max(Math.sqrt(x) * u, 1e-4);
        const geo = new THREE.CylinderGeometry(r, r, Math.max(dx * 0.55 * u, 1e-4), 24);
        const mesh = new THREE.Mesh(geo, this.diskMat);
        mesh.rotation.z = -Math.PI / 2;
        mesh.position.set(x * u, 0, 0);
        this.group.add(mesh);
      }
    }
    if (showShells) {
      const yMax = Math.sqrt(b);
      const dy = yMax / slices;
      for (let i = 0; i < slices; i++) {
        const y = (i + 0.5) * dy;
        const len = Math.max(b - y * y, 0);
        const geo = new THREE.CylinderGeometry(Math.max(y * u, 1e-4), Math.max(y * u, 1e-4), Math.max(len * u, 1e-4), 20, 1, true);
        const mesh = new THREE.Mesh(geo, this.shellMat);
        mesh.rotation.z = -Math.PI / 2;
        mesh.position.set((y * y + len / 2) * u, 0, 0);
        this.group.add(mesh);
      }
    }
  }
}
