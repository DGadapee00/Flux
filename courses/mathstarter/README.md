# Math-shell starter

Copy this folder for a new math course. It is derived from `courses/starter`, with the
same example unit: a constant-rate tank, three problem templates, one notes file and
one checked notes setup. The engineering starter is unchanged. This workspace is
tested and buildable but is not served by the hub.

The header, predictions, notes and practice UI come from the shared math shell. The
main stage draws the tank in Three.js and animates its water level. The volume plot
is a secondary panel. Example inputs are chosen, not product measurements; this is
not a completed course or a cited application lab.

1. Copy to `courses/<id>`; replace `mathstarter` and `MATH STARTER` throughout.
2. Set the manifest, storage namespace, router, title and port from the confirmed spine.
3. Replace the EXAMPLE catalog, labs, bank, coaching, notes and provenance.
4. Keep all planned but unbuilt labs in each unit's `coming` list.
5. Register the first built slice in the hub, backup and course checks.

Run `npm run dev -w @flux/mathstarter` on 5198. Run its `test`, `build` and
`layout` scripts. The production layout script checks 380×820 and 1280×800,
notes, a lab setup, prediction grading, practice and animation. Keep floating-point
assertions tolerant. Use PHY 2049 for content depth and the shared notes type scale.
