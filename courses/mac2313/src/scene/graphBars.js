import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from './manim.js';
import { paintValue } from './paint.js';
import { mathSegment } from './wedge.js';

export const GRAPH_BARS_MAX_N = 24;
const GAP = 0.9;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

/**
 * 1D Riemann rectangles under y = f(x) in the standing xy plane.
 * A negative value hangs below the axis. The selected interval is the true Δx,
 * with the sample point marked on f.
 */
export class GraphBarsView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, GRAPH_BARS_MAX_N);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);
    this.axis = fatSegments(segmentCapacity(1), { color: M.yellow, width: 1.8, opacity: 0.7 });
    this.cage = fatSegments(segmentCapacity(4), { color: M.gold, width: 2.6, opacity: 0.95 });
    this.stem = fatSegments(segmentCapacity(1), { color: M.white, width: 2.2, opacity: 0.95 });
    this.group.add(this.axis, this.cage, this.stem);
    this.dot = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 10),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    this.dot.visible = false;
    this.group.add(this.dot);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, a, b, n, sample = 'mid', show = true, reveal, select = null, lo, hi }) {
    this.group.visible = !!show;
    if (!show) {
      this.mesh.count = 0;
      this.dot.visible = false;
      return;
    }
    const u = sceneScale();
    const nX = Math.max(1, Math.min(GRAPH_BARS_MAX_N, n | 0));
    const shown = reveal == null ? nX : Math.max(0, Math.min(nX, reveal | 0));
    const dx = (b - a) / nX;
    const cells = [];
    let autoLo = Infinity;
    let autoHi = -Infinity;
    for (let i = 0; i < nX; i++) {
      const x0 = a + i * dx;
      const sx = sample === 'left' || sample === 'll' ? x0 : sample === 'right' || sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
      const h = f(sx);
      const height = Number.isFinite(h) ? h : 0;
      cells.push({ x0, sx, h: height });
      if (height < autoLo) autoLo = height;
      if (height > autoHi) autoHi = height;
    }
    const cLo = Number.isFinite(lo) ? lo : autoLo;
    const cHi = Number.isFinite(hi) ? hi : autoHi;
    const thick = Math.max(0.04 * u, 0.03);
    let k = 0;
    for (let i = 0; i < shown; i++) {
      const cell = cells[i];
      const cx = cell.x0 + 0.5 * dx;
      const mag = Math.abs(cell.h);
      const thin = mag < 1e-6;
      const height = thin ? 0.02 : mag;
      const yBase = !thin && cell.h < 0 ? cell.h : 0;
      const foot = mathToWorld(cx, yBase, 0, u);
      _p.set(foot.x, foot.y, foot.z);
      _s.set(Math.max(1e-6, GAP * dx * u), Math.max(1e-6, height * u), thick);
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(k, _m);
      paintValue(cell.h, cLo, cHi, _c);
      this.mesh.setColorAt(k, _c);
      k += 1;
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    const A = mathToWorld(a, 0, 0, u);
    const B = mathToWorld(b, 0, 0, u);
    setFatSegments(this.axis, [A.x, A.y, A.z, B.x, B.y, B.z]);

    const sel = select == null ? -1 : select | 0;
    if (sel < 0 || sel >= shown) {
      setFatSegments(this.cage, []);
      setFatSegments(this.stem, []);
      this.dot.visible = false;
      return;
    }
    const cell = cells[sel];
    const x0 = cell.x0;
    const x1 = cell.x0 + dx;
    const h = cell.h;
    setFatSegments(this.cage, [
      ...mathSegment(x0, 0, 0, x1, 0, 0, u),
      ...mathSegment(x1, 0, 0, x1, h, 0, u),
      ...mathSegment(x1, h, 0, x0, h, 0, u),
      ...mathSegment(x0, h, 0, x0, 0, 0, u),
    ]);
    setFatSegments(this.stem, mathSegment(cell.sx, 0, 0, cell.sx, h, 0, u));
    const w = mathToWorld(cell.sx, h, 0, u);
    this.dot.visible = true;
    this.dot.position.set(w.x, w.y, w.z);
    this.dot.scale.setScalar(0.055 * Math.max(0.6, u));
  }
}
