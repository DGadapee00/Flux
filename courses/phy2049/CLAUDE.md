# FLUX: notes for Claude

**This course now lives in the Flux platform repo (DGadapee00/Flux), at `courses/phy2049/`.** Paths
in this file are relative to that folder, and commands run from it, unless they say "repo root".
The old repo, flux-phy2049, is frozen and no longer edited. The platform's own rules are in the
repo root's `AGENTS.md` and `ROADMAP.md`; where they and this file differ about the platform, they win.

FLUX is a Vite + vanilla JS + three.js + KaTeX study app for PHY 2049. It has three modes: Practice, Notes and Explore. `README.md` covers the layout of the code. `PROVENANCE.md` covers what the instructor has allowed us to include.

## Checks

- `npm test` runs tex-check, the physics selftest, problems-check and notes-check. All of them must pass.
- `npx vite build` must succeed.
- At the repo root, `npm test` and `npm run build` must also pass. The root build includes the
  built-site raw-file scan, which fails if anything from `incoming/`, or any PDF, slide or Word
  file, would ship.
- `node scripts/smoke.mjs` runs every lab headless, and `node scripts/gallery.mjs [labId]` screenshots each scenario into `scripts/output/gallery/`. Both need the dev server on port 5174 (`npx vite --port 5174 --strictPort`, in the background). Font TLS errors in a sandbox are expected; nothing else is.

## Content drop protocol

A GitHub Action at the repo root (`.github/workflows/canvas-ingest.yml`) downloads new Canvas course files into `incoming/YYYY-wkNN/` every Sunday. A scheduled Claude Code run then follows this protocol. When someone says "process the content drop", follow the same steps.

### 0. Is there anything to do?

List the files under `incoming/*-wk*/`, ignoring `incoming/processed/`. If there are none, stop. Make no commit, and report "no new course files".

### 1. Read and sort

Read every new file. PDFs and `.html` files (Canvas pages and assignment descriptions the ingest saves) can be read directly; for `.pptx` and `.docx`, extract the text. Sort each file into one of three kinds:

- **Lecture notes / slides.** Material for the notes (steps 2–3).
- **Homework, quizzes, exams.** Use them only to draft problem ideas for the run report (step 5). Do not add problems from them to `src/problems/` in an automated run. (A new application lab brings its own problem; see step 3.)
- **Anything else** (syllabus, announcements, rubrics). Mention it in the run report and do nothing more.

Map each chapter to its exam using `src/data/catalog.js`, where each exam lists its chapters.

### 2. Write the notes, in the existing format

Notes live in `src/notes/content/eN-<slug>.html`, one file per exam. If the exam already has a file, extend it with new sections. If not, start a new one by copying the structure of `e4-charge-in-motion.html`. Match that file exactly:

- The `<head>` keeps its MathJax config and `<style>` block. That makes the file readable on its own; FLUX strips them.
- `<header class="top">` holds, in order:
  - `.eyebrow`, e.g. "PHY 2049 · Calculus Physics II · Week N · Lecture notes Ch A–B, rewritten"
  - an `<h1>` title
  - `.lede`
  - `.legend`
  - `<nav class="toc">`, with an `<a href="#sN"><span>N</span>Title</a>` link for every section
- `<main>` holds parts, sections and boxes:
  - Parts are `<div class="part"><div class="eyebrow">Part I</div><h2>…</h2></div>`.
  - Each section is `<section class="topic" id="sN">`, numbered s1, s2, … in order. The first child is `<h2><span class="n">N</span>Title</h2>`.
  - Boxes are `<div class="box ex|why|fix|key"><span class="tag">…</span>…</div>`:
    - `ex` is a worked example.
    - `why` is a derivation.
    - `fix` is a correction to the original notes.
    - `key` is a key idea.
- Math uses only `\( … \)` inline and `\[ … \]` display. It is typeset by KaTeX, so write KaTeX-compatible TeX. `$` is never a math delimiter.
- `<footer>` names the source chapters and lists the constants used.

Write the notes as rewritten notes, not as a transcript:

- Derive the rules instead of listing them.
- Recompute every worked answer yourself.
- Where the source is wrong (arithmetic, sign, units, a wrong formula), give the correct version and add a `box fix` saying what the original said and why it is wrong. Never silently correct the source.
- Do not copy slides verbatim. Do not include images from the source files.

#### The quality bar

