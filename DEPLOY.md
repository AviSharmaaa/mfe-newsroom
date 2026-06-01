# Deploying MFE Newsroom to Vercel

This is a micro-frontend app: **4 independently-deployable apps** (1 shell + 3
remotes) stitched together at runtime via Vite Module Federation. There is **no
single deploy** — each app becomes its own Vercel project pointing at this same
repo, with a different **Root Directory**.

```
┌─────────────────────────────┐
│  shell (host)               │  ← VITE_*_URL env vars point at the 3 remotes
│  vercel project: …-shell    │
└───────────┬─────────────────┘
            │ fetches remoteEntry.js at runtime (cross-origin)
   ┌────────┼─────────────────┬──────────────────┐
   ▼        ▼                 ▼                  ▼
 headlines  bookmarks         weather
 (remote)   (remote)          (remote)
```

## What was already wired up for deployment

These changes are in the repo, so you only need to do the Vercel dashboard steps
below:

- **`shell/vite.config.ts`** now reads remote base URLs from env vars
  (`VITE_HEADLINES_URL`, `VITE_BOOKMARKS_URL`, `VITE_WEATHER_URL`) via Vite's
  `loadEnv`, and **falls back to `localhost:3001/3002/3003`** when they're unset
  — so local dev (`npm run start`) keeps working with no env file.
- **`shell/.env.example`** documents those three vars.
- **`shell/vercel.json`** — sets `dist` output + SPA rewrite to `index.html`.
- **`mfe-headlines/`, `mfe-bookmarks/`, `mfe-weather/` each have a `vercel.json`**
  that sets `dist` output and adds **`Access-Control-Allow-Origin: *`** on
  `/assets/*`. This CORS header is mandatory — without it the browser blocks the
  shell from fetching each remote's `remoteEntry.js`.

## Deploy order

Deploy the **3 remotes first** (you need their URLs), then the **shell last**.

### Step 1 — Deploy each remote (×3)

For each of `mfe-headlines`, `mfe-bookmarks`, `mfe-weather`:

1. Vercel → **Add New… → Project** → import this Git repo.
2. **Root Directory:** set to the app folder (e.g. `mfe-headlines`).
3. Framework preset: **Vite** (auto-detected). Build command `npm run build` and
   output `dist` come from the app's `vercel.json` — leave the defaults.
4. **Deploy.** Copy the resulting production URL, e.g.
   `https://mfe-newsroom-headlines.vercel.app`.

Repeat for `mfe-bookmarks` and `mfe-weather`. You'll end up with 3 URLs.

> Give the projects distinct names (e.g. `mfe-newsroom-headlines`,
> `-bookmarks`, `-weather`) so they don't collide.

### Step 2 — Deploy the shell

1. Add New… → Project → same repo → **Root Directory: `shell`**.
2. Before the first deploy, add **Environment Variables** (Production + Preview),
   using the three URLs from Step 1 — **base URL only, no path**:

   | Name                  | Value                                          |
   | --------------------- | ---------------------------------------------- |
   | `VITE_HEADLINES_URL`  | `https://mfe-newsroom-headlines.vercel.app`    |
   | `VITE_BOOKMARKS_URL`  | `https://mfe-newsroom-bookmarks.vercel.app`    |
   | `VITE_WEATHER_URL`    | `https://mfe-newsroom-weather.vercel.app`      |

   The shell appends `/assets/remoteEntry.js` itself — don't include it.
3. **Deploy.** Open the shell URL; all three panels should load.

> If you set the env vars *after* the first deploy, trigger a **Redeploy** — Vite
> inlines them at build time, so a rebuild is required for changes to take effect.

## Verify

1. Open the shell's production URL.
2. DevTools → **Network**: confirm three `remoteEntry.js` requests to the three
   remote domains, each `200` (not CORS-blocked).
3. Click **Save Article** in Headlines → it appears in Bookmarks (the
   `article-saved` window event still works, same origin = the shell page).
4. The status bar dots should all be green.

## Local development is unaffected

With no `.env` present, `shell/vite.config.ts` falls back to the localhost
preview ports, so the existing flow is unchanged:

```bash
npm run install:all
npm run build:remotes
npm run start          # remotes on 3001/3002/3003 preview + shell dev on 3000
```

To test the production wiring locally, copy `shell/.env.example` to `shell/.env`
and fill in real (or local-preview) URLs.

## Troubleshooting

- **Panel shows "Could not load" + red dot** — the shell couldn't fetch that
  remote. Check the Network tab: a **CORS error** means the remote's `vercel.json`
  header didn't apply (confirm Root Directory was the remote folder, not repo
  root); a **404 on `/assets/remoteEntry.js`** means the env var URL is wrong or
  has a trailing path.
- **Everything 404s after env change** — you forgot to redeploy the shell; env
  vars are baked in at build time.
- **Remote works standalone but not in the shell** — verify the exposed component
  imports its own CSS (see the README "federation gotchas" section); this is a
  build-time concern, unaffected by deployment.
