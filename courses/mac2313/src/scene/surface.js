import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { rampColor, M } from './manim.js';

const SEG = 48;

/**
 * Height mesh of z = f(x,y) over a rectangle. Vertex budget is fixed; sync() rewrites z and colour.
 * Math (x, y, f) maps to world (x, f, y) on the xyfloor.
 */
export class SurfaceView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const geo = new THREE.PlaneGeometry(1, 1, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    this.base = Float32Array.from(geo.attributes.position.array);
    const colors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.mesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      }),
    );
    this.group.add(this.mesh);

    this.stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1, 8).translate(0, 0.5, 0),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    this.group.add(this.stem);
    this._c = new THREE.Color();
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, xMin, xMax, yMin, yMax, probe, fP, show, stem = true }) {
    const u = sceneScale();
    const pos = this.mesh.geometry.attributes.position;
    const col = this.mesh.geometry.attributes.color;
    const arr = pos.array;
    const base = this.base;
    const n = pos.count;
    const dx = xMax - xMin;
    const dy = yMax - yMin;
    let lo = Infinity;
    let hi = -Infinity;
    const zs = [];
    for (let i = 0; i < n; i++) {
      const bx = base[i * 3];
      const bz = base[i * 3 + 2];
      const x = xMin + (bx + 0.5) * dx;
      const y = yMin + (bz + 0.5) * dy;
      const z = f(x, y);
      zs.push(z);
      if (z < lo) lo = z;
      if (z > hi) hi = z;
    }
    const span = Math.max(1e-9, hi - lo);
    for (let i = 0; i < n; i++) {
      const bx = base[i * 3];
      const bz = base[i * 3 + 2];
      const x = xMin + (bx + 0.5) * dx;
      const y = yMin + (bz + 0.5) * dy;
      const w = mathToWorld(x, y, zs[i], u);
      arr[i * 3] = w.x;
      arr[i * 3 + 1] = w.y;
      arr[i * 3 + 2] = w.z;
      rampColor((zs[i] - lo) / span, this._c);
      col.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.visible = show !== false;

    const foot = mathToWorld(probe.x, probe.y, 0, u);
    const top = mathToWorld(probe.x, probe.y, fP, u);
    const h = top.y - foot.y;
    this.stem.position.set(foot.x, Math.min(foot.y, top.y), foot.z);
    this.stem.scale.set(u, Math.max(1e-4, Math.abs(h)), u);
    this.stem.visible = stem !== false && show !== false;
  }
}
