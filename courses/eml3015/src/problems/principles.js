/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  network: { name: 'Parallel pipes share a loss', statement: 'Pipes in parallel lose the same head and add their flows; pipes in series carry one flow and add their losses. With h_L ∝ Q²L/D⁵ at a fixed f, a pipe’s flow goes as √(D⁵/L). A pump runs where its falling head curve meets the system’s rising one.', cue: 'Two or more pipes between the same two points, or a pump driving a system.', family: 'Pipe flow' },
  'viscosity-law': { name: 'Stress from a velocity gradient', statement: 'In a Newtonian fluid the shear stress is the viscosity times the velocity gradient.', cue: 'A fluid sheared between surfaces.', family: 'Shear' },
  'momentum-diffusion': { name: 'Momentum diffuses', statement: 'Motion spreads into a still fluid at the kinematic viscosity ν = μ/ρ, over a time of order h²/ν.', cue: 'A wall starts moving, or a flow starts up.', family: 'Shear' },
  'pressure-force': { name: 'Force from pressure on a flat wall', statement: 'The force on a flat submerged surface is the pressure at its centroid times its area.', cue: 'A gate, hatch or window under a liquid.', family: 'Pressure' },
  'center-of-pressure': { name: 'Where a pressure force acts', statement: 'The force on a flat submerged surface acts below its centroid, by I/(y_c A) along its plane.', cue: 'A hinge, a moment or a line of action under a liquid.', family: 'Pressure' },
  'rigid-body-pressure': { name: 'Pressure in a liquid moving as one body', statement: 'With no shear, the pressure gradient is ρ(g − a), so every isobar, the surface included, lies square to g − a.', cue: 'A tank that accelerates or spins with its liquid.', family: 'Pressure' },
  'material-derivative': { name: 'Acceleration following a particle', statement: 'A particle’s acceleration is the local change ∂u/∂t plus the convective change u·∇u from moving to where the flow differs.', cue: 'A particle in a nozzle, a diffuser or any flow that varies in space.', family: 'Motion' },
  'euler-normal': { name: 'Pressure across curved streamlines', statement: 'Across curved streamlines the pressure rises outward at ρu²/r, the push that turns the flow.', cue: 'A bend, a vortex or any curved flow.', family: 'Motion' },
  'boundary-layer': { name: 'A thin viscous layer', statement: 'Viscosity acts only in a thin layer at the wall, which grows as √(νx/U): δ = 4.91x/√Re_x on a flat plate while laminar.', cue: 'Flow along a surface, and how thick the slowed layer is.', family: 'Motion' },
  similitude: { name: 'Match the groups that matter', statement: 'n variables in r dimensions make n − r groups. A model behaves like the full-size thing when the groups that govern it match: Fr with a free surface, Re without one.', cue: 'A scale model, a wind tunnel or a towing tank.', family: 'Motion' },
  poiseuille: { name: 'Pressure against shear', statement: 'In fully developed laminar flow nothing accelerates, so the pressure gradient balances viscous shear: a parabolic profile, and Q = πR⁴Δp/(8μL) in a pipe.', cue: 'Steady flow down a long pipe or slot, driven by a pressure drop.', family: 'Motion' },
  'momentum-cv': { name: 'Force is momentum flux turned', statement: 'On a control volume the net force equals the momentum flux out minus in. A vane that turns a jet through θ feels ρA w²(1 − cos θ) along it, with w the jet’s speed relative to the vane.', cue: 'A jet on a vane, a bend or a nozzle, and the force that holds it.', family: 'Motion' },
  'head-loss': { name: 'Loss grows with flow, faster once turbulent', statement: 'h_L = f(L/D)V²/2g. Laminar, f = 64/Re and h_L ∝ V with roughness irrelevant; turbulent, f from Colebrook levels off and h_L grows nearly as V², more in a rough pipe.', cue: 'Flow through a length of pipe and the head it loses.', family: 'Motion' },
  transport: { name: 'Follow the matter, count at the box', statement: 'A system’s rate of change is the build-up inside a fixed box plus the net outflow through the box’s faces.', cue: 'A law written for matter, applied to a fixed region that flow passes through.', family: 'Motion' },
  continuity: { name: 'Mass is conserved', statement: 'The net mass leaving a region each second equals the rate its mass falls: ∂ρ/∂t + ∇·(ρv) = 0, and ∇·v = 0 where ρ cannot change.', cue: 'Any flow, compressible or not.', family: 'Motion' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
