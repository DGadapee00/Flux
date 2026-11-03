/**
 * Unit 6 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
const DEG = Math.PI / 180;
const G = 9.81;

const rodEnd = (m, L) => (m * L * L) / 3;
const rodCenter = (m, L) => (m * L * L) / 12;

export default {
  'ch10.spin': {
    traps: {
      omega: [
        [($) => $.w0Used + 0.5 * $.alpha * $.t, 'That keeps the 1/2 from the angle formula. Angular velocity is ω0 + αt, with no 1/2.'],
        [($) => $.alpha * $.t, 'That drops ω0. Add the angular velocity the wheel already had. From rest, ω0 is zero.'],
      ],
      revs: [
        [($) => $.theta, 'That is the angle in radians. A revolution is 2π radians, so divide the angle by 2π.'],
        [($) => $.theta / 360, 'That treats the radian measure as if it were degrees. Divide by 2π, not by 360.'],
      ],
    },
  },
  'ch10.stop': {
    traps: {
      t: [
        [($) => $.w0 / $.a, 'That keeps a negative sign on the time. α is negative and ω0 is positive, so t = −ω0/α comes out positive.'],
        [($) => $.w0 * $.alpha, 'That multiplies ω0 by α. The time to stop is the speed divided by the size of the acceleration.'],
      ],
      theta: [
        [($) => $.w0 * $.t, 'That is ω0 t. While the wheel slows to a stop, the ½αt² term removes half of that, so the angle is ½ ω0 t.'],
        [($) => ($.w0 * $.w0) / $.alpha, 'That drops the 2. The angle turned while stopping is ω0² / (2|α|).'],
      ],
    },
  },
  'ch10.wind': {
    traps: {
      alphaAvg: [
        [($) => (-2 * $.w0) / $.T, 'That is α at the start of the stop, twice the average. The average is (0 − ω0)/T.'],
        [($) => $.w0 / $.T, 'The rotor is slowing down, so the average angular acceleration is negative.'],
      ],
      alphaNow: [
        [($) => $.alphaAvg, 'That is the average over the whole stop. Instantaneous α is −(2ω0/T)(1 − t/T), and it equals the average only at the midpoint.'],
        [($) => (-2 * $.w0) / $.T, 'That is α at the start. Multiply by the fraction of the shutdown that is still left.'],
      ],
      omega: [
        [($) => $.w0 * (1 - $.frac), 'That leaves out the square. This shutdown falls as the square of the time that remains.'],
      ],
    },
  },
  'ch10.rim': {
    traps: {
      at: [
        [($) => $.R * (-$.rpm / $.Tstop), 'That uses rpm as if it were rad/s. Convert with 2π/60 before you divide by the stopping time.'],
        [($) => Math.abs($.at), 'Slowing down makes the tangential acceleration negative. The size is a different report from the signed value.'],
      ],
      ac: [
        [($) => $.R * $.w0 * $.w0, 'That uses the angular velocity at the start. Centripetal acceleration uses ω at the instant you were asked.'],
        [($) => ($.omega * $.omega) / $.R, 'That is ω²/R. The speed is ωR, so v²/R is Rω². The radius multiplies, it does not divide.'],
      ],
      a: [
        [($) => Math.abs($.at) + $.ac, 'The tangential and centripetal parts are perpendicular. Add the squares, then take the square root.'],
      ],
    },
  },
  'ch10.heli': {
    traps: {
      I: [
        [($) => ($.n * $.mBlade * $.L * $.L) / 12, 'That is a rod about its center. A blade pivoted at one end is mL²/3, four times larger.'],
        [($) => $.n * $.mBlade * $.L * $.L, 'That drops the 1/3. A thin rod about one end is mL²/3.'],
      ],
      Krot: [
        [($) => 0.5 * $.I * $.rpm * $.rpm, 'That squares the spin in rpm. Convert to rad/s with 2π/60 before you square it.'],
        [($) => $.I * $.omega, 'That is the angular momentum Iω. Rotational kinetic energy is ½Iω².'],
      ],
      Ktrans: [
        [($) => $.mHeli * $.vUsed, 'That is Mv. Translational kinetic energy is ½Mv².'],
        [($) => 0.5 * $.mHeli * $.v * $.v, 'That keeps a flight speed during a hover. A hover has no translational kinetic energy.'],
      ],
    },
  },
  'ch10.rod': {
    traps: {
      Icm: [
        [($) => rodEnd($.m, $.Lused), 'That is the end, mL²/3. The center is mL²/12.'],
        [($) => $.m * $.Lused * $.Lused, 'That drops the 1/12. The center of a thin rod is mL²/12.'],
      ],
      Iend: [
        [($) => $.Icm, 'That leaves the axis at the center. Move it with the parallel-axis theorem: add m(L/2)².'],
        [($) => $.Icm - $.m * ($.Lused / 2) ** 2, 'The parallel-axis theorem adds md². Subtracting sends the moment the wrong way, and it can go negative.'],
      ],
    },
  },
  'ch10.pair': {
    traps: {
      Ifar: [
        [($) => rodCenter($.mRod, $.L) + 0.4 * $.mSphere * $.R * $.R + $.mSphere * $.L * $.L, 'That takes the rod about its center, and it places the sphere a distance L from the axis instead of L + R.'],
        [($) => rodEnd($.mRod, $.L) + $.mSphere * ($.L + $.R) ** 2, 'That is the rod and the parallel-axis shift. The sphere also has its own (2/5)mR² about its center.'],
      ],
      Inear: [
        [($) => rodEnd($.mRod, $.L), 'That is only the rod. The sphere adds (2/5)mR² + mR² about the near end.'],
        [($) => rodEnd($.mRod, $.L) + 0.4 * $.mSphere * $.R * $.R, 'That keeps the sphere\'s own moment and forgets mR², the shift from the sphere\'s center out to the axis.'],
      ],
    },
  },
  'ch10.torque': {
    traps: {
      tau: [
        [($) => $.r * $.F * Math.cos($.phiUsed * DEG), 'That uses cosine. Torque is r F sin φ, with φ the angle between the lever arm and the force.'],
        [($) => $.r * $.F, 'That is rF, which holds only for a perpendicular force. At any other angle, multiply by sin φ.'],
      ],
    },
  },
  'ch10.net': {
    traps: {
      tauA: [
        [($) => $.F1, 'That drops the 4.0 m lever arm. This force is perpendicular, so its torque is 4.0 times F.'],
        [($) => 4 * $.F1 * (Math.PI / 2), 'That multiplies by the angle in radians. A right angle has sine 1, so the torque is rF.'],
      ],
      tauNet: [
        [($) => {
          const angled = $.which === 'square' ? 0 : 5 * $.F3 * Math.sin(53 * DEG) + $.F4 * Math.sin(30 * DEG);
          return 4 * $.F1 + 3 * $.F2 + angled;
        }, 'That makes every torque positive. The 3.0 m force is clockwise, so its torque is subtracted.'],
        [($) => {
          const angled = $.which === 'square' ? 0 : 5 * $.F3 * Math.cos(53 * DEG) + $.F4 * Math.cos(30 * DEG);
          return 4 * $.F1 - 3 * $.F2 + angled;
        }, 'That uses cosine on the angled forces. The component that produces a torque is F sin φ.'],
      ],
    },
  },
  'ch10.merry': {
    traps: {
      alphaBare: [
        [($) => $.F / $.m, 'That is F/m, a linear acceleration. The angular acceleration is the torque RF divided by ½mR².'],
        [($) => $.F / ($.m * $.R), 'That uses I = mR², a hoop. A solid disk about its center is ½mR², so α is twice as large.'],
      ],
      alpha: [
        [($) => $.alphaBare, 'That leaves the child out. Add the child as a point mass mr² before you divide the torque by I.'],
        [($) => ($.R * $.F) / (0.5 * $.m * $.R * $.R + 0.5 * $.rider * $.riderAt * $.riderAt), 'That treats the child as a small disk, with a 1/2. A child standing on the platform is a point mass, mr².'],
      ],
    },
  },
  'ch10.pulley': {
    traps: {
      a: [
        [($) => (($.m2 - $.m1) * G) / ($.m1 + $.m2), 'That is the light-pulley Atwood machine. A disk pulley adds ½ mp to the denominator.'],
        [($) => (($.m2 - $.m1) * G) / ($.m1 + $.m2 + $.mpUsed), 'That adds the whole pulley mass. For a disk, I/R² is half the pulley mass, not all of it.'],
      ],
      T1: [
        [($) => $.m1 * G, 'That is the weight, as if the mass were hanging at rest. The rising mass has T = m(g + a).'],
        [($) => $.m1 * (G - $.a), 'That is the form for the descending mass. The lighter mass is rising, so the tension is m(g + a).'],
      ],
      T2: [
        [($) => $.m2 * G, 'That is the weight of the descending mass. It is accelerating downward, so T = m(g − a), less than the weight.'],
        [($) => $.T1, 'The two sides share one tension only when the pulley is light, and even then you still have to compute that shared value. A massive pulley makes the two tensions different.'],
      ],
    },
  },
  'ch10.work': {
    traps: {
      omega: [
        [($) => (2 * $.W) / $.I, 'That drops the square root. From rest, ½Iω² = W, so ω = √(2W/I).'],
        [($) => $.W / $.I, 'That is W/I, which equals ½ω². Take the square root after doubling, not before.'],
      ],
      W: [
        [($) => $.F * $.R, 'That product is the torque, in N·m. The work is the force times the distance the rope moves.'],
        [($) => ($.F * $.dUsed) / $.R, 'That divides the rope distance by the radius, which turns it into an angle. The work of this tangent force is F times the rope distance.'],
      ],
    },
  },
  'ch10.power': {
    traps: {
      omega: [
        [($) => ($.told === 'rpm' ? $.rpm : $.w), 'Revolutions per minute are not rad/s. Multiply rpm by 2π/60. A value already in rad/s stays as it is.'],
        [($) => ($.told === 'rpm' ? $.rpm * Math.PI : $.w * 60), 'That multiplies rpm by π and leaves the 60 of the minute in place. The factor is 2π/60.'],
      ],
      tau: [
        [($) => $.P / ($.told === 'rpm' ? $.rpm : $.w / (2 * Math.PI)), 'That divides by rpm, or by revolutions per second. Power is τω with ω in rad/s.'],
        [($) => $.P * $.omega, 'Power is the product τω. The torque is the power divided by ω.'],
      ],
    },
  },
  'ch10.flywheel': {
    traps: {
      omega: [
        [($) => Math.sqrt((2 * $.tau * $.revs) / $.I), 'That uses the revolution count as if it were the angle in radians. Multiply the revolutions by 2π first.'],
        [($) => ($.tau / $.I) * $.revs, 'That is α times a number of revolutions. ω² = ω0² + 2αθ, and θ is in radians.'],
      ],
      W: [
        [($) => $.tau * $.revs, 'That multiplies the torque by the number of revolutions. The angle in τθ is in radians, so multiply by 2π as well.'],
        [($) => 0.5 * $.I * $.omega * $.omega, 'That is the kinetic energy at the end. If the flywheel was already turning, the work is only the gain, ½Iω² − ½Iω0².'],
      ],
    },
  },
};
