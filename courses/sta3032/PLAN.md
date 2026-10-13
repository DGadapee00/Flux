# flux-stats: Phase 0 plan

Status: **proposal, waiting for approval.** No app code has been written. Nothing in FLUX was changed.

---

## 1. What FLUX is, as built

Read from `DGadapee00/flux-phy2049` at `acc16b1` (522 files, about 63k lines).

### Stack and build

| | |
|---|---|
| Build | Vite 6, `base: './'`, `target: esnext`. `vite.config.js` stamps each build with its commit (`__BUILD__`, `/version.json`), and `npm run live` compares that stamp with the local checkout. |
| Language | Vanilla JS ES modules. No framework and no TypeScript. |
| Dependencies | `katex` ^0.16 and `three` ^0.172. Dev: `vite`. Playwright is borrowed from the machine (`scripts/playwright.mjs`), not installed. |
| Tests | No test framework. `npm test` runs four Node scripts in turn: `tex-check` (backslash escapes eaten by JS strings), `physics/selftest.js`, `problems-check` (every template), and `notes-check` (notes structure, and every formula typeset). `scripts/smoke.mjs` and `gallery.mjs` drive the dev server on :5174 headless. |
| Deploy | Cloudflare Pages Direct Upload (`npm run deploy` = test, build, `wrangler pages deploy`). A GitHub Pages workflow is also present but off. `public/_headers` and `robots.txt` keep it out of search. |
| State | `localStorage` only (`flux.problems.v1`, `flux.exam.v1`, notes width). Every read and write is wrapped in try/catch. |

### Folder structure

```
index.html            one page: canvas#c behind floating HUD panels (brand, eq-panel, controls, readout, problems, notes)
src/main.js           app state, lab switching, render loop, the three modes (Practice / Notes / Explore)
src/engine/           router.js (hash routes), frame/viewport/pointer/views (3D camera, picking, framing)
src/data/             catalog.js (EXAMS → chapters, dates, labs; LAB_META), scenarios, predictions, quantities
src/labs/             29 labs, each a defineLab({...}) object; load.js lazy-imports them
src/physics/          pure physics + selftest.js
src/scene/            three.js drawing (Manim-style palette)
src/problems/         engine.js, kit.js, bank/eN.js, coaching/eN.js, progress, fading, principles, principle-step, sequence, simbridge
src/notes/            content/eN-*.html (rewritten lecture notes), index.js (section registry), setups.js
src/ui/               hud, problems (practice panel, 1.8k lines), notes, predict, plot (2D canvas plots), shared (KaTeX), format, units
src/styles/           main.css (tokens + desktop HUD), practice.css, mobile.css (≤720px layer)
scripts/              checks, smoke, gallery, canvas_ingest.py, live.mjs
incoming/             Canvas drops: YYYY-wkNN/, processed/, .canvas-state.json
.github/workflows/    canvas-ingest.yml (Sundays), pages.yml
```

### Shell and navigation

- A hash router: `#/<exam>/<lab>?p=<problemId>&s=<seed>&n=<section>`. Every problem instance and every notes section is a link.
- The header has an exam picker (named and dated, from `catalog.js`), lab tabs, and a three-way mode switch: **Practice | Notes | Explore**. With no link, the app opens Practice for the next exam.
- The layout is a full-screen three.js canvas with panels floating over it. `mobile.css` turns that into a stack under 720px. FLUX's own `design-review/REVIEW.md` finds the panels cover 35–60% of the screen. That layout is the part **not** to copy.

### Styling tokens (`src/styles/main.css :root`)

A dark Manim look. Ground `#0b0c0e`, panel `rgba(14,15,18,.88)`, text `#ece6e2`, muted `#aaa39e`. Palette: blue `#58c4dd`, teal, green `#83c167`, yellow `#f4d345`, gold, red `#fc6255`, purple, pink. The type scale has five sizes (11/13/15/18/24px), plus 16px inputs on a phone so Safari doesn't zoom. Fonts are Inter and JetBrains Mono; KaTeX fonts set the math. Colour rules: yellow marks the one primary button, blue means selected, and green/red appear only when grading.

