# Concept map prototype

`prototype-flux-thread.html` is the prototype the owner approved on 2 November 2026: one thread,
flux and divergence, followed across 15 concepts from Calculus III through electricity and
magnetism, thermo and fluids, and heat transfer. Open it in a browser.

It is the reference for the refactor: its data shape (`NODES`: idea, equation, prerequisites,
sources with a reason for each, the Flux lab that shows it, a lab idea where there is none), its
layout (subject lanes, prerequisites left to right, a reading panel, a trail of where you have
been) and its look. Its 15 concepts are the seed data for the map.

## Learner home prototype

`prototype-learner.html` is a proposal, not yet approved. It asks what Flux looks like once it
knows the learner: a Today page (reviews due across every course, the next concept you are ready
for, the next exam), a map filled in by your own progress, a page per concept with your steps
through it, and a satellite whose subsystems open as their concepts become solid. The orbit
subsystem checks the learner's speed and period against a closed form and an integrated orbit.

It is generated from the real map, problem banks and PHY 2049 exam calendar. Rebuild it after the
data changes:

```bash
node docs/map/prototype-learner/build.mjs
```

It opens on a sample learner. Choose "Load a Flux backup file" to see your own progress: make the
file with the hub's Back up progress button. Course apps are unchanged; the lab links open them.
