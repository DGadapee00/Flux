export default {
  "id": "infinite-well-states",
  "title": "Schrödinger equation and bound states",
  "subject": "quantum",
  "courses": [
    "quantum"
  ],
  "eq": "\\psi_n=\\sqrt{2/L}\\sin(n\\pi x/L),\\quad E_n=\\frac{n^2h^2}{8mL^2}",
  "idea": "Boundary conditions restrict which wavefunctions can fit a confining region. In an infinite one-dimensional well, ψ vanishes at both ends and allowed energies are discrete. A stationary energy state has a time-independent position density.",
  "requires": [
    "wavefunction-probability",
    "standing-waves"
  ],
  "sources": [
    {
      "title": "OpenStax University Physics Volume 3: Schrödinger equation and bound states",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/7-4-the-quantum-particle-in-a-box",
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
      "lab": "well",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