### Math rendering

KaTeX everywhere. `src/ui/shared.js` provides `tex()` (cached `renderToString`), `mathText`/`mathProse` (prose with `$…$` inline math, escaped outside it), `eq()` for display equations and `kv()`/`cells()` for readouts. Notes files use `\( \)` and `\[ \]` and are typeset by KaTeX auto-render. Problem steps use `texNum`/`qty` so numbers go inside the math. `tex-check` catches `\text` → tab.

### Practice-problem engine

- **`engine.js`** has no DOM and no three.js. It provides a mulberry32 seeded RNG plus FNV `hashSeed`. `instance(tpl, seed)` samples `vars` until `valid()` passes, and seed 0 is the worksheet case. `render()` gives the statement, parts, hints and steps. `grade()` handles numbers with a relative/absolute tolerance, typed-unit conversion, and "wrong sign" / "off by 10ⁿ" / "factor of 2" feedback. Choice parts can carry per-option "why" feedback. There is a symbolic-expression parser with a live TeX preview and random-point equivalence grading.
- **`kit.js`** is the authoring DSL: `problem`, `range`, `choice`, `num`, `mc`, `tf`, `sym`, `self`, `kase`, `texNum`, `qty`.
- **Around it:** `progress.js` (Leitner spaced review, `pickSet`, interleaving; storage is injected), `fading.js` (worked examples that fade), `principles.js` + `principle-step.js` ("which principle decides this?" before the parts), `sequence.js` (study order per chapter), `coaching/` (hint ladders, wrong-option explanations), `simbridge.js` (loads a problem into its lab).
- **`problems-check.mjs`** confirms that worked cases reproduce printed keys, 200 seeds per template are finite, text renders with no `NaN`/`undefined`, symbolic keys match, and **the lab's own computation agrees with the problem's answer**. That last check is FLUX's strongest one.

### Weekly content

1. `canvas-ingest.yml` runs Sundays at 11:17 UTC. `scripts/canvas_ingest.py` (stdlib only) pulls new or changed Canvas files into `incoming/YYYY-wkNN/`, tracks them in `.canvas-state.json`, and opens an issue if a run fails.
2. A scheduled Claude Code run follows the **Content drop protocol** in `CLAUDE.md`: sort the files, write rewritten notes into `src/notes/content/eN-<slug>.html` (fixed structure: `section.topic#sN`, boxes `ex|why|fix|key`, KaTeX math), register the sections in `src/notes/index.js` (lab, chapters and topics per section), optionally add "Show this in the lab" setups, run the checks, `git mv` the files to `processed/`, and commit to `main` with a run report (or open a PR if a check fails).
3. Worksheets and homework become **draft problem ideas in the run report only**. New templates are written by hand, as code.

---

## 2. How flux-stats reuses FLUX

**Recommendation: copy and adapt into this repo. No shared package yet. FLUX stays untouched.**

Why not a shared package now:

- The reusable core isn't separable today without editing FLUX. `engine.js` imports physics units and constants, and `ui/problems.js` is wired to the lab veil, three.js answer layers and lab agreement. Extracting a package means refactoring FLUX, which you consider done.
- The two apps will diverge on purpose. Stats needs table-aware grading, interval answers and Monte Carlo checks. FLUX needs units and dimensions.
- When to revisit: if a third sibling app appears, or if we find ourselves hand-porting the same engine fix both ways more than a couple of times. The route then is a small `study-core` package (engine, kit, progress, fading, shared.js, tex-check) consumed by git dependency. That's about a day's work, and nothing in this plan blocks it.