The Exam 3 and Exam 4 notes (`e3-potential-to-power.html`, `e4-charge-in-motion.html`) set the standard. Read one of them in full before writing, and match it.

**Voice.** Short, plain, declarative sentences, averaging about 15 words. Use no em dashes; use a period, a colon or a list instead. Cut filler ("genuinely", "exactly", "simply", "just", "actually", "utterly"). Say a thing once. Model sentences: "Those terms are voltages. Power is \(P = I^2R\)." and "A magnetic field can turn a charge but can never speed it up or slow it down."

**Keep the class's own examples.** Students will meet the professor's worked examples in lecture and on the worksheets. Rewrite those examples, with the source's numbers, and label them as the source does (for example "Mike and Cathy", "ball 1, 2, 3"). Add your own examples only where the source has none, such as for a derivation that ends in a formula. Every topic, worked example and application in the source should appear in the notes unless it is course logistics.

**Hunt for errors in the source, not only the arithmetic.** Recomputing numbers catches only one kind of slip. For every claim, check:
- **Physics.** Is the statement true? Examples: "no change in speed" for an electric force perpendicular to \(v\); "positive charge flows" in a metal.
- **Signs and directions.** Does the stated direction follow from the charge's sign and the force? Is a sum that comes out negative written as negative?
- **Labels.** Does "force on ball 2" really mean ball 2? Does a heading match its content? Is each subscript right?
- **Units.** Does each equation balance? Example: "net flux equals \(q\)" is missing \(\varepsilon_0\).
- **Overstatements.** Watch for "MUST", "only" and "always" where the source's own examples contradict it.

Expect to find several errors per chapter. Exams 3 and 4 flag 11 and 14. A set with only two or three corrections probably means the hunt was shallow. Read again before settling.

**Don't manufacture corrections.** A rounded value such as "about 2,000 times" for 1836 is not an error. Every `box fix` must name something a student would get wrong by trusting the source.

**Check your own text as hard as the source's.** Recompute your own examples. Make sure every "Section N" reference points at something that exists. Make sure limits are named correctly (a disk's \(R\to\infty\) limit is not its far field). Make sure each "strongest", "weakest" or "zero" is true.

### 3. Register the notes

Edit the `NOTES` entry in `src/notes/index.js`, or add one for a new exam with `exam`, `title`, `chapters`, `file` and `load`. Add one `sections` entry per section, in order: `{ id, n, title, lab, ch, topics, problems?, home? }`.

- `title` must match the section's h2 text exactly.
- `lab` is the id of a lab (`LAB_META` in `src/data/catalog.js`) that belongs to the same exam, or `null`.
- `ch` lists the chapters whose practice problems the section prepares.
- `topics` holds topic tags used by problems in `src/problems/` (grep for `topics:`). Choose narrow tags; a tag every problem in the chapter carries pulls them all into one section.
- `problems` pins specific problem ids when the topics alone would send them elsewhere.
- `home: true` marks the section a lab's Notes link should open, when that is not the lab's first section.

`scripts/notes-check.mjs` enforces all of this and typesets every formula. Fix the file until it passes.

When a new worked example matches something a lab can show (charges and a probe, a circuit, a capacitor, a wire), add an entry to `src/notes/setups.js`. That gives it a **Show this in the lab** button. Each entry names the example by its tag, sets the lab's state in SI units, and has a `read()` that pairs lab values with the numbers in the notes. notes-check runs every setup in the real lab and fails if they differ by more than 2%. Don't add a setup whose picture would disagree with the example. If the lab can show only part of it, say which part in `note`.

When the source describes a real device that runs on the section's physics (a thruster, a motor, a sensor), add it as a worked example tagged `Application · <device>`: the device in a paragraph, the course equations with realistic numbers, recomputed. If one of the application labs (`railgun`, `thruster`, `cyclotron`, `powerline`, `motor`, `mri`, `transformer`, `flowmeter`, `radargun`, `solarsail`) can show it, add a setup. If none can, build a new application lab for it (below).

When the notes derive an integral one of the labs shows (an RC equation, a Biot–Savart or Ampère setup, a charged rod), consider a step-through derivation in `src/derive/` (format at the top of `src/derive/exam4.js`), with `notes: { exam, section, h3 | box }` so the notes get a **Step through it in the lab** button. `scripts/derive-check.mjs` runs every line in the lab.

