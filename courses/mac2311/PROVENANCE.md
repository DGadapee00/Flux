# Provenance

MAC 2311–2312 is a merged review course. It has no Canvas drop and no instructor files.

## Source

Problems and labs follow the section list of OpenStax *Calculus Volume 1* and *Volume 2*,
[Volume 1](https://openstax.org/details/books/calculus-volume-1) and [Volume 2](https://openstax.org/details/books/calculus-volume-2).

The book is CC BY-NC-SA 4.0: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). (Corrected 18 Oct 2026: OpenStax publishes its Calculus volumes under CC BY-NC-SA, not CC BY. Flux cites and copies nothing, so nothing else changes.)

## What ships

Statements are written fresh. Numbers are generated. A worked case may use a section's setup, cited as `OpenStax Calc 1 §2.3`, and never an invented example number. No figures and no text are copied.

The notes in `src/notes/content/` follow the book's section list. Their prose, derivations, and worked examples are written here, and every number in them is recomputed.

## What does not ship

No worksheets, slides, exams, or notes from a course. No student names, grades, or submissions.

Progress stays in the browser under `flux.mac2311.problems.v1` and `flux.mac2311.exam.v1`. The notes panel remembers its width and height under `flux.mac2311.notes.width.v1` and `flux.mac2311.notes.full.v1`.

## D28 merge

The former `courses/mac2312` labs, math, problem bank and authored notes were moved into
this course. No new source text or figures were copied. The eight notes files were recut
into six; the original worked examples remain. The legacy-seed fixture records generated
pre-merge questions and answers to verify that saved work remains reproducible.

18.01SC Single Variable Calculus (Fall 2010) sets the merged order. Its downloaded references
remain in the ignored `reference/` tree. The content scorecard rework and printed-answer
audit remain outstanding; this change establishes the merged module and migration.
