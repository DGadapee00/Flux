# Engine fixtures

Read-only copies from the engine repo, for the thermo library's checks. The checks run without the
engine repo checked out.

- Repository: https://github.com/DGadapee00/25lbf-methalox-engine (MIT, see `LICENSE` here)
- Pinned commit: `76be31a52f6fb638c3e0ddf2711f823c09f258e8`

| File here | Path in the engine repo | SHA-256 |
|---|---|---|
| `thermo_nasa7.json` | `Sim/data/thermo_nasa7.json` | `e705f80cb7a6a6c9d821595c10da509c74714f750e202774b7cfcd150a4bbd90` |
| `design_point.txt` | `Phase1_Calculations/cea/design_point.txt` | `9069c7edc2c4715214c0eee316e36cf1cb3fe51c0f1cf3c7d21d4da977e28549` |

Flux never edits these files. `test/thermo.test.js` checks each SHA-256 above. To move to a later
engine commit, run `node scripts/engine-fixtures.mjs <engine checkout> <commit>`, which copies
both files from that commit, and update this table and the hashes in the test.

## Note: methane's specific heat

`thermo_nasa7.json`'s CH₄ (GRI-Mech 3.0) runs above NIST-JANAF: cp is 0.98% higher at 600 K and
2.54% higher at 1000 K. It agrees with NASA Glenn's CH₄ (CEA's database) within 0.25% up to
1000 K, and JANAF's methane matches a rigid-rotor harmonic oscillator, so the gap is between the
references. Flux keeps the engine's data unchanged. Details: `src/thermo/PROVENANCE.md`; the text
for a note to the engine repo: `docs/engine-issue-ch4-cp.md`.

## Note: methane's heat of formation

`design_point.txt` was run with CH₄ at −17895 cal/mol (−74.873 kJ/mol), not the −74.600 kJ/mol
in `thermo_nasa7.json`. Engine-page calculations use −74.873 kJ/mol so they reproduce the design
point.
