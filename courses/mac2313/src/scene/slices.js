import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const N = 96;
const TAN_CAP = 1;

/**
 * Traces of z = f(x,y) with one variable held fixed, plus the tangent whose slope is the partial.
 * Teal = P_y (y held, slope f_x). Purple = Q_x (x held, slope f_y).
 * Segment budget is fixed; Line2 cannot grow.
 */
export class SliceView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.xSlice = fatSegments(segmentCapacity(N - 1), { color: M.teal, width: 2.8, opacity: 0.95 });
    this.ySlice = fatSegments(segmentCapacity(N - 1), { color: M.purple, width: 2.8, opacity: 0.95 });
    this.xTan = fatSegments(segmentCapacity(TAN_CAP), { color: M.yellow, width: 2.6, opacity: 0.95 });
    this.yTan = fatSegments(segmentCapacity(TAN_CAP), { color: M.gold, width: 2.6, opacity: 0.95 });
    this.group.add(this.xSlice, this.ySlice, this.xTan, this.yTan);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({
    f,
    probe,
    fP,
    fx,
    fy,
    xMin,
    xMax,
    yMin,
    yMax,
    showX = true,
    showY = true,
    showTan = true,
    tanLen = 0.7,
  }) {
    const u = sceneScale();
    const x0 = probe.x;
    const y0 = probe.y;

    this.xSlice.visible = !!showX;
    if (showX) {
      const flat = [];
      let px;
      let py;
      let pz;
      for (let i = 0; i < N; i++) {
        const x = xMin + ((xMax - xMin) * i) / (N - 1);
        const w = mathToWorld(x, y0, f(x, y0), u);
        if (i) flat.push(px, py, pz, w.x, w.y, w.z);
        px = w.x;
        py = w.y;
        pz = w.z;
      }
      setFatSegments(this.xSlice, flat);
    }

    this.ySlice.visible = !!showY;
    if (showY) {
      const flat = [];
      let px;
      let py;
      let pz;
      for (let i = 0; i < N; i++) {
        const y = yMin + ((yMax - yMin) * i) / (N - 1);
        const w = mathToWorld(x0, y, f(x0, y), u);
        if (i) flat.push(px, py, pz, w.x, w.y, w.z);
        px = w.x;
        py = w.y;
        pz = w.z;
      }
      setFatSegments(this.ySlice, flat);
    }

    this.xTan.visible = !!showTan && !!showX;
    if (this.xTan.visible && Number.isFinite(fx) && Number.isFinite(fP)) {
      const a = mathToWorld(x0 - tanLen, y0, fP - fx * tanLen, u);
      const b = mathToWorld(x0 + tanLen, y0, fP + fx * tanLen, u);
      setFatSegments(this.xTan, [a.x, a.y, a.z, b.x, b.y, b.z]);
    } else {
      setFatSegments(this.xTan, []);
    }

    this.yTan.visible = !!showTan && !!showY;
    if (this.yTan.visible && Number.isFinite(fy) && Number.isFinite(fP)) {
      const a = mathToWorld(x0, y0 - tanLen, fP - fy * tanLen, u);
      const b = mathToWorld(x0, y0 + tanLen, fP + fy * tanLen, u);
      setFatSegments(this.yTan, [a.x, a.y, a.z, b.x, b.y, b.z]);
    } else {
      setFatSegments(this.yTan, []);
    }
  }
}
