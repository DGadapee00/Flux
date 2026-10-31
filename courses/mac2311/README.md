# FLUX · Calculus I and II

MAC 2311–2312 is one course on the math shell. Its stable course ID is `mac2311`.
Six units follow 18.01SC: differentiation, its applications, definite integrals,
integration techniques, parametric/polar curves, and the infinite. OpenStax adds
sequences and convergence tests.

All 14 existing labs, 87 problem templates and 38 lab-linked notes examples remain.
The eight notes files are recut into six. Calculus II's entry path redirects here.

From the repo root:

```sh
npm run dev -w @flux/mac2311
npm test -w @flux/mac2311
npm test -w @flux/mac2312
npm run verify -w @flux/mac2311
```

The browser verifier builds and serves both production routes on one temporary origin.
It checks phone and desktop layouts, every lab/scenario, notes setups, old links and
browser-storage migration. `CHROMIUM_EXECUTABLE` selects a system Chromium when needed.
`SMOKE_SHOTS` saves review screenshots.

Canonical links use `#/mac2311/c3/solids`. Both old course prefixes and their `u1`–`u4`
links remain supported, including `?p=…&s=…` and `?n=…` links. Calculus II problem IDs
are prefixed `ii.`; saved seeds retain their original question values.

The migration combines review histories without deleting old keys or adding attempts
twice. Existing hub backups keep both source-course entries. The complete contract is
in `docs/course-plans/mac2311-2312.md`.

Unit 1 has been reworked with a camera-focus application, predictions, and a new active bank. Original Unit 1 templates remain accessible by saved ID and keep their seed identity. Unit 2 now adds constrained can design, approximation error, Newton failures and first differential equations. The remaining four units still need the same treatment. This completes the module merge within R4a. The merged course still fails the content
scorecard: predictions, cited applications, feedback and problem variety need the planned
unit-by-unit rework. `standard` remains false.
