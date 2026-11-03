# Problems — statics

Same authoring kit as flux-phy2049; see that repo's PROBLEMS.md for the full contract. What differs
here:

- **Constants.** The expression language provides `pi`, `g` (9.81 m/s²) and `gft` (32.2 ft/s²).
- **Units.** `src/physics/units.js` adds `lb`, `kip`, `ft`, `in` and `slug` to the dimension table,
  so a symbolic answer in lb·ft is checked against one in N·m correctly.
- **Degrees vs radians.** Problems state angles in degrees, but the expression parser's `sin` and
  `cos` take radians. A template whose symbolic key uses a trig function should derive the angle in
  radians (`thr`) and declare that as the symbol — see `ch2.parallelogram` and `ch3.spring`.
- **Symbol names.** The parser matches declared symbol names anywhere in the expression, so a symbol
  called `qe` would be found inside `sqrt`. Keep symbol names clear of `sqrt`, `sin`, `cos`, `tan`.

## Bank

| File | Chapters |
|---|---|
| `bank/ch2.js` | 2 — force vectors |
| `bank/ch34.js` | 3 particle equilibrium, 4 moments |
| `bank/ch56.js` | 5 rigid bodies, 6 trusses |
| `bank/ch7910.js` | 7 internal loads, 9 centroids, 10 moments of inertia |
| `bank/ch8.js` | 8 friction (written from the chapter's standard cases, not in the decks) |
| `bank/concepts.js` | Eight conceptual templates spanning all four units |
| `bank/vector-design.js` | Answer-first cable/resultant design, level 3 |

43 templates. The original deck cases remain under PROVENANCE.md. New cases are original
computational checks, not purported printed numerical answers. The complete printed-answer audit
remains outstanding.

`coaching.js` supplies per-option explanations, named numeric mistakes and second hints.
`inverse.js` changes the unknown in nineteen numeric templates. It back-solves a known response
from the chosen load or dimension, then asks the student to recover that input. Its lab still
checks the forward balance against the stated response. The cable-design template independently
chooses the tension first and computes the known horizontal force backward.

Every numeric template opens its lab. Pappus uses the revolution lab and checks volume by washers,
with a separate surface integral. `npm test` reproduces the cases, generates seeded samples,
checks symbolic dimensions and compares the problems with their labs. `content-check.mjs` also
checks staged hints, choice explanations, trap values, notes setups and computed predictions.
