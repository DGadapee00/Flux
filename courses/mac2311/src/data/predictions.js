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

PREDICTIONS.riemann = [
  {
    id: 'endpoint-switch',
    scenario: 'quad',
    prep: (s) => {
      s.sample = 'left';
      s.n = 4;
    },
    ask: 'Keep four intervals for x² on [0,1], but switch left endpoints to right endpoints. Does the estimate stay the same?',
    apply: (s) => {
      s.sample = 'right';
    },
    watch: [{ id: 'sum', label: 'Sum', get: (c) => c.sum, mode: 'trend' }],
    expect: { sum: 'bigger' },
    why: 'Each right endpoint has a larger height on an increasing curve. The number and widths of rectangles stay fixed.',
  },
  {
    id: 'midpoint-error',
    scenario: 'quad',
    prep: (s) => {
      s.sample = 'mid';
      s.n = 4;
    },
    ask: 'Double the midpoint panels for x². What happens to the approximation error?',
    apply: (s) => {
      s.n *= 2;
    },
    watch: [{ id: 'error', label: 'Error magnitude', get: (c) => c.err, mode: 'factor' }],
    expect: { error: 0.25 },
    why: 'For this quadratic, the midpoint error is proportional to 1/n². Twice as many panels gives one quarter of the error.',
  },
];
PREDICTIONS.accum = [
  {
    id: 'quadratic-volume',
    scenario: 'quad',
    prep: (s) => {
      s.x = 1;
      s.a = 0;
    },
    ask: 'Move the upper limit of the x² accumulation from one to two. Does the accumulated value quadruple or grow eightfold?',
    apply: (s) => {
      s.x = 2;
    },
    watch: [{ id: 'area', label: 'Accumulated integral', get: (c) => c.area, mode: 'factor' }],
    factors: [8, 4, 2, 1],
    expect: { area: 8 },
    why: 'The integral from zero is x³/3. Both the integration width and the growing height matter.',
  },
  {
    id: 'declining-rate',
    scenario: 'sine',
    prep: (s) => {
      s.x = Math.PI / 2;
      s.a = 0;
    },
    ask: 'Move from π/2 to π under sin x. The current height falls to zero. Does the accumulated integral fall too?',
    apply: (s) => {
      s.x = Math.PI;
    },
    watch: [{ id: 'area', label: 'Accumulated integral', get: (c) => c.area, mode: 'trend' }],
    expect: { area: 'bigger' },
    why: 'The integrand remains positive, so the accumulated total keeps increasing even while its slope decreases.',
  },
];
PREDICTIONS.solids = [
  {
    id: 'partition-not-volume',
    scenario: 'disks',
    prep: (s) => {
      s.n = 6;
    },
    ask: 'Double the number of drawn slices without changing the solid. What happens to its exact volume?',
    apply: (s) => {
      s.n *= 2;
    },
    watch: [{ id: 'volume', label: 'Exact volume', get: (c) => c.disk, mode: 'factor' }],
    expect: { volume: 1 },
    why: 'The slicing is a representation. The integration domain and the solid remain the same.',
  },
  {
    id: 'endpoint-scale',
    scenario: 'both',
    prep: (s) => {
      s.b = 2;
    },
    ask: 'Double b from two to four under y=√x, rotating about the x-axis. Is the volume doubled, quadrupled, or eightfold?',
    apply: (s) => {
      s.b *= 2;
    },
    watch: [{ id: 'volume', label: 'Volume', get: (c) => c.disk, mode: 'factor' }],
    factors: [8, 4, 2, 1],
    expect: { volume: 4 },
    why: 'Disk area is πx. Integrating to b gives πb²/2. Doubling b does not double every length of the solid.',
  },
];
PREDICTIONS.numint = [
  {
    id: 'trap-refine',
    scenario: 'coarse',
    ask: 'For the sine integral, double trapezoidal panels from four to eight. Approximately how does its error change?',
    apply: (s) => {
      s.n *= 2;
    },
    watch: [{ id: 'error', label: 'Trapezoidal error', get: (c) => c.trapErr, mode: 'factor' }],
    tol: 0.02,
    expect: { error: 0.25 },
    why: 'For a smooth integrand, trapezoidal error is second order in panel width. The quarter factor is an asymptotic estimate, not an exact identity.',
  },
  {
    id: 'simpson-refine',
    scenario: 'mid',
    ask: 'Double Simpson panels from eight to sixteen. Approximately what fraction of the old error remains?',
    apply: (s) => {
      s.n *= 2;
    },
    watch: [{ id: 'error', label: 'Simpson error', get: (c) => c.simpErr, mode: 'factor' }],
    factors: [0.5, 0.25, 0.0625, 1],
    tol: 0.02,
    expect: { error: 0.0625 },
    why: 'Simpson error is fourth order for this smooth function. Halving panel width leaves about one sixteenth of the error.',
  },
];
PREDICTIONS.barrel = [
  {
    id: 'rising-storm',
    scenario: 'ramp',
    prep: (s) => {
      s.t = 5;
    },
    ask: 'The inlet rate rises linearly. Double elapsed time from five to ten minutes. How does delivered water change?',
    apply: (s) => {
      s.t *= 2;
    },
    watch: [{ id: 'water', label: 'Delivered water', get: (c) => c.delivered, mode: 'factor' }],
    expect: { water: 4 },
    why: 'The area under a ramp is a triangle. Doubling time doubles both its base and its endpoint height.',
  },
  {
    id: 'full-storage',
    scenario: 'full',
    ask: 'The barrel is already full. Double inlet flow while leaving capacity fixed. Does the stored water double?',
    apply: (s) => {
      s.peak *= 2;
    },
    watch: [{ id: 'stored', label: 'Stored water', get: (c) => c.stored, mode: 'trend' }],
    expect: { stored: 'same' },
    why: 'The additional delivered water spills. Capacity limits stored volume, while total inflow still increases.',
  },
];
PREDICTIONS.spheroid = [
  {
    id: 'midpoint-refine',
    scenario: 'oblate',
    ask: 'Double the midpoint disk count. How does its excess over the exact volume change?',
    apply: (s) => {
      s.n *= 2;
    },
    watch: [{ id: 'error', label: 'Excess volume', get: (c) => c.error, mode: 'factor' }],
    expect: { error: 0.25 },
    why: 'The disk-area profile is quadratic. Its midpoint error is exactly proportional to 1/n².',
  },
  {
    id: 'radial-scale',
    scenario: 'sphere',
    ask: 'Double the equatorial radius while keeping the axial half-height fixed. Does volume grow fourfold or eightfold?',
    apply: (s) => {
      s.a *= 2;
    },
    watch: [{ id: 'volume', label: 'Volume', get: (c) => c.volume, mode: 'factor' }],
    factors: [8, 4, 2, 1],
    expect: { volume: 4 },
    why: 'The equatorial radius enters disk area twice. The axial interval has not doubled, so this is not an eightfold uniform scaling.',
  },
];
