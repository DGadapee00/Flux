export default {
  "id": "radioactive-decay",
  "title": "Radioactivity and decay kinetics",
  "subject": "nuclear",
  "courses": [
    "nuclear"
  ],
  "eq": "N=N_0e^{-\\lambda t},\\quad \\lambda=\\ln2/T_{1/2},\\quad A=\\lambda N",
  "idea": "An unstable nucleus has a decay probability per unit time. The exponential law describes the expected population of many independent nuclei. A half-life does not schedule the decay of each individual nucleus.",
  "requires": [
    "first-order-models",
    "random-variables"
  ],
  "sources": [
    {
      "title": "OpenStax University Physics Volume 3: Radioactivity and decay kinetics",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay",
      "kind": "Reference",
      "level": "Course level",
      "why": "External background for the physical model and its assumptions.",
      "checked": "2026-11-10"
    },
    {
      "title": "MIT 22.01 Introduction to Nuclear Engineering and Ionizing Radiation",
      "url": "https://ocw.mit.edu/courses/22-01-introduction-to-nuclear-engineering-and-ionizing-radiation-fall-2016/",
      "kind": "Reference",
      "level": "Deeper",
      "why": "The broader subject sequence and directions for further study.",
      "checked": "2026-11-10"
    }
  ],
  "labs": [
    {
      "course": "nuclear",
      "lab": "decay",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
