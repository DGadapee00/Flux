import { choice } from './kit.js';
/** Forward/inverse pairs change what must be inferred. The lab still checks the forward balance.
 * The hidden design parameter is selected first; its target is back-solved from equilibrium. */
const pairs = {
  'ch2.components-resultant': [
    'F3',
    'R',
    'N',
    'The first force is {F1} N at {a1}°, the second {F2} N at {a2}°, and a third force acts at {a3}°. The resultant magnitude is {R} N. All force magnitudes are nonnegative. Find the third magnitude on the branch matching the resultant direction {th}°, then report the resultant components and direction.',
  ],
  'ch2.projection': [
    'Fx',
    'par',
    'N',
    'Force F has unknown x component and known y = {Fy} N, z = {Fz} N. Its signed component along ({ux},{uy},{uz}) is {par} N. Find Fx, the perpendicular magnitude and the angle between the force and that direction.',
  ],
  'ch3.two-cables': [
    'W',
    'T1',
    'lb',
    'Two taut cables point at {a1}° and {a2}° from +x. Tension in cable 1 is {T1} lb. Find the supported weight and cable 2 tension.',
  ],
  'ch4.moment-2d': [
    'F',
    'M',
    'N',
    'A force of unknown nonnegative magnitude acts at ({x},{y}) m in direction {th}° from +x. Its signed moment about the origin is {M} N·m. Find its magnitude and the perpendicular moment arm.',
  ],
  'ch4.moment-3d': [
    'Fz',
    'Mx',
    'N',
    'A force has Fx = {Fx} N, Fy = {Fy} N and unknown Fz. It acts at r = ({rx},{ry},{rz}) m. Its x moment is {Mx} N·m. Find Fz and the other two moment components.',
  ],
  'ch4.couple-moment': [
    'F',
    'M',
    'N',
    'Two equal opposite forces are applied at (−1.5,0) and (1.5,0) m. The force at the left points at {th}° from +x. Their signed couple is {M} N·m. Find the force magnitude.',
  ],
  'ch3.three-cables': [
    'W',
    'TAB',
    'lb',
    'A ring has anchors (3,0,{h}), (−2,3,{h}) and (−2,−3,{h}) ft. Cable AB has tension {TAB} lb. Find the supported weight and the tension in AC.',
  ],
  'ch5.distributed': [
    'w',
    'W',
    'lb/ft',
    'A simply supported {L} ft beam carries a {shape} distribution with total load {W} lb. Find its peak intensity, load centroid, and support reactions.',
  ],
  'ch6.truss-joints': [
    'P',
    'AC',
    'lb',
    'A triangular truss has A(0,0), B({span},0), C({half},{h}) ft, pin A and vertical roller B. AC carries {AC} lb (tension positive). Find the downward apex load, the bottom-chord force and the state of AC.',
  ],
  'ch6.frame-aframe': [
    'P',
    'Cy',
    'lb',
    'An A-frame has A(0,0), B(2,3), C(4,0) ft. A downward load acts at fraction {t} along AB. Member BC is unloaded between pins. Cy is {Cy} lb upward. Find the applied load, horizontal reaction Ax, and apex pin-force magnitude.',
  ],
  'ch6.pliers': [
    'P',
    'N',
    'N',
    'One plier member has jaw arm 1 in and hand arm {b} in. Each jaw presses with {N} N. Find the hand force per handle and the pivot force.',
  ],
  'ch5.cantilever': [
    'P',
    'MA',
    'lb',
    'A {L} ft cantilever has {w} lb/ft uniform load and an unknown downward tip load. Its wall reaction moment is {MA} lb·ft counterclockwise. Find the tip load and wall vertical force.',
  ],
  'ch6.sections': [
    'P2',
    'EC',
    'lb',
    'The Pratt truss in the lab carries {P1} lb at B and an unknown downward force at C. EC has signed axial force {EC} lb. Using the standard 3 ft panels, find the force at C and forces BC and EF.',
  ],
  'ch7.internal-point': [
    'P',
    'M',
    'lb',
    'A simply supported {L} ft beam has a downward load at x = {a} ft. Moment at a cut x = {c} ft is {M} lb·ft. Find the load magnitude, then N and V at that cut.',
  ],
  'ch9.centroid-composite': [
    'h2',
    'A',
    'in',
    'An L area has a {w1} by {h1} in base and a {w2} in wide upright above its left end. Total area is {A} in². Find upright height, then both centroid coordinates.',
  ],
  'ch9.plate-hole': [
    'r',
    'A',
    'in',
    'An {w} by {h} in plate has net area {A} in² after a circular hole centred at ({xh},{halfH}) in is removed. Find hole radius and the remaining centroid x coordinate.',
  ],
  'ch10.ibeam': [
    'tw',
    'A',
    'in',
    'A symmetric I-section is {d} in deep with {b} by {tf} in flanges. Its total area is {A} in². Find web thickness and centroidal Ix.',
  ],
  'ch8.incline-band': [
    'W',
    'Ppush',
    'lb',
    'A block on a {th}° incline has μs = {mus}. An upslope force of {Ppush} lb is just enough to start upward motion. Find the weight and minimum upslope force that prevents downward motion.',
  ],
  'ch8.belt': [
    'T1',
    'T2',
    'lb',
    'A rope with μ = {mu} makes {turns} full turns around a fixed post. Tight-side tension is {T2} lb at impending slip. Find the required slack-side holding force.',
  ],
};
const inverseTraps = {
  'ch2.components-resultant': [
    (s) => s.R - s.F1 - s.F2,
    'Subtracting magnitudes ignores the given directions.',
    (s) => -s.F3,
    'The requested force magnitude is nonnegative.',
  ],
  'ch2.projection': [
    (s) => (s.par * s.Lmag) / s.ux,
    'Subtract the known y and z dot-product contributions before dividing by ux.',
    (s) => s.par / s.ux,
    'Normalise the direction before solving the projection equation.',
  ],
  'ch3.two-cables': [
    (s) => s.T1,
    'The first cable tension is not the supported weight.',
    (s) => s.T1 * Math.sin((s.a1 * Math.PI) / 180),
    'The second cable also has a vertical component.',
  ],
  'ch4.moment-2d': [
    (s) => Math.abs(s.M) / Math.hypot(s.x, s.y),
    'Use perpendicular distance, not position-vector length.',
    (s) => -s.F,
    'A signed moment does not imply a negative force magnitude.',
  ],
  'ch4.moment-3d': [
    (s) => s.Mx / s.ry,
    'The known rzFy contribution must be restored before dividing by ry.',
    (s) => -s.Fz,
    'Check the order ryFz − rzFy in Mx.',
  ],
  'ch4.couple-moment': [
    (s) => Math.abs(s.M) / 3,
    'The separation is not generally perpendicular to the force.',
    (s) => 2 * s.F,
    'Both forces create the couple; do not assign the total moment to only one half-arm.',
  ],
  'ch3.three-cables': [
    (s) => 3 * s.TAB,
    'The three tensions are not equal and only their vertical components support weight.',
    (s) => s.TAB,
    'The other two cables also support the weight.',
  ],
  'ch5.distributed': [
    (s) => s.W / s.L,
    'For a triangle, the total is half the bounding rectangle area.',
    (s) => s.W,
    'Total force is not load intensity. Divide by the loaded length and its shape factor.',
  ],
  'ch6.truss-joints': [
    (s) => -s.AC,
    'Axial compression magnitude is not the vertical apex load.',
    (s) => s.P / 2,
    'Both diagonal vertical components support the apex load.',
  ],
  'ch6.frame-aframe': [
    (s) => s.Cy,
    'The support reaction differs from the applied load by the lever-arm ratio.',
    (s) => s.Cy / s.t,
    'The load acts on one leg, whose horizontal reach is half the full base.',
  ],
  'ch6.pliers': [
    (s) => s.N * s.b,
    'To recover hand force, divide the jaw moment by the handle lever.',
    (s) => s.N,
    'The hand arm is not the 1 in jaw arm.',
  ],
  'ch5.cantilever': [
    (s) => s.MA / s.L,
    'Subtract the uniform load’s moment before recovering the tip load.',
    (s) => (s.MA - s.w * s.L * s.L) / s.L,
    'The uniform resultant acts at L/2, not L.',
  ],
  'ch6.sections': [
    (s) => s.P1 + 3 * s.EC,
    'Use the vertical component EC/√2 in the section equation.',
    (s) => s.P1 - (3 * s.EC) / Math.SQRT2,
    'Keep the sign of the diagonal’s vertical contribution.',
  ],
  'ch7.internal-point': [
    (s) => s.M / s.c,
    'Moment divided by cut distance gives a reaction here, not the applied load.',
    (s) => s.M / s.a,
    'The load-to-cut moment arm depends on which side contains the load.',
  ],
  'ch9.centroid-composite': [
    (s) => s.A / s.w2,
    'Subtract the base area before solving the upright height.',
    (s) => Math.sqrt(s.A - s.w1 * s.h1),
    'The upright width is given; it is not a square.',
  ],
  'ch9.plate-hole': [
    (s) => Math.sqrt(s.w * s.h - s.A),
    'The removed area is πr², so divide by π before taking a square root.',
    (s) => 2 * s.r,
    'That is the diameter, not the radius.',
  ],
  'ch10.ibeam': [
    (s) => s.A / (s.d - 2 * s.tf),
    'Subtract both flange areas before recovering the web thickness.',
    (s) => (s.A - 2 * s.b * s.tf) / s.d,
    'The web height excludes both flange thicknesses.',
  ],
  'ch8.incline-band': [
    (s) => s.Ppush / Math.sin((s.th * Math.PI) / 180),
    'The upward threshold includes friction as well as gravity.',
    (s) => s.Ppush / (Math.sin((s.th * Math.PI) / 180) - s.mus * Math.cos((s.th * Math.PI) / 180)),
    'The minus sign belongs to impending downward motion.',
  ],
  'ch8.belt': [
    (s) => s.T2 * Math.exp(s.mu * 2 * Math.PI * s.turns),
    'Reverse the capstan relation by dividing by the exponential.',
    (s) => s.T2 / Math.exp(s.mu * s.turns),
    'Convert full turns to radians.',
  ],
};

