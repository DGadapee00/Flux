# Deploying the hub

The hub is a static site. `npm run build` writes `site/dist/`. Cloudflare Pages serves that folder. The project is **direct upload**, same as the course apps: a push to `main` does not publish anything.

**Live URL: https://flux-study.pages.dev**

`flux.pages.dev` already belongs to an unrelated project (a brake-parts site). The hub uses `flux-study` so it does not take over that hostname.

```bash
npm run deploy
```

That runs the tests, builds, and uploads `site/dist` to the Pages project `flux-study` on the production branch `main`. It needs a Cloudflare login once:

```bash
npx wrangler login
```

A `CLOUDFLARE_API_TOKEN` in the environment works instead of a browser login.

`npm run live` reads `/version.json` on the live hub and says whether that build matches this checkout.

`public/robots.txt` and `public/_headers` ship with the build and ask search engines to skip the site. The course apps do the same, and the hub links to them.
