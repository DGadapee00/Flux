# FLUX — MAC 2313

Interactive 3D labs for Calculus III (Merino, UNF). Units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/ch2/gradient`).

Built on the engine from [flux-phy2049](https://github.com/DGadapee00/flux-phy2049): the problem generator, spaced review, formula palette and the typeset panels are the same contracts; the math and the labs are new.

## Open the live app

**[https://flux-mac2313.pages.dev](https://flux-mac2313.pages.dev)** — no install. Works on a laptop, Chromebook, phone, or library machine.

Deep links work the same as locally, e.g. `#/ch2/gradient`.

Repo: https://github.com/DGadapee00/flux-mac2313 (`main`). Source only — none of the course’s lecture notes, worksheets, or Canvas files. **[DEPLOY.md](DEPLOY.md)** covers rebuilding and republishing.

## Run locally

```bash
git clone https://github.com/DGadapee00/flux-mac2313.git
cd flux-mac2313
npm install
npm start
```

Opens at http://localhost:5175/

```bash
npm test    # math self-test (no browser) + the problem-bank check
```

## Labs

### Chapter 1

| Lab | Hash | What it shows |
|---|---|---|
| Limits | `#/ch1/limits` | Limits, continuity, $f'$ vs a difference quotient; $|x|$ and $x^3$ |
| Riemann | `#/ch1/riemann1` | Left/mid/right sums vs Simpson vs $F(b)-F(a)$; graph length |

### Chapter 2

| Lab | Hash | What it shows |
|---|---|---|
| Polar | `#/ch2/polar` | $(x,y)\leftrightarrow(r,\theta)$ with $\theta\in[0,2\pi)$, $\hat r$ and $\hat\theta$ |
| Parametric | `#/ch2/parametric` | $\gamma(t)=(x(t),y(t))$, tangent, arc length two ways |
| Partials | `#/ch2/partials` | $P_y$ / $Q_x$ slices, first and second partials, Schwarz $f_{xy}=f_{yx}$ |
| Extrema | `#/ch2/extrema` | Critical points and the Hessian test $D=f_{xx}f_{yy}-(f_{xy})^2$ |
| Chain rule | `#/ch2/chain` | $g=f\circ\gamma$, $g'=\nabla f\cdot\gamma'$; two-variable $h=f\circ g$ |
| Gradient | `#/ch2/gradient` | $\nabla f$, $D_{\hat u}f$ by the dot product and by a difference quotient |

### Chapter 3

| Lab | Hash | What it shows |
|---|---|---|
| Riemann | `#/ch3/riemann` | Double Riemann boxes vs Simpson vs a closed form |
| Iterated | `#/ch3/iterated` | $\iint dy\,dx$ vs $dx\,dy$ (Fubini), type I / type II regions |
| Polar | `#/ch3/dpolar` | Disk $D_R$: Jacobian $r$, polar vs Cartesian vs polar Riemann |

### Chapter 4

| Lab | Hash | What it shows |
|---|---|---|
| R³ | `#/ch4/r3` | $u\cdot v$ two ways, $u\times v$, parallelogram area |
| Space | `#/ch4/space` | $\gamma(t)=(x(t),y(t),z(t))$, tangent line, arc length two ways |
| Partials | `#/ch4/partials3` | $f_x,f_y,f_z$ and $\nabla f$ in $\mathbb{R}^3$, Schwarz in three variables |

### Chapter 5

| Lab | Hash | What it shows |
|---|---|---|
| Triple | `#/ch5/triple` | $n^3$ cubes on a box; Fubini $dz\,dy\,dx$ vs $dx\,dy\,dz$ |
| Cylindrical | `#/ch5/cyl` | Cylinder: Jacobian $r$, polar vs Cartesian |
| Spherical | `#/ch5/sph` | Ball: $\rho$, $\varphi\in[0,\pi]$, $\theta\in[0,2\pi)$, Jacobian $\rho^2\sin\varphi$ |

The notes stop at triple integrals. There is no Green / Stokes / Divergence lab.

Practice (**P**) has generated problems for every unit. Progress stays in this browser.

Notation follows Merino: $(x,y)$ and $(x,y,z)$, $\gamma(t)$, $D_u f$ with a unit vector, $\nabla f = (\partial f/\partial x, \partial f/\partial y)$ or the three-component analogue, $\theta\in[0,2\pi)$, cross product only in $\mathbb{R}^3$.

## What the tests check

Nothing is checked against itself. Analytic partials vs central differences; mixed $f_{xy}$ from $f$ vs $\partial_y f_x$ vs $\partial_x f_y$; $D_{\hat u} f$ vs the difference quotient; steepest-ascent angle vs a 720-step sweep; polar round-trip and $\hat r\perp\hat\theta$; arc length Simpson vs polyline (and a closed form when we have one); Hessian $D$ vs mixed partials from finite differences; chain-rule $g'$ vs a quotient of $g$ vs numeric $\nabla f\cdot\gamma'$; $h_s,h_t$ vs quotients of the composite; Riemann sum vs Simpson vs closed form; Fubini $dy\,dx$ vs $dx\,dy$; type I vs type II on a disk and a triangle; polar $\iint$ (with the $r\,dr\,d\theta$ Jacobian) vs Cartesian type I vs polar Riemann; $u\cdot v$ vs polarization; $\|u\times v\|$ vs parallelogram area from a projection; space-curve length Simpson vs polyline; $f_x,f_y,f_z$ in $\mathbb{R}^3$ vs central differences and Schwarz $f_{xy}=f_{yx}$; 1D $f'$ vs a difference quotient, left/mid/right Riemann vs Simpson vs $F(b)-F(a)$, graph length Simpson vs polyline; triple Riemann vs Simpson $dz\,dy\,dx$ vs $dx\,dy\,dz$ vs a closed form; cylindrical (with $r$) vs Cartesian on a cylinder; spherical (with $\rho^2\sin\varphi$) vs Cartesian on a ball. The problem bank is then run through each lab’s own `recompute`.
