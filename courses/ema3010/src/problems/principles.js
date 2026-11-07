/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  well: { name: 'The force is the slope of the energy', statement: 'Two atoms feel F = −dU/dr: zero at the bottom of the well, apart inside it, together outside it.', cue: 'Atoms at a given separation, and the force between them.', family: 'Bonding' },
  curvature: { name: 'Stiffness is curvature', statement: 'Near the bottom of the well the bond is a spring with k = U″(r₀) = nmE₀/r₀². Depth sets the energy to break it; curvature sets how far it stretches.', cue: 'How stiff a bond or a solid is.', family: 'Bonding' },
  packing: { name: 'Where atoms touch sets the cell', statement: 'Hard-sphere atoms touch along a close-packed direction: a = 2R (SC), 4R/√3 (BCC), 2√2 R (FCC). Count the atoms per cell to get the packing fraction and the density.', cue: 'A crystal structure and an atomic radius.', family: 'Structure' },
  'equilibrium-defects': { name: 'Vacancies are in equilibrium', statement: 'The free energy per site is lowest at a vacancy fraction c* ≈ exp(−Q_v/kT), above zero at any temperature; ln c* against 1/T is a line of slope −Q_v/k.', cue: 'How many sites are empty, or how that changes with temperature.', family: 'Structure' },
  diffusion: { name: 'Depth grows as √(Dt)', statement: 'Atoms flow down a concentration gradient, J = −D ∂C/∂x. A held surface fills a deep part as an error function in x/2√(Dt), so depth grows as √t, and D = D₀ exp(−Q/RT) rises steeply with temperature.', cue: 'Carburizing, doping or any species soaking into a solid.', family: 'Structure' },
  schmid: { name: 'Slip is driven by resolved shear', statement: 'A crystal slips when the shear stress on a slip plane along a slip direction, τ_R = σ cos φ cos λ, reaches τ_crss. The Schmid factor cos φ cos λ is at most ½, so σ_y ≥ 2τ_crss.', cue: 'A single crystal pulled at some orientation, or why yield is a shear event.', family: 'Structure' },
  'coulomb-pair': { name: 'An ion pair is Coulomb’s law plus a repulsion', statement: 'For ±e the attraction is ke²/r; at r₀ the repulsion B/rᵐ takes back 1/m of it, so E₀ = (ke²/r₀)(1 − 1/m).', cue: 'An ionic bond’s energy.', family: 'Bonding' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
