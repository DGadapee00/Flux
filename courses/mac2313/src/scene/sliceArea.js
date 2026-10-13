import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { M } from './manim.js';
import { setColoredTriangles, setTriangles } from './paint.js';

const N = 48;
const GOLD = new THREE.Color(M.gold);
const BLUE = new THREE.Color(M.blue);
const BAND = new THREE.Color(M.gold);

function pushVert(pos, col, p, color) {
  pos.push(p.x, p.y, p.z);
  col.push(color.r, color.g, color.b);
}

/**
 * The inner integral as a filled cross-section, plus the strip it occupies in D.
 * Order `xy` holds x fixed and runs in y. Order `yx` holds y fixed and runs in x.
 */
export class SliceAreaView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.fill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.band = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: M.gold,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.fill.frustumCulled = false;
    this.band.frustumCulled = false;
    this.group.add(this.fill, this.band);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, order = 'xy', x, y, xLo, xHi, yLo, yHi, xMin, xMax, yMin, yMax, show = true }) {
    this.group.visible = !!show;
    if (!show) return;
    const u = sceneScale();
    const alongY = order !== 'yx';
    const t0 = alongY ? yLo : xLo;
    const t1 = alongY ? yHi : xHi;
    const pos = [];
    const col = [];
    if (t1 > t0) {
      const samples = [];
      for (let i = 0; i <= N; i++) {
        const t = t0 + ((t1 - t0) * i) / N;
        const px = alongY ? x : t;
        const py = alongY ? t : y;
        const h = f(px, py);
        samples.push({ t, h: Number.isFinite(h) ? h : 0, px, py });
      }
      const emit = (a, b) => {
        const A0 = mathToWorld(a.px, a.py, 0, u);
        const A1 = mathToWorld(a.px, a.py, a.h, u);
        const B0 = mathToWorld(b.px, b.py, 0, u);
        const B1 = mathToWorld(b.px, b.py, b.h, u);
        const cA = a.h < 0 ? BLUE : GOLD;
        const cB = b.h < 0 ? BLUE : GOLD;
        pushVert(pos, col, A0, cA);
        pushVert(pos, col, B0, cB);
        pushVert(pos, col, B1, cB);
        pushVert(pos, col, A0, cA);
        pushVert(pos, col, B1, cB);
        pushVert(pos, col, A1, cA);
      };
      for (let i = 0; i < samples.length - 1; i++) {
        const a = samples[i];
        const b = samples[i + 1];
        if (a.h * b.h < 0) {
          const t = a.h / (a.h - b.h);
          const mid = {
            px: a.px + (b.px - a.px) * t,
            py: a.py + (b.py - a.py) * t,
            h: 0,
          };
          emit(a, mid);
          emit(mid, b);
        } else {
          emit(a, b);
        }
      }
    }
    setColoredTriangles(this.fill, pos, col);

    const spanX = Math.max(1e-3, (xMax ?? 1) - (xMin ?? 0));
    const spanY = Math.max(1e-3, (yMax ?? 1) - (yMin ?? 0));
    const band = [];
    const lift = 0.03;
    if (alongY && yHi > yLo) {
      const half = 0.045 * spanX;
      const x0 = x - half;
      const x1 = x + half;
      const c0 = mathToWorld(x0, yLo, lift, u);
      const c1 = mathToWorld(x1, yLo, lift, u);
      const c2 = mathToWorld(x1, yHi, lift, u);
      const c3 = mathToWorld(x0, yHi, lift, u);
      band.push(c0.x, c0.y, c0.z, c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c0.x, c0.y, c0.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z);
    } else if (!alongY && xHi > xLo) {
      const half = 0.045 * spanY;
      const y0 = y - half;
      const y1 = y + half;
      const c0 = mathToWorld(xLo, y0, lift, u);
      const c1 = mathToWorld(xHi, y0, lift, u);
      const c2 = mathToWorld(xHi, y1, lift, u);
      const c3 = mathToWorld(xLo, y1, lift, u);
      band.push(c0.x, c0.y, c0.z, c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c0.x, c0.y, c0.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z);
    }
    setTriangles(this.band, band);
    this.band.material.color.copy(BAND);
  }
}
