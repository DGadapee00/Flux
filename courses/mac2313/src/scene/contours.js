import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, rampColor, M } from './manim.js';

/**
 * Level curves of f on the domain, drawn on the floor.
 *
 * Marching squares emits a variable segment count per frame, and Line2 buffers cannot grow after
 * the first draw. Each level is therefore built once at SEG_CAP segments; unused tail is zeroed.
 * Cells are walked in row-major order so the same contour does not reshuffle between frames.
 * Overflow: drop the tail, do not reallocate.
 */
const GRID = 40;
const LEVELS = 8;
const SEG_CAP = 256; // segments per level

const EDGE = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

export class ContourView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lines = [];
    this._c = new THREE.Color();
    for (let k = 0; k < LEVELS; k++) {
      const t = LEVELS === 1 ? 0.5 : k / (LEVELS - 1);
      rampColor(t, this._c);
      const line = fatSegments(segmentCapacity(SEG_CAP), {
        color: this._c.getHex(),
        width: 2,
        opacity: 0.9,
      });
      this.group.add(line);
      this.lines.push(line);
    }
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, xMin, xMax, yMin, yMax, show }) {
    this.group.visible = !!show;
    if (!show) return;
    const u = sceneScale();
    const nx = GRID;
    const ny = GRID;
    const vals = new Float64Array((nx + 1) * (ny + 1));
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j <= ny; j++) {
      const y = yMin + (j / ny) * (yMax - yMin);
      for (let i = 0; i <= nx; i++) {
        const x = xMin + (i / nx) * (xMax - xMin);
        const v = f(x, y);
        vals[j * (nx + 1) + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (hi - lo < 1e-12) {
      for (const line of this.lines) line.material.opacity = 0;
      return;
    }
    for (let k = 0; k < LEVELS; k++) {
      const level = lo + ((k + 0.5) / LEVELS) * (hi - lo);
      const flat = [];
      for (let j = 0; j < ny && flat.length / 6 < SEG_CAP; j++) {
        const y0 = yMin + (j / ny) * (yMax - yMin);
        const y1 = yMin + ((j + 1) / ny) * (yMax - yMin);
        for (let i = 0; i < nx && flat.length / 6 < SEG_CAP; i++) {
          const x0 = xMin + (i / nx) * (xMax - xMin);
          const x1 = xMin + ((i + 1) / nx) * (xMax - xMin);
          const v = [
            vals[j * (nx + 1) + i],
            vals[j * (nx + 1) + (i + 1)],
            vals[(j + 1) * (nx + 1) + (i + 1)],
            vals[(j + 1) * (nx + 1) + i],
          ];
          const corners = [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
          ];
          const pts = [];
          for (const [a, b] of EDGE) {
            const va = v[a] - level;
            const vb = v[b] - level;
            if (va === 0 && vb === 0) continue;
            if (va * vb <= 0) {
              const t = va === 0 ? 0 : va / (va - vb);
              const x = corners[a][0] + t * (corners[b][0] - corners[a][0]);
              const y = corners[a][1] + t * (corners[b][1] - corners[a][1]);
              pts.push([x, y]);
            }
          }
          // One segment per cell when the level cuts two edges (the usual case).
          if (pts.length >= 2) {
            const a = mathToWorld(pts[0][0], pts[0][1], 0, u);
            const b = mathToWorld(pts[1][0], pts[1][1], 0, u);
            flat.push(a.x, a.y + 0.012 * u, a.z, b.x, b.y + 0.012 * u, b.z);
          }
        }
      }
      this.lines[k].material.opacity = 0.9;
      setFatSegments(this.lines[k], flat);
    }
  }
}

void M;
