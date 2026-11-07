# EML 4140 conventions

- Answers print three significant figures, four when the leading digit is 1
  (`src/problems/engine.js`).
- Temperatures are in °C. In the rod, θ = (T − T_end)/ΔT₀ runs from 0 at the ends to 1 at the
  starting peak.
- Time is given as the Fourier number Fo = αt/L², and in seconds for a chosen material and length.
- Diffusivities at 300 K: copper 117, aluminum 97.1, carbon steel 17.7, Pyrex 0.75 mm²/s.
