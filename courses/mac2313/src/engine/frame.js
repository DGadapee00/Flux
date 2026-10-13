import { configureFrame } from '@flux/core/scene3d/frame.js';
import { fitScale, unitsPerTick } from '@flux/subjects/math/scale.js';

const FIN = (v) => (Number.isFinite(v) ? Math.abs(v) : 0);

function lenLabel(u) {
  const a = Math.abs(u);
  if (a < 1e-12) return '0';
  if (a >= 100) return String(Number(u.toFixed(0)));
  if (a >= 10) return String(Number(u.toFixed(1)));
  if (a >= 0.01) return String(Number(u.toFixed(2)));
  return Number(u).toExponential(2);
}

function coordUnit(scale) {
  const square = 1 / scale;
  return { unit: '', per: 1, step: Number((square / 2).toPrecision(3)) };
}

function contentExtent(state) {
  let m = 0;
  if (state?.probe) m = Math.max(m, FIN(state.probe.x), FIN(state.probe.y), FIN(state.probe.z));
  m = Math.max(m, FIN(state?.xMin), FIN(state?.xMax), FIN(state?.yMin), FIN(state?.yMax));
  return m;
}

configureFrame({
  upm: 1,
  plane: 'xyfloor',
  planes: ['xy', 'xz', 'xyfloor'],
  lenLabel,
  coordUnit,
  contentExtent,
  fitScale,
  gridScale: 1,
  nearLabels: false,
  hideOffPlane: true,
  labelStyle: 'math',
});

export { unitsPerTick };
export * from '@flux/core/scene3d/frame.js';
