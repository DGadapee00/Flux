import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from './manim.js';
import { setTriangles } from './paint.js';
import { annularPositions, polarRectPositions, arcSegments, mathSegment, sphCellPositions } from './wedge.js';

const MESHES = 4;

function makeLabel() {
  const el = document.createElement('div');
  el.className = 'probe-label element-label';
  const obj = new CSS2DObject(el);
  obj.visible = false;
  return { el, obj };
}

/**
 * One or two area/volume elements with dimension labels.
 * Wedges are annular sectors (or the forgotten-Jacobian rectangle).
 * Spheres are spherical volume elements, φ measured from +z.
 */
export class ElementView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.meshes = [];
    for (let i = 0; i < MESHES; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshLambertMaterial({
          color: M.gold,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mesh.frustumCulled = false;
      mesh.visible = false;
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
    this.lines = fatSegments(segmentCapacity(48), { color: M.yellow, width: 2.2, opacity: 0.95 });
    this.group.add(this.lines);
    this.labels = [];
    for (let i = 0; i < 4; i++) {
      const lab = makeLabel();
      this.labels.push(lab);
      this.group.add(lab.obj);
    }
  }

  setVisible(v) {
    this.group.visible = v;
    if (!v) this._hideLabels();
  }

  _hideLabels() {
    for (const lab of this.labels) {
      lab.obj.visible = false;
      lab.el.textContent = '';
    }
  }

  sync(spec = {}) {
    const show = !!spec.show;
    this.group.visible = show;
    if (!show) {
      this._hideLabels();
      return;
    }
    const u = sceneScale();
    const pieces = [];
    const line = [];
    for (const w of spec.wedges || []) {
      const pos = w.shape === 'rect'
        ? polarRectPositions({
            r: w.r,
            th: w.th,
            dr: w.dr,
            tang: w.tang,
            z0: w.z0,
            z1: w.z1,
            u,
          })
        : annularPositions({
            r0: w.r0,
            r1: w.r1,
            th0: w.th0,
            th1: w.th1,
            z0: w.z0,
            z1: w.z1,
            u,
            steps: 8,
          });
      pieces.push({ pos, color: w.color ?? M.gold, opacity: w.opacity ?? 0.8 });
      if (w.outline) {
        const z = w.z1 + 0.04;
        if (w.shape === 'rect') {
          const th = w.th;
          const erx = Math.cos(th);
          const ery = Math.sin(th);
          const etx = -ery;
          const ety = erx;
          const cx = w.r * erx;
          const cy = w.r * ery;
          const hx = w.dr / 2;
          const hy = w.tang / 2;
          const corner = (sx, sy) => [cx + sx * hx * erx + sy * hy * etx, cy + sx * hx * ery + sy * hy * ety];
          const c0 = corner(-1, -1);
          const c1 = corner(1, -1);
          const c2 = corner(1, 1);
          const c3 = corner(-1, 1);
          line.push(
            ...mathSegment(c0[0], c0[1], z, c1[0], c1[1], z, u),
            ...mathSegment(c1[0], c1[1], z, c2[0], c2[1], z, u),
            ...mathSegment(c2[0], c2[1], z, c3[0], c3[1], z, u),
            ...mathSegment(c3[0], c3[1], z, c0[0], c0[1], z, u),
          );
        } else {
          line.push(
            ...arcSegments(w.r0, w.th0, w.th1, z, u, 8),
            ...arcSegments(w.r1, w.th0, w.th1, z, u, 10),
            ...mathSegment(w.r0 * Math.cos(w.th0), w.r0 * Math.sin(w.th0), z, w.r1 * Math.cos(w.th0), w.r1 * Math.sin(w.th0), z, u),
            ...mathSegment(w.r0 * Math.cos(w.th1), w.r0 * Math.sin(w.th1), z, w.r1 * Math.cos(w.th1), w.r1 * Math.sin(w.th1), z, u),
          );
        }
      }
    }
    for (const s of spec.spheres || []) {
      pieces.push({
        pos: sphCellPositions({ ...s, u, n: 4 }),
        color: s.color ?? M.gold,
        opacity: s.opacity ?? 0.8,
      });
    }
    for (const s of spec.stems || []) {
      line.push(...mathSegment(s.x, s.y, s.z0, s.x, s.y, s.z1, u));
    }
    for (let i = 0; i < MESHES; i++) {
      const piece = pieces[i];
      const mesh = this.meshes[i];
      if (!piece) {
        mesh.visible = false;
        continue;
      }
      setTriangles(mesh, piece.pos);
      mesh.material.color.set(piece.color);
      mesh.material.opacity = piece.opacity;
    }
    setFatSegments(this.lines, line);
    const labels = spec.labels || [];
    for (let i = 0; i < this.labels.length; i++) {
      const src = labels[i];
      const lab = this.labels[i];
      if (!src || !src.text) {
        lab.obj.visible = false;
        lab.el.textContent = '';
        continue;
      }
      const w = mathToWorld(src.x, src.y, src.z, u);
      lab.obj.visible = true;
      lab.obj.position.set(w.x, w.y, w.z);
      lab.el.textContent = src.text;
    }
  }
}
