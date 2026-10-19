# Thermo library: data provenance

Every number this library produces comes from one of the sources below. Nothing is copied from a
textbook. Flux generates its own property tables from these equations (`tables.js`).

| Data | Source | Licence | Pinned by |
|---|---|---|---|
| Water and steam, `if97.js` | IAPWS-IF97, Revised Release R7-97 (2012), regions 1, 2 and 4. Coefficients typed from the release. | public standard | the release's verification tables, in `selftest.js` |
| Ideal gases, `nasa7-data.js` | GRI-Mech 3.0, `thermo30.dat` (Smith et al.), read from Cantera 2.4's `gri30.inp`. The seven species the engine repo carries are identical to its `Sim/data/thermo_nasa7.json`. | GRI-Mech, free use with citation | SHA-256 `0bfc72f5…ddf774`, checked by `scripts/nasa7-gri.mjs` |
| Ideal gases, `glenn-data.js` | NASA Glenn coefficients: McBride, Zehe and Gordon, NASA/TP-2002-211556 (2002), from NASA's CEA `data/thermo.inp`, github.com/nasa/cea at `2f79a64`. N₂, O₂, Ar and CH₄. | Apache 2.0 | SHA-256 `fa774657…884363`, checked by `scripts/nasa9-glenn.mjs` |
| Engine fixtures, `test/fixtures/engine/` | 25lbf-methalox-engine at `76be31a`: `thermo_nasa7.json` and the CEA design point. | MIT | SHA-256 of each file, in `test/thermo.test.js` |
| Air composition | U.S. Standard Atmosphere (1976): N₂, O₂, Ar, CO₂ by mole, scaled to sum to one. | public | — |
| Reference values in the checks | NIST-JANAF Thermochemical Tables, 4th ed. (Chase, 1998); NACA Report 1135 (1953). | public | quoted in `selftest.js` |

## Which polynomial a gas uses

- **Bare names** (`N2`, `CO2`, `CH4`, …) are GRI-Mech 3.0, so a calculation here matches the engine
  repo's.
- **`glenn:` names** are NASA Glenn. Air uses `glenn:N2`, `glenn:O2` and `glenn:AR`, with GRI's
  CO₂, so it works from 200 K. GRI fits N₂ only from 300 K, and below that its cp falls 1.1% under
  JANAF by 200 K. NASA Glenn's N₂, O₂ and Ar match JANAF within 0.03% at 200, 250 and 300 K.

## Methane's specific heat: three references, two answers

GRI-Mech 3.0's CH₄ (the engine repo's data) runs above NIST-JANAF as the temperature rises:

| T, K | GRI-Mech 3.0 | NASA Glenn | NIST-JANAF | GRI against JANAF |
|---|---|---|---|---|
| 600 | 52.730 | 52.690 | 52.221 | +0.98% |
| 1000 | 73.617 | 73.676 | 71.795 | +2.54% |

cp in J/(mol·K). GRI agrees with NASA Glenn, CEA's own database (Gurvich 1991), within 0.25% from
300 K to 1000 K. JANAF's values match a rigid-rotor harmonic-oscillator calculation to 0.01%
(`selftest.js`), so they leave out the anharmonic terms the Gurvich data carries. The difference is
between the references, not an error in GRI's fit. Flux keeps GRI's CH₄ identical to the engine
repo's. The text for a note to the engine repo is in `docs/history/engine-issue-ch4-cp.md`.

## Methane's heat of formation in engine-page calculations

GRI-Mech 3.0 and NASA Glenn both give ΔfH°(CH₄) = −74.600 kJ/mol. The engine repo's committed CEA
design point was run with the reactant enthalpy written into its input, −17895 cal/mol, which is
−74.873 kJ/mol (JANAF's older value). Engine-page calculations use −74.873 kJ/mol, so they
reproduce the design point. The 0.273 kJ/mol difference is the whole 1.08 cal/g gap between the two
reactant enthalpies (`test/thermo.test.js`). Course problems use the library's −74.600 kJ/mol.
