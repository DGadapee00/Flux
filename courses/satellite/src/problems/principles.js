/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  ellipse: { name: 'An orbit is an ellipse with fixed energy', statement: 'a = (r_p + r_a)/2 from Earth’s centre, T = 2π√(a³/μ), and v² = μ(2/r − 1/a) at any radius.', cue: 'An orbit given by its perigee and apogee.', family: 'Orbits' },
  noise: { name: 'Noise power is kTB', statement: 'A receiver at system temperature T lets in noise k_B T B in a band B, whatever its resistance. What decides a link is S/N, or E_b/N_0 per bit: a narrower band or a colder receiver lowers the noise.', cue: 'A weak signal, a receiver, a bandwidth or a noise temperature.', family: 'Communications' },
  rotation: { name: 'A rotation keeps lengths and angles', statement: 'An attitude is a rotation matrix whose columns are the body axes written in the reference frame: R = R_z(ψ) R_y(θ) R_x(φ) for yaw, pitch and roll, and RᵀR = I.', cue: 'Where a body axis points after a sequence of turns.', family: 'Attitude' },
  'gimbal-lock': { name: 'Three angles can lock', statement: 'Angle rates follow from the body rate through a matrix with determinant cos θ. Near θ = ±90° they grow as 1/cos θ; at it yaw and roll share an axis and one direction of turn is lost. A quaternion never locks.', cue: 'Angle rates, a pitch near 90°, or choosing how to store an attitude.', family: 'Attitude' },
  kepler: { name: 'Equal areas in equal times', statement: 'The mean anomaly M = √(μ/a³) t grows steadily; the position comes from M = E − e sin E, solved numerically.', cue: 'Where a craft is a given time after perigee.', family: 'Orbits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
