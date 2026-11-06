# Provenance

Design practice lives in this folder. It is a project, not a UNF course, so it has no syllabus,
course pack or textbook. It is written here, unit by unit. Units 1 to 3 are in.

## References

Each topic cites the reference its concept on the map cites, through `src/data/textbook.js`:
Wikipedia's Engineering fit, Tolerance analysis and Geometric dimensioning and tolerancing articles
(CC BY-SA 4.0), and MIT 2.008 (Spring 2025) and 2.007 (Spring 2009) lecture notes
(CC BY-NC-SA 4.0). Nothing is copied: no prose, figures, tables or problems. Flux writes its own text.

## Data

The 50 mm fit deviations (H8/f7, H7/g6, H7/h6, H7/k6, H7/p6) come from Wikipedia's Engineering fit
article, read on 6 November 2026, which cites the ISO system of limits and fits. The bracket's
numbers in the Decision lab are illustrative, written for this course, not measured parts.

## Methods

All derivations are our own. Fits and stacks are checked by convolving binned size distributions;
position zones by 2D Simpson integration; capability by Simpson integration and by stepping a
drifting mean; the decision matrix's weight ranges by scan and bisection.
