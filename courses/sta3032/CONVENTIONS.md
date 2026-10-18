# STA 3032 conventions

These stay in this course. `CLAUDE.md` in this folder has the course's working notes.

The class works on a TI-84. Quartiles are the median of each half, and the median is excluded when
n is odd. s uses n − 1. Regression is written ŷ = a + bx, with a the intercept and b the slope.

Printed tables are data. A worked solution quotes the printed value. Grading accepts the exact value
and the table value (`alt`). p-values are the calculator's exact values (tcdf, normalcdf, and the
rest). Welch's df is the calculator's fractional value. The table's rounded-down df is also
accepted. Normal approximation for a binomial, a sample proportion, or a proportion test requires
np(1 − p) ≥ 10, and counts use a continuity correction. A normal probability plot puts
z_i = Φ⁻¹((i − 0.5)/n) on the x-axis and the sorted data on the y-axis. Table A.6 prints only
α = 0.05 and 0.01, so an F interval read from that table is 90% or 98%.

A worked case may break a condition that generated versions must meet. That condition goes in
`sampleValid`. `valid` stays the rule for generated versions.

Cite a source by section (Walpole §5.2). Textbook example numbers are never invented. Nothing from
the STA 3032 instructor's notes or review sheets goes in until they have been asked and said yes
(`PROVENANCE.md`).

A 2D lab earns its place when moving a parameter corrects an intuition. Each has two to four
predictions. `outcome(before, after)` is derived from the lab's own results, and labs-check requires
it to equal `expect`. Numbers quoted in a prediction's `why` are recomputed when a preset changes.

STA 3032 has no Notes mode (removed 13 Oct 2026).

Prose uses `$…$` and `$$…$$`. Money is written "dollars", because a bare `$` starts math.
