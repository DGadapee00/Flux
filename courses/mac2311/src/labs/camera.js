import * as THREE from 'three';

/**
 * Camera fitting for the flat (xy) labs. The camera looks straight down -z, so a
 * content box in math units maps to the screen without tilt. Shared by every planar lab.
 */

/** Half of the scene camera's 40° vertical field of view. */
const TAN_HALF_FOV = Math.tan(Math.PI / 9);

function boxOf(sel) {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector(sel);
  if (!el) return null;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return r;
}

/**
 * The rectangle of the canvas that panels do not cover.
 * On a phone the header, chips, setup sheet, and readout leave a short band.
 */
export function plotWindow() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 380;
  const height = typeof window !== 'undefined' ? window.innerHeight : 780;
  const gap = 14;
  if (typeof document === 'undefined') {
    return { width, height, top: 260, bottom: 310, left: 12, right: 12 };
  }
  let top;
  let bottom;
  let left;
  let right;
  if (width <= 720) {
    const heads = [boxOf('.brand'), boxOf('.toggles')].filter(Boolean);
    const feet = [boxOf('.controls'), boxOf('.readout')].filter(Boolean);
    top = (heads.length ? Math.max(...heads.map((r) => r.bottom)) : 0) + gap;
    const foot = feet.length ? Math.min(...feet.map((r) => r.top)) : height;
    bottom = height - foot + gap;
    left = gap;
    right = gap;
  } else {
    const eq = boxOf('.eq-panel');
    const controls = boxOf('.controls');
    const readout = boxOf('.readout');
    left = (eq ? eq.right : 0) + gap;
    right = controls ? width - controls.left + gap : gap;
    top = gap;
    bottom = readout ? height - readout.top + gap : 80;
  }
  if (width - left - right < 80) {
    left = gap;
    right = gap;
  }
  if (height - top - bottom < 80) {
    top = height * 0.28;
    bottom = height * 0.34;
  }
  return { width, height, top, bottom, left, right };
}

/**
 * Place the camera so the content box (state.xMin..xMax, yMin..yMax, math units), grown by
 * `pad`, lands in the part of the canvas no panel covers. `state.view.upm` is the scene scale.
 */
export function fitPlaneCamera(state, view, pad = 0) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const x0 = ((Number.isFinite(state?.xMin) ? state.xMin : -0.2) - pad) * u;
  const x1 = ((Number.isFinite(state?.xMax) ? state.xMax : 1.2) + pad) * u;
  const y0 = ((Number.isFinite(state?.yMin) ? state.yMin : -0.2) - pad) * u;
  const y1 = ((Number.isFinite(state?.yMax) ? state.yMax : 1.2) + pad) * u;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const halfW = Math.max(1e-6, (x1 - x0) / 2);
  const halfH = Math.max(1e-6, (y1 - y0) / 2);
  const width = view.width;
  const height = view.height;
  const aspect = width / Math.max(1, height);
  const ndcLeft = (view.left / width) * 2 - 1;
  const ndcRight = ((width - view.right) / width) * 2 - 1;
  const ndcTop = 1 - (view.top / height) * 2;
  const ndcBottom = (2 * view.bottom) / height - 1;
  const ndcCx = (ndcLeft + ndcRight) / 2;
  const ndcCy = (ndcBottom + ndcTop) / 2;
  const roomX = Math.max(0.08, Math.min(ndcCx - ndcLeft, ndcRight - ndcCx));
  const roomY = Math.max(0.08, Math.min(ndcCy - ndcBottom, ndcTop - ndcCy));
  const z = Math.min(36, Math.max(4.5, halfW / (roomX * TAN_HALF_FOV * aspect), halfH / (roomY * TAN_HALF_FOV)));
  const tx = cx - ndcCx * z * TAN_HALF_FOV * aspect;
  const ty = cy - ndcCy * z * TAN_HALF_FOV;
  return { pos: new THREE.Vector3(tx, ty, z), target: new THREE.Vector3(tx, ty, 0), z };
}

/** Screen position of a world point under `fitPlaneCamera`, matching the 40° camera. */
export function projectArc(cam, x, y, view) {
  const aspect = view.width / Math.max(1, view.height);
  const ndcX = (x - cam.target.x) / cam.pos.z / (TAN_HALF_FOV * aspect);
  const ndcY = (y - cam.target.y) / cam.pos.z / TAN_HALF_FOV;
  return {
    ndcX,
    ndcY,
    px: ((ndcX + 1) / 2) * view.width,
    py: ((1 - ndcY) / 2) * view.height,
  };
}

/** The default camera of a planar lab: fitted to its content box, with a small margin. */
export function planeFit(state) {
  const c = fitPlaneCamera(state, plotWindow());
  return { pos: c.pos, target: c.target };
}
