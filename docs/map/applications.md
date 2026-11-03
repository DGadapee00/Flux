# Applications

The concept map shows how ideas connect. Applications show what those ideas help a person build.
The first application is an educational satellite model, reached from the hub's Applications link.
`?application=satellite&component=power#applications` opens a subsystem recipe.

Each recipe names existing concepts, foundation labs, the output to produce, the inputs it needs
and the interface it passes to other subsystems. Bench supplies circuit and sensor foundations.
Existing courses, labs and notes stay where they are. Satellite-specific labs and the coupled
mission simulator remain visible gaps. The recipes do not imply those tools are already built.

## Capability records

- Studied: the learner says they have studied a subsystem's foundations.
- Demonstrated: the learner records evidence after studying and recording the required inputs.
- Integrated: all seven subsystem demonstrations and a shared mission report are recorded.

These are personal records. No automatic assessment, physical test or flight qualification is
claimed. Editing a subsystem record clears its demonstration and those of its dependents, while
preserving all evidence notes. Unrelated subsystem records stay valid.

Progress is stored at `flux.applications.satellite.v1` and included in the hub's Progress backup
as the `applications` section. A blocked browser store leaves the current session usable and
shows that records cannot be saved. Restoring an older backup keeps application records when
that backup has no applications section. The hub adds the current application section before the
shared importer validates the complete file. Missing course sections and wrong course ids still fail.

The content is in `site/src/applications/satellite.js`. Capability rules and storage are in
`progress.js`; the hub view is in `view.js`. Tests check concept and lab links, prerequisite gates,
integration, evidence invalidation and backup round trips.
