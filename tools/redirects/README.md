# Old-site redirects

Each folder is one page. It refreshes to that course on the hub and keeps the hash, so a lab link still opens the lab.

| Folder | Opens |
|---|---|
| `phy2049/` | https://flux-study.pages.dev/phy2049/ |
| `mac2313/` | https://flux-study.pages.dev/mac2313/ |
| `sta3032/` | https://flux-study.pages.dev/sta3032/ |
| `statics/` | https://flux-study.pages.dev/statics/ |

`#/e2/gauss` on the old PHY site becomes `https://flux-study.pages.dev/phy2049/#/e2/gauss`. The hash is kept by the script. With JavaScript off, the meta refresh and the link still open the course, without the hash.

`flux.pages.dev` is a different site. These pages point at `flux-study` only.

Upload the folder as the whole site. Do this after the hub deploy, so the new address already serves the course.

## phy2049

Pages project `flux-phy2049` (https://flux-phy2049.pages.dev). Direct upload, production branch `main`:

```bash
npx wrangler pages deploy tools/redirects/phy2049 --project-name flux-phy2049 --branch main
```

Or in the dashboard: Workers & Pages → `flux-phy2049` → Create deployment, and upload the `phy2049` folder.

## mac2313

Pages project `flux-mac2313` (https://flux-mac2313.pages.dev).

```bash
npx wrangler pages deploy tools/redirects/mac2313 --project-name flux-mac2313 --branch main
```

## sta3032

Pages project `flux-stats` (https://flux-stats.pages.dev).

```bash
npx wrangler pages deploy tools/redirects/sta3032 --project-name flux-stats --branch main
```

## statics

The live app is https://dgadapee00.github.io/statics-sim/ (GitHub Pages for `statics-sim`), not a Cloudflare project. Publish `statics/index.html` as that site's `index.html` on the branch GitHub Pages already serves. The hub path is `/statics/`.
