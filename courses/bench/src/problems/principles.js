/**
 * The ideas Unit 1's problems turn on. Principle tags are optional (D16); a course that supplies them
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
  energy: { name: 'Stored energy', statement: 'Run time is stored energy, after losses, over the power drawn.', cue: 'How long a battery lasts.', family: 'Power' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
