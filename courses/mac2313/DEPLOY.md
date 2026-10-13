# Deploying FLUX — MAC 2313

**Live at <https://flux-mac2313.pages.dev> on Cloudflare Pages, public, no login.** Same hosting choice as flux-phy2049: a link that just works. `public/robots.txt` and `public/_headers` keep the site out of search results.

The app is a static site. `npm run build` writes `dist/`. `vite.config.js` sets `base: './'`, and routing is hash-based (`#/ch2/gradient`), so any static host works. Dev server: port **5175** (PHY 2049 owns 5174).

## Updating the live site

The Pages project is a **Direct Upload** project, not Git-connected. Pushing to `main` does not publish anything — a hosted build is a snapshot, and it only changes when someone uploads a new one.

### Shipping a release

```bash
npm run deploy
```

That runs the tests, builds, and uploads `dist` to the Pages project in one go. It does not need Wrangler installed — `npx` fetches it for that run — but it does need to be authorised once:

```bash
npx wrangler login      # opens a browser, once per machine
```

(A `CLOUDFLARE_API_TOKEN` in the environment works instead, if you'd rather not log in.)

The production URL never changes. Check the first run landed under **Production** rather than Preview in the dashboard; if it shows as a preview, the project's production branch is named something other than `main` and the `--branch` flag in the `deploy` script should match it.

The dashboard route still works if you'd rather click: Workers & Pages → `flux-mac2313` → Deployments → Create new deployment, and upload `dist`.

### Knowing what is actually live

Every build stamps itself with the commit it came from, served at
<https://flux-mac2313.pages.dev/version.json> and logged to the browser console.

```bash
npm run live
```

compares that stamp with the local checkout. Progress is per-origin in `localStorage`. A hosted copy starts everyone at zero.
