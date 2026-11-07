# Provenance

Design practice lives in this folder. It is a project, not a UNF course, so it has no syllabus,
course pack or textbook. It is written here, unit by unit. Units 1 to 6 are in.

## References

Each topic cites the reference its concept on the map cites, through `src/data/textbook.js`:
Wikipedia's Engineering fit, Tolerance analysis and Geometric dimensioning and tolerancing articles
(CC BY-SA 4.0), and MIT 2.008 (Spring 2025) and 2.007 (Spring 2009) lecture notes
(CC BY-NC-SA 4.0). Nothing is copied: no prose, figures, tables or problems. Flux writes its own text.

## Data

The 50 mm fit deviations (H8/f7, H7/g6, H7/h6, H7/k6, H7/p6) come from Wikipedia's Engineering fit
article, read on 6 November 2026, which cites the ISO system of limits and fits. The bracket's
numbers in the Decision lab are illustrative, written for this course, not measured parts. The
Verification lab's 6061-T6 values (E = 68 GPa, minimum yield 35 ksi = 241 MPa) come from Wikipedia's
6061 aluminium alloy article, read on 6 November 2026. Joint stiffness ratios and mount stiffnesses
are round example values. Units 5 and 6 take a foil gauge factor of about 2 and the quarter-bridge
estimate (Strain gauge), the Kv definition (Flow coefficient), copper's resistivity 1.68 × 10⁻⁸ Ω·m
(Electrical resistivity and conductivity) and 1 oz copper as 35 μm (Printed circuit board), all from
Wikipedia, read on 6 November 2026. The gauge's 10 με per °C drift, the pump, pipe and valve sizes,
and the board's currents are example values written for the labs. The type K sensitivity (about
41 μV/°C), the Pt100 constants (R0 = 100 Ω, A = 3.9083 × 10⁻³, B = −5.775 × 10⁻⁷) and the orifice
equation come from Wikipedia's Thermocouple, Resistance thermometer and Orifice plate articles, read
on 6 November 2026. The motor's constants, the transmitter accuracy and the 16 MHz timer clock are
example values. The decoupling lab's 1 nH per mm, the chip's own 2 nF and its 3.0 V reset, and
the tolerance-cost constants are example values; the 100 nF per chip, placed close, follows
Wikipedia's Decoupling capacitor article.

## Methods

All derivations are our own. Fits and stacks are checked by convolving binned size distributions;
position zones by 2D Simpson integration; capability by Simpson integration and by stepping a
drifting mean; the decision matrix's weight ranges by scan and bisection; the bolted joint by a spring network
solved by bisection; contact ranks by elimination and by minors, seating by normal equations and
conjugate gradients; sketches by a Newton constraint solver; the bracket by integrating curvature.
