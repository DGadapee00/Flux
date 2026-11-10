/* Original Flux lesson plans. External sources are links, not reproduced material. */
export const LESSONS=[
  {
    "id": "relativity",
    "title": "Space, time and relativity",
    "labTitle": "Moving clocks",
    "model": "relativity",
    "concept": "special-relativity",
    "inputs": [
      {
        "key": "beta",
        "label": "Speed v/c",
        "default": 0.6,
        "min": 0,
        "max": 0.95,
        "step": 0.01
      },
      {
        "key": "tau",
        "label": "Proper time, µs",
        "default": 2,
        "min": 0.5,
        "max": 5,
        "step": 0.1
      },
      {
        "key": "length",
        "label": "Rest length, m",
        "default": 1,
        "min": 0.5,
        "max": 3,
        "step": 0.1
      }
    ],
    "outputs": [
      {
        "key": "gamma",
        "label": "Lorentz factor",
        "unit": ""
      },
      {
        "key": "time",
        "label": "Elapsed laboratory time",
        "unit": "µs"
      },
      {
        "key": "contracted",
        "label": "Moving length",
        "unit": "m"
      }
    ],
    "eq": "\\gamma=\\frac{1}{\\sqrt{1-\\beta^2}},\\quad\\Delta t=\\gamma\\Delta\\tau,\\quad L=L_0/\\gamma",
    "idea": "Observers agree on the laws of physics but can assign different times and lengths to the same experiment. Proper time is measured by a clock present at both events. It is not a label for whichever observer we prefer.",
    "method": [
      "Identify the two events and the frame in which they occur at one location. That clock measures proper time.",
      "Write β = v/c and check that its magnitude is less than one. Compute γ before using time dilation or length contraction.",
      "Use time dilation only for the stated pair of events. A laboratory distance divided by a proper time is not the speed in either frame.",
      "For a moving length, the endpoints must be recorded simultaneously in the measuring frame. The rest length belongs to the frame where the object is at rest."
    ],
    "worked": "A clock records 1.5 µs between two ticks while moving at 0.8c relative to a laboratory. The lab assigns γ = 1/√(1 − 0.8²) = 5/3, so its interval is 2.5 µs. A 1.2 m rod at rest with the clock is 0.72 m long in the lab when its endpoints are measured simultaneously there.",
    "traps": [
      "Do not say that either observer has a defective clock. They compare different frame measurements.",
      "Time dilation alone does not resolve arbitrary multi-stage trips. Events, simultaneity and any frame changes must be tracked."
    ],
    "transfer": "Change speed from 0.1c to 0.9c. Explain why replacing γ with one works at low speed but fails near light speed. Identify what remains invariant in the light-clock construction.",
    "limits": "The lab compares inertial frames in special relativity. It does not model gravitational time dilation or a full accelerated journey.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/5-3-time-dilation",
    "future": "Lorentz transformations, spacetime diagrams, relativistic momentum and energy, and accelerated worldlines.",
    "exam": "u1",
    "chapter": "1"
  },
  {
    "id": "photoelectric",
    "title": "Photons and the photoelectric effect",
    "labTitle": "Photoelectric threshold",
    "model": "photoelectric",
    "concept": "photoelectric-effect",
    "inputs": [
      {
        "key": "wavelength",
        "label": "Wavelength, nm",
        "default": 300,
        "min": 150,
        "max": 800,
        "step": 5
      },
      {
        "key": "work",
        "label": "Work function, eV",
        "default": 2.4,
        "min": 1,
        "max": 5,
        "step": 0.1
      }
    ],
    "outputs": [
      {
        "key": "energy",
        "label": "Photon energy",
        "unit": "eV"
      },
      {
        "key": "kinetic",
        "label": "Maximum electron energy",
        "unit": "eV"
      },
      {
        "key": "stopping",
        "label": "Stopping-potential magnitude",
        "unit": "V"
      },
      {
        "key": "cutoff",
        "label": "Cutoff wavelength",
        "unit": "nm"
      }
    ],
    "eq": "E_\\gamma=hf=hc/\\lambda,\\quad K_{\\max}=hf-\\phi",
    "idea": "A photon transfers energy in one absorption event. A surface needs a minimum energy to release an electron. Above threshold, the remaining energy can appear as electron kinetic energy.",
    "method": [
      "Convert wavelength to metres if using h in joule-seconds. An electron-volt is an energy; multiply by the elementary charge to express it in joules.",
      "Compare photon energy with the work function before subtracting. A below-threshold result means no photoemission in this ideal single-photon model.",
      "For emitted electrons, divide maximum kinetic energy in joules by the elementary charge to obtain the stopping-potential magnitude in volts.",
      "Separate photon energy from photon arrival rate. Increasing ideal intensity at fixed wavelength changes the number of incident photons, not the energy per photon."
    ],
    "worked": "For an illustrative surface with a 3.0 eV work function and 250 nm illumination, photon energy is about 4.959 eV. The ideal maximum electron energy is 1.959 eV and the stopping-potential magnitude is 1.959 V. These are chosen classroom values, not a measured material certificate.",
    "traps": [
      "A negative calculated kinetic energy is not an emitted electron moving backward. It indicates that the threshold was not met.",
      "The readout shows a stopping-potential magnitude. The actual electrode polarity must oppose the emitted electrons."
    ],
    "transfer": "Keep the work function fixed and compare shorter wavelength with greater intensity. Explain which changes maximum electron energy and which can change ideal photocurrent.",
    "limits": "The model omits contact potentials, surface contamination, energy distributions, multiphoton processes and the current-voltage curve.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect",
    "future": "Blackbody radiation, Compton scattering, photon counting and real photocurrent curves.",
    "exam": "u2",
    "chapter": "2"
  },
  {
    "id": "matter-wave",
    "title": "Matter waves and diffraction",
    "labTitle": "Electron wavelength",
    "model": "matterWave",
    "concept": "matter-waves",
    "inputs": [
      {
        "key": "energy",
        "label": "Electron kinetic energy, eV",
        "default": 100,
        "min": 10,
        "max": 500,
        "step": 5
      }
    ],
    "outputs": [
      {
        "key": "wavelength",
        "label": "de Broglie wavelength",
        "unit": "nm"
      },
      {
        "key": "speed",
        "label": "Electron speed",
        "unit": "m/s"
      },
      {
        "key": "momentum",
        "label": "Momentum",
        "unit": "kg·m/s"
      }
    ],
    "eq": "\\lambda=h/p,\\quad p=\\sqrt{2m_eK}",
    "idea": "An electron has momentum and a wavelength associated with its quantum state. Diffraction is evidence for wave behavior, while individual detections remain localized events. A sinusoidal wave is not the path of a small orbiting ball.",
    "method": [
      "Choose the particle mass and decide whether the kinetic energy is small compared with its rest energy.",
      "Use K = p²/(2m) only in the nonrelativistic regime, then calculate λ = h/p.",
      "Connect wavelength to an experimental length such as a lattice spacing or slit separation. The wavelength alone does not determine a complete diffraction pattern.",
      "The lab checks the energy a second way from a finite-difference curvature of a plane wave in the Schrödinger kinetic-energy operator."
    ],
    "worked": "For a 150 eV electron, the nonrelativistic wavelength is about 0.100 nm. Raising the kinetic energy by a factor of four doubles momentum and halves wavelength. It does not divide wavelength by four.",
    "traps": [
      "Do not mix photon energy E = hc/λ with the kinetic energy of a massive nonrelativistic electron.",
      "A shorter wavelength does not by itself specify the probability of landing at one detector position. The state and apparatus also matter."
    ],
    "transfer": "Explain why a free electron with one exact momentum is spread out in position. What changes if many nearby wavelengths are combined into a packet?",
    "limits": "The slider stays well below the electron rest energy. It omits relativistic corrections and a detailed diffraction apparatus.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/6-5-de-broglies-matter-waves",
    "future": "Wave packets, electron diffraction geometry and relativistic de Broglie wavelengths.",
    "exam": "u3",
    "chapter": "3"
  },
  {
    "id": "hydrogen",
    "title": "Atomic energy levels and spectra",
    "labTitle": "Hydrogen transitions",
    "model": "hydrogen",
    "concept": "hydrogen-spectrum",
    "inputs": [
      {
        "key": "upper",
        "label": "Upper principal level",
        "default": 3,
        "min": 3,
        "max": 8,
        "step": 1
      },
      {
        "key": "lower",
        "label": "Lower principal level",
        "default": 2,
        "min": 1,
        "max": 2,
        "step": 1
      }
    ],
    "outputs": [
      {
        "key": "photon",
        "label": "Emitted photon energy",
        "unit": "eV"
      },
      {
        "key": "wavelength",
        "label": "Vacuum wavelength",
        "unit": "nm"
      },
      {
        "key": "upperEnergy",
        "label": "Upper state energy",
        "unit": "eV"
      },
      {
        "key": "lowerEnergy",
        "label": "Lower state energy",
        "unit": "eV"
      }
    ],
    "eq": "E_n=-\\frac{13.605693\\ \\mathrm{eV}}{n^2},\\quad E_\\gamma=E_i-E_f",
    "idea": "Discrete atomic energies produce discrete transition energies. An emitted photon carries the difference between two levels. The reference zero is the separated electron and proton, so bound-state energies are negative.",
    "method": [
      "Label the initial and final levels. Emission has initial energy greater than final energy.",
      "Subtract signed energies before converting the positive difference into wavelength.",
      "Distinguish the size of a level energy from the difference of two level energies.",
      "Treat the Bohr picture as a historical model. Modern atomic states are wavefunctions, not literal planet-like electron trajectories."
    ],
    "worked": "In the infinite-nuclear-mass hydrogen model, a transition from n = 4 to n = 2 releases about 2.551 eV, corresponding to a vacuum wavelength near 486.0 nm. The upper and lower energies are both negative; their difference is positive.",
    "traps": [
      "A negative level energy does not mean a photon has negative energy.",
      "One successful hydrogen spectrum model does not make the same formula valid for every many-electron atom."
    ],
    "transfer": "Hold the lower level fixed and raise the upper level. Explain why the emitted photon energies approach a series limit.",
    "limits": "This model neglects finite proton mass, fine and hyperfine structure, external fields and selection rules. Wavelengths are idealized vacuum values.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/6-4-bohrs-model-of-the-hydrogen-atom",
    "future": "Selection rules, angular momentum, spin-orbit effects, many-electron atoms and condensed matter.",
    "exam": "u4",
    "chapter": "4"
  }
];
