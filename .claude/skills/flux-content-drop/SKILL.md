---
name: flux-content-drop
description: Process the weekly PHY 2049 Canvas content drop into rewritten notes. Use when asked to "process the content drop", and in the Sunday scheduled run.
---

# PHY 2049 weekly content drop

The full protocol, quality bar and hand-off are in `courses/phy2049/CLAUDE.md`. Follow it exactly;
this skill only points there and adds the platform rules that sit around it.

1. Work in the Flux repo (DGadapee00/Flux). The ingest Action writes to
   `courses/phy2049/incoming/YYYY-wkNN/`.
2. If there are no new files under `courses/phy2049/incoming/*-wk*/` (ignoring `processed/`), stop
   and report "no new course files". No commit.
3. Follow `courses/phy2049/CLAUDE.md` steps 1–5. Device physics for application labs lives in
   `packages/subjects/src/em/devices.js`.
4. Platform rules still apply (`AGENTS.md`): raw files stay in `incoming/`; no student data;
   `npm test` and `npm run build` pass before any push to `main`; never delete
   `.canvas-state.json`.
