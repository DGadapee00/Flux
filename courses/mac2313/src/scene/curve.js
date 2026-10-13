import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const N = 256;
const TAN_CAP = 1;

/**
 * A parametric curve on the floor, plus a tangent segment through γ(t).
 * Point count is fixed; Line2 cannot grow.
 */
export class CurveView {
  constructor(scene, { color = M.teal, tanColor = M.yellow, width = 3.2 } = {}) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.curve = fatSegments(segmentCapacity(N - 1), { color, width, opacity: 0.95 });
    this.tan = fatSegments(segmentCapacity(TAN_CAP), { color: tanColor, width: 2.4, opacity: 0.9 });
    this.group.add(this.curve, this.tan);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /**
   * Optional `z(s)` lifts the curve off the floor (graph of f along γ). Optional `zp` is the
   * vertical component of the tangent; omit both to stay on z = 0.
   */
  sync({ x, y, z, t0, t1, t, xp, yp, zp, showCurve = true, showTan = true, tanLen = 0.8 }) {
    const u = sceneScale();
    const height = z || (() => 0);
    const hz = Number.isFinite(zp) ? zp : 0;
    const onFloor = !z;
    this.curve.visible = !!showCurve;
    this.tan.visible = !!showTan;
    if (showCurve) {
      const flat = [];
      let px;
      let py;
      let pz;
      for (let i = 0; i < N; i++) {
        const s = t0 + ((t1 - t0) * i) / (N - 1);
        const w = mathToWorld(x(s), y(s), height(s), u);
        if (!Number.isFinite(w.x) || !Number.isFinite(w.y) || !Number.isFinite(w.z)) {
          px = undefined;
          continue;
        }
        if (i && px !== undefined) flat.push(px, py, pz, w.x, w.y, w.z);
        px = w.x;
        py = w.y;
        pz = w.z;
      }
      setFatSegments(this.curve, flat);
    }
    if (showTan && Number.isFinite(xp) && Number.isFinite(yp)) {
      const speed = Math.hypot(xp, yp, hz);
      if (speed < 1e-10) {
        setFatSegments(this.tan, []);
        return;
      }
      const ux = xp / speed;
      const uy = yp / speed;
      const uz = hz / speed;
      const gx = x(t);
      const gy = y(t);
      const gz = height(t);
      const a = mathToWorld(gx - tanLen * ux, gy - tanLen * uy, gz - tanLen * uz, u);
      const b = mathToWorld(gx + tanLen * ux, gy + tanLen * uy, gz + tanLen * uz, u);
      const lift = onFloor ? 0.012 * u : 0;
      setFatSegments(this.tan, [a.x, a.y + lift, a.z, b.x, b.y + lift, b.z]);
    } else if (showTan) {
      setFatSegments(this.tan, []);
    }
  }
}
