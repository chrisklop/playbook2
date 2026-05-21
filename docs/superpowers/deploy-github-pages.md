# Deploy to GitHub Pages

PWA deploys cleanly on GitHub Pages. HTTPS is enabled by default (required for service workers).

## One-time setup

### 1. Choose a repo + URL pattern

| URL pattern | Repo name | Vite `base` setting |
|---|---|---|
| `chrisklop.github.io/playbook/` | `playbook` (project pages) | `'/playbook/'` |
| `chrisklop.github.io/` | `chrisklop.github.io` (user pages) | `'/'` |
| `playbook.mebro.app` (custom CNAME) | any | `'/'` + `public/CNAME` file |

### 2. Set `base` in `vite.config.ts`

If using project pages at `chrisklop.github.io/playbook/`:

```ts
export default defineConfig({
  base: '/playbook/',
  // ...rest of config
});
```

For user pages or custom domain, use `base: '/'`.

### 3. SPA 404 fallback

GitHub Pages serves `404.html` when a path is not found. For client-side routing to survive a refresh on a sub-path, copy `dist/index.html` to `dist/404.html` after build. Add to `package.json`:

```json
"scripts": {
  "build": "vite build && cp dist/index.html dist/404.html"
}
```

Our app currently has no client routes (all UI state is in-memory tab refs), so this is defensive — but cheap.

### 4. Optional custom domain

Create `public/CNAME` containing one line — the custom domain:

```
playbook.mebro.app
```

Vite copies `public/*` into `dist/` on build. GitHub Pages reads `dist/CNAME` and configures the custom domain. Then point a DNS CNAME record at `chrisklop.github.io`.

## Two deployment paths

### Option A: GitHub Actions (recommended)

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec vite build
      - run: cp dist/index.html dist/404.html
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Note: we use `pnpm exec vite build` rather than `pnpm build` because `pnpm build` runs `vue-tsc --noEmit` which currently fails on pre-existing Profectus TS errors. Fix those upstream, then switch back to `pnpm build` here.

Then in repo Settings → Pages → Source: select "GitHub Actions". Every push to `main` triggers a fresh deploy.

### Option B: Manual `gh-pages` branch

```bash
pnpm exec vite build
cp dist/index.html dist/404.html
git worktree add -B gh-pages dist origin/gh-pages
cd dist
git add -A
git commit -m "deploy: v0.1.0"
git push -u origin gh-pages
cd ..
git worktree remove dist
```

Then in repo Settings → Pages → Source: "Deploy from branch", select `gh-pages` / `/ (root)`.

## PWA verification after deploy

After the site is live:

1. Visit the URL on iPhone Safari or Android Chrome
2. Open share menu → "Add to Home Screen"
3. Launch from home screen → should open standalone (no browser chrome)
4. Test offline: turn off WiFi, refresh — game should still load (service worker caches it)
5. Test save persistence: play, kill the app, relaunch — Rumor and owned generators should restore

If "Add to Home Screen" doesn't appear or doesn't install correctly:
- Confirm site is HTTPS (`https://...`)
- Confirm `manifest.webmanifest` returns 200 with proper Content-Type
- Use Lighthouse audit in Chrome DevTools → PWA category to identify what's missing
