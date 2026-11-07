/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  well: { name: 'The force is the slope of the energy', statement: 'Two atoms feel F = −dU/dr: zero at the bottom of the well, apart inside it, together outside it.', cue: 'Atoms at a given separation, and the force between them.', family: 'Bonding' },
  curvature: { name: 'Stiffness is curvature', statement: 'Near the bottom of the well the bond is a spring with k = U″(r₀) = nmE₀/r₀². Depth sets the energy to break it; curvature sets how far it stretches.', cue: 'How stiff a bond or a solid is.', family: 'Bonding' },
  packing: { name: 'Where atoms touch sets the cell', statement: 'Hard-sphere atoms touch along a close-packed direction: a = 2R (SC), 4R/√3 (BCC), 2√2 R (FCC). Count the atoms per cell to get the packing fraction and the density.', cue: 'A crystal structure and an atomic radius.', family: 'Structure' },
  'coulomb-pair': { name: 'An ion pair is Coulomb’s law plus a repulsion', statement: 'For ±e the attraction is ke²/r; at r₀ the repulsion B/rᵐ takes back 1/m of it, so E₀ = (ke²/r₀)(1 − 1/m).', cue: 'An ionic bond’s energy.', family: 'Bonding' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
