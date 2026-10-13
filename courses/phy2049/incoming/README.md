# incoming/

Course files waiting to become part of FLUX.

- `YYYY-wkNN/` — what the weekly Canvas ingest fetched that week (the repo root's `.github/workflows/canvas-ingest.yml`).
  You can also drop a file into a folder like this by hand.
- `processed/YYYY-wkNN/` — files the weekly Claude Code run has already turned into notes. It moves
  them here in the same pull request that adds the notes.
- `.canvas-state.json` — which Canvas files have been fetched, by id and modification time. Delete an
  entry to fetch that file again.

Nothing in this folder is part of the site: the build only ships `src/`, and the platform build fails if
anything from here reaches the built site. The repository is public; the instructor has allowed his
course files to be here (see ../PROVENANCE.md, "Canvas files in the repository").
