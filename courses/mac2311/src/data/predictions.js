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
