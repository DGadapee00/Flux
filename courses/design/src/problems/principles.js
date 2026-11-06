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
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