#### Building an application lab

Build one only for a device the source names, whose working the course equations fully explain, with realistic numbers you can check. At most two new labs per run. If a device doesn't meet that bar, name it in the run report as a candidate instead. Copy the pattern of `mri.js`, `motor.js` and `powerline.js`, which are the models:

- **Physics.** Add a pure function to `packages/subjects/src/em/devices.js` (repo root; `src/physics/devices.js` here only re-exports it) with a comment deriving it, and checks to `src/physics/selftest.js`: the notes' numbers, and at least one scaling (double an input, predict the factor).
- **Lab.** `src/labs/<id>.js` with `defineLab`: `orbit: false` and a fixed camera, so the lab fits a phone. Use the `label`, `si` and `points` helpers in `src/labs/device-kit.js` and the scene palette (E yellow, B teal, I gold, F pink, v white). Hide unused particles with `setDrawRange`, never by moving them off screen. Give it 2–3 scenarios with real numbers, sliders for the inputs, a readout, and an explainer that ends with **What the course model leaves out.**
- **Register it** in `src/data/catalog.js` (the exam's `labs` list and `LAB_META` with `app: true`), `src/labs/load.js` and `src/data/quantities.js`. Add two Predict-first prompts to `src/data/predictions.js`.
- **Notes.** The `Application · <device>` box gets a setup in `src/notes/setups.js` for the new lab.
- **Practice.** One problem in `src/problems/bank/eN.js` titled `Application: <device>`, with a `sim` on the lab, a case using the notes' numbers (in display units), an `Application: …` stage in `src/problems/sequence.js`, `PRINCIPLE_TAGS` in `src/problems/principles.js`, and hints in `src/problems/coaching/eN.js`. This is the one kind of problem an automated run may add.
- **Docs.** Add a row to the README's Applications table and the lab's id to the list above.
- **Check it by eye.** Run `node scripts/smoke.mjs` and `node scripts/gallery.mjs <id>`, and look at every screenshot, plus one at 390×844. Nothing may overlap, clip or sit off screen. Fix what you see before committing.

### 4. Verify

- Run `npm test` and `npx vite build` here, then `npm test` and `npm run build` at the repo root. All four must pass.
- If a lab or its wiring changed, also run `node scripts/smoke.mjs`. For a new lab, also run `node scripts/gallery.mjs <id>` and look at the screenshots.
- Self-review against the quality bar, and fix what fails:
  - Count the `box fix` corrections and `box ex` worked examples, and compare with an Exam 3/4 set covering a similar number of chapters.
  - Compute the average sentence length and the em-dash count of the prose in `<main>`, excluding math.
  - List every worked example in the source and confirm each appears in the notes.
  - Re-read each `box fix` against the source PDF page it quotes.

### 5. Hand off

1. `git mv` each processed file from `incoming/YYYY-wkNN/` to `incoming/processed/YYYY-wkNN/`. Keep `incoming/.canvas-state.json`; the ingest needs it.
2. Write the **run report**. It lists:
   - the files processed and what each became
   - the sections added or changed
   - every `box fix` correction, quoted, so the owner can check them
   - the self-review numbers from step 4 (corrections, worked examples, average sentence length, em dashes) next to the same numbers for the Exam 3/4 notes
   - any new labs, with a one-line description and their scenarios
   - draft practice problem ideas from any homework or quiz files, as text only
   - anything skipped, and why
3. If every check in step 4 passed, commit directly on `main`, with a subject `Content drop YYYY-wkNN: <chapters>` and the run report as the commit message body. Then `git pull --rebase origin main` and `git push origin main`. A push to `main` deploys the site (the repo root's `.github/workflows/deploy.yml` publishes to Cloudflare Pages), so the notes go live without review.
4. If any check still fails, or the push to `main` is refused, push the commit to a branch named `content/YYYY-wkNN` instead and open a pull request to `main` with the run report and what failed. Never force-push `main`.
5. End the run with the run report and the commit link.

### Never

- Never copy raw course files (PDF, slides, docs) into `src/` or `public/`, or into anything that ships. Only rewritten notes ship.
- Never include student names, grades or submissions.
- Never delete `incoming/.canvas-state.json`.
- Never put raw course files anywhere but `incoming/`. The repository is public, and the course
  instructor has allowed his course files to be in it (see `PROVENANCE.md`); they still never ship.
