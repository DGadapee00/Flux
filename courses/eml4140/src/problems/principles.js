/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  modes: { name: 'Each sine fades on its own', statement: 'With the ends held fixed, the profile is a sum of sines sin(nπx/L), and mode n fades as exp(−(nπ)²αt/L²). Short wiggles die first.', cue: 'A rod or slab whose temperature profile changes in time.', family: 'Conduction' },
  'diffusion-time': { name: 'Time scales as L²/α', statement: 'The profile depends on time only through Fo = αt/L². Twice the length takes four times as long; half the diffusivity takes twice as long.', cue: 'How long conduction takes, or comparing two sizes or materials.', family: 'Conduction' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
