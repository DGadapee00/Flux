# EGN 3311 Statics conventions

These stay in this course. They are not copied into `packages/core` or the engineering shell.

- Hibbeler, chapters 2–10, cited by section.
- The second opinion is equilibrium about every point, reported as a residual. Joints are checked
  against sections, and composite parts against integration.
- US customary and SI both go through `subjects/src/convert.js`.
- Worked cases carry numbers from public problem decks (`PROVENANCE.md`).

- The application models use SI. Published customary-unit data is converted through
  `@flux/subjects/convert.js`; legacy deck problems retain their stated display units.
- Positive external planar moments are counterclockwise. Positive beam bending is sagging;
  plotted shear is the upward external-force sum to the left of the cut.
- Student-error boxes are labelled **Common mistake**. A source correction must identify its source.
- Application drawings use pink force arrows and teal for a distinguished cable or chord.
- Notes preferences use `flux.statics.notes.width.v1` and `flux.statics.notes.full.v1`.
