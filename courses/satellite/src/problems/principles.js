/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  ellipse: { name: 'An orbit is an ellipse with fixed energy', statement: 'a = (r_p + r_a)/2 from Earth’s centre, T = 2π√(a³/μ), and v² = μ(2/r − 1/a) at any radius.', cue: 'An orbit given by its perigee and apogee.', family: 'Orbits' },
  noise: { name: 'Noise power is kTB', statement: 'A receiver at system temperature T lets in noise k_B T B in a band B, whatever its resistance. What decides a link is S/N, or E_b/N_0 per bit: a narrower band or a colder receiver lowers the noise.', cue: 'A weak signal, a receiver, a bandwidth or a noise temperature.', family: 'Communications' },
  rotation: { name: 'A rotation keeps lengths and angles', statement: 'An attitude is a rotation matrix whose columns are the body axes written in the reference frame: R = R_z(ψ) R_y(θ) R_x(φ) for yaw, pitch and roll, and RᵀR = I.', cue: 'Where a body axis points after a sequence of turns.', family: 'Attitude' },
  'gimbal-lock': { name: 'Three angles can lock', statement: 'Angle rates follow from the body rate through a matrix with determinant cos θ. Near θ = ±90° they grow as 1/cos θ; at it yaw and roll share an axis and one direction of turn is lost. A quaternion never locks.', cue: 'Angle rates, a pitch near 90°, or choosing how to store an attitude.', family: 'Attitude' },
  'spin-stability': { name: 'The middle axis tumbles', statement: 'With no torque, Euler’s equations keep a wobble about the least or greatest principal axis small, and make one about the middle axis grow as e^(λt), λ = ω₀√((I₂ − I₁)(I₃ − I₂)/(I₁I₃)).', cue: 'A spinning body, a spin-stabilized satellite, or a wobble that grows.', family: 'Attitude' },
  feedback: { name: 'Poles decide the loop', statement: 'Closing the loop puts the poles at the roots of 1 + C(s)G(s). All in the left half plane and the loop settles; one to the right and it grows. With PD the steady error is d/K_p; an integral term removes it.', cue: 'A controller’s gains, a steady error, or a loop that rings.', family: 'Attitude' },
  link: { name: 'A link budget adds in decibels', statement: 'P_r = P_t G_t G_r (λ/4πd)²: in decibels each gain adds and the path loss, 20 log₁₀(4πd/λ), subtracts. Twice the range costs 6 dB; twice the dish diameter gains 6 dB.', cue: 'Received power, range, antenna gain or dish size.', family: 'Communications' },
  transmissibility: { name: 'Keep the natural frequency clear', statement: 'A base-shaken mass sees the input times T = √[(1 + (2ζr)²)/((1 − r²)² + (2ζr)²)], r = f/f_n: about 1/(2ζ) near r = 1, about 1 well below, and less than 1 above r = √2.', cue: 'A component shaken at launch, or a mount and its natural frequency.', family: 'Structure' },
  transfer: { name: 'Change speed to change orbit', statement: 'Vis-viva, v² = μ(2/r − 1/a), gives the speed anywhere on an orbit. A forward burn raises the far side and lengthens the period; a Hohmann transfer burns once at each end of a half ellipse.', cue: 'Moving between orbits, catching up, or costing a manoeuvre in Δv.', family: 'Orbits' },
  power: { name: 'Daylight must pay for the night', statement: 'The eclipse lasts T·asin(R/r)/π; the array must carry the load in daylight and refill the battery for the eclipse through its losses, so it needs more than the orbit-average load.', cue: 'Sizing an array or a battery for an orbit.', family: 'Power' },
  kepler: { name: 'Equal areas in equal times', statement: 'The mean anomaly M = √(μ/a³) t grows steadily; the position comes from M = E − e sin E, solved numerically.', cue: 'Where a craft is a given time after perigee.', family: 'Orbits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
