# BENCH: electronics on the bench

A personal-projects module beside PHY 2049: how to put real circuits together on a breadboard to
get a job done, and how to find out why one does not work. The plan is
`docs/course-plans/bench.md` (DECISIONS.md, D35). It runs on the engineering shell; its labs draw a
half-size breadboard on the shell's 2D stage, and the circuits are solved by
`@flux/subjects/em/breadboard.js`.

Run it with `npm run dev -w @flux/bench` (port 5196). `npm test -w @flux/bench` runs its checks;
`npm run layout -w @flux/bench` checks the layout at both sizes against the dev server.
