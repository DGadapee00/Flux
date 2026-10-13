# Provenance and academic integrity

*What course material this project does and does not contain.*

## What this is

FLUX — MAC 2313 is a study tool: interactive 3D labs plus a bank of generated practice problems for Calculus III at UNF. It runs in a browser with nothing to install.

Its purpose is a **second opinion**. When a student works a problem, the matching lab computes the same quantity by a different route — a difference quotient against $\nabla f\cdot\hat u$, a 720-step sweep against $\mathrm{atan2}(f_y,f_x)$ — and says whether the two agree.

## What of the course's material is in the repository

Facts and structure only: that Chapter 2 covers directional derivatives, that $D_u f$ is defined for a unit vector, that $\nabla f = (\partial f/\partial x, \partial f/\partial y)$. Every problem statement is written fresh with randomised numbers. Templates cite the notes as `src: 'Merino §2.8 type'`.

## What is *not* in the repository

- No lecture notes, worksheets, slides, exams, or Canvas files, in any format.
- No scans, screenshots, or PDFs of course documents.
- No copied problem text. Two students opening the same template see different numbers.
- No answer keys from the instructor.

## Student data

None leaves the device. Progress is kept in `localStorage` under `flux-mac2313.problems.v1` and `flux-mac2313.exam.v1`. There are no accounts, no server, no database, no analytics.
