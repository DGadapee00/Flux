/* Original Flux lesson plans. External sources are links, not reproduced material. */
export const LESSONS=[
  {
    "id": "packet",
    "title": "States, probability and uncertainty",
    "labTitle": "Gaussian wave packet",
    "model": "packet",
    "concept": "wavefunction-probability",
    "inputs": [
      {
        "key": "sigma",
        "label": "Position standard deviation, nm",
        "default": 0.5,
        "min": 0.1,
        "max": 2,
        "step": 0.05
      },
      {
        "key": "k",
        "label": "Central wave number, nm⁻¹",
        "default": 5,
        "min": 0,
        "max": 15,
        "step": 0.5
      }
    ],
    "outputs": [
      {
        "key": "dk",
        "label": "Wave-number uncertainty",
        "unit": "nm⁻¹"
      },
      {
        "key": "dp",
        "label": "Momentum uncertainty",
        "unit": "kg·m/s"
      },
      {
        "key": "meanMomentum",
        "label": "Mean momentum",
        "unit": "kg·m/s"
      },
      {
        "key": "norm",
        "label": "Probability integral",
        "unit": ""
      },
      {
        "key": "uncertainty",
        "label": "Δx Δp / ħ",
        "unit": ""
      }
    ],
    "eq": "\\int|\\psi|^2dx=1,\\quad\\Delta x\\Delta p\\geq\\hbar/2",
    "idea": "The wavefunction contains amplitudes. Its squared magnitude is a probability density, which must be integrated over a region to obtain a probability. For this Gaussian family, position and momentum uncertainties attain the minimum product.",
    "method": [
      "Separate amplitude from probability density and keep their units distinct. A density at one point is not a finite probability.",
      "Normalize the density over the whole line. The lab integrates a finite interval extending eight standard deviations in each direction.",
      "Calculate Δk = 1/(2σ) and Δp = ħΔk, converting inverse nanometres to inverse metres.",
      "Changing the central wave number adds phase variation and shifts mean momentum while leaving this position density unchanged."
    ],
    "worked": "Choose σ = 0.4 nm. Then Δk = 1.25 nm⁻¹ and Δp is about 1.318 × 10⁻²⁵ kg·m/s. Multiplying by 0.4 × 10⁻⁹ m gives ħ/2. Changing the carrier wave number does not alter that uncertainty product.",
    "traps": [
      "Do not read the real part of ψ as a probability density. It can be negative.",
      "Uncertainty describes the distribution of outcomes in a state. It is not merely an instrument specification."
    ],
    "transfer": "Compare a narrow packet with a broad packet at the same central wave number. Explain what changes in momentum uncertainty and what does not change in mean momentum.",
    "limits": "A one-dimensional normalized Gaussian packet is shown at one instant. Time evolution, dispersion and non-Gaussian states are further work.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/7-1-wave-functions",
    "extra": "https://openstax.org/books/university-physics-volume-3/pages/7-2-the-heisenberg-uncertainty-principle",
    "future": "Hilbert spaces, complex amplitudes, Fourier transforms, operators and packet dynamics.",
    "exam": "u1",
    "chapter": "1"
  },
  {
    "id": "well",
    "title": "Schrödinger equation and bound states",
    "labTitle": "Infinite square well",
    "model": "well",
    "concept": "infinite-well-states",
    "inputs": [
      {
        "key": "width",
        "label": "Well width, nm",
        "default": 1,
        "min": 0.3,
        "max": 2,
        "step": 0.05
      },
      {
        "key": "n",
        "label": "Energy-state number n",
        "default": 1,
        "min": 1,
        "max": 6,
        "step": 1
      }
    ],
    "outputs": [
      {
        "key": "energy",
        "label": "State energy",
        "unit": "eV"
      },
      {
        "key": "nodes",
        "label": "Interior nodes",
        "unit": ""
      },
      {
        "key": "norm",
        "label": "Probability integral",
        "unit": ""
      },
      {
        "key": "numericEnergy",
        "label": "Discrete kinetic-energy check",
        "unit": "eV"
      }
    ],
    "eq": "\\psi_n=\\sqrt{2/L}\\sin(n\\pi x/L),\\quad E_n=\\frac{n^2h^2}{8mL^2}",
    "idea": "Boundary conditions restrict which wavefunctions can fit a confining region. In an infinite one-dimensional well, ψ vanishes at both ends and allowed energies are discrete. A stationary energy state has a time-independent position density.",
    "method": [
      "State where the potential is zero and where it is infinite. Do not apply the interior sinusoid outside the well.",
      "Use a positive integer n. The n = 0 function would be zero everywhere and cannot be normalized.",
      "Count n − 1 interior nodes, then compute energy using the physical width in metres.",
      "Compare the closed-form energy with the expectation of a discrete kinetic-energy operator. A finite grid introduces an error that shrinks as the grid is refined."
    ],
    "worked": "For an electron in a 1.0 nm well, E₁ is about 0.376 eV and E₂ is about 1.504 eV. The first excited state has one interior node. Doubling the width reduces every corresponding energy by a factor of four.",
    "traps": [
      "The spacing between successive levels is not constant: Eₙ grows as n².",
      "A stationary state is not a particle sitting still at the peaks of its density."
    ],
    "transfer": "Explain why the ground-state energy is nonzero and what happens to confinement energy as the well becomes wider.",
    "limits": "Perfectly infinite walls and a single nonrelativistic particle are idealizations. Finite wells have penetration outside the nominal boundaries.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/7-4-the-quantum-particle-in-a-box",
    "future": "Finite wells, superpositions, time evolution, harmonic oscillators and three-dimensional hydrogen states.",
    "exam": "u2",
    "chapter": "2"
  },
  {
    "id": "tunnel",
    "title": "Barriers and quantum transmission",
    "labTitle": "Rectangular barrier",
    "model": "tunnel",
    "concept": "barrier-tunneling",
    "inputs": [
      {
        "key": "energy",
        "label": "Incident energy, eV",
        "default": 2,
        "min": 0.5,
        "max": 4,
        "step": 0.1
      },
      {
        "key": "barrier",
        "label": "Barrier height, eV",
        "default": 5,
        "min": 5,
        "max": 10,
        "step": 0.25
      },
      {
        "key": "width",
        "label": "Barrier width, nm",
        "default": 0.25,
        "min": 0.05,
        "max": 0.8,
        "step": 0.025
      }
    ],
    "outputs": [
      {
        "key": "transmission",
        "label": "Transmission probability",
        "unit": ""
      },
      {
        "key": "reflection",
        "label": "Reflection probability",
        "unit": ""
      },
      {
        "key": "kappa",
        "label": "Decay constant in barrier",
        "unit": "nm⁻¹"
      },
      {
        "key": "numericTransmission",
        "label": "Boundary-matching check",
        "unit": ""
      }
    ],
    "eq": "T=\\left[1+\\frac{V_0^2\\sinh^2(\\kappa a)}{4E(V_0-E)}\\right]^{-1}",
    "idea": "A finite barrier can transmit a nonzero probability current even when the incident energy is below its height. The state inside the barrier is evanescent. Reflection and transmission follow matching of the wavefunction and its derivative.",
    "method": [
      "Check that 0 < E < V₀ for the below-barrier formula used here.",
      "Calculate κ = √[2m(V₀ − E)]/ħ with consistent energy and length units.",
      "Match ψ and ψ′ at both interfaces. The lab also solves those four complex equations independently of the closed-form transmission formula.",
      "For equal potentials and masses on the two exterior sides, reflected and transmitted probability-current fractions sum to one. In a different setup, amplitude squares need velocity factors."
    ],
    "worked": "For the classroom choice E = 2 eV, V₀ = 5 eV and width 0.25 nm, the lab computes the exact rectangular-barrier transmission and compares it with direct complex boundary matching. Increase the width by a small amount and observe the strong reduction in transmission. Use the readout rather than a large-barrier approximation when the barrier is thin.",
    "traps": [
      "Tunneling does not require the particle to borrow enough energy to cross the barrier.",
      "An exponential-only estimate omits interface factors and can be poor for a thin barrier."
    ],
    "transfer": "Keep E/V₀ fixed and increase the barrier width. Explain what happens to transmission and why R + T is a useful check.",
    "limits": "One-dimensional, time-independent, single-particle scattering with a rectangular barrier and equal exterior potentials. It omits absorption and many-body effects.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/7-6-the-quantum-tunneling-of-particles-through-potential-barriers",
    "future": "Wave-packet scattering, resonances, potential steps and numerical Schrödinger solvers.",
    "exam": "u3",
    "chapter": "3"
  },
  {
    "id": "spin",
    "title": "Spin, states and measurement",
    "labTitle": "Spin analyzer",
    "model": "spin",
    "concept": "spin-measurement",
    "inputs": [
      {
        "key": "theta",
        "label": "Prepared-state angle, degrees",
        "default": 60,
        "min": 0,
        "max": 180,
        "step": 5
      },
      {
        "key": "analyzer",
        "label": "Analyzer angle, degrees",
        "default": 0,
        "min": 0,
        "max": 180,
        "step": 5
      }
    ],
    "outputs": [
      {
        "key": "plus",
        "label": "Probability of +ħ/2",
        "unit": ""
      },
      {
        "key": "minus",
        "label": "Probability of −ħ/2",
        "unit": ""
      },
      {
        "key": "projection",
        "label": "Mean projection / (ħ/2)",
        "unit": ""
      }
    ],
    "eq": "P_+=\\cos^2[(\\theta-\\alpha)/2],\\quad P_- =1-P_+",
    "idea": "A spin-half state gives two possible results for one spin-component measurement. State preparation and analyzer orientation determine probabilities. The Bloch-vector representation organizes those probabilities; it is not the path of a tiny rotating object.",
    "method": [
      "Specify the prepared state and the axis being measured. These are different choices.",
      "In the common plane shown, use the half-angle overlap formula for P₊. The angle difference belongs between the prepared state and analyzer axes.",
      "Form the expectation from both possible outcomes: (ħ/2)P₊ − (ħ/2)P₋. An expectation need not itself be one of the observed outcomes.",
      "Check the same probability from the Bloch-vector dot product. Do not replace a sequence of measurements with a single classical projection."
    ],
    "worked": "Prepare spin up along one axis and set the analyzer 90° away. The two probabilities are both 1/2 and the mean component is zero. Individual results are still +ħ/2 or −ħ/2, not zero.",
    "traps": [
      "A zero expectation value does not imply that each measurement returns zero.",
      "Spin is intrinsic angular momentum, not literal surface rotation of a small solid sphere."
    ],
    "transfer": "Compare aligned, perpendicular and opposite analyzers. Explain which are deterministic and which split the outcomes equally.",
    "limits": "Pure spin-half states and ideal projective measurements in one plane. The lab does not model mixed states, azimuthal phase, entanglement or detector imperfections.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/8-3-electron-spin",
    "extra": "https://ocw.mit.edu/courses/8-05-quantum-physics-ii-fall-2013/",
    "future": "Matrices and operators, sequential measurements, mixed states, entanglement and perturbation theory.",
    "exam": "u4",
    "chapter": "4"
  }
];
