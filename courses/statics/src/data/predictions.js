import { prediction as p } from '../labs/device-kit.js';
const mag = (v) => Math.hypot(v.x, v.y, v.z || 0);
export const PREDICTIONS = {
  vectors: [
    p(
      'cancel',
      'two',
      'Replace two equal perpendicular forces by equal opposite forces. What happens to resultant magnitude?',
      (s) => (s.F2 = [-100, 0, 0]),
      (c) => mag(c.vec.R),
      'smaller',
      'Magnitudes do not add. Signed components do.',
      (s) => Object.assign(s, { F1: [100, 0, 0], F2: [0, 100, 0], F3: null }),
    ),
    p(
      'reverse',
      'two',
      'Reverse every force. What happens to resultant magnitude?',
      (s) => {
        s.F1 = s.F1.map((x) => -x);
        s.F2 = s.F2.map((x) => -x);
      },
      (c) => mag(c.vec.R),
      'same',
      'Reversal changes direction, not length.',
      (s) => Object.assign(s, { F1: [100, 0, 0], F2: [0, 100, 0], F3: null }),
    ),
  ],
  particle: [
    p(
      'flatten',
      'two',
      'Two symmetric cables support a weight. Flatten them from 45° to 15° above horizontal. What happens to each tension?',
      (s) => {
        s.a1 = 165;
        s.a2 = 15;
      },
      (c) => c.particle.members[0].T,
      'bigger',
      'Each vertical component still supports half the weight.',
      (s) => {
        s.a1 = 135;
        s.a2 = 45;
      },
    ),
    p(
      'spring',
      'spring',
      'Double the spring stiffness at the same cable geometry and weight. What happens to the spring force?',
      (s) => (s.k *= 2),
      (c) => c.particle.members[1].T,
      'same',
      'Equilibrium sets force. Stiffness changes extension.',
    ),
  ],
  moments: [
    p(
      'slide',
      'point',
      'Move the force application point along its own line of action. What happens to moment magnitude about O?',
      (s) => {
        s.x += Math.cos((s.th * Math.PI) / 180);
        s.y += Math.sin((s.th * Math.PI) / 180);
      },
      (c) => c.mom.Mz,
      'same',
      'The added displacement is parallel to F, so its cross product with F vanishes.',
    ),
    p(
      'couple',
      'couple',
      'Move the moment point far from the force pair. What happens to the couple moment?',
      (s) => {
        s.px += 3;
        s.py -= 2;
      },
      (c) => c.mom.Mz,
      'same',
      'The two point-shift terms cancel because the net force is zero.',
    ),
  ],
  truss: [
    p(
      'scale',
      'three',
      'Double every joint load. What happens to member force magnitudes?',
      (s) => (s.scale *= 2),
      (c) => Math.max(...Object.values(c.truss.sol.forces || {}).map(Math.abs), c.truss.sol.reactions.A.y),
      'bigger',
      'Joint equilibrium is linear for fixed geometry.',
    ),
    p(
      'depth',
      'three',
      'Keep the load and span fixed but double the apex height. What happens to the vertical reaction at A?',
      (s) => {
        s.joints.C[1] *= 2;
      },
      (c) => c.truss.sol.reactions.A.y,
      'same',
      'Whole-truss moments do not depend on its height.',
    ),
  ],
  frame: [
    p(
      'grip',
      'pliers',
      'Increase the handle lever arm while keeping hand force fixed. What happens to jaw force?',
      (s) => (s.b *= 1.5),
      (c) => c.frame.sol.values.J1n,
      'bigger',
      'Moments about the pivot give jaw force times jaw arm equal hand force times handle arm.',
    ),
    p(
      'pin',
      'pliers',
      'Double hand force at fixed geometry. What happens to pin force magnitude?',
      (s) => (s.P *= 2),
      (c) => Math.hypot(c.frame.sol.values.Cx, c.frame.sol.values.Cy),
      'bigger',
      'The pivot carries the sum of jaw and hand forces, and both scale.',
    ),
  ],
  friction: [
    p(
      'mass',
      'incline',
      'Double the weight on the same unforced slope. What happens to the friction-to-normal ratio required to hold it?',
      (s) => (s.W *= 2),
      (c) => Math.abs(c.fr.need / c.fr.N),
      'same',
      'Weight increases both normal force and downslope demand by the same factor. Their ratio stays tan θ.',
    ),
    p(
      'wrap',
      'belt',
      'Double the wrap angle. Does the holding ratio stay the same?',
      (s) => (s.beta *= 2),
      (c) => c.fr.ratio,
      'bigger',
      'The capstan ratio is exponential in wrap angle. It is not a fixed pulley advantage.',
    ),
  ],
  beam: [
    p(
      'cut',
      'udl',
      'Move a cut from quarter span to midspan under uniform loading. What happens to bending moment?',
      (s) => (s.c = s.L / 2),
      (c) => c.beam.at.M,
      'bigger',
      'Moment grows until shear crosses zero, even though the shear itself is falling.',
      (s) => (s.c = s.L / 4),
    ),
    p(
      'span',
      'udl',
      'Double beam length at the same load per foot, keeping the cut at midspan. What happens to the maximum moment?',
      (s) => {
        s.L *= 2;
        s.c = s.L / 2;
      },
      (c) => c.beam.at.M,
      'bigger',
      'The total load doubles and its lever arm doubles, so peak moment quadruples.',
      (s) => (s.c = s.L / 2),
    ),
  ],
  sections: [
    p(
      'scale',
      'L',
      'Double every dimension of the L section. What happens to its centroidal area moment of inertia?',
      (s) => (s.p = s.p.map((x) => 2 * x)),
      (c) => c.sec.Ix,
      'bigger',
      'Area grows by four and distance squared by four. Inertia grows by sixteen.',
    ),
    p(
      'hole',
      'hole',
      'Move the hole to the right without changing its radius. What happens to the remaining plate centroid x?',
      (s) => (s.p[3] += 0.5),
      (c) => c.sec.xbar,
      'smaller',
      'Removing material farther right moves the remaining centroid left.',
    ),
  ],
};

// Application predictions live beside their diagrams and are read from the lab contract.
