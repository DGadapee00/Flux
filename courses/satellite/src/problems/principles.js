/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  ellipse: { name: 'An orbit is an ellipse with fixed energy', statement: 'a = (r_p + r_a)/2 from Earth’s centre, T = 2π√(a³/μ), and v² = μ(2/r − 1/a) at any radius.', cue: 'An orbit given by its perigee and apogee.', family: 'Orbits' },
  kepler: { name: 'Equal areas in equal times', statement: 'The mean anomaly M = √(μ/a³) t grows steadily; the position comes from M = E − e sin E, solved numerically.', cue: 'Where a craft is a given time after perigee.', family: 'Orbits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