| FLUX piece | In flux-stats |
|---|---|
| `vite.config.js` build stamp, `live.mjs`, `DEPLOY.md`, `_headers`, `robots.txt` | **Copy**, rename the project. |
| `ui/shared.js` (KaTeX helpers), `tex-check.mjs` | **Copy verbatim.** |
| Style tokens, type scale, colour rules, `practice.css` | **Copy** the tokens and practice sheet. Re-assign scene colours to stats meanings (below). |
| `main.css` / `mobile.css` floating-HUD layout | **Don't copy.** Write a new mobile-first layout (§4). |
| `engine/router.js` | **Adapt:** the same `#/<unit>/<lab>?p=&s=&n=` scheme. |
| `data/catalog.js` | **Adapt:** units (exams) → chapters → labs, with dates. |
| `problems/engine.js` | **Adapt:** keep the RNG, sampling, render, choice grading, number parser and symbolic parser. Drop dimensions and physics constants. Add **table-aware numeric grading** and **interval answers** (§5). |
| `kit.js` | **Adapt:** keep the DSL, drop `charge`/`layout`/units. Add `pNum`, `critNum`, `interval`, `tableLine()`. |
| `progress.js`, `fading.js`, `sequence.js`, `principle-step.js`, coaching pattern | **Copy** with light edits. Rewrite `principles.js` content for statistics (CLT, standardizing, complement rule, conditional probability/Bayes, linearity of expectation, pivotal quantity, duality of CI and test, least squares, …). |
| `ui/problems.js` (practice panel) | **Adapt:** keep list, attempt, principle step, fading, review and practice exam. Replace the three.js veil and lab agreement with a light "open in lab" link. |
| `ui/predict.js` + `engine/predict.js` ("Predict first") | **Adapt.** This is the design rule in UI form: predict, move the parameter, see the answer. Every sim lab gets 2–3 of these. |
| `notes/index.js`, `ui/notes.js`, `notes-check.mjs`, `setups.js` | **Adapt:** same HTML format and registry. "Show this in the lab" becomes a parameter preset, which is simpler than FLUX's 3D setups. |
| `canvas_ingest.py`, `canvas-ingest.yml`, `incoming/` layout | **Copy verbatim.** Only the repo variables change. |
| CLAUDE.md content-drop protocol | **Adapt** (§7). |
| `scripts/playwright.mjs`, `smoke.mjs`, `gallery.mjs` | **Adapt:** the smoke test runs every lab at 380×800 and 1280×800. |
| three.js, `scene/`, `physics/`, `engine/frame|viewport|pointer|views`, `labs/*`, `lessons/` | **Not used.** Everything is 2D. |

### New pieces (no FLUX equivalent)

- **`src/stats/`**: pure and tested.
  - `rng.js`: mulberry32 from FLUX; normal via Box–Muller or polar; exponential, gamma, chi-square, t and F draws; skewed and heavy-tailed populations.
  - `dist.js`: pdf, cdf and quantile for normal, t, χ², F, binomial, geometric, Poisson and uniform, built on regularized incomplete beta and gamma (continued fractions). Normal quantile uses AS241.
  - `tables.js`: a model of your printed tables (§5).
  - `describe.js`: mean, median, quartiles by *your textbook's* rule, s with n−1, fences, stem-and-leaf.
  - `infer.js`: every test and interval in Ch 8–9, including pooled and Welch df.
  - `regress.js`: least squares, residuals, R², leverage.
- **`src/plot/`**: a small 2D kit on Canvas 2D (DPR-aware setup taken from FLUX's `plot.js`). It covers linear scales and ticks, histograms from typed arrays, density curves, shaded regions, dot plots, interval strips, draggable points (Pointer Events, so mouse and touch work alike), and a slider with a numeric box (FLUX's "every slider has a box").
- **The lab contract (2D)**:
  `defineLab({ id, unit, ch, title, params, scenarios, compute(state, rng) → result, draw(plot, state, result), readout, coach, predictions })`.
  `compute` is pure, so the check script can run every lab headless.