const hints = {
  2: 'Use the signed projection or resultant equation to isolate the missing force component or magnitude.',
  3: 'Use horizontal balance to relate tensions, then use vertical balance to recover the weight.',
  4: 'Divide the known moment by the signed geometric coefficient of the unknown force.',
  5: 'Replace the distribution by its total load, then solve the reaction or wall-moment equation backward.',
  6: 'Use the same joint or member moment equation, with the force formerly given now unknown.',
  7: 'Write M at the specified cut in terms of the applied load, then isolate that load.',
  8: 'Reverse the impending-motion equation; do not change the friction direction.',
  9: 'Solve the signed total-area equation for the missing dimension before locating the centroid.',
  10: 'Subtract the two flange areas, then divide the remaining web area by its clear height.',
};
export function withInverse(t) {
  const spec = pairs[t.id];
  if (!spec) return t;
  const [unknown, out, unit, statement] = spec;
  const selected = t.parts.find((p) => p.id === out);
  const inverse = (s) => s.task === 'inverse';
  const original = t.text;
  const trap = inverseTraps[t.id];
  const fallback = [(s) => -selected.get(s), 'Check the sign of the requested response.'];
  const forwardTraps = selected.traps || [
    fallback,
    [(s) => 0, 'A nonzero load generally needs a nonzero response in this configuration.'],
  ];
  const parts = t.parts.map((p) =>
    p === selected
      ? {
          ...p,
          unit: (s) => (inverse(s) ? unit : p.unit),
          label: (T, s) => (inverse(s) ? `${unknown} (the unknown input)` : p.label),
          get: (s) => (inverse(s) ? s[unknown] : p.get(s)),
          traps: [
            [
              (s) => (inverse(s) ? trap[0](s) : forwardTraps[0][0](s)),
              (s) => (inverse(s) ? trap[1] : forwardTraps[0][1]),
            ],
            [
              (s) => (inverse(s) ? trap[2](s) : forwardTraps[1][0](s)),
              (s) => (inverse(s) ? trap[3] : forwardTraps[1][1]),
            ],
          ],
        }
      : p,
  );
  return {
    ...t,
    vars: {
      ...t.vars,
      task: choice(['forward', 'given loads'], ['inverse', 'given a reaction or response']),
    },
    variety: ['unknown'],
    parts,
    valid: (s) =>
      t.valid(s) &&
      (t.id !== 'ch2.projection' || Math.abs(s.ux) > 0.1) &&
      (t.id !== 'ch4.moment-3d' || Math.abs(s.ry) > 0.1),
    text: (T, s, f) =>
      inverse(s)
        ? statement.replace(/\{(\w+)\}/g, (_, k) => {
            const v = k === 'half' ? s.span / 2 : k === 'halfH' ? s.h / 2 : s[k];
            return typeof v === 'number' ? Number(v.toPrecision(9)) : v;
          })
        : original(T, s, f),
    hints: [
      (T, s) => (inverse(s) ? hints[t.ch] : t.hints[0]),
      (T, s) =>
        inverse(s)
          ? 'Keep every lever arm or direction cosine. Substitute the known response, then divide by the coefficient of the requested input.'
          : t.hints[1],
    ],
    steps: (s, f) =>
      inverse(s)
        ? [
            hints[t.ch],
            ...t.steps(s, f),
            `Solving that same equation for ${unknown} gives ${f(s[unknown])} ${unit}.`,
          ]
        : t.steps(s, f),
    cases: t.cases.map((c) => ({ ...c, v: { ...c.v, task: 'forward' } })),
    sim: t.sim
      ? {
          ...t.sim,
          read: (c, s, $) => {
            const got = t.sim.read?.(c, s, $) || {};
            if (inverse($) && Object.hasOwn(got, out)) {
              got['@given response'] = [got[out], selected.get($)];
              delete got[out];
            }
            return got;
          },
        }
      : t.sim,
  };
}
