# Errata

Places where the app's answer differs from a printed answer in the class material or the textbook's
tables. Each is recomputed; the practice problem's solution says the same thing where it applies.

## Teacher's notes

| Where | The notes say | Correct | Why |
|---|---|---|---|
| Ex 5.8(b), P(X ≥ 1) for λ = 1.5 | 1 − 0.2231 = 0.7669 | 0.7769 | Subtraction slip; e^−1.5 = 0.2231 is right. |
| Ex 9.15, difference for machine 4 | 0.337 | 0.277 | 1.339 − 1.062 = 0.277. The TI-84 (L3 = L1 − L2) uses the columns: d̄ = 0.2086, t₀ = 2.70, p = 0.0271 (the column as printed gives 0.2152, 2.75, 0.0251). The decision at α = 0.01 is the same. |
| §3.2, definition of the discrete CDF | F(x) = Σ over t < x | Σ over t ≤ x | F(x) = P(X ≤ x) includes f(x) itself (in Ex 3.4, F(0) = f(0) = 1/16). |
| Ex 4.4, handwritten answer | E(X) = 3.8 | E[g(X)] = E(2X + 1) = 3.8 | Notation: E(X) itself is 1.4. |
| §8.4.2, 1-PropZInterval condition | np̂(1 − p̂) ≤ 10 | np̂(1 − p̂) ≥ 10 | The sample must be large enough; the inequality is reversed. |

Not errors, but worth knowing:

- The calculator screens under Ex 1.15 show a different list (19.95, 28.58, …), not the 18
  collision claims of the example.
- Ex 8.14 runs a one-proportion z-test with np₀(1 − p₀) = 200(0.05)(0.95) = 9.5, just under the
  notes' own condition of 10. The app keeps the example and says so in its solution.
- Ex 9.15's calculator steps mention the dominant hand; that wording belongs to Ex 9.16.
- Ex 10.2(d) predicts at 10°F, below the smallest temperature in the data (21°F): an
  extrapolation.

Rounding, not errors: Ex 5.2 f(1) = 0.368 (exact 0.3685), Ex 5.5 σ² = 4.83 (exact 4.838). The app
accepts both.

## Textbook tables (Appendix A)

`scripts/stats-check.mjs` compares every printed t, χ² and F entry with the exact value. Entries off
by more than one unit in the last printed place:

- Table A.4, t₀.₀₀₀₅ with ν = 1: printed 636.578, exact 636.619.
- Table A.5, α = 0.001 column, ν = 13, 19, 21, 27, 30, 40: each off by a little over one unit in the
  last place (for example ν = 13: printed 34.527, exact 34.528).

The grader accepts the printed value and the exact value.
