import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from './manim.js';
import { paintValue, setTriangles } from './paint.js';

export const TRIPLE_MAX_N = 8;
const MAX = TRIPLE_MAX_N * TRIPLE_MAX_N * TRIPLE_MAX_N;
const GAP = 0.82;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

/**
 * Coloured n³ cubes filling a box in R³. Colour is f at the cell centre — the cubes are
 * the partition, not height-extruded prisms.
 */
export class TripleBoxesView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);
    this.outline = fatSegments(segmentCapacity(12), { color: M.yellow, width: 1.8, opacity: 0.75 });
    this.cage = fatSegments(segmentCapacity(12), { color: M.white, width: 2.6, opacity: 1 });
    this.group.add(this.outline, this.cage);
    this.plane = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: M.gold,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.plane.frustumCulled = false;
    this.group.add(this.plane);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, xMin, xMax, yMin, yMax, zMin, zMax, n, show = true, select = null, lo: scaleLo, hi: scaleHi, sweep = null }) {
    this.group.visible = !!show;
    if (!show) {
      this.mesh.count = 0;
      this.plane.visible = false;
      return;
    }
    const u = sceneScale();
    const nX = Math.max(1, Math.min(TRIPLE_MAX_N, n | 0));
    const dx = (xMax - xMin) / nX;
    const dy = (yMax - yMin) / nX;
    const dz = (zMax - zMin) / nX;
    const c0 = mathToWorld(0, 0, 0, u);
    const ax = mathToWorld(dx, 0, 0, u);
    const ay = mathToWorld(0, dy, 0, u);
    const az = mathToWorld(0, 0, dz, u);
    const sx = GAP * Math.hypot(ax.x - c0.x, ax.y - c0.y, ax.z - c0.z);
    const sy = GAP * Math.hypot(az.x - c0.x, az.y - c0.y, az.z - c0.z);
    const sz = GAP * Math.hypot(ay.x - c0.x, ay.y - c0.y, ay.z - c0.z);
    let autoLo = Infinity;
    let autoHi = -Infinity;
    const vals = [];
    for (let i = 0; i < nX; i++) {
      const x = xMin + (i + 0.5) * dx;
      for (let j = 0; j < nX; j++) {
        const y = yMin + (j + 0.5) * dy;
        for (let k = 0; k < nX; k++) {
          const z = zMin + (k + 0.5) * dz;
          const h = f(x, y, z);
          const val = Number.isFinite(h) ? h : 0;
          vals.push({ i, j, k, x, y, z, val });
          if (val < autoLo) autoLo = val;
          if (val > autoHi) autoHi = val;
        }
      }
    }
    const cLo = Number.isFinite(scaleLo) ? scaleLo : autoLo;
    const cHi = Number.isFinite(scaleHi) ? scaleHi : autoHi;
    const axis = sweep?.axis;
    const at = sweep?.at;
    let nInst = 0;
    for (const cell of vals) {
      const w = mathToWorld(cell.x, cell.y, cell.z, u);
      _p.set(w.x, w.y, w.z);
      _s.set(Math.max(1e-6, sx), Math.max(1e-6, sy), Math.max(1e-6, sz));
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(nInst, _m);
      paintValue(cell.val, cLo, cHi, _c);
      const coord = axis === 'z' ? cell.z : axis === 'y' ? cell.y : cell.x;
      const step = axis === 'z' ? dz : axis === 'y' ? dy : dx;
      if (axis && Number.isFinite(at) && coord > at + 0.5 * step) _c.multiplyScalar(0.28);
      this.mesh.setColorAt(nInst, _c);
      nInst += 1;
    }
    this.mesh.count = nInst;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    const corners = [
      [xMin, yMin, zMin],
      [xMax, yMin, zMin],
      [xMax, yMax, zMin],
      [xMin, yMax, zMin],
      [xMin, yMin, zMax],
      [xMax, yMin, zMax],
      [xMax, yMax, zMax],
      [xMin, yMax, zMax],
    ].map(([x, y, z]) => mathToWorld(x, y, z, u));
    const e = (i, j) => [corners[i].x, corners[i].y, corners[i].z, corners[j].x, corners[j].y, corners[j].z];
    setFatSegments(this.outline, [
      ...e(0, 1),
      ...e(1, 2),
      ...e(2, 3),
      ...e(3, 0),
      ...e(4, 5),
      ...e(5, 6),
      ...e(6, 7),
      ...e(7, 4),
      ...e(0, 4),
      ...e(1, 5),
      ...e(2, 6),
      ...e(3, 7),
    ]);

    const sel = select == null ? -1 : select | 0;
    if (sel >= 0 && sel < vals.length) {
      const cell = vals[sel];
      const x0 = cell.x - 0.5 * dx;
      const y0 = cell.y - 0.5 * dy;
      const z0 = cell.z - 0.5 * dz;
      const cage = [
        [x0, y0, z0],
        [x0 + dx, y0, z0],
        [x0 + dx, y0 + dy, z0],
        [x0, y0 + dy, z0],
        [x0, y0, z0 + dz],
        [x0 + dx, y0, z0 + dz],
        [x0 + dx, y0 + dy, z0 + dz],
        [x0, y0 + dy, z0 + dz],
      ].map(([x, y, z]) => mathToWorld(x, y, z, u));
      const g = (i, j) => [cage[i].x, cage[i].y, cage[i].z, cage[j].x, cage[j].y, cage[j].z];
      setFatSegments(this.cage, [
        ...g(0, 1), ...g(1, 2), ...g(2, 3), ...g(3, 0),
        ...g(4, 5), ...g(5, 6), ...g(6, 7), ...g(7, 4),
        ...g(0, 4), ...g(1, 5), ...g(2, 6), ...g(3, 7),
      ]);
    } else {
      setFatSegments(this.cage, []);
    }

    if (!axis || !Number.isFinite(at)) {
      this.plane.visible = false;
      return;
    }
    let quad;
    if (axis === 'z') {
      quad = [
        [xMin, yMin, at],
        [xMax, yMin, at],
        [xMax, yMax, at],
        [xMin, yMax, at],
      ];
    } else if (axis === 'y') {
      quad = [
        [xMin, at, zMin],
        [xMax, at, zMin],
        [xMax, at, zMax],
        [xMin, at, zMax],
      ];
    } else {
      quad = [
        [at, yMin, zMin],
        [at, yMax, zMin],
        [at, yMax, zMax],
        [at, yMin, zMax],
      ];
    }
    const q = quad.map(([x, y, z]) => mathToWorld(x, y, z, u));
    setTriangles(this.plane, [
      q[0].x, q[0].y, q[0].z, q[1].x, q[1].y, q[1].z, q[2].x, q[2].y, q[2].z,
      q[0].x, q[0].y, q[0].z, q[2].x, q[2].y, q[2].z, q[3].x, q[3].y, q[3].z,
    ]);
  }
}
