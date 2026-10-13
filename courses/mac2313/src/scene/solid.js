import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M } from './manim.js';

const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 36, 1, true);
const sphGeo = new THREE.SphereGeometry(1, 28, 20);
const capGeo = new THREE.CircleGeometry(1, 36);
const mat = () =>
  new THREE.MeshLambertMaterial({
    color: M.teal,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
const wireMat = () =>
  new THREE.LineBasicMaterial({
    color: M.teal,
    transparent: true,
    opacity: 0.5,
  });

/**
 * Unit cylinder (along math z) or unit sphere, scaled to (R, z0, z1). Geometry is built once.
 */
export class SolidView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.cyl = new THREE.Mesh(cylGeo, mat());
    this.cylWire = new THREE.LineSegments(new THREE.WireframeGeometry(cylGeo), wireMat());
    this.cap0 = new THREE.Mesh(capGeo, mat());
    this.cap1 = new THREE.Mesh(capGeo, mat());
    this.sph = new THREE.Mesh(sphGeo, mat());
    this.sphWire = new THREE.LineSegments(new THREE.WireframeGeometry(sphGeo), wireMat());
    this.group.add(this.cyl, this.cylWire, this.cap0, this.cap1, this.sph, this.sphWire);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ kind = 'cyl', R = 1, z0 = 0, z1 = 1, show = true }) {
    this.group.visible = !!show;
    const u = sceneScale();
    const isCyl = kind === 'cyl';
    const isSph = kind === 'sph';
    this.cyl.visible = isCyl;
    this.cylWire.visible = isCyl;
    this.cap0.visible = isCyl;
    this.cap1.visible = isCyl;
    this.sph.visible = isSph;
    this.sphWire.visible = isSph;
    if (isCyl) {
      const H = Math.max(1e-6, z1 - z0);
      const c = mathToWorld(0, 0, 0.5 * (z0 + z1), u);
      this.cyl.position.set(c.x, c.y, c.z);
      this.cyl.scale.set(R * u, H * u, R * u);
      this.cylWire.position.copy(this.cyl.position);
      this.cylWire.scale.copy(this.cyl.scale);
      const b = mathToWorld(0, 0, z0, u);
      const t = mathToWorld(0, 0, z1, u);
      this.cap0.position.set(b.x, b.y, b.z);
      this.cap1.position.set(t.x, t.y, t.z);
      this.cap0.scale.setScalar(R * u);
      this.cap1.scale.setScalar(R * u);
      this.cap0.rotation.x = -Math.PI / 2;
      this.cap1.rotation.x = Math.PI / 2;
    }
    if (isSph) {
      const c = mathToWorld(0, 0, 0, u);
      this.sph.position.set(c.x, c.y, c.z);
      this.sph.scale.setScalar(R * u);
      this.sphWire.position.copy(this.sph.position);
      this.sphWire.scale.copy(this.sph.scale);
    }
  }
}
