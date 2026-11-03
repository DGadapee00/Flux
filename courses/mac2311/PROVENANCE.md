# Provenance

MAC 2311–2312 is a merged review course. It has no Canvas drop and no instructor files.

## Source

18.01SC Single Variable Calculus, Fall 2010, sets the program and unit order.
OpenStax supplies the section references in *Calculus Volume 1* and *Volume 2*,
[Volume 1](https://openstax.org/details/books/calculus-volume-1) and [Volume 2](https://openstax.org/details/books/calculus-volume-2).

The book is CC BY-NC-SA 4.0: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). (Corrected 18 Oct 2026: OpenStax publishes its Calculus volumes under CC BY-NC-SA, not CC BY. Flux cites and copies nothing, so nothing else changes.)

## What ships

Statements are written fresh. Numbers are generated. A worked case may use a section's setup, cited as `OpenStax Calc 1 §2.3`, and never an invented example number. No figures and no text are copied.

The notes in `src/notes/content/` follow the merged program spine. Their prose, derivations, and worked examples are written here, and every number in them is recomputed.

## What does not ship

No worksheets, slides, exams, or notes from a course. No student names, grades, or submissions.

Progress stays in the browser under `flux.mac2311.problems.v1` and `flux.mac2311.exam.v1`. The notes panel remembers its width and height under `flux.mac2311.notes.width.v1` and `flux.mac2311.notes.full.v1`.

## D28 merge

The former `courses/mac2312` labs, math, problem bank and authored notes were moved into
this course. No new source text or figures were copied. The eight notes files were recut
into six; the original worked examples remain. The legacy-seed fixture records generated
pre-merge questions and answers to verify that saved work remains reproducible.

18.01SC Single Variable Calculus (Fall 2010) sets the merged order. Its downloaded references
remain in the ignored `reference/` tree. The six content reworks and printed-answer checks are recorded below. The original merge
established the module, redirects and migration.

## Unit 1 content rework

Original explanations and statements follow 18.01SC (Fall 2010), Unit 1. Symbolic worked cases reproduce the published answer formulas for exercises 1C-1, 1E-1, 1F-1, 1F-3, 1I-1 and 1J-1. Numeric cases check 1B-1, 1C-5 and the Secants and Tangents activity. Rounded printed secant values are identified as rounded. Conceptual families cite the relevant exercise or OpenStax definition; these are reasoning checks, not claims of a new printed numeric answer.

Camera inputs: Nikon AF NIKKOR 50mm f/1.8D nominal focal length 50 mm and minimum focus 0.45 m; AF NIKKOR 85mm f/1.8D nominal focal length 85 mm. Other subject distances are stated teaching inputs. The thin-lens idealisation does not claim a product calibration. No source text or figures are copied. Raw references remain outside the shipped course.

## Unit 2 content rework

Original explanations follow 18.01SC Unit 2, including Session 40’s first differential equations. Worked cases check solutions 2A-1, 2A-2, 2A-8, 2A-10, 2G-1 and the nonconvergent Newton cases in 2F-5. The open-cylinder ratio agrees with 2C-5; that source fixes area and maximizes volume, while the lab solves the inverse fixed-volume/least-area problem. The identical stationary proportions are identified explicitly. Antiderivative cases use Unit 1 solution 1E-2 with the stated integration constant. Conceptual transfers and definition-based cases are identified as such.

The can application uses the 330 mL capacity in the Coca-Cola GB-linked can listing, https://www.yourcoca-cola.co.uk/coca-cola-lemon-24-x-330ml/15227578.html (linked from the manufacturer’s Coca-Cola Original Taste page). All radii, flat-end shapes and the 500 mL alternative are teaching inputs, not product measurements. No source text or images are copied.

## Unit 3 content rework

Original statements and explanations follow 18.01SC Unit 3. Cases check exercise solutions 3B-3, 3C-1, 3C-3, 3D-1, 3A-3, 3C-6(b), 3G-1 and 3G-5; Exam 3 solutions 1 and 3(b); and Sessions 55, 58, 60 and 61. Where a formula uses a selected parameter or a generated variant, the case identifies that use. The numerical bank retains the unrounded value when a posted answer rounds. A verified arithmetic error in the published solution 3B-3(a), PDF page 4, is recorded in ERRATA.md and visibly corrected in the notes.

Spring-work data and the 6.25 J check come from OpenStax Calculus Volume 2, §2.5, Example 2.25, The Work Required to Stretch or Compress a Spring. The complementary restoring-force question is an original force-agency variant.

