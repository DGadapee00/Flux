# EGN 3321: where our answer differs from a printed one

Worked cases cite MIT OCW 2.003SC (Fall 2011) problem sets and quizzes with posted solutions (D15).
Each case reproduces the printed answer by our own computation. Where it does not, or where a printed
number looks wrong, it is listed here, as PHY 2049's `ERRATA.md` does. Statements are not copied: the
templates are our own and the cases cite set and problem.

## Printed numbers that differ from ours

- **Problem Set 5, Problem 7 (a wheel on a hill).** The printed limit is 37.07°. It comes from
  tan θ = μ(k_G² + R²)/k_G² = 0.7556, which is what R = 1 m gives. The problem states R = 1.25 m, and
  that gives tan θ = 1.068, so θ = 46.9°. We have no case for this one. The `roll-slip` lab and
  `u6.17.roll` use the correct form, so a student who follows the printed arithmetic with the stated
  radius is off by about ten degrees.
- **Problem Set 3, Problem 2 (the winch).** The printed speed after 24 s is 16.44 m/s. The second
  interval's integrand is −6.81 + 0.5t, and the printed antiderivative uses −6.82t. With 9.81 m/s² and
  the printed force curve the exact speed is 16.56 m/s, checked by numerical integration. We have no
  case for this one: the impulse template has no ramped force and no movable pulley.

## Printed answers that are rounded

- **Problem Set 2, Problem 1.** The radius of curvature is printed as 8.4 m. The unrounded value is
  8.396 m, and the printed normal acceleration (7.623 m/s²) and acceleration (8.608 m/s²) use it.
  `u1.12.path` reproduces all three.

## Printed answers that are formulas

- **Problem Set 6, Problem 6.** The printed results are T = m g h and a translational share of
  R²/(k_G² + R²), with no numbers. `u7.18.wheel-hill` evaluates them at the stated 150 kg, 1.25 m,
  k_G = 0.6 m and a 2 m drop. The case's speed is ours, not printed.
- **Problem Set 4, Problem 2.** The printed answer is a turning rate, 5.87 rad/s. `u2.13.bank` gives
  the matching speed, 5.87 rad/s times the 0.25 m radius, 1.468 m/s.

## Cases that stand in for a different template

Several problems are the same physics as a template with a different story. The case's note says how:
a girl leaping from a cart is `u4.15.recoil`'s relative-to-the-barrel case; a box on an accelerating
cart is `u6.17.crate` with a push at mid-height; a spool on a turning inclined rod is `u2.13.bank`.
