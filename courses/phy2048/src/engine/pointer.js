import * as THREE from 'three';

/**
 * Dragging in a lab. A lab that wants it has a `pointer` with `down`, `move` and `up`. `down` returns
 * true when it picked something up; from then on `move` and `up` follow the pointer, and the orbit
 * controls stay out of the way. The lab gets `pick(e, objects)` to ray-cast against its own meshes and
 * `onPlane(e)` to read where the pointer is on the z = 0 plane (the plane the flat labs are drawn in).
 */
export function createLabPointer({ canvas, camera, controls, getLab, getHandle, getState, bump }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  let dragging = false;

  const aim = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
  };

  const ctx = {
    drag: null,
    get handle() {
      return getHandle();
    },
    get state() {
      return getState();
    },
    bump,
    pick(e, objects) {
      aim(e);
      return raycaster.intersectObjects(objects, false);
    },
    onPlane(e) {
      aim(e);
      return raycaster.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null;
    },
  };

  canvas.addEventListener('pointerdown', (e) => {
    const lab = getLab();
    if (!lab?.pointer || !ctx.handle) return;
    if (lab.pointer.down(e, ctx)) {
      dragging = true;
      controls.enabled = false;
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) getLab()?.pointer.move(e, ctx);
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    controls.enabled = true;
    getLab()?.pointer.up(e, ctx);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    get dragging() {
      return dragging;
    },
  };
}
