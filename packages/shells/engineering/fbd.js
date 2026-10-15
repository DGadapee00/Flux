/**
 * Free-body drawing for an engineering course: a body, its supports, force arrows,
 * and the N, V and M on a cut face.
 *
 * Positive senses are arguments. The defaults match the beam picture already on screen:
 * positive shear points down, positive axial force points away from the kept segment,
 * and a positive moment is counterclockwise.
 */
import * as THREE from 'three';
import { Arrow } from '@flux/core/scene3d/manim.js';

/**
 * @param {THREE.Vector3} dir
 * @param {number} color
 * @param {number} [shaft]
 * @param {number} [headLength]
 * @param {number} [headWidth]
 */
export function forceArrow(dir, color, shaft = 0.035, headLength = 0.24, headWidth = 0.18) {
  return new Arrow(dir, new THREE.Vector3(), 1, color, headLength, headWidth, shaft);
}

/** Pin support: a triangle under the joint. */
export function pinGlyph(color) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.2, -0.32, 0),
    new THREE.Vector3(0.2, -0.32, 0),
  ]);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide }));
}

/** Roller: a disc under the joint. */
export function rollerGlyph(color) {
  return new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
}

/** Ring drawn on a member at a pin or a contact. */
export function pinRing(color) {
  return new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.14, 24),
    new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
}

/**
 * Hatched wall for a fixed support. `y` is the member's height.
 * @param {number} x
 * @param {number} y
 * @returns {number[]}
 */
export function fixedWallSegments(x, y) {
  const wall = [x, y - 0.6, 0, x, y + 0.6, 0];
  for (let i = 0; i < 5; i++) {
    const yy = y - 0.55 + i * 0.27;
    wall.push(x, yy, 0, x - 0.2, yy - 0.18, 0);
  }
  return wall;
}

/**
 * Hatched ground under a pinned joint. `y` is the joint.
 * @param {number} x
 * @param {number} y
 * @returns {number[]}
 */
export function pinnedGroundSegments(x, y) {
  const base = y - 0.34;
  const g = [x, y, 0, x - 0.22, base, 0, x, y, 0, x + 0.22, base, 0, x - 0.34, base, 0, x + 0.34, base, 0];
  for (let k = 0; k < 4; k++) g.push(x - 0.3 + k * 0.18, base, 0, x - 0.42 + k * 0.18, base - 0.14, 0);
  return g;
}

/**
 * Segment pairs through `points`, for a member or a cable.
 * @param {{ x: number, y: number, z?: number }[]} points
 * @returns {number[]}
 */
export function segmentPairs(points) {
  const seg = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    seg.push(a.x, a.y, a.z || 0, b.x, b.y, b.z || 0);
  }
  return seg;
}

/**
 * Point `arrow` from `from` to `to`. Hidden when the two points coincide.
 * @param {Arrow} arrow
 * @param {THREE.Vector3} from
 * @param {THREE.Vector3} to
 */
export function aimArrow(arrow, from, to) {
  const d = to.clone().sub(from);
  const len = d.length();
  arrow.visible = len > 1e-4;
  if (!arrow.visible) return false;
  arrow.position.copy(from);
  arrow.setDirection(d.normalize());
  arrow.setLength(len);
  return true;
}

/**
 * Arrow that ends at `at`, pushing along `(fx, fy)`.
 * Length is `max(minLength, |F| * scale)`.
 * @returns {{ len: number, dir: THREE.Vector3 } | null}
 */
export function placeIncomingArrow(arrow, at, fx, fy, { scale = 1, minLength = 0.3, gap = 0.1 } = {}) {
  const m = Math.hypot(fx, fy);
  if (m < 1e-9 || !Number.isFinite(m)) {
    arrow.visible = false;
    return null;
  }
  const len = Math.max(minLength, m * scale);
  const dir = new THREE.Vector3(fx, fy, 0).normalize();
  arrow.visible = true;
  arrow.position.copy(at).addScaledVector(dir, -len - gap);
  arrow.setDirection(dir);
  arrow.setLength(len);
  return { len, dir };
}

