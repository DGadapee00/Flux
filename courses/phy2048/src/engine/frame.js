import { configureFrame } from '@flux/core/scene3d/frame.js';

function lenLabel(m) {
  const a = Math.abs(m);
  if (a < 1e-12) return '0';
  const digits = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  return `${Number(m.toFixed(digits))} m`;
}

// Mechanics works in the vertical plane, one scene unit to the metre.
configureFrame({
  upm: 1,
  plane: 'xy',
  planes: ['xy'],
  lenLabel,
  gridScale: 1,
});

export { defaultView, sceneScale, setFrame, workPlane } from '@flux/core/scene3d/frame.js';
