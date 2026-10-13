# Problems

Practice problems are templates with randomised values. Authoring helpers live in `src/problems/kit.js`.

```bash
npm test
node scripts/problems-check.mjs --samples 200 --list
```

`domain(slice, { xMin, xMax, yMin, yMax })` frames the lab to the problem’s own numbers (the Calc 3 rewrite of PHY 2049’s `layout()`).

Parser: `a/bc` is $(a/b)\cdot c$. The palette’s `/` opens a bracketed denominator. `λ` and `lam` are the same symbol; for this course the useful glyphs are $\theta$, $\pi$.

Under a formula box the panel typesets what the parser understood and shows the expression’s value at the lab’s current $P$, instead of a units line.
