import { problem, choice, mc, kase } from '../kit.js';
/** Each statement changes the physical circumstance, not merely its numbers. */
const check = (id, exam, ch, lab, title, items) =>
  problem({
    id,
    exam,
    ch,
    lab,
    title,
    kind: 'conceptual',
    topics: [
      ch === '2'
        ? 'vectors'
        : ch === '3'
          ? 'equilibrium'
          : ch === '4'
            ? 'moments'
            : ch === '6'
              ? 'trusses'
              : ch === '8'
                ? 'friction'
                : ch === '7'
                  ? 'shear-moment'
                  : 'centroids',
    ],
    vars: { scene: choice(...items.map((x, i) => [String(i), x[0]])) },
    text: (T) => T.scene,
    parts: [
      mc(
        'answer',
        [
          [true, 'True'],
          [false, 'False'],
        ],
        (s) => items[Number(s.scene)][1],
      ),
    ],
    hints: [
      'Draw the physical forces and identify what changes between the stated situations.',
      'Test the statement with a limiting geometry or with the appropriate component or moment balance.',
    ],
    steps: (s) => [items[Number(s.scene)][2]],
    cases: items.map((x, i) =>
      kase('Flux original conceptual check; Hibbeler, chapter ' + ch, { scene: String(i) }, { answer: x[1] }),
    ),
  });
const bank = [
  check('r4.vector-cancellation', 'u1', '2', 'vectors', 'Cancellation needs direction', [
    [
      'Two forces of equal magnitude must have zero resultant.',
      false,
      'They cancel only when their directions are opposite.',
    ],
    [
      'Two nonzero perpendicular forces can cancel exactly.',
      false,
      'Each has a component that the other cannot cancel.',
    ],
    [
      'Equal opposite forces at a point have zero resultant.',
      true,
      'Their signed components cancel in every direction.',
    ],
  ]),
  check('r4.projection-sign', 'u1', '2', 'vectors', 'Projection is signed', [
    [
      'A force projected onto a reversed unit direction changes the sign of its scalar projection.',
      true,
      'The dot product is linear in the unit direction.',
    ],
    [
      'A negative scalar projection means the force magnitude is negative.',
      false,
      'Magnitude stays nonnegative; only its component along the chosen direction is signed.',
    ],
    [
      'A force perpendicular to the projection direction has zero projection.',
      true,
      'The dot product contains cos 90°, which vanishes.',
    ],
  ]),
  check('r4.cable-limit', 'u2', '3', 'particle', 'When the ring model fails', [
    [
      'A cable solution requiring compression is physically admissible for a taut rope.',
      false,
      'A rope pulls. A negative tension means the assumed taut configuration fails.',
    ],
    [
      'Three unknown cable tensions always have a unique solution in 3D.',
      false,
      'The direction vectors must be independent. Coplanar or parallel directions can make the matrix singular.',
    ],
    [
      'A very shallow symmetric bridle can require tension greater than its entire supported weight.',
      true,
      'T = W/(2 sin θ), which exceeds W below 30° from horizontal.',
    ],
  ]),
  check('r4.force-equivalence', 'u2', '4', 'moments', 'Moving a force', [
    [
      'Moving a force to a different parallel line generally requires adding a couple to preserve its external effect.',
      true,
      'The changed moment must be compensated by a free couple.',
    ],
    [
      'Sliding a force along its own line changes the moment about the origin.',
      false,
      'The added displacement is parallel to the force and has zero cross product.',
    ],
    [
      'A zero resultant force guarantees zero resultant moment.',
      false,
      'A separated equal opposite pair is a counterexample.',
    ],
  ]),
  check('r4.truss-geometry', 'u3', '6', 'truss', 'The count does not prove stability', [
    [
      'The count m + r = 2j alone proves a plane truss is stable.',
      false,
      'Geometry can make constraints dependent even when their number matches.',
    ],
    [
      'A member with zero force in one load case can be important in another.',
      true,
      'Changing loads changes the joint force balance.',
    ],
    [
      'A load applied midway along a truss bar can generally be handled while keeping that bar a two-force member.',
      false,
      'An intermediate transverse load introduces bending and invalidates the two-force assumption.',
    ],
  ]),
  check('r4.friction-regime', 'u4', '8', 'friction', 'Static friction adjusts', [
    [
      'A resting block on a horizontal floor with no horizontal applied force has friction μsN.',
      false,
      'The required friction is zero; μsN is only a limit.',
    ],
    [
      'Increasing the weight changes the unforced angle of repose in the ideal Coulomb model.',
      false,
      'Weight cancels from W sin θ = μs W cos θ.',
    ],
    [
      'A crate may tip before its friction limit is reached.',
      true,
      'Compare the moment threshold Wb/(2h) with μsW.',
    ],
  ]),
  check('r4.diagram-jumps', 'u4', '7', 'beam', 'Read a shear or moment diagram', [
    [
      'A downward point force creates a jump in shear while moment stays continuous there, if no couple is applied.',
      true,
      'A force has a finite jump in V. The integral of V remains continuous.',
    ],
    [
      'An applied concentrated couple must create a jump in shear.',
      false,
      'A couple changes M directly without changing the net vertical force.',
    ],
    [
      'Every zero of shear is necessarily the global maximum of bending-moment magnitude.',
      false,
      'It is a candidate stationary point. Compare endpoints, kinks and both signs.',
    ],
  ]),
  check('r4.area-mass', 'u4', '10', 'sections', 'Area geometry is not mass geometry', [
    [
      'Doubling every section dimension multiplies area inertia by sixteen.',
      true,
      'Area grows by four and the squared-distance factor grows by four.',
    ],
    [
      'Two sections with the same area must have the same centroidal inertia.',
      false,
      'The distribution of area relative to the axis matters.',
    ],
    [
      'An area centroid is always the centre of mass of a plate with nonuniform density.',
      false,
      'Mass centroids require density weighting.',
    ],
  ]),
];
for (const t of bank)
  t.parts[0].options = t.parts[0].options.map((o) => ({
    ...o,
    why: (s) =>
      `${o.value ? 'The statement claims the stated balance always holds.' : 'The statement denies the stated balance.'} ${t.steps(s)[0]}`,
  }));
export default bank;
