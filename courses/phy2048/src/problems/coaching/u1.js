/**
 * Unit 1 coaching: for each template, the wrong value a named mistake gives (`traps`), a `why` for
 * each option of a choice that the template does not carry itself, and the hints that continue its
 * ladder. Folded into the bank by src/problems/index.js. A trap is [($) => wrongValue, 'what went wrong'].
 */
import { DEG } from '@flux/subjects/mechanics/vectors.js';
import { G } from '@flux/subjects/mechanics/constants.js';

const mod360 = (x) => ((x % 360) + 360) % 360;
const deg = (rad) => rad / DEG;

export default {
  // ---------- Chapter 1 ----------
  'ch1.convert': {
    hints: ['Write each factor so the unit you want to remove cancels: miles in the denominator to cancel miles, minutes in the numerator over seconds.'],
    traps: {
      v: [
        [($) => ($.d * 1609.344) / $.t, 'That is meters per minute. Minutes still have to become seconds: divide by 60 s in a minute as well.'],
        [($) => ($.d * 1609.344) / ($.t * 3600), 'That treats the minutes as hours. A minute is 60 seconds; 3600 s is an hour.'],
        [($) => ($.d * 1000) / ($.t * 60), 'A mile is not 1000 m. Kilometers are the ones with 1000 m: a mile is 1609 m.'],
      ],
      dkm: [
        [($) => $.d, 'That is still in miles. One mile is 1.609 km.'],
        [($) => $.d * 0.6214, 'That is the factor the other way round: 0.6214 converts kilometers to miles. A mile is longer than a kilometer.'],
      ],
    },
  },
  'ch1.prefix': {},
  'ch1.uncertainty': {
    hints: ['Half the range is (largest − smallest) divided by 2. The average is the sum divided by how many readings there are.'],
    traps: {
      avg: [
        [($) => ($.w1 + $.w2 + $.w3 + $.w4) / 3, 'There are four readings, so divide by four.'],
        [($) => (Math.max($.w1, $.w2, $.w3, $.w4) + Math.min($.w1, $.w2, $.w3, $.w4)) / 2, 'That is the middle of the range, not the average of the readings.'],
      ],
      delta: [
        [($) => Math.max($.w1, $.w2, $.w3, $.w4) - Math.min($.w1, $.w2, $.w3, $.w4), 'That is the whole range. The uncertainty here is half of it.'],
      ],
      pct: [
        [($) => $.delta / $.avg, 'That is the fraction. A percent is the fraction times 100.'],
        [($) => (2 * $.delta * 100) / $.avg, 'That uses the whole range as the uncertainty. Use half of it.'],
        [($) => ($.delta * 100) / $.w1, 'Divide by the best value, the average, not by the first reading.'],
      ],
    },
  },
  'ch1.dimensions': {},
  'ch1.fermi': {
    traps: {
      M: [
        [($) => $.M / 4, 'That is the area of a circle, π(d/2)², the disk Earth would cast as a shadow. The surface of the sphere is four times that: π d².'],
        [($) => $.M * 4, 'That puts the diameter into 4πr² as if it were the radius. Use π d², or 4π(d/2)².'],
      ],
      n: [
        [($) => Math.log10($.M) - 3, 'That uses a density of 1 kg/m³. Water is 1000 kg/m³, which is 1 g/cm³.'],
        [($) => Math.log10($.M) - 12, 'That puts the diameter in as megameters. Convert to meters first: 1 Mm is 10⁶ m.'],
      ],
    },
  },
  'ch1.sigfigs': {},

  // ---------- Chapter 2 ----------
  'ch2.magnitude': {
    hints: ['Square each component, add the squares, then take the square root of the total. Do all three components, in three dimensions.'],
    traps: {
      F: [
        [($) => Math.abs($.Fx) + Math.abs($.Fy) + Math.abs($.Fz), 'That adds the components. A vector’s length comes from squaring them, adding, and taking the root.'],
        [($) => Math.hypot($.Fx, $.Fy), 'That leaves out the z component. In three dimensions the length uses all three.'],
      ],
      alpha: [
        [($) => 90 - $.alpha, 'That is the angle from the other side: cos α = Fx/F, with a cosine, not the sine.'],
        [($) => deg(Math.atan2($.Fy, $.Fx)), 'That is the angle in the xy plane. The direction angle α is measured from the x axis to the vector itself.'],
      ],
      beta: [[($) => 90 - $.beta, 'cos β = Fy/F, with a cosine, not the sine.']],
      gamma: [[($) => 90 - $.gamma, 'cos γ = Fz/F, with a cosine, not the sine.']],
    },
  },
  'ch2.resultant': {
    hints: [
      String.raw`Resolve each force into components, add the x components and add the y components, then find the length and angle of the sum.`,
    ],
    traps: {
      R: [
        [($) => $.F1 + $.F2, 'That adds the magnitudes. Forces add as vectors, which counts the angle between them.'],
        [($) => Math.sqrt($.F1 ** 2 + $.F2 ** 2), 'That assumes a right angle between the forces. Use the actual angle.'],
      ],
      th: [
        [($) => mod360(deg(Math.atan(($.F1 * Math.sin($.a1 * DEG) + $.F2 * Math.sin($.a2 * DEG)) / ($.F1 * Math.cos($.a1 * DEG) + $.F2 * Math.cos($.a2 * DEG))))), 'The arctangent alone cannot tell the quadrant. Look at the signs of the two components of the sum.'],
        [($) => mod360(90 - $.th), 'That measures the angle from the +y axis. The question measures from +x.'],
      ],
    },
  },
  'ch2.along': {
    hints: ['The vector from A to B is B minus A, coordinate by coordinate. Its length is the distance.'],
    traps: {
      L: [
        [($) => Math.abs($.bx - $.ax) + Math.abs($.by - $.ay) + Math.abs($.bz - $.az), 'That adds the coordinate differences. The distance is the root of the sum of their squares.'],
      ],
      ux: [
        [($) => $.bx - $.ax, 'That is the displacement’s x component. A unit vector has length 1: divide by the distance.'],
        [($) => $.bx / Math.hypot($.bx, $.by, $.bz), 'That is the unit vector along B’s position, from the origin. You need the one along A to B.'],
      ],
      uy: [[($) => $.by - $.ay, 'That is the displacement’s y component. Divide by the distance to make it a unit vector.']],
      uz: [[($) => $.bz - $.az, 'That is the displacement’s z component. Divide by the distance to make it a unit vector.']],
    },
  },
  'ch2.between': {
    hints: ['Find a·b from the components, then |a| and |b|, then solve a·b = |a||b| cos θ for θ.'],
    traps: {
      theta: [
        [($) => deg(Math.asin(Math.min(1, Math.hypot(($.ay * $.bz - $.az * $.by), ($.az * $.bx - $.ax * $.bz), ($.ax * $.by - $.ay * $.bx)) / (Math.hypot($.ax, $.ay, $.az) * Math.hypot($.bx, $.by, $.bz))))), 'The sine cannot tell an obtuse angle from its acute partner. Use the cosine: the dot product has the sign.'],
        [($) => $.theta * DEG, 'That is in radians. The answer is wanted in degrees.'],
      ],
    },
  },
  'ch2.product': {
    hints: ['The size of the cross product is |a||b| sin θ. Or take the components of a × b from the determinant and find its length.'],
    traps: {
      M: [
        [($) => $.ax * $.bx + $.ay * $.by + $.az * $.bz, 'That is the dot product. The cross product comes from different combinations of components.'],
        [($) => Math.hypot($.ax, $.ay, $.az) * Math.hypot($.bx, $.by, $.bz), 'That is |a||b| with no angle. Multiply by sin θ for the cross product.'],
      ],
    },
  },
  'ch2.pointer': {
    traps: {
      Dx: [[($) => $.x1 - $.x2, 'The displacement is final minus initial, not the other way round.']],
      Dy: [[($) => $.y1 - $.y2, 'The displacement is final minus initial, not the other way round.']],
      D: [[($) => Math.abs($.Dx) + Math.abs($.Dy), 'That adds the components. The length comes from the root of the sum of squares.']],
      th: [
        [($) => mod360(deg(Math.atan($.Dy / $.Dx))), 'The arctangent alone gives an angle between −90° and 90°. If Dx is negative, the vector points into the second or third quadrant: add 180°.'],
        [($) => mod360(deg(Math.atan2($.Dx, $.Dy))), 'That swaps x and y: the angle from +x uses Dy over Dx.'],
      ],
    },
  },
  'ch2.three': {
    traps: {
      Rx: [[($) => $.A * Math.sin($.a * DEG) + $.B * Math.sin($.b * DEG) + $.C * Math.sin($.c * DEG), 'That uses the sines. With the angle measured from +x, the x component is the magnitude times the cosine.']],
      Ry: [[($) => $.A * Math.sin($.a * DEG) + $.B * Math.sin(Math.abs($.b) * DEG) + $.C * Math.sin($.c * DEG), 'That drops the minus sign on B’s angle. A vector below the axis has a negative y component.']],
      R: [[($) => $.A + $.B + $.C, 'That adds the magnitudes. The vectors point in different directions, so add components.']],
      th: [[($) => mod360(deg(Math.atan($.Ry / $.Rx))), 'Check the quadrant: the arctangent alone only gives angles between −90° and 90°.']],
    },
  },
  'ch2.tug': {
    traps: {
      Dx: [[($) => -$.Dx, 'That is the resultant of the three pulls. The fourth dog pulls the opposite way.']],
      Dy: [[($) => -$.Dy, 'That is the resultant of the three pulls. The fourth dog pulls the opposite way.']],
      D: [[($) => $.A + $.B + $.C, 'That adds the three magnitudes. The pulls are in different directions: add components.']],
      th: [
        [($) => mod360($.th + 180), 'That is the direction of the three pulls’ resultant. The fourth dog pulls against it.'],
        [($) => mod360(deg(Math.atan($.Dy / $.Dx))), 'The arctangent alone gives the wrong quadrant when both components are negative. Add 180°.'],
      ],
    },
  },
  'ch2.concept-quantity': {},
  'ch2.concept-products': {},
  'ch2.concept-sum': {},

  // ---------- Chapter 3 ----------
  'ch3.average': {
    hints: ['Write the three positions on a line. The net change gives the velocity, and the sizes of each leg give the distance.'],
    traps: {
      vAvg: [
        [($) => $.speed, 'That is the average speed: total path over time. Average velocity uses the net displacement.'],
        [($) => ((($.xb - $.xa) / $.t1) + (($.xc - $.xb) / $.t2)) / 2, 'That averages the two leg velocities. The legs take different times, so use net displacement over total time.'],
      ],
      speed: [
        [($) => Math.abs(($.xc - $.xa) / ($.t1 + $.t2)), 'That is the size of the average velocity. The speed counts the whole path, including any part going back.'],
        [($) => (Math.abs(($.xb - $.xa) / $.t1) + Math.abs(($.xc - $.xb) / $.t2)) / 2, 'That averages the two leg speeds. Divide the total path by the total time instead.'],
      ],
    },
  },
  'ch3.const': {
    hints: ['List what you know: x₀, v₀, a and t. Each of v = v₀ + at and x = x₀ + v₀t + ½at² uses exactly those.'],
    traps: {
      x: [
        [($) => $.x0 + $.v0 * $.t, 'That leaves out the acceleration term, ½at².'],
        [($) => $.x0 + $.v0 * $.t + $.a * $.t * $.t, 'The acceleration term has a factor ½: x = x₀ + v₀t + ½at².'],
      ],
      v: [
        [($) => $.v0 + 0.5 * $.a * $.t, 'There is no ½ in v = v₀ + at. The ½ belongs to the position formula.'],
        [($) => $.v0 + $.a, 'The acceleration is per second: multiply it by the time.'],
      ],
    },
    why: {
      pace: {
        up: 'Right when the velocity and acceleration have the same sign, or when it starts from rest.',
        down: 'It slows down only when the acceleration points against the velocity.',
        neither: 'It is only “neither” when the acceleration is zero. Any nonzero acceleration changes the speed.',
      },
    },
  },
  'ch3.stop': {
    hints: ['At the stop v = 0. Take the acceleration as negative, because it points against the motion.'],
    traps: {
      t: [[($) => $.v0 / $.a, 'A negative time. With a negative acceleration, t = −v₀/a is positive.']],
      x: [
        [($) => ($.v0 * $.v0) / (2 * $.a), 'The distance cannot be negative: with a negative a, the distance is −v₀²/(2a).'],
        [($) => ($.v0 * $.v0) / -$.a, 'The distance is v₀²/(2a): you dropped the 2 that comes from the ½ in the position formula.'],
      ],
    },
  },
  'ch3.drop': {
    hints: ['Dropped from rest means v₀ = 0. Pick the formula that has the height and the final speed and no time.'],
    traps: {
      v: [
        [($) => Math.sqrt($.h * G), 'You dropped the 2: v² = 2gh.'],
        [($) => 2 * G * $.h, 'That is v², not v. Take the square root.'],
      ],
      t: [
        [($) => Math.sqrt($.h / G), 'You dropped the 2: h = ½gt² gives t = √(2h/g).'],
        [($) => $.h / $.v, 'That treats the speed as constant at its final value. The ball speeds up the whole way, so it takes longer.'],
      ],
    },
  },
  'ch3.toss': {
    hints: ['At the top v = 0. The time down equals the time up, since the acceleration is the same −g both ways.'],
    traps: {
      h: [
        [($) => ($.v0 * $.v0) / G, 'You dropped the 2: v² = v₀² − 2gh gives h = v₀²/(2g).'],
        [($) => $.v0 * $.tTop, 'That treats the speed as constant at v₀ all the way up. It falls to zero at the top, so the average is v₀/2.'],
      ],
      tTop: [[($) => $.v0 * G, 'That multiplies. The time is the speed to lose divided by how fast it is lost: v₀/g.']],
      tBack: [
        [($) => $.tTop, 'That is only the climb. The ball also has to come back down.'],
        [($) => 4 * $.tTop, 'The fall takes as long as the climb, so the whole trip is twice the climb, not four times.'],
      ],
    },
  },
  'ch3.legs': {
    traps: {
      disp: [
        [($) => $.dist, 'That is the distance walked. The displacement is the change in position, from start to end.'],
        [($) => $.x4 - $.x3, 'That is the last leg only. The displacement is the end position minus the start.'],
      ],
      vAvg: [
        [($) => $.dist / ($.t1 + $.t2 + $.t3 + $.t4), 'That is the average speed. Average velocity uses the net displacement.'],
        [($) => ($.x1 / $.t1 + ($.x2 - $.x1) / $.t2 + ($.x3 - $.x2) / $.t3 + ($.x4 - $.x3) / $.t4) / 4, 'That averages the four leg velocities. The legs take different times, so divide the total displacement by the total time.'],
      ],
      dist: [
        [($) => Math.abs($.x4), 'That is how far she ended from home. The distance counts every leg.'],
        [($) => Math.abs($.x1) + Math.abs($.x2) + Math.abs($.x3) + Math.abs($.x4), 'That adds the positions. Add the sizes of the changes between them: each leg is a difference.'],
      ],
    },
  },
  'ch3.slopes': {
    traps: {
      v1: [[($) => $.xa / ($.ta + $.tb), 'Use only the time of this stage, the interval the position changes over.']],
      v2: [[($) => $.v1, 'The cart is not moving in this stage: the position does not change, so the slope is zero.']],
      v3: [
        [($) => $.xc / $.tc, 'That uses the final position, not the change in position over the stage.'],
        [($) => ($.xc - $.xa) / ($.ta + $.tb + $.tc), 'Divide by the time of this stage, not the whole trip.'],
      ],
      dist: [[($) => Math.abs($.xc), 'That is how far the cart ends from the start. The distance counts the trip out as well as back.']],
    },
  },
  'ch3.racehorse': {
    traps: {
      a: [
        [($) => $.mag, 'Look at the direction: with east positive, a push toward the west is negative.'],
        [($) => $.v * $.t, 'That multiplies. Acceleration is the change in velocity divided by the time.'],
      ],
      mag: [
        [($) => $.v * $.t, 'That multiplies. Acceleration is the change in velocity divided by the time.'],
        [($) => $.t / $.v, 'That is upside down: the change in velocity goes on top.'],
      ],
    },
  },
  'ch3.reaction': {
    traps: {
      reaction: [[($) => ($.v0 * $.tr) / 2, 'The car is not slowing during the reaction. It holds its speed, so the distance is v₀ t, not half of it.']],
      braking: [[($) => ($.v0 * $.v0) / $.a, 'You dropped the 2: v₀² = 2a d gives d = v₀²/(2a).']],
      total: [
        [($) => $.braking, 'That is the braking distance only. The car also covers distance during the reaction time.'],
        [($) => $.braking + ($.v0 * $.tr) / 2, 'The reaction distance is v₀ t_r in full: the car does not slow until the brake is on.'],
      ],
      tTotal: [[($) => $.v0 / $.a, 'That is the braking time only. Add the reaction time.']],
    },
  },
  'ch3.throwdown': {
    traps: {
      t: [
        [($) => Math.sqrt((2 * $.h) / G), 'That drops the ball from rest. It was thrown down, so it starts with speed v₀ and takes less time.'],
        [($) => (-$.v0 - Math.sqrt($.v0 * $.v0 + 2 * G * $.h)) / G, 'That is the negative root: a time before the throw. Take the positive one.'],
      ],
      v: [
        [($) => -$.v, 'Check the sign: with +y upward, a ball moving down has a negative velocity.'],
        [($) => -Math.sqrt(2 * G * $.h), 'That ignores the throw: the ball started with speed v₀ already.'],
      ],
    },
  },
  'ch3.hangtime': {
    traps: {
      v0: [
        [($) => G * $.T, 'The climb takes only half the hang time. v₀ = g(T/2).'],
        [($) => $.T / G, 'That divides. Velocity lost is g times the time.'],
      ],
      h: [[($) => ($.v0 * $.v0) / G, 'You dropped the 2: h = v₀²/(2g).']],
      tTop: [[($) => $.T, 'That is the whole hang time. The top is half way.']],
      vEnd: [
        [($) => $.v0, 'Check the sign: coming down, the velocity is negative with +y upward.'],
        [() => 0, 'The ball is still moving when it is caught. Its velocity is zero only at the top.'],
      ],
      aTop: [
        [() => 0, 'The velocity is zero at the top, but the acceleration is not. It is −g the whole flight.'],
        [() => G, 'The sign: the acceleration points down, and +y is up.'],
      ],
    },
  },
  'ch3.piecewise': {
    traps: {
      vEnd: [[($) => $.v0 + $.a1 + $.a2 + $.a3 + $.a4, 'Each acceleration acts for 1.5 s. Multiply by the time before adding.']],
      disp: [
        [($) => $.dist, 'That is the distance. The displacement counts the part of the motion in the negative direction as negative.'],
        [($) => $.v0 * 6 + 0.5 * (($.a1 + $.a2 + $.a3 + $.a4) / 4) * 36, 'That uses one average acceleration in x = v₀t + ½at². That formula is only for a constant a, so work stage by stage.'],
      ],
      dist: [[($) => Math.abs($.disp), 'That is the size of the displacement. The distance adds every stretch of path, so it counts the part where the velocity is negative as positive.']],
    },
  },
  'ch3.integrate': {
    traps: {
      v2: [
        [($) => $.v0 - $.k * 4, 'That takes the acceleration at 2 s, −2k, and uses it as if it were constant for the whole 2 s. The acceleration grows from zero, so integrate: v = v₀ − ½kt².'],
        [($) => $.v0 - ($.k * 8) / 3, 'The integral of t is t²/2, not t³/3.'],
      ],
      tStop: [
        [($) => Math.sqrt($.v0 / $.k), 'You dropped the 2: v = 0 gives ½kt² = v₀, so t = √(2v₀/k).'],
        [($) => $.v0 / $.k, 'That treats −kt as a constant acceleration: v = v₀ − kt would stop at v₀/k. The acceleration grows with t, so the velocity changes as t².'],
      ],
      xStop: [
        [($) => $.v0 * $.tStop, 'That ignores the slowing: the boat does not hold v₀ the whole time.'],
        [($) => $.v0 * $.tStop - ($.k * $.tStop ** 3) / 2, 'The integral of ½kt² is kt³/6, not kt³/2.'],
      ],
    },
  },
  'ch3.chase': {
    traps: {
      t: [
        [($) => $.vg / $.a, 'That is when the cheetah reaches the gazelle’s speed. It is still behind then. It catches it later.'],
        [($) => (2 * $.vg) / $.a, 'That ignores the head start. The cheetah has to close that gap as well.'],
      ],
      x: [
        [($) => $.vg * $.t, 'The gazelle also had a head start. The cheetah’s displacement is the gazelle’s plus the gap.'],
        [($) => $.vc * $.t, 'That uses the final speed for the whole run. The cheetah started from rest, so its average speed is half the final.'],
      ],
      vc: [
        [($) => $.vg, 'At the catch the cheetah is faster than the gazelle. It had to be, to close the gap.'],
        [($) => $.vc / 2, 'That is the cheetah’s average speed over the run, not its speed at the catch.'],
      ],
    },
  },
  'ch3.concept-signs': {},
  'ch3.concept-top': {},
  'ch3.concept-table': {},
};
