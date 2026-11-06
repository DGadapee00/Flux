/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  'viscosity-law': { name: 'Stress from a velocity gradient', statement: 'In a Newtonian fluid the shear stress is the viscosity times the velocity gradient.', cue: 'A fluid sheared between surfaces.', family: 'Shear' },
  'momentum-diffusion': { name: 'Momentum diffuses', statement: 'Motion spreads into a still fluid at the kinematic viscosity ν = μ/ρ, over a time of order h²/ν.', cue: 'A wall starts moving, or a flow starts up.', family: 'Shear' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
