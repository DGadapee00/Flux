# FLUX · EGN 3311 Statics

Four linked units of notes, interactive labs and generated practice on the shared engineering
shell. PHY 2049 supplies the content and interaction benchmark. The course follows 2.001
lectures 1–6, supplemented by Hibbeler Ch 2–10.

From the repository root:

```sh
npm run dev -w @flux/statics
npm test -w @flux/statics
npm run scorecard -- --units
npm run layout -w @flux/statics
npm run smoke -w @flux/statics
```

The browser checks need the dev server at http://localhost:5176/. Smoke accepts
`SMOKE_URL`, `SMOKE_SHOTS` and `CHROMIUM_EXECUTABLE` overrides.

| Unit | Applications | Notes setups | Conceptual templates |
|---|---|---|---|
| Force vectors | Pallet lifting bridle | 6 | 3/9 |
| Equilibrium and moments | Wall shelf | 7 | 3/10 |
| Rigid bodies and trusses | Sign gantry, scissor jack | 9 | 3/10 |
| Friction and section geometry | Bookcase | 10 | 4/14 |

The 15 lab routes have 30 predictions. The 43 templates include forward and inverse problems,
symbolic expressions, staged hints, per-choice explanations and named numeric mistakes.
A problem loads its own lab setup with answer readouts hidden. Notes examples open the real lab.

Each application cites its published dimensions or rating and identifies assumed geometry and
loads. These are ideal models, with explicit limits. Closed forms are checked by equilibrium,
sections, integration or virtual work. The shared vector solver also has an obtuse-resultant
regression check.

Routes use `#/statics/u3/truss`, `?p=ch6.truss-joints&s=0` for practice, and `?n=s2` for notes.
Original lab routes and progress keys remain supported. Backups live on the hub.

See [the course plan](../../docs/course-plans/statics.md), [CONVENTIONS.md](CONVENTIONS.md) and
[PROVENANCE.md](PROVENANCE.md). The measured scorecard passes; `standard` remains false.
The complete printed-answer case audit and the owner's student review remain outstanding.
