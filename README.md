# FLUX

One study platform. Each course is a module inside a track. The hub is the front door: one card per track, and each built course opens the app that is live for it today.

| Track | Card opens | Also on the card |
|---|---|---|
| Physics | PHY 2049 at `phy2049/` | |
| Math | MAC 2313 at `mac2313/` | MAC 2311, MAC 2312 |
| Mechanics | EGN 3321 Dynamics at `egn3321/` | EGN 3311 Statics at `statics/` |
| Statistics | STA 3032 at `sta3032/` | |

Courses that are not built yet stay on the card, dimmed. The built courses open the copies in this repo. The old repos are frozen, and their sites stay up. Those repos are not edited from here.

The hub publishes to https://flux-study.pages.dev. `flux.pages.dev` is an unrelated site, so this project does not use that hostname.

```bash
npm install
npm start     # http://localhost:5173
npm test      # every workspace, including the dependency-direction check
npm run smoke # 380px and 1280px, hover, reduced motion, each built course
npm run build
```

[DEPLOY.md](DEPLOY.md) covers publishing. [PLAN.md](PLAN.md) is the phase order. [AGENTS.md](AGENTS.md) is the rules.
