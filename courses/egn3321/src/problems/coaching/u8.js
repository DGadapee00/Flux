/**
 * Unit 8 coaching: numeric `traps` for each template (the wrong value a known mistake produces, and
 * what the mistake was). Folded into the bank by src/problems/index.js. Values inside `$` are SI,
 * except the bat's pitch, in mph.
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { batHit, strikeBar } from '@flux/subjects/mechanics/rigid-momentum.js';

const DEG = Math.PI / 180;
const MPH = 0.44704;
const K = { hoop: 1, disk: 0.5, sphere: 0.4 };

export default {
  'u8.19.momentum': {
    traps: {
      HG: [
        [($) => (K[$.shape] + 1) * $.m * $.R * $.v, 'That uses the moment of inertia about the contact point. About G, H_G = I_G ω.'],
        [($) => $.m * $.v * $.R, 'That is only the moment of the linear momentum. About G that term is zero: r_G/G = 0. What is left is I_G ω.'],
      ],
      HP: [
        [($) => K[$.shape] * $.m * $.R * $.v, 'That is H about G. About the contact point, add the moment of the linear momentum, m v R.'],
        [($) => $.m * $.v * $.R, 'That is only m v R. The body also spins about G, which adds I_G ω.'],
      ],
    },
  },
  'u8.19.angular-impulse': {
    traps: {
      q: [
        [($) => {
          const I = 0.5 * $.m * $.R * $.R;
          return $.find === 'w2' ? $.w1 + ($.M * $.t) / I : (I * ($.wTarget - $.w1)) / $.M;
        }, 'That leaves out the bearing friction. Its moment opposes the motor for the whole interval: use M − M_f.'],
        [($) => {
          const I = $.m * $.R * $.R;
          return $.find === 'w2' ? $.w1 + (($.M - $.Mf) * $.t) / I : (I * ($.wTarget - $.w1)) / ($.M - $.Mf);
        }, 'That uses m R², a hoop. A solid disk has I = ½ m R².'],
      ],
    },
  },
  'u8.19.spin': {
    traps: {
      q: [
        [($) => {
          if ($.find === 'w2') return ($.w1 * $.r1) / $.r2;
          return ($.r1 * $.w1) / $.w2;
        }, 'That scales with r, as if H were m r v of one particle at a fixed speed. The masses enter I as r², alongside the body’s own I₀.'],
        [($) => {
          if ($.find === 'w2') return ($.w1 * (2 * $.m * $.r1 * $.r1)) / (2 * $.m * $.r2 * $.r2);
          return Math.sqrt((2 * $.m * $.r1 * $.r1 * $.w1) / $.w2 / (2 * $.m));
        }, 'That leaves out the body’s own I₀. It turns too, and its inertia does not change.'],
      ],
      work: [
        [() => 0, 'Kinetic energy is not kept here. H is kept, so T = H²/2I changes as I does; the arms do that work.'],
        [($) => {
          const I1 = $.I0 + 2 * $.m * $.r1 * $.r1;
          return -0.5 * I1 * $.w1 * $.w1 * 0.5;
        }, 'Check the sign: pulling in raises the kinetic energy, so the arms do positive work.'],
      ],
    },
  },
  'u8.19.ballistic-bar': {
    traps: {
      w: [
        [($) => ($.mb * $.u) / (($.M + $.mb) * $.dFrac * $.L), 'That keeps linear momentum. The pin pushes on the bar during the blow, so only angular momentum about the pin is kept.'],
        [($) => ($.mb * $.u * $.dFrac * $.L) / (($.M * $.L * $.L) / 12 + $.mb * ($.dFrac * $.L) ** 2), 'That uses I_G = ML²/12, about the bar’s centre. The bar turns about the pin: I_O = ML²/3.'],
      ],
      theta: [
        [($) => {
          const IO = ($.M * $.L * $.L) / 3;
          const d = $.dFrac * $.L;
          const w = ($.mb * $.u * d) / (IO + $.mb * d * d);
          const c = 1 - (0.5 * (IO + $.mb * d * d) * w * w) / ($.M * G * $.L);
          return Math.acos(Math.max(-1, c)) / DEG;
        }, 'The bar’s centre rises by (L/2)(1 − cos θ), not L(1 − cos θ).'],
        [($) => {
          const d = $.dFrac * $.L;
          const v = $.u;
          const c = 1 - (v * v) / (2 * G * d);
          return Math.acos(Math.max(-1, c)) / DEG;
        }, 'That gives the bar the bullet’s whole kinetic energy. Most of it is lost in the embedding; only what is left after the blow lifts the bar.'],
      ],
    },
  },
  'u8.19.strike': {
    traps: {
      w: [
        [($) => ($.m * $.u * (1 + $.e)) / (($.M * $.L) / 2 + $.m * $.dFrac * $.L), 'That keeps linear momentum. The pin acts during the blow; keep angular momentum about the pin instead.'],
        [($) => ($.m * $.u * $.dFrac * $.L) / (($.M * $.L * $.L) / 3 + $.m * ($.dFrac * $.L) ** 2), 'That is the plastic case, e = 0. With restitution the bar gets (1 + e) times as much.'],
      ],
      v: [
        [($) => strikeBar({ M: $.M, L: $.L, m: $.m, u: $.u, d: $.dFrac * $.L, e: $.e }).w * $.dFrac * $.L + $.e * $.u, 'Check the sign in the restitution: the struck point pulls away from the ball, ω d − v = e u, so v = ω d − e u.'],
        [($) => -$.e * $.u, 'That treats the bar as a wall. It recoils, so the ball leaves at ω d − e u.'],
      ],
      J: [
        [() => 0, 'The pin gives no impulse only at the centre of percussion, 2L/3. Elsewhere it does.'],
        [($) => -strikeBar({ M: $.M, L: $.L, m: $.m, u: $.u, d: $.dFrac * $.L, e: $.e }).J, 'Check the sign: J = Mω L/2 + m v − m u, positive along the ball’s path.'],
      ],
    },
  },
  'u8.19.percussion': {
    traps: {
      d: [
        [($) => {
          if ($.body === 'bob') return ($.M * ($.L / 2) + $.mb * $.L) / ($.M + $.mb);
          return $.L / 2;
        }, 'That is the mass centre. Struck there, the bar would translate, and the pin must stop its top: the pin feels a blow.'],
        [($) => ($.body === 'rod' ? $.L : (2 * $.L) / 3), ($) => ($.body === 'rod' ? 'That is the rod’s end. The centre of percussion of a uniform rod is at 2L/3.' : 'That is a bare rod’s answer. This body has a different I_O and mass centre: d = I_O/(M r̄).')],
      ],
    },
  },
  'u8.19.free-bar': {
    traps: {
      vG: [
        [($) => ($.m * $.u * (1 + $.e)) / ($.m + $.M), 'That ignores the spin. Struck off centre, the bar gives way by turning, so it takes a smaller impulse.'],
        [($) => ($.m * $.u) / $.M, 'That gives the bar all the ball’s momentum. The ball keeps some, and the restitution decides how much.'],
      ],
      w: [
        [() => 0, 'Struck off its centre, the bar must spin: P a = I_G ω.'],
        [($) => {
          const c = strikeBar({ M: $.M, L: $.L, m: $.m, u: $.u, d: $.L / 2 + $.armFrac * $.L, e: $.e, pinned: false });
          return Math.abs(c.w) * 4;
        }, 'That uses I = ML²/3, about an end. A free bar turns about its centre: I_G = ML²/12.'],
      ],
    },
  },
  'u8.19.bat': {
    traps: {
      v: [
        [($) => 0.5 * ($.w0 * $.dFrac * $.L + $.u * MPH), 'That treats the bat as an immovable wall, v = e × closing speed. The bat recoils, and its own speed adds: v = ω₁ d + e(ω₀ d + u).'],
        [($) => batHit({ I: ($.M * $.L * $.L) / 3, M: $.M, xbar: $.L / 2, m: 0.145, u: -$.u * MPH, w0: $.w0, e: 0.5, d: $.dFrac * $.L }).v, 'That takes the closing speed as the bat’s speed minus the pitch’s. They move toward each other, so the closing speed is ω₀d + u.'],
      ],
      J: [
        [() => 0, 'The hands feel no impulse only at the centre of percussion, 2L/3 for this uniform bat.'],
        [($) => -batHit({ I: ($.M * $.L * $.L) / 3, M: $.M, xbar: $.L / 2, m: 0.145, u: $.u * MPH, w0: $.w0, e: 0.5, d: $.dFrac * $.L }).J, 'Check the sign: positive toward the pitcher.'],
      ],
    },
  },
  'u8.19.embed-sym': {
    traps: {
      w: [
        [($) => ($.m * $.u) / (($.M + $.m) * $.d), 'That keeps linear momentum. The pin pushes on the bar during the impact; keep angular momentum about the pin instead.'],
        [($) => ($.m * $.u * $.d) / (($.M * $.L * $.L) / 12 + $.m * $.d * $.d), 'That uses I_G = ML²/12. The bar turns about the pin: I_O = ML²/3.'],
      ],
    },
  },
};
