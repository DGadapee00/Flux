/**
 * Small helpers the application labs (railgun, thruster, cyclotron, power lines, motor, MRI)
 * share: a scene label, an SI-prefixed number, and a cloud of round particles.
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/** An HTML label pinned to a point in the scene. */
export function label(html, x, y, z, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  return o;
}

/** 3 significant figures with an SI prefix: 439 kN, 2.64 MJ, 7.39 ms. */
export function si(x, unit) {
  if (!Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  const P = [
    [1e9, 'G'],
    [1e6, 'M'],
    [1e3, 'k'],
    [1, ''],
    [1e-3, 'm'],
    [1e-6, 'μ'],
    [1e-9, 'n'],
  ];
  const [k, p] = P.find(([k]) => a >= k * 0.9995) || P[P.length - 1];
  return `${Number((x / k).toPrecision(3))} ${p}${unit}`;
}

let dotTex = null;
/** A soft round dot, so particles are not squares. */
function roundDot() {
  if (dotTex || typeof document === 'undefined') return dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.95)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

/** n particles drawn as round dots of a fixed pixel size; positions are set every frame. */
export function points(n, color, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ color, size, map: roundDot(), sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}