**Speed.** Draws go into `Float64Array`s from one seeded stream. 10,000 samples at n = 50 is 500k draws plus a histogram, a few milliseconds in a phone browser. A Web Worker isn't needed. The seed is shown in the lab, so "Resample" is reproducible and shareable in the URL.

---

## 3. Stats colour meanings (replacing E/B/I)

One meaning per colour in every lab:

| Colour | Meaning |
|---|---|
| blue | population / H₀ |
| gold | sample / statistic |
| teal | sampling distribution |
| pink | H₁ / effect |
| red | Type I region, a miss |
| purple | Type II region |
| green | captured / correct (shared with grading, as in FLUX) |

---

## 4. Phone-first layout

The target is 380px portrait first and desktop second. There are no floating panels.

- **Header strip:** brand, unit picker, and the Practice | Notes | Explore switch.
- **Explore (phone):** lab tabs scroll horizontally. Below them:
  - the plot at full width (about 4:3, never taller than 55% of the viewport),
  - a readout row of 2–4 big numbers,
  - the Predict-first card, then the controls (slider + number box),
  - the explainer, folded by default.
- **Explore (desktop, ≥900px):** the plot on the left, with controls, readout and explainer in a column on the right.
- **Practice and Notes** use FLUX's phone sheet (`practice.css`), which the design review already rates well.

Touch targets are at least 44px and inputs 16px. Draggable points get a 24px hit radius and snap to a grid when needed.

---

## 5. Tables and grading

Every generated problem computes **both routes**:

1. the exact answer (`dist.js`), and
2. the route a student takes with the printed tables:
   - round z to 2 dp and read Φ to 4 dp,
   - read the t, χ² or F critical value at the table's df row and α column,
   - bracket a p-value between two columns when the table can't give it exactly.

Grading accepts anything in the span between the two routes, widened by half the table's last digit (for Φ, ±0.00005 plus the z-rounding effect, which can reach about 0.002 near z = 0). Derived answers (CI endpoints, test statistics) are graded after propagating that same span through the formula, not with a flat 2%.

Some answers can only be bracketed from a table (a t-test p-value). Those are **interval or choice parts**, e.g. "0.02 < p < 0.05". Each worked solution has a line like "Table: \(t_{0.025,\,10} = 2.228\) (exact 2.2281)".

**`scripts/stats-check.mjs` runs first in `npm test`, before any generator is checked.** It pins published values:

| Family | Values |
|---|---|
| z | z₀.₀₅ = 1.645, z₀.₀₂₅ = 1.960, z₀.₀₀₅ = 2.576, Φ(1.00) = 0.8413, Φ(−1.96) = 0.0250 |
| t | t₀.₀₂₅,₁₀ = 2.228, t₀.₀₅,₅ = 2.015, t₀.₀₀₅,₂₀ = 2.845, t₀.₀₂₅,₁ = 12.706, and t → z as df → ∞ |
| χ² | χ²₀.₀₅,₁₀ = 18.307, χ²₀.₉₅,₁₀ = 3.940, χ²₀.₀₂₅,₁ = 5.024 |
| F | F₀.₀₅(5,10) = 3.33, F₀.₀₅(10,5) = 4.74, F₀.₀₁(3,20) = 4.94, F₀.₀₅(1,ν) = t²₀.₀₂₅,ν |
| Discrete | binomial and Poisson pmf/cdf against textbook table entries |
| Round trips | cdf(quantile(p)) = p, pdf integrates to 1, the F reciprocal identity |
| RNG | fixed-seed moment checks (mean, variance and skew within 4 SE) |

**The analogue of FLUX's lab-agreement check:** `problems-check` also runs each generator's *simulation twin*. The analytic answer must fall inside the Monte Carlo estimate ± 4 SE: P(X̄ > a) against 20k simulated means, and a CI generator's stated coverage against simulated coverage. That checks the formulas by an independent route, the way FLUX checks Biot–Savart sums against closed forms.

---

