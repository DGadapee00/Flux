/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  modes: { name: 'Each sine fades on its own', statement: 'With the ends held fixed, the profile is a sum of sines sin(nπx/L), and mode n fades as exp(−(nπ)²αt/L²). Short wiggles die first.', cue: 'A rod or slab whose temperature profile changes in time.', family: 'Conduction' },
  planck: { name: 'Emission depends on T and on wavelength', statement: 'A black body emits σT⁴ in all, peaking at λ_max = 2898 µm·K/T; a real surface emits ε_λ of that at each wavelength, so its absorptivity for sunlight and its emissivity for its own glow can differ.', cue: 'A surface glowing, or sitting in sunlight.', family: 'Radiation' },
  resistance: { name: 'Resistances in series', statement: 'In steady conduction the same heat crosses every layer: q = ΔT/ΣR, with R = L/k for a layer and 1/h for a film, and each layer takes a share of ΔT in proportion to its R.', cue: 'A wall, a pipe or any heat path through layers.', family: 'Conduction' },
  'thermal-layer': { name: 'Pr sets the thermal layer', statement: 'Heat spreads from the wall at α while momentum spreads at ν, so Pr = ν/α sets the thermal layer beside the velocity layer: δt/δ ≈ Pr^(−1/3) for Pr above about 0.6, and θ′(0) ≈ 0.332 Pr^(1/3) on a laminar plate.', cue: 'A fluid flowing over a heated or cooled surface.', family: 'Convection' },
  'diffusion-time': { name: 'Time scales as L²/α', statement: 'The profile depends on time only through Fo = αt/L². Twice the length takes four times as long; half the diffusivity takes twice as long.', cue: 'How long conduction takes, or comparing two sizes or materials.', family: 'Conduction' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
