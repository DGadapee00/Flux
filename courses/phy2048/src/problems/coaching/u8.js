/**
 * Unit 8 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
const G = 9.81;

export default {
  'ch12.car': {
    traps: {
      xRear: [
        [($) => (1 - $.share) * $.d, 'That is the distance from the front axle. The front share of the wheelbase, measured from the rear axle, is the center.'],
        [($) => $.d, 'That is the whole wheelbase. The center sits between the axles, at the front share of that distance.'],
      ],
      front: [
        [($) => $.share * $.weight, 'That is the front axle with the car at rest. Braking shifts W a h / (g d) onto the front.'],
        [($) => (1 - $.share) * $.weight, 'That is the rear axle at rest. The front carries the front share, plus whatever braking moved forward.'],
      ],
      rear: [
        [($) => $.share * $.weight, 'That is the front share. The rear carries the rest, and braking takes still more off it.'],
        [($) => $.weight, 'That gives the rear axle the whole weight. The front axle is carrying some of it.'],
      ],
    },
  },
  'ch12.beam': {
    traps: {
      left: [
        [($) => (($.mBoard * $.L) / 2 + $.mPerson * ($.L - $.x)) * G / $.L, 'That puts the supports at the ends and ignores an inset. Use the distance between the supports as the span.'],
        [($) => ($.mBoard + $.mPerson) * G / 2, 'That splits the weight in half. Half and half is only true when the person stands at the center and the supports are symmetric.'],
      ],
      right: [
        [($) => ($.mBoard + $.mPerson) * G, 'That puts both weights on the right support. The left one is carrying part of them.'],
        [($) => $.mPerson * G * $.x / $.L, 'That drops the board and uses the full length even when the supports are set in.'],
      ],
    },
  },
  'ch12.ladder': {
    traps: {
      normal: [
        [($) => $.ladderW, 'That leaves the person off the floor. The normal force is both weights.'],
        [($) => $.ladderW * Math.cos($.theta * Math.PI / 180), 'That is a block on an incline. The floor under a ladder is horizontal, so the normal force is the whole weight.'],
      ],
      friction: [
        [($) => ($.ladderW + $.personW) / Math.tan($.theta * Math.PI / 180), 'That uses the whole weight at the top of the ladder. The ladder’s weight acts halfway up, and the person acts at the fraction given.'],
        [($) => $.ladderW + $.personW, 'That is the normal force. Friction is the horizontal partner of the wall, and it is smaller.'],
      ],
      mu: [
        [($) => Math.tan($.theta * Math.PI / 180), 'That is the μ that holds a block on an incline of this angle. A ladder against a smooth wall asks for a different ratio.'],
        [($) => 1 / Math.tan($.theta * Math.PI / 180), 'That is cot θ, which would be right only if the entire weight acted at the top. Half the ladder’s weight, or the person’s fraction, belongs in front.'],
      ],
    },
  },
  'ch12.strings': {
    traps: {
      added: [
        [($) => $.Tmax / G - $.pan, 'That hangs the whole limit tension straight down. The steeper string is not vertical, so the weight it can hold is T √5 / 2, not T.'],
        [($) => (0.5 * $.Tmax) / G - $.pan, 'That divides the tension by 5 and then treats 2.5/5 as a typeset fraction done wrong. The rising and running parts are 2 and 1, and the hypotenuse is √5.'],
      ],
      shallow: [
        [($) => $.Tmax, 'That is the steeper string, the one that breaks. The shallower string carries half as much.'],
        [($) => $.Tmax / Math.sqrt(5), 'That skips the factor of 2 between the strings. Horizontal balance makes the steep tension twice the shallow one.'],
      ],
    },
  },
  'ch12.stick': {
    traps: {
      m3: [
        [($) => (0.7 * $.m1 + 0.4 * $.m2) / 0.3, 'That leaves out the stick. Its center is 20 cm from the support, and its mass has a moment.'],
        [($) => $.m1 + $.m2 + $.stick, 'That adds the masses. The third mass is fixed by moments, and the arms are not equal, so it is not the sum.'],
      ],
      support: [
        [($) => ($.m1 + $.m2 + $.stick) * G, 'That leaves the third mass off the support. The support holds every gram, including the one you just found.'],
        [($) => $.m3 * G, 'That is only the third mass. The two hanging masses and the stick are on the support too.'],
      ],
    },
  },
  'ch12.forearm': {
    traps: {
      tension: [
        [($) => $.weight * ($.near / $.far), 'That inverts the arms. The muscle is closer to the elbow, so its force is larger than the load, not smaller.'],
        [($) => $.weight, 'That would be right if the muscle attached at the load. It attaches much closer to the elbow, so it has to pull harder.'],
      ],
      elbow: [
        [($) => $.tension, 'That is the muscle by itself. The elbow cancels the muscle minus the load, because the load is already helping.'],
        [($) => $.weight, 'That is the load. The elbow is larger than the load. It is what is left after the muscle has pulled too hard for the load alone.'],
      ],
    },
  },
  'ch12.cable': {
    traps: {
      tension: [
        [($) => $.strutW + $.signW, 'That is the total weight. The cable is slanted, so its tension is larger than the vertical part it has to supply.'],
        [($) => $.strutW / 2 + $.signW, 'That is the cable’s vertical part. Divide by the sine of the cable’s angle, which is rise over the hypotenuse.'],
      ],
      hingeX: [
        [($) => $.tension, 'That gives the hinge the whole cable tension. Only the horizontal part of the cable reaches the hinge.'],
        [($) => 0, 'A horizontal strut with a slanted cable needs a horizontal hinge force. Nothing else cancels the cable’s sideways pull.'],
      ],
      hingeY: [
        [($) => $.strutW + $.signW, 'That gives the hinge both weights. The cable is holding the sign and half the strut.'],
        [($) => 0, 'The hinge still carries half the strut. The sign is at the outer end, but the strut’s own center is not.'],
      ],
    },
  },
  'ch12.rod': {
    traps: {
      stress: [
        [($) => $.m * $.g, 'That is the weight, in newtons. Stress divides it by the area, in square meters.'],
        [($) => ($.m * $.g) / $.area, 'That treats the area in cm² as if it were already in m². A square centimeter is 10⁻⁴ m², so the stress is 10⁴ times larger.'],
      ],
      delta: [
        [($) => $.stress / ($.E * 1e9), 'That is the strain. Multiply by the length to get the elongation.'],
        [($) => ($.m * $.g * $.L) / ($.E * 1e9), 'That leaves the area out of ΔL = FL/(AE). The stretch is smaller once the area is in the denominator.'],
      ],
    },
  },
  'ch12.pillar': {
    traps: {
      stress: [
        [($) => $.sculpt / $.area, 'That is only the sculpture. The stone above the cut has weight too, and the cut carries both.'],
        [($) => $.rho * $.g * $.h, 'That is the pillar’s own contribution. The sculpture is an extra force, and it does not cancel with the area.'],
      ],
      strain: [
        [($) => $.stress, 'That is the stress in pascals. Strain divides it by Young’s modulus, and the number is tiny.'],
        [($) => $.sculpt / ($.area * $.E * 1e9), 'That strains the sculpture’s force and leaves out the granite above the cut.'],
      ],
    },
  },
  'ch12.shear': {
    traps: {
      stress: [
        [($) => $.force / $.height, 'That divides by the height. Shear stress divides by the area the force acts on.'],
        [($) => $.force, 'That is the force. Stress is the force per area.'],
      ],
      strain: [
        [($) => $.shift / 100, 'That is the shift in meters. Strain divides it by the height.'],
        [($) => $.shift / $.height, 'That leaves the shift in centimeters against a height in meters. Convert the shift first.'],
      ],
      modulus: [
        [($) => $.stress, 'That is the stress again. The modulus is stress divided by strain.'],
        [($) => $.stress * $.height, 'That multiplies by the height and never divides by the shift. Both belong in the strain.'],
      ],
    },
  },
  'ch12.yield': {
    traps: {
      stress: [
        [($) => $.E * 1e9 * $.eps, 'That keeps the elastic line going past the yield. After the yield the slope is the tangent modulus, not Young’s modulus.'],
        [($) => $.sigY * 1e6, 'That stops the stress at the yield and forgets the extra rise along the tangent modulus.'],
      ],
      permanent: [
        [($) => $.eps, 'That leaves the whole strain behind. Unloading recovers the elastic piece, σ/E.'],
        [($) => 0, 'That assumes the wire comes all the way back. It does, only if the strain never passed the yield.'],
      ],
    },
  },
  'ch12.door': {
    traps: {
      horizontal: [
        [($) => ($.weight * $.width) / $.separation, 'That puts the weight at the outer edge. A uniform door carries it at the center, so the lever arm is half the width.'],
        [($) => $.weight / 2, 'That is the vertical force. The horizontal force is a couple, weight times half the width, divided by the hinge separation.'],
      ],
      vertical: [
        [($) => $.weight, 'That gives each hinge the whole weight. The two hinges share it, and the problem says the shares are equal.'],
        [($) => $.horizontal, 'That copies the sideways force. The vertical force is half the weight, from the sharing assumption.'],
      ],
    },
  },
};
