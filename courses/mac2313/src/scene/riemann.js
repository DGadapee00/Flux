import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from './manim.js';
import { paintValue, setColoredTriangles } from './paint.js';
import { annularPositions, polarRectPositions, arcSegments, mathSegment, repeatColor } from './wedge.js';
import { polarCell } from '../math/terms.js';

export const RIEMANN_MAX_N = 12;
const MAX = RIEMANN_MAX_N * RIEMANN_MAX_N;
const GAP = 0.88;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

function slab(h) {
  if (!Number.isFinite(h) || Math.abs(h) < 1e-6) return { z0: 0, z1: 0.02 };
  if (h > 0) return { z0: 0, z1: h };
  return { z0: h, z1: 0 };
}

function insetPolar(r0, r1, th0, th1) {
  const g = 0.1;
  const dr = r1 - r0;
  const dt = th1 - th0;
  return {
    r0: r0 + g * dr,
    r1: Math.max(r0 + g * dr + 1e-4, r1 - 0.4 * g * dr),
    th0: th0 + g * dt,
    th1: th1 - g * dt,
  };
}

/**
 * Prism boxes for a double Riemann sum, or annular sectors on a disk.
 * Negative heights hang below the floor. A selected cell draws its true base,
 * the sample point, and the stem f(x*, y*).
 */
