import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { VectorBatch } from './arrows.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

function worldDelta(vx, vy, vz, u) {
  const a = mathToWorld(0, 0, 0, u);
  const b = mathToWorld(vx, vy, vz, u);
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}

/**
 * Up to four math-space arrows (xyfloor: math (x,y,z) → world (x, z_up, y)),
 * plus an optional parallelogram on the floor of the two spanning vectors.
 */
export class SpaceArrowsView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.u = new VectorBatch(this.group, M.yellow);
    this.v = new VectorBatch(this.group, M.teal);
    this.sum = new VectorBatch(this.group, M.white);
    this.cr = new VectorBatch(this.group, M.red);
    this.para = fatSegments(segmentCapacity(4), { color: M.gold, width: 1.8, opacity: 0.75 });
    this.group.add(this.para);
  }

  setVisible(vis) {
    this.group.visible = vis;
  }

  _push(batch, from, vec, show, scaleLen = 1) {
    batch.begin();
    if (show && vec) {
      const u = sceneScale();
      const foot = mathToWorld(from.x, from.y, from.z, u);
      _o.set(foot.x, foot.y, foot.z);
      const w = worldDelta(vec.x, vec.y, vec.z, u);
      const L0 = Math.hypot(w.x, w.y, w.z);
      if (L0 > 1e-8) {
        _d.set(w.x / L0, w.y / L0, w.z / L0);
        batch.push(_o, _d, L0 * scaleLen, null);
      }
    }
    batch.end(!!show);
  }

  sync({
    origin = { x: 0, y: 0, z: 0 },
    u,
    v,
    sum,
    cr,
    showU = true,
    showV = true,
    showSum = false,
    showCross = false,
    showPara = false,
  }) {
    this._push(this.u, origin, u, showU);
    this._push(this.v, origin, v, showV);
    this._push(this.sum, origin, sum, showSum);
    this._push(this.cr, origin, cr, showCross);
    const sc = sceneScale();
    if (showPara && u && v) {
      const o = mathToWorld(origin.x, origin.y, origin.z, sc);
      const A = mathToWorld(origin.x + u.x, origin.y + u.y, origin.z + u.z, sc);
      const B = mathToWorld(origin.x + u.x + v.x, origin.y + u.y + v.y, origin.z + u.z + v.z, sc);
      const C = mathToWorld(origin.x + v.x, origin.y + v.y, origin.z + v.z, sc);
      setFatSegments(this.para, [
        o.x, o.y, o.z, A.x, A.y, A.z,
        A.x, A.y, A.z, B.x, B.y, B.z,
        B.x, B.y, B.z, C.x, C.y, C.z,
        C.x, C.y, C.z, o.x, o.y, o.z,
      ]);
      this.para.visible = true;
    } else {
      setFatSegments(this.para, []);
      this.para.visible = false;
    }
  }
}
