const watch = (id, label, get, mode = 'factor') => ({ id, label, get, mode });
export const PREDICTIONS = {
  limits: [
    {
      id: 'hole-limit',
      scenario: 'hole',
      ask: 'Keep the hole at a=1. Halve the sampling distance h. Does the limit change?',
      prep: (s) => {
        s.a = 1;
        s.h = 0.4;
      },
      apply: (s) => {
        s.h /= 2;
      },
      watch: [watch('L', 'Limit', (c) => c.limit, 'trend')],
      expect: { L: 'same' },
      why: 'The limit describes arbitrarily nearby inputs. Moving two samples closer does not change that target.',
    },
    {
      id: 'jump-persists',
      scenario: 'jump',
      ask: 'Shrink h by a factor of ten at a jump. Will the one-sided limits now agree?',
      prep: (s) => {
        s.a = 0;
        s.h = 0.5;
        s.leftValue = 2;
        s.rightValue = 4;
      },
      apply: (s) => {
        s.h /= 10;
      },
      watch: [watch('agree', 'Sides agree', (c) => c.left === c.right, 'bool')],
      expect: { agree: false },
      why: 'A jump is a disagreement between limiting heights, not a sampling-resolution error.',
    },
  ],
  secant: [
    {
      id: 'secant-error',
      scenario: 'quad',
      ask: 'For x² at x=1, halve h. What happens to the secant’s error, rather than the whole slope?',
      prep: (s) => {
        s.graphId = 'quad';
        s.x0 = 1;
        s.h = 0.8;
      },
      apply: (s) => {
        s.h /= 2;
      },
      watch: [watch('error', 'Slope error', (c) => c.msec - c.fp)],
      expect: { error: 0.5 },
      why: 'The quotient is 2x+h. Its error is h, although the derivative 2x stays fixed.',
    },
    {
      id: 'corner',
      scenario: 'abs',
      ask: 'At the corner of |x|, make h four times smaller. Do the left and right derivatives agree?',
      prep: (s) => {
        s.graphId = 'abs';
        s.x0 = 0;
        s.h = 0.4;
      },
      apply: (s) => {
        s.h /= 4;
      },
      watch: [watch('agree', 'One-sided slopes agree', (c) => Math.abs(c.left - c.right) < 0.01, 'bool')],
      expect: { agree: false },
      why: 'Continuity does not remove a corner. The limiting slopes remain −1 and +1.',
    },
  ],
  focus: [
    {
      id: 'focus-sensitivity',
      scenario: 'close',
      ask: 'Move the object from 450 to 850 mm with f=50 mm. What happens to the magnitude of focus sensitivity?',
      apply: (s) => {
        s.u = 2 * s.u - s.f;
      },
      watch: [watch('sensitivity', '|dv/du|', (c) => c.sensitivity)],
      expect: { sensitivity: 0.25 },
      why: 'The distance u−f doubles. Its square is in the denominator, so sensitivity becomes one quarter.',
    },
    {
      id: 'focus-distance',
      scenario: 'portrait',
      ask: 'Double the distance to a subject at 1 m. Does the lens-to-sensor distance double, stay exactly fixed, or get smaller?',
      apply: (s) => {
        s.u *= 2;
      },
      watch: [watch('v', 'Image distance', (c) => c.v, 'trend')],
      expect: { v: 'smaller' },
      why: 'v=f+f²/(u−f). The image approaches the focal plane as the subject recedes; it does not follow the subject outward.',
    },
  ],
};
export const predictionsFor = (id) => PREDICTIONS[id] || [];

PREDICTIONS.rates = [
  {
    id: 'near-floor',
    scenario: 'mid',
    ask: 'The base keeps the same speed. Move it from 6 to 8 ft out on a 10 ft ladder. Does the top keep the same speed?',
    apply: (s) => {
      s.x = 8;
    },
    watch: [{ id: 'top', label: 'Top speed magnitude', get: (c) => c.dy, mode: 'trend' }],
    expect: { top: 'bigger' },
    why: 'The constraint gives |y′|=(x/y)|x′|. The horizontal-to-vertical ratio grows as the ladder flattens.',
  },
  {
    id: 'base-speed',
    scenario: 'mid',
    prep: (s) => {
      s.v = 1;
    },
    ask: 'At the same position, double the base speed. What happens to the top’s speed?',
    apply: (s) => {
      s.v *= 2;
    },
    watch: [{ id: 'top', label: 'Top speed magnitude', get: (c) => c.dy, mode: 'factor' }],
    expect: { top: 2 },
    why: 'Position fixes x/y. The instantaneous relation is linear in the base speed, even though it is nonlinear in position.',
  },
];
PREDICTIONS.box = [
  {
    id: 'deeper-cut',
    scenario: 'short',
    ask: 'Raise the cut from 1 to 4 inches on a 12 inch sheet. Does the taller box hold more?',
    apply: (s) => {
      s.x = 4;
    },
    watch: [{ id: 'volume', label: 'Volume', get: (c) => c.v, mode: 'trend' }],
    expect: { volume: 'smaller' },
    why: 'The height quadruples, but both base dimensions shrink. Volume drops from 100 to 64 cubic inches.',
  },
  {
    id: 'scale-sheet',
    scenario: 'short',
    ask: 'Double the sheet side and the cut. How does volume scale?',
    apply: (s) => {
      s.side *= 2;
      s.x *= 2;
    },
    watch: [{ id: 'volume', label: 'Volume', get: (c) => c.v, mode: 'factor' }],
    factors: [8, 4, 2, 1, 0.5],
    expect: { volume: 8 },
    why: 'All three lengths double. Their product is eight times as large.',
  },
];
PREDICTIONS.can = [
  {
    id: 'radius-height',
    scenario: 'closed',
    ask: 'Hold capacity fixed and double the radius. Does height halve or quarter?',
    apply: (s) => {
      s.r *= 2;
    },
    watch: [{ id: 'height', label: 'Height', get: (c) => c.h, mode: 'factor' }],
    expect: { height: 0.25 },
    why: 'The circular cross-section grows by four. Fixed volume requires one quarter of the height.',
  },
  {
    id: 'remove-lid',
    scenario: 'closed',
    ask: 'Remove the lid, then redesign for least area at the same volume. Is the new optimum taller or shorter?',
    apply: (s) => {
      s.k = 1;
    },
    watch: [{ id: 'height', label: 'Optimal height', get: (c) => c.optH, mode: 'trend' }],
    expect: { height: 'smaller' },
    why: 'Removing a circular end allows a larger optimal radius. The optimum changes from h=2r to h=r, so its height decreases despite the larger radius.',
  },
];
