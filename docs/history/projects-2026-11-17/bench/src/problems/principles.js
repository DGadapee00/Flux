/**
 * The ideas the problems turn on. Principle tags are optional (D16); a course that supplies them
 * gets the deciding principle shown with each solution, "what went wrong" after a miss, the
 * weak-principle list and a group-by-principle view. There is no question about the principle
 * before a problem (D34).
 */
export const PRINCIPLES = {
  strips: { name: 'Strips are nodes', statement: 'Holes in one strip are one connection; a part works only with its legs in different strips.', cue: 'Where the parts sit on the board.', family: 'The board' },
  series: { name: 'Series', statement: 'Parts in one path carry one current, and their resistances add.', cue: 'One path from + to −.', family: 'Circuits' },
  short: { name: 'A short', statement: 'A near-zero resistance across a part takes its current and removes it from the circuit.', cue: 'A wire or an ammeter across something.', family: 'Circuits' },
  loading: { name: 'Meter loading', statement: 'A voltmeter is a large resistor in parallel with what it measures.', cue: 'A voltmeter on large resistances.', family: 'Measuring' },
  'in-series': { name: 'Amps in series', statement: 'An ammeter carries the current it measures, so it goes in series.', cue: 'Measuring a current.', family: 'Measuring' },
  'parallel-path': { name: 'Every path counts', statement: 'An ohmmeter reads every path between its leads, in parallel.', cue: 'Measuring a part still in a circuit.', family: 'Measuring' },
  'ir-drop': { name: 'I·R drop', statement: 'Every resistance in the supply path costs a voltage of I times R.', cue: 'Rails lower than the source.', family: 'Power' },
  vf: { name: 'Forward voltage', statement: 'A lit LED keeps about its forward voltage whatever its current; the resistor in series takes the rest and sets the current.', cue: 'An LED with a resistor.', family: 'LEDs' },
  'one-way': { name: 'One way only', statement: 'A diode conducts from anode to cathode and blocks the other way, taking the whole voltage across it.', cue: 'An LED that will not light.', family: 'LEDs' },
  'e12-up': { name: 'Round up to a standard part', statement: 'Resistors come in the E12 series; buy the next value up so the current stays at or under the target.', cue: 'Choosing a resistor to buy.', family: 'LEDs' },
  power: { name: 'Power in a resistor', statement: 'A resistor turns I squared R into heat, which must stay within its rating.', cue: 'Will this resistor run hot?', family: 'Power' },
  'parallel-share': { name: 'Parallel shares a voltage', statement: 'Parts in parallel share one voltage, and their currents add.', cue: 'LEDs side by side.', family: 'Circuits' },
  ratio: { name: 'The ratio sets a divider', statement: 'A divider’s output is the lower part’s share of the supply; scaling both parts changes nothing until a load is attached.', cue: 'Two resistors from a supply.', family: 'Sensing' },
  'sensor-side': { name: 'Which side the sensor sits', statement: 'A sensor below the output raises it as its resistance grows; above the output it lowers it.', cue: 'An LDR or thermistor in a divider.', family: 'Sensing' },
  'geo-mean': { name: 'Geometric mean for swing', statement: 'The fixed resistor that gives the largest swing is the geometric mean of the sensor’s two resistances.', cue: 'Choosing a divider’s fixed resistor.', family: 'Sensing' },
  'loading-div': { name: 'Loading a divider', statement: 'A load is in parallel with the lower part, so it pulls the output down unless it is much larger than the divider.', cue: 'Something reads the divider.', family: 'Sensing' },
  floating: { name: 'A floating input', statement: 'An input joined to nothing has no voltage of its own and reads stray pickup.', cue: 'A button input that misbehaves.', family: 'Inputs' },
  'pull-size': { name: 'Sizing a pull resistor', statement: 'A pull resistor must be much smaller than any stray or leakage path, and large enough not to waste power when the button is held.', cue: 'Choosing a pull-up.', family: 'Inputs' },
  energy: { name: 'Stored energy', statement: 'Run time is stored energy, after losses, over the power drawn.', cue: 'How long a battery lasts.', family: 'Power' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
