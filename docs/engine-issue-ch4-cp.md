# Issue text for DGadapee00/25lbf-methalox-engine

Flux does not edit the engine repo. This is the text of an issue for the owner to file there.

---

**Title:** Document the reference behind CH₄'s c_p in `Sim/data/thermo_nasa7.json` (GRI-Mech 3.0 runs above NIST-JANAF when hot)

**Body:**

`Sim/data/thermo_nasa7.json` takes CH₄ from GRI-Mech 3.0. Compared with NIST-JANAF (Chase 1998),
its specific heat runs high as the temperature rises:

| T, K | GRI-Mech 3.0 (this repo) | NIST-JANAF | difference |
|---|---|---|---|
| 300 | 35.761 | 35.708 | +0.15% |
| 600 | 52.730 | 52.221 | +0.98% |
| 1000 | 73.617 | 71.795 | +2.54% |

c_p in J/(mol·K), from the coefficients in `thermo_nasa7.json` at commit `76be31a`.

A third reference does not side with JANAF. NASA Glenn's CH₄ (McBride, Zehe and Gordon,
NASA/TP-2002-211556, from Gurvich 1991), which CEA itself uses, gives 52.690 at 600 K and 73.676
at 1000 K: within 0.25% of GRI-Mech from 300 K to 1000 K. JANAF's methane matches a plain
rigid-rotor harmonic-oscillator calculation (fundamentals 2917, 1534, 3019 and 1306 cm⁻¹) to 0.01%,
which suggests it leaves out the anharmonic corrections the Gurvich data includes.

**Effect here:** none for the stand sim as built. Methane is a fuel at feed temperatures, where all
three references agree within 0.2%. Hot CH₄ appears only inside the combustion products, which come
from the CEA table, not from this file.

**Suggested change:** no change to the coefficients. Add a line to the data's provenance saying
that CH₄ follows GRI-Mech 3.0 and Gurvich, and runs 1–2.5% above JANAF above 600 K, so a later
comparison against JANAF is not mistaken for a bug.

**Related:** the committed CEA design point (`Phase1_Calculations/cea/design_point.txt`) gives the
CH₄ reactant enthalpy as −17895 cal/mol (−74.873 kJ/mol). `thermo_nasa7.json` has ΔfH° =
−74.600 kJ/mol. The 0.273 kJ/mol difference accounts for the 1.08 cal/g gap between the reactant
enthalpies computed the two ways. It is worth one line in the same provenance note.

Checked in Flux: `packages/subjects/src/thermo/selftest.js` and `test/thermo.test.js`.
