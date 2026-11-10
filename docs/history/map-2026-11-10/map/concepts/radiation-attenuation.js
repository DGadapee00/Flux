export default {
  "id": "radiation-attenuation",
  "title": "Radiation interactions with matter",
  "subject": "nuclear",
  "courses": [
    "nuclear"
  ],
  "eq": "I=I_0e^{-\\mu x},\\quad x_{1/2}=\\ln2/\\mu",
  "idea": "A narrow monoenergetic beam loses uncollided photons as they interact with matter. The linear attenuation coefficient describes that removal per unit path length. It is not a universal material constant independent of energy.",
  "requires": [
    "em-waves",
    "first-order-models"
  ],
  "sources": [
    {
      "title": "NIST: Radiation interactions with matter",
      "url": "https://physics.nist.gov/PhysRefData/XrayMassCoef/chap2.html",
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
      "lab": "attenuation",
      "notes": [
        "s1",
        "s2",
        "s3"
      ],
      "note": "An interactive model with independent numerical checks, worked notes and practice."
    }
  ]
};
