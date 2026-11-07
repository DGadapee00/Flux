/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  'viscosity-law': { name: 'Stress from a velocity gradient', statement: 'In a Newtonian fluid the shear stress is the viscosity times the velocity gradient.', cue: 'A fluid sheared between surfaces.', family: 'Shear' },
  'momentum-diffusion': { name: 'Momentum diffuses', statement: 'Motion spreads into a still fluid at the kinematic viscosity ν = μ/ρ, over a time of order h²/ν.', cue: 'A wall starts moving, or a flow starts up.', family: 'Shear' },
  'pressure-force': { name: 'Force from pressure on a flat wall', statement: 'The force on a flat submerged surface is the pressure at its centroid times its area.', cue: 'A gate, hatch or window under a liquid.', family: 'Pressure' },
  'center-of-pressure': { name: 'Where a pressure force acts', statement: 'The force on a flat submerged surface acts below its centroid, by I/(y_c A) along its plane.', cue: 'A hinge, a moment or a line of action under a liquid.', family: 'Pressure' },
  'rigid-body-pressure': { name: 'Pressure in a liquid moving as one body', statement: 'With no shear, the pressure gradient is ρ(g − a), so every isobar, the surface included, lies square to g − a.', cue: 'A tank that accelerates or spins with its liquid.', family: 'Pressure' },
  'material-derivative': { name: 'Acceleration following a particle', statement: 'A particle’s acceleration is the local change ∂u/∂t plus the convective change u·∇u from moving to where the flow differs.', cue: 'A particle in a nozzle, a diffuser or any flow that varies in space.', family: 'Motion' },
  'euler-normal': { name: 'Pressure across curved streamlines', statement: 'Across curved streamlines the pressure rises outward at ρu²/r, the push that turns the flow.', cue: 'A bend, a vortex or any curved flow.', family: 'Motion' },
  similitude: { name: 'Match the groups that matter', statement: 'n variables in r dimensions make n − r groups. A model behaves like the full-size thing when the groups that govern it match: Fr with a free surface, Re without one.', cue: 'A scale model, a wind tunnel or a towing tank.', family: 'Motion' },
  poiseuille: { name: 'Pressure against shear', statement: 'In fully developed laminar flow nothing accelerates, so the pressure gradient balances viscous shear: a parabolic profile, and Q = πR⁴Δp/(8μL) in a pipe.', cue: 'Steady flow down a long pipe or slot, driven by a pressure drop.', family: 'Motion' },
  continuity: { name: 'Mass is conserved', statement: 'The net mass leaving a region each second equals the rate its mass falls: ∂ρ/∂t + ∇·(ρv) = 0, and ∇·v = 0 where ρ cannot change.', cue: 'Any flow, compressible or not.', family: 'Motion' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
