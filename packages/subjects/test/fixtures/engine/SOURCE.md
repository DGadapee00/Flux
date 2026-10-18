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
