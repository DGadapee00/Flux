export default {
  "id": "wavefunction-probability",
  "title": "States, probability and uncertainty",
  "subject": "quantum",
  "courses": [
    "quantum"
  ],
  "eq": "\\int|\\psi|^2dx=1,\\quad\\Delta x\\Delta p\\geq\\hbar/2",
  "idea": "The wavefunction contains amplitudes. Its squared magnitude is a probability density, which must be integrated over a region to obtain a probability. For this Gaussian family, position and momentum uncertainties attain the minimum product.",
  "requires": [
    "matter-waves",
    "definite-integral",
    "random-variables"
  ],
  "sources": [
    {
      "title": "OpenStax University Physics Volume 3: States, probability and uncertainty",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/7-1-wave-functions",
      "kind": "Reference",
      "level": "Course level",
      "why": "External background for the physical model and its assumptions.",
      "checked": "2026-11-10"
    },
    {
      "title": "MIT 8.04 Quantum Physics I",
      "url": "https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/",
      "kind": "Reference",
      "level": "Deeper",
      "why": "The broader subject sequence and directions for further study.",
      "checked": "2026-11-10"
    }
  ],
  "labs": [
    {
      "course": "quantum",
      "lab": "packet",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