export class RiemannView {
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
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);

    this.sectors = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.sectors.frustumCulled = false;
    this.group.add(this.sectors);

    this.outline = fatSegments(segmentCapacity(4), { color: M.yellow, width: 1.8, opacity: 0.7 });
    this.base = fatSegments(segmentCapacity(4), { color: M.gold, width: 2.6, opacity: 0.95 });
    this.stem = fatSegments(segmentCapacity(1), { color: M.white, width: 2.2, opacity: 0.95 });
    this.cage = fatSegments(segmentCapacity(12), { color: M.yellow, width: 2.2, opacity: 0.95 });
    this.ring = fatSegments(segmentCapacity(36), { color: M.yellow, width: 2.4, opacity: 0.95 });
    this.group.add(this.outline, this.base, this.stem, this.cage, this.ring);

    this.dot = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    this.dot.visible = false;
    this.group.add(this.dot);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync(opts) {
    const show = opts.show !== false;
    this.group.visible = show;
    if (!show) {
      this.mesh.count = 0;
      this.sectors.visible = false;
      this.dot.visible = false;
      return;
    }
    if (opts.mode === 'polar') this._polar(opts);
    else this._rect(opts);
  }

  _clearMarks() {
    setFatSegments(this.base, []);
    setFatSegments(this.stem, []);
    setFatSegments(this.cage, []);
    setFatSegments(this.ring, []);
    this.dot.visible = false;
  }

  _markSample(x, y, h, u) {
    const w = mathToWorld(x, y, h, u);
    this.dot.visible = true;
    this.dot.position.set(w.x, w.y, w.z);
    this.dot.scale.setScalar(0.055 * Math.max(0.6, u));
    setFatSegments(this.stem, mathSegment(x, y, 0, x, y, h, u));
  }

  _rect({ f, xMin, xMax, yMin, yMax, nx, ny, sample = 'mid', reveal, select = null, lo, hi }) {
    const u = sceneScale();
    this.sectors.visible = false;
    const nX = Math.max(1, Math.min(RIEMANN_MAX_N, nx | 0));
    const nY = Math.max(1, Math.min(RIEMANN_MAX_N, ny | 0));
    const total = nX * nY;
    const shown = reveal == null ? total : Math.max(0, Math.min(total, reveal | 0));
    const dx = (xMax - xMin) / nX;
    const dy = (yMax - yMin) / nY;
    const cells = [];
    let autoLo = Infinity;
    let autoHi = -Infinity;
    for (let k = 0; k < total; k++) {
      const i = Math.floor(k / nY);
      const j = k - i * nY;
      const x0 = xMin + i * dx;
      const y0 = yMin + j * dy;
      const sx = sample === 'll' ? x0 : sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
      const sy = sample === 'll' ? y0 : sample === 'ur' ? y0 + dy : y0 + 0.5 * dy;
      const h = f(sx, sy);
      const val = Number.isFinite(h) ? h : 0;
      cells.push({ i, j, x0, y0, sx, sy, h: val });
      if (val < autoLo) autoLo = val;
      if (val > autoHi) autoHi = val;
    }
    const cLo = Number.isFinite(lo) ? lo : autoLo;
    const cHi = Number.isFinite(hi) ? hi : autoHi;
    let n = 0;
    for (let k = 0; k < shown; k++) {
      const cell = cells[k];
      const foot = mathToWorld(cell.x0 + 0.5 * dx, cell.y0 + 0.5 * dy, 0, u);
      const mag = Math.abs(cell.h);
      const thin = mag < 1e-6;
      const height = thin ? 0.02 : mag;
      const yBase = !thin && cell.h < 0 ? foot.y + cell.h * u : foot.y;
      _p.set(foot.x, yBase, foot.z);
      _s.set(Math.max(1e-6, GAP * dx * u), Math.max(1e-6, height * u), Math.max(1e-6, GAP * dy * u));
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(n, _m);
      paintValue(cell.h, cLo, cHi, _c);
      this.mesh.setColorAt(n, _c);
      n += 1;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    const lift = 0.012 * u;
    const a = mathToWorld(xMin, yMin, 0, u);
    const b = mathToWorld(xMax, yMin, 0, u);
    const c = mathToWorld(xMax, yMax, 0, u);
    const d = mathToWorld(xMin, yMax, 0, u);
    setFatSegments(this.outline, [
      a.x, a.y + lift, a.z, b.x, b.y + lift, b.z,
      b.x, b.y + lift, b.z, c.x, c.y + lift, c.z,
      c.x, c.y + lift, c.z, d.x, d.y + lift, d.z,
      d.x, d.y + lift, d.z, a.x, a.y + lift, a.z,
    ]);

    const sel = select == null ? -1 : select | 0;
    if (sel < 0 || sel >= shown) {
      this._clearMarks();
      return;
    }
    const cell = cells[sel];
    const { z0, z1 } = slab(cell.h);
    const x1 = cell.x0 + dx;
    const y1 = cell.y0 + dy;
    const liftY = 0.02;
    setFatSegments(this.base, [
      ...mathSegment(cell.x0, cell.y0, liftY, x1, cell.y0, liftY, u),
      ...mathSegment(x1, cell.y0, liftY, x1, y1, liftY, u),
      ...mathSegment(x1, y1, liftY, cell.x0, y1, liftY, u),
      ...mathSegment(cell.x0, y1, liftY, cell.x0, cell.y0, liftY, u),
    ]);
    const corners = [
      [cell.x0, cell.y0, z0],
      [x1, cell.y0, z0],
      [x1, y1, z0],
      [cell.x0, y1, z0],
      [cell.x0, cell.y0, z1],
      [x1, cell.y0, z1],
      [x1, y1, z1],
      [cell.x0, y1, z1],
    ].map(([x, y, z]) => mathToWorld(x, y, z, u));
    const e = (i, j) => [corners[i].x, corners[i].y, corners[i].z, corners[j].x, corners[j].y, corners[j].z];
    setFatSegments(this.cage, [
      ...e(0, 1), ...e(1, 2), ...e(2, 3), ...e(3, 0),
      ...e(4, 5), ...e(5, 6), ...e(6, 7), ...e(7, 4),
      ...e(0, 4), ...e(1, 5), ...e(2, 6), ...e(3, 7),
    ]);
    setFatSegments(this.ring, []);
    this._markSample(cell.sx, cell.sy, cell.h, u);
  }

  _polar({ f, R, nr, nth, sample = 'mid', reveal, select = null, lo, hi, jacobian = true }) {
    const u = sceneScale();
    this.mesh.count = 0;
    setFatSegments(this.outline, []);
    const nR = Math.max(1, Math.min(RIEMANN_MAX_N, nr | 0));
    const nTh = Math.max(1, Math.min(RIEMANN_MAX_N, nth | 0));
    const total = nR * nTh;
    const shown = reveal == null ? total : Math.max(0, Math.min(total, reveal | 0));
    const positions = [];
    const colors = [];
    let autoLo = Infinity;
    let autoHi = -Infinity;
    const vals = [];
    for (let k = 0; k < total; k++) {
      const c = polarCell(R, nR, nTh, k, sample);
      const h = f(Math.max(c.r, 0) * Math.cos(c.th), Math.max(c.r, 0) * Math.sin(c.th));
      const val = Number.isFinite(h) ? h : 0;
      vals.push({ ...c, h: val });
      if (val < autoLo) autoLo = val;
      if (val > autoHi) autoHi = val;
    }
    const cLo = Number.isFinite(lo) ? lo : autoLo;
    const cHi = Number.isFinite(hi) ? hi : autoHi;
    for (let k = 0; k < shown; k++) {
      const cell = vals[k];
      const { z0, z1 } = slab(cell.h);
      paintValue(cell.h, cLo, cHi, _c);
      const box = insetPolar(cell.r0, cell.r0 + cell.dr, cell.th0, cell.th0 + cell.dth);
      let pos;
      if (jacobian) {
        pos = annularPositions({ ...box, z0, z1, u, steps: 5 });
      } else {
        pos = polarRectPositions({
          r: Math.max(cell.r, cell.dr * 0.5),
          th: cell.th0 + 0.5 * cell.dth,
          dr: box.r1 - box.r0,
          tang: cell.dth * 0.9,
          z0,
          z1,
          u,
        });
      }
      const before = positions.length;
      positions.push(...pos);
      repeatColor((positions.length - before) / 3, _c, colors);
    }
    setColoredTriangles(this.sectors, positions, colors);

    const sel = select == null ? -1 : select | 0;
    this._clearMarks();
    if (sel < 0 || sel >= shown) return;
    const cell = vals[sel];
    const { z1 } = slab(cell.h);
    const zLine = z1 + 0.03;
    setFatSegments(this.ring, [
      ...arcSegments(cell.r0, cell.th0, cell.th0 + cell.dth, zLine, u, 8),
      ...arcSegments(cell.r0 + cell.dr, cell.th0, cell.th0 + cell.dth, zLine, u, 10),
      ...mathSegment(
        cell.r0 * Math.cos(cell.th0),
        cell.r0 * Math.sin(cell.th0),
        zLine,
        (cell.r0 + cell.dr) * Math.cos(cell.th0),
        (cell.r0 + cell.dr) * Math.sin(cell.th0),
        zLine,
        u,
      ),
      ...mathSegment(
        cell.r0 * Math.cos(cell.th0 + cell.dth),
        cell.r0 * Math.sin(cell.th0 + cell.dth),
        zLine,
        (cell.r0 + cell.dr) * Math.cos(cell.th0 + cell.dth),
        (cell.r0 + cell.dr) * Math.sin(cell.th0 + cell.dth),
        zLine,
        u,
      ),
    ]);
    this._markSample(cell.r * Math.cos(cell.th), cell.r * Math.sin(cell.th), cell.h, u);
  }
}
