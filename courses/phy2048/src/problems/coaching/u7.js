/**
 * Unit 7 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
const G = 9.81;
const DEG = Math.PI / 180;

const kOf = (shape) => (shape === 'sphere' ? 0.4 : shape === 'hoop' ? 1 : 0.5);

export default {
  'ch11.roll': {
    traps: {
      a: [
        [($) => G * Math.sin($.theta * DEG), 'That is the acceleration of a block on a frictionless hill. A rolling body also has to spin, so divide by 1 + I/(mR²).'],
        [($) => (G * Math.sin($.theta * DEG)) / (1 + ($.shape === 'disk' ? 1 : 0.5)), 'That uses another shape’s k. A solid cylinder is 1/2, a sphere is 2/5, and a hoop is 1.'],
      ],
      muMin: [
        [($) => Math.tan($.theta * DEG), 'That is the μ that holds a block at rest on the hill. Rolling asks for a smaller friction, (k/(1+k)) tanθ.'],
        [($) => kOf($.shape) * Math.tan($.theta * DEG), 'That leaves out the 1 + k in the denominator. The friction share is k/(1+k), not k.'],
      ],
      v: [
        [($) => Math.sqrt(2 * G * $.s * Math.sin($.theta * DEG)), 'That is √(2gh), a slide with no spin. Divide the height by 1 + k before you take the square root.'],
      ],
    },
  },
  'ch11.slip': {
    traps: {
      a: [
        [($) => G * Math.sin($.theta * DEG), 'That drops the kinetic friction. Subtract μk g cosθ from g sinθ.'],
        [($) => (G * Math.sin($.theta * DEG)) / (1 + kOf($.shape)), 'That is the no-slip acceleration. This contact is slipping, so friction is μk N and it does not depend on k.'],
      ],
      alpha: [
        [($) => $.a / $.R, 'That sets α = a/R. The contact is slipping, so the center and the spin are not tied that way. Use α = fR/I.'],
        [($) => (2 * $.mu * G * Math.cos($.theta * DEG)) / $.R, 'That is the solid-cylinder formula, α = 2 μk g cosθ / R. Another shape has a different I.'],
      ],
    },
  },
  'ch11.rover': {
    traps: {
      v: [
        [($) => Math.sqrt(2 * $.g * $.h), 'That is a slide, √(2gh). A rolling body keeps some of the drop in the spin, so the center is slower.'],
        [($) => Math.sqrt($.g * $.h), 'That is the hoop, √(gh). A disk, a sphere, and a slide each have a different k.'],
      ],
      share: [
        [($) => 0, 'That leaves the spin out. The rotational fraction is k/(1+k), and it is zero only for a slide.'],
        [($) => 0.5, 'Half and half is the hoop, where k = 1. A disk keeps one third of the kinetic energy in the spin.'],
      ],
    },
  },
  'ch11.meteor': {
    traps: {
      Lz: [
        [($) => $.m * Math.hypot($.x, $.y) * $.vy, 'That uses the full distance as if it were perpendicular to the velocity. Only the x component is a lever arm here.'],
        [($) => -$.m * $.x * $.vy, 'That flips the sign. With vy downward and +z out of the page, Lz is negative.'],
      ],
      tau: [
        [($) => $.m * Math.hypot($.x, $.y) * $.ay, 'That uses the full distance as the lever arm. The force is along y, so the lever arm is x.'],
        [($) => -$.m * $.x * $.ay, 'That flips the sign. The torque is m x ay, and ay is already negative.'],
      ],
    },
  },
  'ch11.three': {
    traps: {
      Lz: [
        [($) => 30 * $.pScale, 'That drops the minus sign. Two of the three contributions point into the page, and they win.'],
        [($) => -36 * $.pScale, 'That leaves out the third particle, whose contribution is +6 times the scale.'],
      ],
      tau: [
        [($) => -30 * $.fScale, 'That copies the angular momentum, sign and all. The torque is a different sum, and here it points the other way.'],
        [($) => (6 + 40 + 16) * $.fScale, 'That makes every torque positive. Particle 3’s torque is negative.'],
      ],
    },
  },
  'ch11.arm': {
    traps: {
      Lempty: [
        [($) => (($.mArm * $.len * $.len) / 12 + $.mTip * $.len * $.len) * $.w, 'That is a rod about its center, mL²/12. This rod turns about one end, so the rod’s share is mL²/3.'],
        [($) => ($.mArm * $.len * $.len + $.mTip * $.len * $.len) * $.w, 'That drops the 1/3 on the rod. A thin rod about one end is mL²/3, and the point mass at the end is mL².'],
      ],
      Lrock: [
        [($) => $.Lempty, 'That leaves the second mass out. A point mass at the end adds mL².'],
        [($) => $.Lempty + (2 / 5) * $.mRock * $.len * $.len * $.w, 'That treats the extra mass as a sphere about its own center and then forgets the shift out to the end. The book’s model is a point mass, mL².'],
      ],
      tau: [
        [($) => (($.mArm * $.len * $.len) / 3 + ($.mTip + $.mRock) * $.len * $.len) * $.w / $.t, 'That includes the second mass. The spin-up in the question is the empty arm.'],
        [($) => $.Lempty * $.t, 'That multiplies by the time. From rest, α = ω/t, so the torque is Iω/t.'],
      ],
    },
  },
  'ch11.fly': {
    traps: {
      omega: [
        [($) => ($.rpm * Math.PI / 30) / $.factor, 'That divides by the added moment only. The first flywheel is still there, so the divisor is 1 + that factor.'],
        [($) => ($.rpm * Math.PI / 30) * $.factor, 'That multiplies by the factor. Adding inertia slows the pair down.'],
      ],
      lost: [
        [($) => 1 / (1 + $.factor), 'That is the fraction that remains. The lost fraction is one minus that.'],
        [($) => 0, 'Angular momentum of the pair is conserved. Kinetic energy is not. Friction between the wheels removes energy.'],
      ],
    },
  },
  'ch11.tuck': {
    traps: {
      omega: [
        [($) => $.w0 * ($.len0 / $.len), 'That leaves out the square. I goes as L², so the spin goes as (L0/L)².'],
        [($) => $.w0 * ($.len / $.len0) ** 2, 'That inverts the lengths. The shorter body spins faster.'],
      ],
      t: [
        [($) => $.h / $.g, 'That divides the height by g. The time of a drop from rest is √(2h/g).'],
        [($) => Math.sqrt((2 * $.h) / 9.81), 'That uses 9.81 m/s². This drop names its own g.'],
      ],
      revs: [
        [($) => $.w0 * $.t, 'That keeps the spin from before the tuck. The revolutions in the air use the faster tucked spin.'],
        [($) => $.omega * $.t * 2 * Math.PI, 'That turns rev/s into rad/s and then calls the result a revolution count. The spin was already in rev/s.'],
      ],
    },
  },
  'ch11.bullet': {
    traps: {
      L: [
        [($) => $.m * $.v, 'That is mv, the linear momentum. Angular momentum about the center is mvR.'],
        [($) => $.M * $.v * $.R, 'That uses the disk’s mass. Before the hit, only the bullet has momentum.'],
      ],
      omega: [
        [($) => $.v / $.R, 'That would be the spin if the rim moved at the bullet’s speed. The disk is much heavier, so the shared spin is far slower.'],
        [($) => ($.m * $.v) / ($.M * $.R), 'That uses I = MR² for the disk and leaves the bullet’s own mR² out. A solid disk is (1/2)MR².'],
      ],
    },
  },
  'ch11.precess': {
    traps: {
      omegaP: [
        [($) => ($.m * $.g * $.d * $.rev * 2 * Math.PI) / (0.5 * $.m * $.R * $.R), 'That multiplies by the spin. Precession goes as 1/ω, because a larger L is harder to turn.'],
        [($) => ($.m * $.g * $.d) / ($.m * $.R * $.R * $.rev * 2 * Math.PI), 'That uses I = mR², a hoop. A solid disk about its center is half of that, so the precession is twice as fast.'],
      ],
      period: [
        [($) => 1 / $.omegaP, 'That is 1/Ω, in seconds per radian. A full turn is 2π/Ω.'],
        [($) => 2 * Math.PI * $.omegaP, 'That multiplies by Ω. The period is 2π divided by the rate.'],
      ],
    },
  },
};