## 6. Module plan by course section

Key: **Lab** = an interactive sim that passes the design rule. **Ref** = reference content (notes, formula sheet, tables), no sim. **Gen** = problem generators.

| Ch | Topic | Labs | Ref | Generators |
|---|---|---|---|---|
| 1 | Data analysis | **Center & spread** (secondary): drag points or add an outlier, and watch the mean chase it while the median holds. Toggle skew. **Bin width** (secondary): the same data, and the histogram's story changes with the bins. **Box plot fences** (secondary): drag a point across 1.5·IQR and it becomes an outlier; quartiles use your book's rule. | Types of data, sampling methods, stem-and-leaf how-to | Mean/median/mode, s, range, quartiles/percentiles, fences and outliers, build a stem-and-leaf and a frequency table, read a histogram |
| 2 | Probability | **Conditional probability** (secondary): an area model and tree side by side. Slide the base rate and P(A∣B) ≠ P(B∣A) becomes visible (the false-positive paradox). | Axioms, counting formulas | Sample spaces, permutations/combinations, additive rule, conditional, independence check, product rule, total probability / Bayes |
| 3 | Random variables | Part of the **Distribution explorer** (secondary): a pmf/pdf with its cdf, shade P(a ≤ X ≤ b) | Discrete vs continuous, pmf/pdf/cdf properties | Valid pmf/pdf constants, P from a pmf/pdf/cdf, cdf ↔ pdf |
| 4 | Expectation | Candidate: **Linear combinations** (secondary, optional). Var(X − Y) = Var X + Var Y surprises people, and the histogram of X − Y shows it. | E, Var, rules for aX + bY | E[X] and Var[X] from a table or pdf, E and Var of linear combinations |
| 5 | Discrete distributions | **Distribution explorer**: binomial, geometric and Poisson with sliders and shaded region | Formula sheet, binomial/Poisson tables | Binomial, geometric and Poisson probabilities and mean/variance, "at least/at most" wording traps |
| 6 | Continuous distributions | **Distribution explorer**: uniform and normal, the z_α picker. **Normal probability plot** (secondary): normal vs skewed vs heavy-tailed samples, and n's effect on wiggle. | z-table reference | Uniform probabilities, normal forward and backward (percentiles), z_α, reading a normal probability plot |
| 7 | Sampling distributions | **★1 CLT lab**: skewed population → X̄ histogram, SE = σ/√n overlay. Tabs for p̂, and for the normal approximation to Bin(n, p) with continuity correction (exact bars vs the approximating curve, the ±0.5 shaded). | Rules of thumb (np ≥ …) | Linear combinations of normals, P(X̄ …), P(p̂ …), normal approximation with continuity correction |
| 8 | One-sample inference | **★2 CI coverage**: 100 intervals, the captured count, sliders for confidence and n, z vs t toggle (and what goes wrong using z with s at small n). **★3 Errors & power**: H₀/H₁ curves, drag α, n and effect; α and β shaded, power live; one- vs two-sided. **t vs z** (secondary). | Hypothesis-test language, decision rules, the assumptions list | Z-interval, T-interval, one-proportion interval, sample size for margin E, Z-test / T-test / one-proportion test (statistic, critical value, p-value or bracket, decision, sentence), Type I/II and power |
| 9 | Two-sample inference | **★4 Test selector** (not a sim): a decision tree ending at the test, with its formula, df and assumptions, and a link to practice that test. **F shape** (secondary). **Paired vs independent** (secondary): the same data both ways, the SE of the difference shrinking with the correlation. | Formula sheet for every test | Two-proportion Z-test and interval, two means with known σ, F-test and F-interval for variances, pooled t, Welch t (your book's df rule), paired T-test and interval, plus "which test?" classification items fed from the selector's tree |
| 10 | Simple linear regression | **★5 Regression**: draggable points, the fitted line, residual sticks, R² and r, a residual plot beside it. Show leverage: an x-outlier swings the line, a y-outlier at x̄ barely does. | Formulas, assumptions | Compute b₀, b₁, r, R², predict ŷ, residual; interpret slope and R²; read residual plots for linearity |

Every ★ lab ships with 2–3 Predict-first prompts and the generators for its chapter.

---

## 7. Content pipeline (mirrors FLUX)

- `incoming/`, `canvas_ingest.py` and `canvas-ingest.yml` are **identical** to FLUX. Only `CANVAS_COURSE_ID` changes.
- Notes use the same `src/notes/content/uN-<slug>.html` format and the same `NOTES` registry fields (`lab`, `ch`, `topics`, `problems`, `home`). The CLAUDE.md protocol carries over with stats-specific error hunts:
  - n vs n−1
  - one- vs two-sided α
  - the wrong df
  - continuity-correction direction
  - a table read at the wrong tail
  - "accept H₀" wording
- **Worksheets become data, not code.** A new folder `src/content/worksheets/<wk>.json` lists entries `{ gen: 'u3.8.t-interval', src: 'WS 6 #4', values: {...}, key: {...} }`. The bank loader folds each entry into its generator's `cases`, so the printed key becomes a test fixture and the first attempt uses the worksheet's numbers. Adding a week's worksheet touches only JSON, provided a generator for that problem type exists. A type with no generator appears in the run report as "needs a generator", like FLUX's draft ideas.

---

## 8. Build order

| # | Milestone | Done when |
|---|---|---|
| 0 | **Scaffold + shell:** Vite, tokens, KaTeX, router, header and mode switch, mobile-first layout, catalog, build stamp | Empty app runs at 380px and 1280px; `npm test` and build pass |
| 1 | **`src/stats` core + `stats-check`** (published values, round trips, RNG moments) | All pinned values pass. **No generator before this.** |
| 2 | **Problem engine + practice panel port** (engine, kit, progress, fading, principle step, practice exam), table-aware grading, `problems-check` with simulation twins | One Ch 8 generator (T-interval) works end to end on a phone |
| 3 | **Plot kit + 2D lab contract** + smoke/gallery at 380×800 | A demo lab passes smoke |
| 4 | ★1 CLT lab + Ch 7 generators | |
| 5 | ★2 CI coverage + ★3 errors & power + Ch 8 generators | |
| 6 | ★4 Test selector + Ch 9 generators | |
| 7 | ★5 Regression + Ch 10 generators | |
| 8 | **Content pipeline:** ingest, notes panel, CLAUDE.md protocol, worksheet JSON | Could move up to right after 2 if weekly drops are already waiting (see questions) |
| 9 | Ch 1–6 generators | |
| 10 | Secondary labs in the order listed in the brief | |
| 11 | Deploy (Cloudflare Pages project `flux-stats`), PROVENANCE, README | |

**Status (30 Sep 2026):** 0–7, 9 and 10 done: ten labs (the five ★ labs; describing data,
conditional probability, distributions, normal probability plot, paired vs independent; t vs z and
the F shape live in the Distributions lab). Next: 8 (notes) and 11 (deploy).

**Change to 8 (30 Sep 2026):** there is no weekly Canvas drop for this course. The teacher's notes
for Ch 1–10 (already provided) are the only notes, so no ingest pipeline or scheduled run is built.
Notes are written once from them, as data in `src/notes/`, midterm chapters first.

**Status (30 Sep 2026, later):** notes for all ten chapters are done (101 worked examples, every
stated number recomputed by notes-check). Remaining: 11 (deploy), which needs the owner's
Cloudflare login.

---

## 9. Decisions (answered 30 Sep 2026)

- **Repo:** build in `dgadapee00/stats`.
- **Course:** STA 3032, Fall 2026.
  - Textbook: Walpole, Myers, Myers & Ye, *Probability & Statistics for Engineers & Scientists*.
  - Notes: the teacher's own typeset notes (TI-84 workflow).
- **Units:**
  - **Midterm**, Mon 12 Oct 2026, Ch 1–6.
  - **Final**, Mon 7 Dec 2026 at 3 pm, Ch 1–10 (cumulative).
  - As of 30 Sep the class is in Ch 6.
- **Printed tables:** Appendix A of the textbook. `src/stats/tables.js` models their exact layout:

  | Table | Rows | Columns | Precision |
  |---|---|---|---|
  | A.1 binomial cumulative | n 1–20 | p .10–.90 | 4 dp |
  | A.2 Poisson cumulative | r | μ 0.1–18 | 4 dp |
  | A.3 z, cumulative from the left | z −3.49 to 3.49 | .00–.09 | 4 dp |
  | A.4 t, upper-tail α | df 1–30, 40, 60, 120, ∞ | .40, .30, .20, .15, .10, .05, .025, .02, .015, .01, .0075, .005, .0025, .0005 | 3 dp |
  | A.5 χ², upper-tail α | df 1–30, 40, 50, 60 | .995 … .001 | 3 dp |
  | A.6 F | ν₁ 1–10, 12, 15, 20, 24, 30, 40, 60, 120, ∞ and ν₂ 1–30, 40, 60, 120, ∞ | **only α = .05 and .01** | 2 dp |

  - Because A.6 has only those two columns, an F interval or two-sided F test in this course uses α/2 ∈ {.05, .01}, so a 90% or 98% interval. Generators respect that, and use \(f_{1-\alpha}(\nu_1,\nu_2) = 1/f_\alpha(\nu_2,\nu_1)\).
  - A df between table rows is graded as correct from either neighbouring row.
- **Conventions** (updated 30 Sep from the notes for Ch 6–10; these replace the Walpole defaults below where they differ):
  - p-values and Welch's df as the TI-84 gives them (fractional df; rounded-down df also accepted).
  - Normal approximation condition: **np(1 − p) ≥ 10** (not np ≥ 5, nq ≥ 5).
  - Normal probability plot: z on the x-axis, data on the y-axis, z_i = Φ⁻¹((i − 0.5)/n).
  - Regression: ŷ = a + bx.
- **Conventions (original):**
  - **Quartiles** use the teacher's TI-84 rule: the median of the lower and upper halves, leaving the median out when n is odd (checked against her Examples 1.6 and 1.13).
  - **Box plot:** whiskers run to the most extreme values inside 1.5·IQR fences, and outliers are marked `*`.
  - **Standard deviation** s uses n − 1.
  - **Welch df** is ν rounded down (Walpole).
  - **Normal approximation to the binomial** needs np ≥ 5 and nq ≥ 5 (Walpole).
  - **Critical values and p-values** are both shown, since the textbook does both.
- **Build order change:** the midterm is 12 days out and covers Ch 1–6, so the **Ch 1–6 generators move ahead of the labs**. The Distribution explorer (Ch 5–6) moves ahead of the other secondary labs. The ★ labs then follow in the original order, starting with Ch 7, which begins 14 Oct.

### Original questions (for the record)

1. **Repo.** This session's repo is `dgadapee00/stats`. Build here, or create `flux-stats`?
2. **Exams.** Which chapters does each exam cover, and when? This drives the unit picker and practice exams.
3. **Tables.** Please send your printed z/t/χ²/F tables (a PDF or photo into `incoming/` works):
   - Is z cumulative from the left, and is it Φ to 4 dp?
   - Which α columns and df rows do the t, χ² and F tables have?
   - For a df between rows, does the class round down or interpolate?
4. **Conventions from your textbook:**
   - Which quartile/percentile rule?
   - Is the Welch df formula used as is, and rounded down?
   - What threshold for the normal approximation (np ≥ 5 or ≥ 10)?
   - Is the p-value or the critical-value approach primary?
   - Please name the textbook itself, too.
5. **Where you are now** in the course. That decides whether the content pipeline (step 8) moves up.
