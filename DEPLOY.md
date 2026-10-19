# Deploying the hub

**Live URL: https://flux-study.pages.dev**

The hub is a static site. `npm run build` writes `site/dist/`, with every course app in its own folder
(`site/dist/phy2049/`, `site/dist/egn3321/`, and so on). Cloudflare Pages serves that folder.

## A push to `main` publishes

The Pages project `flux-study` is connected to this GitHub repo (set 18 Oct 2026). On every push to
`main`, Cloudflare clones the repo and runs:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `site/dist` |
| Root directory | (blank: the repo root) |
| Environment variable | `NODE_VERSION` = `22`, in Production and Preview |

A push to any other branch of this repo builds a preview at `<hash>.flux-study.pages.dev`. Nothing
else is needed: no wrangler login, no GitHub secrets.

`npm run build` ends with `node packages/checks/raw.mjs --dist`, which fails the build if anything raw
or from an `incoming/` folder is in `site/dist`. If those build settings are ever cleared, Cloudflare
publishes the repo root instead, raw course files included. That happened once (18 Oct 2026);
check the settings first if the live site ever shows repository files.

The build does not run `npm test`; GitHub's `ci.yml` runs it on every push. Run `npm test` before
pushing to `main`.

## Checking what is live

`npm run live` reads `/version.json` on the live hub and says whether that build matches this
checkout. Each deployment also gets its own URL in the Cloudflare dashboard.

## Other notes

`flux.pages.dev` already belongs to an unrelated project (a brake-parts site). The hub uses
`flux-study` so it does not take over that hostname.

`public/robots.txt` and `public/_headers` ship with the build and ask search engines to skip the
site. The course apps do the same, and the hub links to them.
