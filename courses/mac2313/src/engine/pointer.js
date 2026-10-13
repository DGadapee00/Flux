import * as THREE from 'three';
import { sceneScale, workPlane, PLANE_AXES, GRID_HALF, FIT_MAX, snapStep, snapTo, worldToMath, mathToWorld } from './frame.js';

/**
 * Drag the probe in the lab's work plane. Positions snap to half a grid square; hold Alt to
 * place freely. Shift moves along the out-of-plane axis (height on an xyfloor graph).
 *
 * xyfloor: the domain is the floor. Math (x, y) maps to world (x, 0, y); height is world y.
 */
export function createChargePointer({ camera, controls, canvas, getState, getPool, getHandle, getLab, bump }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  let drag = null;
  let down = null;
  const proj = new THREE.Vector3();

  /*
   * Is the pointer actually on the probe handle?
   *
   * This used to be `if (state.probe)` — true in every lab that has a probe at all, which is most
   * of them — so any left-press anywhere on the canvas grabbed P and switched OrbitControls off.
   * Dragging empty space moved the probe instead of rotating the view, and the camera could not be
   * orbited by mouse at all. Screen-space distance rather than a raycast against the handle: the
   * dot is a few pixels wide, and a near miss should still grab it.
   */
  const GRAB_PX = 24;
  function onProbe(e, state) {
    if (!state.probe) return false;
    const w = mathToWorld(state.probe.x, state.probe.y, state.probe.z, sceneScale());
    proj.set(w.x, w.y, w.z);
    if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y) || !Number.isFinite(proj.z)) return false;
    proj.project(camera);
    if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y) || proj.z > 1) return false;
    const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
    return Math.hypot(e.clientX - sx, e.clientY - sy) <= GRAB_PX;
  }

  function setPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function clampPos(p) {
    const lim = (FIT_MAX - 0.05) / sceneScale();
    const fix = (v) => (Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
    p.x = fix(p.x);
    p.y = fix(p.y);
    p.z = fix(p.z);
  }

  const HIT_LIMIT = 3 * GRID_HALF;
  function usableHit() {
    return (
      Number.isFinite(hit.x) &&
      Number.isFinite(hit.y) &&
      Number.isFinite(hit.z) &&
      Math.abs(hit.x) <= HIT_LIMIT &&
      Math.abs(hit.y) <= HIT_LIMIT &&
      Math.abs(hit.z) <= HIT_LIMIT
    );
  }

  function dragPlane(point, out) {
    const u = sceneScale();
    const wp = workPlane();
    if (wp === 'xyfloor') {
      // Floor (world y = 0) or a vertical plane for Shift-height.
      if (out) {
        nrm.set(0, 0, 1);
        plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, 0, point.y * u));
      } else {
        nrm.set(0, 1, 0);
        plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, 0, 0));
      }
      return out ? ['z'] : ['x', 'y'];
    }
    const P = PLANE_AXES[wp] || PLANE_AXES.xz;
    const axes = out ? [P.axes[0], P.off] : P.axes;
    const fixed = out ? P.axes[1] : P.off;
    nrm.set(fixed === 'x' ? 1 : 0, fixed === 'y' ? 1 : 0, fixed === 'z' ? 1 : 0);
    const at = new THREE.Vector3(
      fixed === 'x' ? point.x * u : 0,
      fixed === 'y' ? point.y * u : 0,
      fixed === 'z' ? point.z * u : 0,
    );
    plane.setFromNormalAndCoplanarPoint(nrm, at);
    return axes;
  }

  function place(target, axes, free) {
    const step = free ? 0 : snapStep();
    const wp = workPlane();
    if (wp === 'xyfloor') {
      const m = worldToMath(hit.x, hit.y, hit.z);
      if (axes.includes('x')) target.x = snapTo(m.x, step);
      if (axes.includes('y')) target.y = snapTo(m.y, step);
      if (axes.includes('z')) target.z = snapTo(m.z, step);
    } else {
      const u = sceneScale();
      const p = { x: hit.x / u, y: hit.y / u, z: hit.z / u };
      for (const a of axes) target[a] = snapTo(p[a], step);
    }
    clampPos(target);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const state = getState();
    const custom = getLab?.()?.pointer;
    if (custom?.down) {
      custom.down(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool: getPool() });
      return;
    }
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    down = { x: e.clientX, y: e.clientY, moved: false };
    if (onProbe(e, state)) {
      // Grabbing the handle: take the drag and hand the camera back on pointerup.
      drag = { shift: e.shiftKey };
      controls.enabled = false;
    }
    // Anywhere else the press belongs to OrbitControls, and a press that never moves still places
    // the probe on pointerup below.
  });

  window.addEventListener('pointermove', (e) => {
    const state = getState();
    const custom = getLab?.()?.pointer;
    if (custom?.move) {
      custom.move(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool: getPool() });
      return;
    }
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
    if (!drag || !state.probe) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const axes = dragPlane(state.probe, drag.shift || e.shiftKey);
    if (raycaster.ray.intersectPlane(plane, hit) && usableHit()) {
      place(state.probe, axes, e.altKey);
      state.dirty = true;
    }
  });

  window.addEventListener('pointerup', (e) => {
    const state = getState();
    const custom = getLab?.()?.pointer;
    if (custom?.up) {
      custom.up(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool: getPool() });
      down = null;
      if (drag) {
        drag = null;
        controls.enabled = true;
      }
      return;
    }
    const allowProbe = !!getLab?.()?.probe && !!state.probe;
    if (down && !down.moved && allowProbe) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const axes = dragPlane(state.probe, false);
      if (raycaster.ray.intersectPlane(plane, hit) && usableHit()) {
        place(state.probe, axes, e.altKey);
        state.dirty = true;
      }
    }
    down = null;
    if (drag) {
      drag = null;
      controls.enabled = true;
    }
  });

  return {
    get dragging() {
      return !!drag;
    },
  };
}
