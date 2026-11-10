/* Original Flux lesson plans. External sources are links, not reproduced material. */
export const LESSONS=[
  {
    "id": "binding",
    "title": "Nuclei, mass and binding energy",
    "labTitle": "Mass defect",
    "model": "binding",
    "concept": "mass-defect-binding",
    "inputs": [
      {
        "key": "defect",
        "label": "Given mass defect, u",
        "default": 0.03,
        "min": 0.002,
        "max": 0.1,
        "step": 0.001
      },
      {
        "key": "A",
        "label": "Mass number A",
        "default": 4,
        "min": 2,
        "max": 20,
        "step": 1
      }
    ],
    "outputs": [
      {
        "key": "energy",
        "label": "Total binding energy",
        "unit": "MeV"
      },
      {
        "key": "perNucleon",
        "label": "Binding energy per nucleon",
        "unit": "MeV"
      },
      {
        "key": "massKg",
        "label": "Mass defect",
        "unit": "kg"
      }
    ],
    "eq": "B=\\Delta m c^2,\\quad B/A\\ \\text{compares energy per nucleon}",
    "idea": "The bound nucleus has less rest mass than its separated nucleons. The missing mass corresponds to binding energy. Proton number identifies the element; mass number counts protons plus neutrons.",
    "method": [
      "Choose either nuclear masses or consistent atomic masses. Electron masses cancel only when the bookkeeping is set up correctly.",
      "Find the difference between separated constituents and the bound system. Here the mass defect is supplied as an illustrative input.",
      "Convert atomic mass units to energy using the mass-energy equivalent, then divide by A only when asking for energy per nucleon.",
      "A curve of binding energy per nucleon summarizes trends across real measured nuclei; this lab does not predict that curve from A alone."
    ],
    "worked": "For an illustrative nucleus with A = 4 and a supplied mass defect of 0.030 u, total binding energy is about 27.945 MeV and energy per nucleon is about 6.986 MeV. The supplied defect is a classroom input, not a claim about the measured helium-4 mass.",
    "traps": [
      "Total binding energy and binding energy per nucleon answer different questions.",
      "Do not mix an atomic mass for one side of a reaction with nuclear masses for the other side without accounting for electrons."
    ],
    "transfer": "Keep a supplied mass defect fixed while changing A. Explain why the total binding energy is unchanged but energy per nucleon changes, and why arbitrary inputs do not establish a real isotope’s stability.",
    "limits": "The lab converts a supplied mass defect; it is not a nuclear mass model or a prediction of isotope stability.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/10-2-nuclear-binding-energy",
    "future": "Nuclide charts, nuclear forces, liquid-drop and shell models, and measured isotope masses.",
    "exam": "u1",
    "chapter": "1"
  },
  {
    "id": "decay",
    "title": "Radioactivity and decay kinetics",
    "labTitle": "Decay and activity",
    "model": "decay",
    "concept": "radioactive-decay",
    "inputs": [
      {
        "key": "halfLife",
        "label": "Half-life, s",
        "default": 10,
        "min": 2,
        "max": 40,
        "step": 1
      },
      {
        "key": "time",
        "label": "Elapsed time, s",
        "default": 20,
        "min": 0,
        "max": 80,
        "step": 1
      },
      {
        "key": "initial",
        "label": "Initial nuclei",
        "default": 1000,
        "min": 100,
        "max": 5000,
        "step": 100
      }
    ],
    "outputs": [
      {
        "key": "remaining",
        "label": "Expected nuclei remaining",
        "unit": ""
      },
      {
        "key": "activity",
        "label": "Expected activity",
        "unit": "Bq"
      },
      {
        "key": "lambda",
        "label": "Decay constant",
        "unit": "s⁻¹"
      },
      {
        "key": "fraction",
        "label": "Surviving fraction",
        "unit": ""
      }
    ],
    "eq": "N=N_0e^{-\\lambda t},\\quad \\lambda=\\ln2/T_{1/2},\\quad A=\\lambda N",
    "idea": "An unstable nucleus has a decay probability per unit time. The exponential law describes the expected population of many independent nuclei. A half-life does not schedule the decay of each individual nucleus.",
    "method": [
      "Keep the half-life and elapsed time in the same time unit. Use seconds for activity in becquerels.",
      "Calculate λ = ln 2 / T₁/₂ and use it in both the population and activity equations.",
      "Compare the exponential with numerical integration of dN/dt = −λN. The integrated result approaches the same curve as the step is refined.",
      "Distinguish expected population from a possible integer count in one realization. Activity is a rate, not an accumulated dose."
    ],
    "worked": "A hypothetical collection starts with 1,600 unstable nuclei and has a half-life of 8 s. After 24 s, the expected remaining population is 200. Its expected activity at that instant is (ln 2 / 8) × 200 ≈ 17.33 Bq.",
    "traps": [
      "After two half-lives, one quarter remains; the remaining population is not zero.",
      "A lower activity can reflect fewer nuclei, a smaller decay constant, or both."
    ],
    "transfer": "Hold the initial number fixed and change the half-life. Explain the separate effects on initial activity and the fraction surviving a fixed time.",
    "limits": "Single-species decay with no production, daughter growth or branching. Real low-count records fluctuate around the expected curve.",
    "reference": "https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay",
    "future": "Alpha, beta and gamma processes, decay chains, branching fractions, reaction conservation laws and Q values.",
    "exam": "u2",
    "chapter": "2"
  },
  {
    "id": "attenuation",
    "title": "Radiation interactions with matter",
    "labTitle": "Narrow-beam attenuation",
    "model": "attenuation",
    "concept": "radiation-attenuation",
    "inputs": [
      {
        "key": "mu",
        "label": "Linear attenuation coefficient, cm⁻¹",
        "default": 0.2,
        "min": 0.05,
        "max": 1,
        "step": 0.025
      },
      {
        "key": "depth",
        "label": "Path thickness, cm",
        "default": 5,
        "min": 0,
        "max": 10,
        "step": 0.25
      },
      {
        "key": "intensity",
        "label": "Initial intensity, relative units",
        "default": 1000,
        "min": 100,
        "max": 3000,
        "step": 100
      }
    ],
    "outputs": [
      {
        "key": "fraction",
        "label": "Uncollided fraction",
        "unit": ""
      },
      {
        "key": "transmitted",
        "label": "Transmitted intensity",
        "unit": "relative units"
      },
      {
        "key": "halfValue",
        "label": "Half-value thickness",
        "unit": "cm"
      }
    ],
    "eq": "I=I_0e^{-\\mu x},\\quad x_{1/2}=\\ln2/\\mu",
    "idea": "A narrow monoenergetic beam loses uncollided photons as they interact with matter. The linear attenuation coefficient describes that removal per unit path length. It is not a universal material constant independent of energy.",
    "method": [
      "Identify the radiation energy, material and beam geometry before using an attenuation coefficient. The slider supplies a hypothetical coefficient.",
      "Keep μ and path length in reciprocal units. A coefficient in cm⁻¹ needs a path in centimetres.",
      "Compare the exponential with numerical integration of dI/dx = −μI.",
      "Separate removal from the original beam from energy deposited locally. Scattered radiation can still reach other locations, and a transmission fraction is not a dose assessment."
    ],
    "worked": "In this idealized model, μ = 0.30 cm⁻¹ and x = 4.0 cm give I/I₀ = exp(−1.2) ≈ 0.3010. The half-value thickness is ln 2 / 0.30 ≈ 2.310 cm. A second half-value thickness halves the remaining uncollided intensity again.",
    "traps": [
      "Do not use a mass attenuation coefficient in cm²/g as if it were a linear coefficient in cm⁻¹; density is needed.",
      "The uncollided exponential omits buildup and cannot be treated as a complete protective-design result."
    ],
    "transfer": "Compare doubling thickness with doubling initial intensity. Explain what changes the fraction transmitted and what changes only the final magnitude.",
    "limits": "Ideal narrow, monoenergetic beam with constant μ. Scattering buildup, secondary radiation, energy spectra and dose conversion are outside this model.",
    "reference": "https://physics.nist.gov/PhysRefData/XrayMassCoef/chap2.html",
    "future": "Photoelectric absorption, Compton scattering, pair production, charged-particle stopping and energy-dependent cross sections.",
    "exam": "u3",
    "chapter": "3"
  },
  {
    "id": "counting",
    "title": "Detection and counting statistics",
    "labTitle": "Signal and background counts",
    "model": "counting",
    "concept": "poisson-counting",
    "inputs": [
      {
        "key": "gross",
        "label": "Gross counts",
        "default": 120,
        "min": 10,
        "max": 300,
        "step": 5
      },
      {
        "key": "background",
        "label": "Separate background counts",
        "default": 20,
        "min": 0,
        "max": 100,
        "step": 5
      },
      {
        "key": "time",
        "label": "Equal acquisition time, s",
        "default": 10,
        "min": 1,
        "max": 60,
        "step": 1
      }
    ],
    "outputs": [
      {
        "key": "rate",
        "label": "Estimated net count rate",
        "unit": "s⁻¹"
      },
      {
        "key": "sigma",
        "label": "Standard uncertainty of rate",
        "unit": "s⁻¹"
      }
    ],
    "eq": "r=(G-B)/t,\\quad\\sigma_r=\\sqrt{G+B}/t",
    "idea": "A detector records discrete events. Subtracting an independent background estimate changes the net signal but does not subtract away statistical uncertainty. For independent Poisson counts, variances add.",
    "method": [
      "State the acquisition times. This lab assumes equal times for the gross and separate background records.",
      "Subtract count rates, not raw counts from unequal exposures. For equal times, the net rate is (G − B)/t.",
      "Use G + B in the variance estimate because the two records fluctuate independently.",
      "A negative background-subtracted estimate can occur in a low-signal record. It does not represent a negative number of emitted events. Interpret uncertainty and detection evidence separately."
    ],
    "worked": "A hypothetical detector records 145 gross counts and 25 background counts in separate 12 s exposures. Estimated net rate is 10 s⁻¹. Its standard uncertainty is √170 / 12 ≈ 1.087 s⁻¹, under the independent Poisson assumption.",
    "traps": [
      "The uncertainty of G − B is not generally √(G − B).",
      "Detector count rate is not automatically source activity. Efficiency, geometry, dead time and branching can matter."
    ],
    "transfer": "Imagine four times the exposure at the same underlying gross and background rates. Explain why expected counts quadruple while the relative counting uncertainty is halved.",
    "limits": "Independent Poisson records with equal exposure and plug-in variance estimates. No dead-time correction, efficiency calibration or formal detection-limit procedure is included.",
    "reference": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm",
    "future": "Detector efficiency, energy spectra, dead time, confidence intervals, reaction cross sections, fission and fusion fundamentals.",
    "exam": "u4",
    "chapter": "4"
  }
];