The rain-barrel application cites Good Ideas, Rain Wizard 50 (https://goodideasinc.com/products/rain-wizard-50), for nominal 50 US gallon capacity. The exact gallon conversion uses the shared convert module. Storm profiles, peak flows, durations and initial storage are generated teaching setups. The diagram is schematic and makes no dimensional product claim. Closed forms, independent quadrature, time stepping and water conservation check these examples. No source text or figures are copied.

### Unit 4 content rework

Original derivations and figures follow 18.01SC Fall 2010 Unit 4A–B. The resource PDFs
are numbered by the underlying exercise collection: integration techniques are in
*Solutions to 18.01 Exercises*, Unit 5, 5C-1/3/4/5/6/13, 5D-1/2/3/10,
5E-1/2/5/6 and 5F-2/4/5. Arc and surface geometry use collection Unit 4, 4G-1/2/3.
Symbolic primitives are checked by differentiation; definite values use independent
quadrature. Parameter substitutions, method interpretations and new definite-interval
checks are labeled. We use the final surface values of 4G-2/3 with original x-based
parameterizations, rather than copying the source's intermediate notation.

The bridge district's official design statistics give a 4,200 ft main span:
https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/.
The shared exact foot conversion yields 1,280.16 m; the source's 1,280 m is rounded.
The 50 m/100 m sags, 10 m model and discretization inputs are teaching assumptions.
The drawn cable, supports, deck and hangers are original schematic geometry. No
as-built cable shape, strength, tension or design adequacy is asserted.

OpenStax Calculus Volume 2 §§3.1–3.4 and §2.4 fill in the textbook treatment.

### Unit 5 content rework

Original derivations and diagrams follow 18.01SC Fall 2010 Unit 4C. Checked cases use
*Solutions to 18.01 Exercises*, collection Unit 4: 4E-2/3/7, 4H-1/2/3,
4I-1/3/4/6/7, and Session 80, *Parametric Equations of a Spiral*, part (b).
The source's simplified speed integrand is checked by independently differentiating
both Cartesian coordinates. Radius parameters, inverse conversions, branch choices
and method interpretations are labeled. Uniform angle and uniform arc-length means
reproduce 4I-6's distinct printed answers. No source figures are copied.

Audio-Technica's AT-LP60X manufacturer specifications list nominal 33⅓ and 45 RPM:
https://www.audio-technica.com/en-us/at-lp60x. The 0.14 m and 0.07 m marked radii
are teaching inputs, not measured groove positions. The original top-view disk and
arm are schematic. Positive counterclockwise rotation is a mathematical convention,
not a statement about the product's direction. The mark is not a stylus. Shared exact
RPM conversion supplies angular speed. Position derivatives, circumference, sector
geometry and timing/scaling identities independently check the model.

OpenStax Calculus Volume 2 §§7.1–7.5 supply parameter restrictions, tangent conditions,
polar intersections and eccentricity. The notes explicitly retain the directrix
absolute value until choosing a branch.

### Unit 6 content rework

Original notes follow 18.01SC Fall 2010 Unit 5, with OpenStax's sequence and convergence
spine. Checked cases use Sessions 88(b), 90, 91, 94(c), 95(b,c), 97, 98 and 100,
and Final Exam Solutions problem 14(a,c,d). Symbolic logarithmic coefficients and
polynomials reproduce the printed formulas; the series-integral approximation is
13/42, not a claim that this finite approximation equals the exact integral.
New truncations, error-bound questions and series substitutions are labeled as transfers. Conceptual
cases cite definitions or theorem applications, rather than invented numeric answers.

The clock application cites Parliament's Great Clock facts, including the 2 s beat
and 4.4 m overall pendulum dimension:
https://www.parliament.uk/about/living-heritage/building/palace/big-ben/facts-figures/great-clock-facts/.
Two beats make a full 4 s cycle. This calibrates an equivalent point-mass length;
it is not a measurement or substitution of the 4.4 m overall dimension. The shared
conventional standard gravity supplies g, not measured local gravity. Swing amplitudes
and the quarter-length variant are assumptions. The drawing is original and schematic.
No prediction of the actual clock's timing or escapement behavior is made.

NIST DLMF §19.2 defines K(k), and §19.5 gives its hypergeometric series. Our derivation
integrates the binomial series and bounds its tail by a geometric majorant. An
arithmetic-geometric-mean evaluation is checked against independent quadrature and
length/amplitude scaling. OpenStax Calculus Volume 1 §4.8 and Volume 2 §§3.7, 5.1–5.6,
6.1–6.4 supply the remaining theorem hypotheses and examples.
