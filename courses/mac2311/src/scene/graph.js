import * as THREE from 'three';
import { mathToWorld, sceneScale } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from '@flux/core/scene3d/manim.js';

const CURVE_N = 160;
const BAR_MAX = 48;

function world(x, y, lift = 0) {
  const u = sceneScale();
  return mathToWorld(x, y, lift, u);
}

function pushSeg(flat, x0, y0, x1, y1, lift = 0.02) {
  if (![x0, y0, x1, y1].every(Number.isFinite)) return;
  const a = world(x0, y0, lift);
  const b = world(x1, y1, lift);
  flat.push(a.x, a.y, a.z, b.x, b.y, b.z);
}

/**
 * Graph of y = f(x), a secant, a tangent, and Riemann rectangles.
 * Buffers are allocated once. Line2 cannot grow.
 */
export class GraphView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.curve = fatSegments(segmentCapacity(CURVE_N - 1), { color: M.teal, width: 3.2, opacity: 0.95 });
    this.secant = fatSegments(segmentCapacity(1), { color: M.yellow, width: 2.6, opacity: 0.95 });
    this.tangent = fatSegments(segmentCapacity(1), { color: M.white, width: 2.2, opacity: 0.9 });
    this.bars = fatSegments(segmentCapacity(BAR_MAX * 4), { color: M.gold, width: 1.5, opacity: 0.8 });
    this.group.add(this.curve, this.secant, this.tangent, this.bars);
  }

  setVisible(on) {
    this.group.visible = !!on;
  }

  syncCurve(fn, a, b, show = true) {
    this.curve.visible = !!show;
    if (!show) return;
    const flat = [];
    let prev = null;
    for (let i = 0; i < CURVE_N; i++) {
      const x = a + ((b - a) * i) / (CURVE_N - 1);
      const y = fn(x);
      if (!Number.isFinite(y)) {
        prev = null;
        continue;
      }
      if (prev) pushSeg(flat, prev.x, prev.y, x, y, 0.03);
      prev = { x, y };
    }
    setFatSegments(this.curve, flat);
  }

  syncLine(which, x0, y0, x1, y1, show = true) {
    const line = which === 'secant' ? this.secant : this.tangent;
    line.visible = !!show && [x0, y0, x1, y1].every(Number.isFinite);
    if (!line.visible) {
      setFatSegments(line, []);
      return;
    }
    const flat = [];
    pushSeg(flat, x0, y0, x1, y1, 0.04);
    setFatSegments(line, flat);
  }

  /** @param {{ x0: number, x1: number, y: number }[]} rects */
  syncBars(rects, show = true) {
    this.bars.visible = !!show && rects.length > 0;
    if (!this.bars.visible) {
      setFatSegments(this.bars, []);
      return;
    }
    const flat = [];
    for (const r of rects.slice(0, BAR_MAX)) {
      const y = r.y;
      pushSeg(flat, r.x0, 0, r.x1, 0, 0.02);
      pushSeg(flat, r.x1, 0, r.x1, y, 0.02);
      pushSeg(flat, r.x1, y, r.x0, y, 0.02);
      pushSeg(flat, r.x0, y, r.x0, 0, 0.02);
    }
    setFatSegments(this.bars, flat);
  }
}
