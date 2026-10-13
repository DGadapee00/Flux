import { SurfaceView } from '../scene/surface.js';
import { ContourView } from '../scene/contours.js';
import { ProbeView } from '../scene/probe.js';
import { GradArrowView } from '../scene/gradArrows.js';
import { TangentPlaneView } from '../scene/tangent.js';
import { PolarGridView } from '../scene/polarGrid.js';
import { CurveView } from '../scene/curve.js';
import { CritView } from '../scene/crits.js';
import { SliceView } from '../scene/slices.js';
import { RiemannView } from '../scene/riemann.js';
import { RegionView } from '../scene/region.js';
import { SpaceArrowsView } from '../scene/spaceArrows.js';
import { GraphBarsView } from '../scene/graphBars.js';
import { TripleBoxesView } from '../scene/tripleBoxes.js';
import { SolidView } from '../scene/solid.js';
import { SliceAreaView } from '../scene/sliceArea.js';
import { ElementView } from '../scene/element.js';
import { M } from '../scene/manim.js';

/** Lazy view pool: a lab's first visit builds what it needs; exit hides, does not dispose. */
export function createViewPool(scene) {
  const made = {};
  function once(key, fn) {
    if (!made[key]) made[key] = fn();
    return made[key];
  }

  const pool = {
    surface: () => once('surface', () => new SurfaceView(scene)),
    contours: () => once('contours', () => new ContourView(scene)),
    probe: () => once('probe', () => new ProbeView(scene)),
    arrows: () => once('arrows', () => new GradArrowView(scene)),
    tangent: () => once('tangent', () => new TangentPlaneView(scene)),
    polarGrid: () => once('polarGrid', () => new PolarGridView(scene)),
    curve: () => once('curve', () => new CurveView(scene)),
    lift: () => once('lift', () => new CurveView(scene, { color: M.gold, tanColor: M.yellow, width: 3.4 })),
    slices: () => once('slices', () => new SliceView(scene)),
    riemann: () => once('riemann', () => new RiemannView(scene)),
    region: () => once('region', () => new RegionView(scene)),
    spaceArrows: () => once('spaceArrows', () => new SpaceArrowsView(scene)),
    graphBars: () => once('graphBars', () => new GraphBarsView(scene)),
    tripleBoxes: () => once('tripleBoxes', () => new TripleBoxesView(scene)),
    solid: () => once('solid', () => new SolidView(scene)),
    sliceArea: () => once('sliceArea', () => new SliceAreaView(scene)),
    element: () => once('element', () => new ElementView(scene)),
    crits: () => once('crits', () => new CritView(scene)),
    hideAll() {
      made.surface?.setVisible(false);
      made.contours?.setVisible(false);
      made.probe?.setVisible(false);
      made.arrows?.setVisible(false);
      made.tangent?.setVisible(false);
      made.polarGrid?.setVisible(false);
      made.curve?.setVisible(false);
      made.lift?.setVisible(false);
      made.slices?.setVisible(false);
      made.riemann?.setVisible(false);
      made.region?.setVisible(false);
      made.spaceArrows?.setVisible(false);
      made.graphBars?.setVisible(false);
      made.tripleBoxes?.setVisible(false);
      made.solid?.setVisible(false);
      made.sliceArea?.setVisible(false);
      made.element?.setVisible(false);
      made.crits?.setVisible(false);
    },
  };
  return pool;
}
