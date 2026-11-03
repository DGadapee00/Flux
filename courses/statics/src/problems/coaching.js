/** Authored mistakes, evaluated from the same givens a student sees. No generic offsets. */
const rad = (x) => (x * Math.PI) / 180;
export const COACHING = {
  'r4.cable-design': [
    'T',
    (s) => s.Q - s.Fx,
    'This is only the horizontal cable component. Divide by its direction cosine.',
    (s) => s.Q / (s.dx / 5),
    'The known horizontal force must be subtracted before recovering cable tension.',
  ],
  'ch2.parallelogram': [
    'R',
    (s) => s.F1 + s.F2,
    'Adding magnitudes assumes parallel forces.',
    (s) => Math.sqrt(s.F1 * s.F1 + s.F2 * s.F2),
    'Pythagoras assumes perpendicular forces.',
  ],
  'ch2.components-resultant': [
    'R',
    (s) => s.F1 + s.F2 + s.F3,
    'Magnitudes do not include cancellation.',
    (s) => Math.abs(s.Rx) + Math.abs(s.Ry),
    'Perpendicular components combine by Pythagoras, not addition.',
  ],
  'ch2.cartesian-angles': [
    'F',
    (s) => Math.abs(s.Fx) + Math.abs(s.Fy) + Math.abs(s.Fz),
    'This is the sum of component magnitudes, not vector length.',
    (s) => Math.sqrt(s.Fx * s.Fx + s.Fy * s.Fy),
    'The z component was omitted.',
  ],
  'ch2.force-along-line': [
    'Fx',
    (s) => s.F * (s.bx - s.ax),
    'Normalise the direction before multiplying by tension.',
    (s) => -s.Fx,
    'The force at A points toward B, not away from B.',
  ],
  'ch2.projection': [
    'par',
    (s) => s.par * s.Lmag,
    'The direction vector was not normalised.',
    (s) => Math.abs(s.par),
    'A scalar projection retains the direction sign.',
  ],
  'ch3.two-cables': [
    'T1',
    (s) => s.W / 2,
    'Equal vertical shares do not mean tension equals half the weight.',
    (s) => s.W / (2 * Math.sin(rad(s.a1))),
    'Equal tensions require symmetric cable angles.',
  ],
  'ch3.spring': [
    's',
    (s) => s.W / s.k,
    'Only the vertical component of the spring force supports W.',
    (s) => s.F * s.k,
    'Hooke’s law requires dividing force by stiffness.',
  ],
  'ch4.moment-2d': [
    'M',
    (s) => s.F * Math.hypot(s.x, s.y),
    'The lever arm must be perpendicular to the force line.',
    (s) => -s.M,
    'The cross-product order or rotation sign was reversed.',
  ],
  'ch4.moment-3d': [
    'Mx',
    (s) => -s.Mx,
    'The cross product F × r reverses the required sign.',
    (s) => s.ry * s.Fz + s.rz * s.Fy,
    'The determinant subtracts the second product.',
  ],
  'ch4.moment-axis': [
    'Maxis',
    (s) => s.Maxis * s.ulen,
    'The axis direction must be a unit vector.',
    (s) => Math.hypot(s.ry * s.Fz - s.rz * s.Fy, s.rz * s.Fx - s.rx * s.Fz, s.rx * s.Fy - s.ry * s.Fx),
    'Moment-vector magnitude is not its signed axis projection.',
  ],
  'ch4.couple-moment': [
    'M',
    (s) => 0,
    'Zero net force does not imply zero couple.',
    (s) => s.M / 2,
    'Both separated forces contribute to the couple.',
  ],
  'ch3.three-cables': [
    'TAB',
    (s) => s.W / 3,
    'The anchors have different direction cosines.',
    (s) => (s.TAB * 3) / 5,
    'The vertical component was confused with the tension magnitude.',
  ],
  'ch5.beam-reactions': [
    'RA',
    (s) => s.P / 2,
    'Half-load reactions require a centred load.',
    (s) => s.RB,
    'The load distance from A determines B, not A.',
  ],
  'ch5.distributed': [
    'W',
    (s) => s.w,
    'Load intensity is force per length, not total force.',
    (s) => (s.shape === 'triangular' ? s.w * s.L : (s.w * s.L) / 2),
    'Use the actual area under the distribution, not the other shape.',
  ],
  'ch6.truss-joints': [
    'AC',
    (s) => Math.abs(s.AC),
    'The diagonal is in compression under this downward load.',
    (s) => -s.P / 2,
    'The vertical component, not the axial magnitude, equals half the load.',
  ],
  'ch6.frame-aframe': [
    'Cy',
    (s) => s.P / 2,
    'The load is not centred between the supports.',
    (s) => s.P * s.t,
    'The reaction lever arm is the full 4 ft base, not one leg’s horizontal reach.',
  ],
  'ch6.pliers': [
    'C',
    (s) => s.N,
    'The pin also balances the applied hand force.',
    (s) => s.N - s.P,
    'Hand and jaw forces add in the pin balance for this geometry.',
  ],
  'ch5.cantilever': [
    'MA',
    (s) => s.P * s.L,
    'The uniform load also contributes a moment.',
    (s) => s.P * s.L + s.w * s.L * s.L,
    'The distributed resultant acts at midspan, not the tip.',
  ],
  'ch6.sections': [
    'EC',
    (s) => s.Ay - s.P1,
    'This is only the vertical component of the diagonal force.',
    (s) => Math.abs(s.EC),
    'Keep the sign of the section force; compression is negative.',
  ],
  'ch7.internal-point': [
    'V',
    (s) => s.RA,
    'After crossing the load, subtract its force.',
    (s) => s.RA + s.P,
    'A downward load decreases the upward force sum.',
  ],
  'ch9.centroid-composite': [
    'xbar',
    (s) => (s.w1 / 2 + s.w2 / 2) / 2,
    'Centroids must be weighted by area.',
    (s) => ((s.w1 * s.h1 * s.w1) / 2 + (s.w2 * s.h2 * s.w2) / 2) / (s.w1 * s.h1),
    'The denominator must include both areas.',
  ],
  'ch9.pappus': [
    'V',
    (s) => s.V / (2 * Math.PI),
    'Pappus requires the centroid’s full circular travel distance.',
    (s) => s.V * 2,
    'The generating area is counted once, not twice.',
  ],
  'ch10.moi-composite': [
    'Ix',
    (s) => (s.t * s.h ** 3) / 12 + (s.b * s.t ** 3) / 12,
    'Each part’s inertia must be transferred to the common centroid.',
    (s) => s.Ix + (s.b * s.t + s.t * s.h) * (s.ybar || 0) ** 2,
    'The requested axis is centroidal, not at the base.',
  ],
  'ch7.udl-diagrams': [
    'M',
    (s) => (s.w * s.L * s.c) / 2,
    'The distributed load on the retained segment also creates a moment.',
    (s) => (s.w * s.L * s.c) / 2 - s.w * s.c * s.c,
    'The retained load acts at c/2, not c.',
  ],
  'ch9.plate-hole': [
    'A',
    (s) => s.w * s.h + Math.PI * s.r * s.r,
    'A hole subtracts area.',
    (s) => s.w * s.h - 2 * Math.PI * s.r,
    'Circumference is a length, not the removed area.',
  ],
  'ch10.ibeam': [
    'Ix',
    (s) => (s.b * s.d ** 3) / 12,
    'Subtract the empty strips beside the web.',
    (s) => (2 * s.b * s.tf ** 3) / 12 + (s.tw * (s.d - 2 * s.tf) ** 3) / 12,
    'The flange transfer terms were omitted.',
  ],
  'ch8.incline-band': [
    'Ppush',
    (s) => s.W * Math.sin(rad(s.th)),
    'Impending upward motion must also overcome friction.',
    (s) => s.W * (Math.sin(rad(s.th)) - s.mus * Math.cos(rad(s.th))),
    'That friction sign belongs to impending downward motion.',
  ],
  'ch8.tip-or-slip': [
    'P',
    (s) => Math.max(s.Pslip, s.Ptip),
    'Failure occurs at the lower threshold.',
    (s) => (s.W * s.b) / s.hp,
    'The weight acts half a base width from the tipping edge.',
  ],
  'ch8.belt': [
    'T2',
    (s) => s.T1 * (1 + s.mu * 2 * Math.PI * s.turns),
    'The capstan law is exponential, not linear.',
    (s) => s.T1 * Math.exp(s.mu * s.turns),
    'Convert turns to radians before using the exponential.',
  ],
};
export const SECOND_HINT = {
  2: 'Write the signed components in separate columns. Check the direction vector has magnitude one.',
  3: 'Use one component equation to eliminate a tension, then substitute into the other component equation.',
  4: 'Choose the moment point and expand the cross product in its stated order.',
  5: 'Take moments about one support, then use vertical force balance to recover the other reaction.',
  6: 'Isolate the loaded joint or member. Eliminate unwanted forces with a suitable moment centre.',
  7: 'Draw only the retained segment. Include its reaction and every load before the cut.',
  8: 'Draw the impending motion in each direction separately before assigning the friction arrow.',
  9: 'List each part’s signed area and centroid. Sum the first moments before dividing by total area.',
  10: 'Locate the common centroidal axis first, then transfer each part’s own centroidal inertia.',
};
/** Per-option explanations state the claim each distractor would make. */
export const WHY = {
  'ch2.concepts': {
    one: 'Normalisation gives unit magnitude and removes units.',
    unity: 'The direction-cosine squares sum to one by the magnitude identity.',
    scalar: 'A dot product contracts two vectors to one signed scalar.',
    vector: 'A cross product is a vector normal to the two inputs; a parallel pair gives zero.',
    magF: 'The scalar tension carries the force magnitude; the unit direction does not.',
  },
  'ch4.couple-concept': {
    same: 'A couple is independent of the moment point because its net force vanishes.',
    zero: 'The forces of a couple cancel; the separated moments need not.',
    nothing: 'Sliding along the force line adds a parallel displacement whose cross product vanishes.',
    depends: 'Individual force moments change with origin, but a couple’s sum does not.',
  },
  'ch6.truss-joints': {
    tension: 'Positive axial force pulls away from a joint.',
    compression: 'Negative axial force reverses the assumed tensile arrows and pushes into the joint.',
    zero: 'A zero-force member has zero axial force for this load case, not every load case.',
  },
  'ch6.determinacy': {
    determinate: 'With independent constraints and stable geometry, equal counts permit a unique solution.',
    indeterminate: 'More unknowns than independent equations require additional deformation information.',
    unstable: 'Too few independent constraints leave a mechanism. Equal counts alone cannot rule one out.',
  },
  'ch6.zero-force': {
    2: 'Two noncollinear members at an unloaded unsupported joint must both vanish.',
    1: 'With three members, two collinear, the perpendicular component forces the third to vanish.',
    0: 'An applied load invalidates the shortcut; the force directions must still be checked.',
  },
  'ch10.parallel-axis': {
    centroid: 'The reference inertia must be centroidal so the first-moment cross term vanishes.',
    any: 'Between arbitrary axes, the first-moment cross term need not vanish.',
    centroidal: 'Among parallel axes, the centroidal axis minimises inertia because Ad² is nonnegative.',
    len4: 'Distance squared times area has units of length to the fourth.',
    len3: 'Length cubed would describe a first area moment, not a second moment.',
  },
  'ch8.tip-or-slip': {
    tip: 'Tipping governs when Wb/(2h) is smaller than μW.',
    slip: 'Sliding governs when μW is smaller than Wb/(2h).',
  },
};
export function coach(t) {
  const row = COACHING[t.id];
  const parts = t.parts.map((p) =>
    p.kind === 'choice'
      ? { ...p, options: p.options.map((o) => ({ ...o, why: o.why || WHY[t.id]?.[o.value] })) }
      : row && p.id === row[0]
        ? {
            ...p,
            traps: [
              [row[1], row[2]],
              [row[3], row[4]],
            ],
          }
        : p,
  );
  let sim = t.sim;
  if (t.lab === 'vectors' && sim) {
    const setup = sim.setup;
    sim = {
      ...sim,
      setup: (s, $) => {
        setup?.(s, $);
        s.unit = t.vars.F1?.unit || t.vars.F?.unit || t.vars.Fx?.unit || 'N';
        s.mode = t.id === 'ch2.projection' ? 'projection' : 'components';
        s.showResultant = !['ch2.projection', 'ch2.force-along-line', 'ch2.cartesian-angles'].includes(t.id);
      },
    };
  }
  return { ...t, sim, parts, hints: t.hints.length >= 2 ? t.hints : [...t.hints, SECOND_HINT[t.ch]] };
}
