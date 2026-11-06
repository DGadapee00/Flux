/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  'fit-limits': { name: 'Limits decide the fit', statement: 'The tightest pair is the smallest hole with the largest shaft; the loosest is the largest hole with the smallest shaft.', cue: 'A hole and a shaft with tolerance bands.', family: 'Tolerances' },
  'stack-rss': { name: 'Independent errors add as variances', statement: 'A stack’s worst case adds the tolerances; its real spread adds their squares, so it grows as √n.', cue: 'Several toleranced parts in a chain.', family: 'Tolerances' },
  'position-zone': { name: 'Distance from true position', statement: 'What matters for a hole is how far it is from where it belongs, so the zone should be a circle, not a box.', cue: 'A hole or pin located from datums.', family: 'Tolerances' },
  capability: { name: 'Spread against the band', statement: 'Cp compares the band with six standard deviations; Cpk also counts how far off centre the process sits.', cue: 'A process mean and spread against drawing limits.', family: 'Process' },
  'requirements-first': { name: 'Requirements before weights', statement: 'A requirement is pass or fail and rules a concept out; weights rank only what passes.', cue: 'Choosing between design concepts.', family: 'Design approach' },
  'design-intent': { name: 'Dimension the reason', statement: 'Dimension a feature by what it is for, so the model follows when the design changes.', cue: 'A sketch or model about to be edited.', family: 'Design approach' },
  margins: { name: 'A margin rests on its assumptions', statement: 'MS = allowable/(FS × applied) − 1 holds only as far as the analysis behind it; a test checks what the analysis assumed.', cue: 'A part judged on paper before it is built.', family: 'Design approach' },
  preload: { name: 'A preloaded bolt takes its share', statement: 'Until the joint opens, the bolt feels only C = k_b/(k_b + k_m) of an external pull; the rest unclamps the parts.', cue: 'A bolted joint under a separating load.', family: 'Joints' },
  'exact-constraint': { name: 'One contact per freedom', statement: 'A part has three freedoms in the plane and six in space; hold each once, and no more.', cue: 'Locating or mounting a part on pins or pads.', family: 'Joints' },
  bridge: { name: 'Read a gauge with a bridge', statement: 'A gauge’s resistance barely changes, so it is read as a bridge’s imbalance; gauges in adjacent arms add strain and cancel heat.', cue: 'A strain gauge, load cell or pressure sensor.', family: 'Measurement' },
  nyquist: { name: 'Sample faster than twice the frequency', statement: 'Below twice a signal’s frequency, samples show a false slower wave: f folds to |f − k fₛ|.', cue: 'Choosing a sample rate or reading logged data.', family: 'Measurement' },
  'installed-characteristic': { name: 'A valve acts in its system', statement: 'Flow is set by the valve and the pipe together; where the pipe takes most of the drop, the valve controls only near closed.', cue: 'Choosing or sizing a control valve.', family: 'Flow' },
  'ground-return': { name: 'Shared copper couples circuits', statement: 'A current through copper that a sensor’s ground shares lifts that ground by IR, and the sensor reads it.', cue: 'Routing power, motor and sensor grounds on a board.', family: 'Boards' },
  'reference-junction': { name: 'A thermocouple measures a difference', statement: 'A thermocouple’s voltage is set by the difference between its tip and where its wires meet the instrument; the instrument must know that junction’s temperature.', cue: 'Reading or wiring a thermocouple.', family: 'Measurement' },
  'square-law': { name: 'Drop goes as flow squared', statement: 'A differential-pressure flowmeter’s drop rises as the square of the flow, so its error in flow grows as the flow falls.', cue: 'An orifice, venturi or nozzle meter.', family: 'Measurement' },
  'motor-line': { name: 'A DC motor’s straight line', statement: 'Torque sets the current, τ = k i; voltage less the iR drop sets the speed, ω = (V − iR)/k; power peaks at half the stall torque.', cue: 'Sizing or loading a brushed DC motor.', family: 'Actuators' },
  'pwm-average': { name: 'Duty sets the average', statement: 'PWM’s average voltage is the duty cycle times the supply; the frequency only sets the ripple and must be fast against the load’s time constant.', cue: 'Driving a motor, coil or LED from a microcontroller pin.', family: 'Actuators' },
  'tolerance-cost': { name: 'Tolerance costs money', statement: 'Each part’s cost rises as its tolerance tightens; the cheapest split gives room to the parts dearest to make precise.', cue: 'Setting tolerances on parts in an assembly.', family: 'Tolerances' },
  decoupling: { name: 'Charge must be close', statement: 'A fast current step through inductance dips the supply by L di/dt; a capacitor beside the chip supplies it through little inductance.', cue: 'Placing capacitors on a board.', family: 'Boards' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