/**
 * Arrow that starts at `origin` and runs along `direction` for `length`.
 * @param {Arrow} arrow
 * @param {THREE.Vector3} origin
 * @param {THREE.Vector3} direction
 * @param {number} length
 */
export function placeOutgoingArrow(arrow, origin, direction, length) {
  arrow.visible = true;
  arrow.position.copy(origin);
  arrow.setDirection(direction.clone().normalize());
  arrow.setLength(length);
}

/** Arc of `sweep` radians around `c`, as flat segment pairs. */
export function arcSegments(c, r, start, sweep, n = 32) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = start + (sweep * i) / n;
    const a1 = start + (sweep * (i + 1)) / n;
    out.push(c.x + r * Math.cos(a0), c.y + r * Math.sin(a0), c.z, c.x + r * Math.cos(a1), c.y + r * Math.sin(a1), c.z);
  }
  return out;
}

/**
 * A curled arrow around `c`. `sign` +1 is counterclockwise.
 * Moves `head` onto the tip and returns the arc.
 * @param {Arrow} head
 * @param {THREE.Vector3} c
 * @param {number} r
 * @param {number} sign
 */
export function coupleCurl(head, c, r, sign) {
  const sweep = sign * 1.4 * Math.PI;
  const start = Math.PI / 2 - sweep / 2;
  const endA = start + sweep;
  const end = new THREE.Vector3(c.x + r * Math.cos(endA), c.y + r * Math.sin(endA), c.z);
  const tangent = new THREE.Vector3(-Math.sin(endA), Math.cos(endA), 0).multiplyScalar(sign);
  head.visible = true;
  head.position.copy(end).addScaledVector(tangent, -0.22);
  head.setDirection(tangent);
  head.setLength(0.22, 0.2, 0.16);
  return arcSegments(c, r, start, sweep * 0.9, 36);
}

/**
 * N, V and M on a cut face.
 * Defaults: positive V down, positive N away (+x), positive M counterclockwise.
 * @param {object} spec
 * @param {boolean} spec.show
 * @param {Arrow} spec.cutV
 * @param {Arrow} spec.cutN
 * @param {Arrow} spec.momentHead
 * @param {THREE.Vector3} spec.face
 * @param {number} spec.N
 * @param {number} spec.V
 * @param {number} spec.M
 * @param {boolean} [spec.vPositiveDown]
 * @param {boolean} [spec.nPositiveAway]
 * @param {boolean} [spec.mPositiveCcw]
 * @returns {number[]} Moment arc, empty when it is not drawn.
 */
export function applyCutFace(spec) {
  const { cutV, cutN, momentHead, face, N, V, M } = spec;
  const vPositiveDown = spec.vPositiveDown !== false;
  const nPositiveAway = spec.nPositiveAway !== false;
  const mPositiveCcw = spec.mPositiveCcw !== false;
  cutV.visible = false;
  cutN.visible = false;
  if (momentHead) momentHead.visible = false;
  if (!spec.show) return [];
  if (Math.abs(V) > 1e-9) {
    const down = vPositiveDown ? V > 0 : V < 0;
    aimArrow(
      cutV,
      face.clone().add(new THREE.Vector3(0.12, down ? 0.75 : -0.75, 0)),
      face.clone().add(new THREE.Vector3(0.12, 0, 0)),
    );
  }
  if (Math.abs(N) > 1e-9) {
    const away = nPositiveAway ? N > 0 : N < 0;
    aimArrow(cutN, face, face.clone().add(new THREE.Vector3(away ? 0.7 : -0.7, 0, 0)));
  }
  if (momentHead && Math.abs(M) > 1e-9) {
    const sign = (mPositiveCcw ? 1 : -1) * Math.sign(M);
    return coupleCurl(momentHead, face, 0.38, sign);
  }
  return [];
}
