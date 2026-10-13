# FLUX

One study platform. Each course is a module. This repo is the hub: a course picker in front of the apps that are already live.

| Course | Opens |
|---|---|
| PHY 2049 | https://flux-phy2049.pages.dev |
| MAC 2313 | https://flux-mac2313.pages.dev |
| Statics | https://dgadapee00.github.io/statics-sim/ |
| STA 3032 | https://flux-stats.pages.dev |

PHY 2049 is the first card. The other three keep their own apps until they are ported. Those repos are not edited from here.

The hub publishes to https://flux-study.pages.dev. `flux.pages.dev` is an unrelated site, so this project does not use that hostname.

```bash
npm install
npm start     # http://localhost:5173
npm test      # every workspace, including the dependency-direction check
npm run build
```

[DEPLOY.md](DEPLOY.md) covers publishing. [PLAN.md](PLAN.md) is the phase order. [AGENTS.md](AGENTS.md) is the rules.
