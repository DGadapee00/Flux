export default {
  "id": "poisson-counting",
  "title": "Detection and counting statistics",
  "subject": "nuclear",
  "courses": [
    "nuclear"
  ],
  "eq": "r=(G-B)/t,\\quad\\sigma_r=\\sqrt{G+B}/t",
  "idea": "A detector records discrete events. Subtracting an independent background estimate changes the net signal but does not subtract away statistical uncertainty. For independent Poisson counts, variances add.",
  "requires": [
    "radioactive-decay",
    "sampling-distributions"
  ],
  "sources": [
    {
      "title": "NIST: Detection and counting statistics",
      "url": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm",
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
      "lab": "counting",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
