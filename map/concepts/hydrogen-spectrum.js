export default {
  "id": "hydrogen-spectrum",
  "title": "Atomic energy levels and spectra",
  "subject": "quantum",
  "courses": [
    "modern"
  ],
  "eq": "E_n=-\\frac{13.605693\\ \\mathrm{eV}}{n^2},\\quad E_\\gamma=E_i-E_f",
  "idea": "Discrete atomic energies produce discrete transition energies. An emitted photon carries the difference between two levels. The reference zero is the separated electron and proton, so bound-state energies are negative.",
  "requires": [
    "matter-waves",
    "angular-momentum"
  ],
  "sources": [
    {
      "title": "OpenStax University Physics Volume 3: Atomic energy levels and spectra",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/6-4-bohrs-model-of-the-hydrogen-atom",
      "kind": "Reference",
      "level": "Course level",
      "why": "External background for the physical model and its assumptions.",
      "checked": "2026-11-10"
    },
    {
      "title": "NIST CODATA constants",
      "url": "https://physics.nist.gov/cuu/Constants/",
      "kind": "Reference",
      "level": "Deeper",
      "why": "The physical constants used in the calculations.",
      "checked": "2026-11-10"
    }
  ],
  "labs": [
    {
      "course": "modern",
      "lab": "hydrogen",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
