import * as THREE from 'three';
import { worldToMath, workPlane } from '../engine/frame.js';

/** A click on the floor (not a drag) reports the math point. Orbit still owns the drag. */
export function clickPicker(onPick) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const plane = new THREE.Plane();
  let down = null;

  function setNDC(e, canvas) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
  }

  return {
    down(e) {
      down = { x: e.clientX, y: e.clientY, moved: false };
    },
    move(e) {
      if (!down) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
    },
    up(e, ctx) {
      if (!down || down.moved) {
        down = null;
        return;
      }
      down = null;
      setNDC(e, ctx.canvas);
      raycaster.setFromCamera(ndc, ctx.camera);
      if (workPlane() === 'xy') {
        normal.set(0, 0, 1);
        plane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(0, 0, 0));
      } else {
        normal.set(0, 1, 0);
        plane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(0, 0, 0));
      }
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      onPick(ctx.state, worldToMath(hit.x, hit.y, hit.z), ctx.bump);
    },
  };
}
