# FLUX

One study platform. Each course is a module inside a track. The hub is the front door: four track cards, and each built course opens the app that is live for it today.

| Track | Built course | Opens |
|---|---|---|
| Physics | PHY 2049 | the copy in this repo, at `phy2049/` |
| Math | MAC 2313 | https://flux-mac2313.pages.dev |
| Mechanics | EGN 3311 Statics | https://dgadapee00.github.io/statics-sim/ |
| Statistics | STA 3032 | https://flux-stats.pages.dev |

Courses that are not built yet stay on the card, dimmed. PHY 2049 opens the copy in this repo. The other three stay on their own sites until they are ported. Those repos are not edited from here.

The hub publishes to https://flux-study.pages.dev. `flux.pages.dev` is an unrelated site, so this project does not use that hostname.

```bash
npm install
npm start     # http://localhost:5173
npm test      # every workspace, including the dependency-direction check
npm run smoke # 380px and 1280px, hover, reduced motion, each built course
npm run build
```

[DEPLOY.md](DEPLOY.md) covers publishing. [PLAN.md](PLAN.md) is the phase order. [AGENTS.md](AGENTS.md) is the rules.
