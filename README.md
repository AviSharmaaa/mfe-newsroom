# MFE Newsroom — Micro Frontend Demo

A news dashboard composed of **4 independently-runnable applications** stitched
together at runtime with [Vite Module Federation](https://github.com/originjs/vite-plugin-federation)
(`@originjs/vite-plugin-federation`). One **Shell (host)** loads three
**remotes** — and one remote is deliberately built with a completely different
tech stack to prove micro frontends are framework- and language-agnostic.

## Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │                 SHELL (host)                  │
                          │      React 18 · TypeScript · Tailwind          │
                          │           http://localhost:3000                │
                          │                                                │
                          │   navbar · live status bar · 3-column grid     │
                          │   ┌────────────────┐  ┌────────────────────┐   │
                          │   │   Headlines     │  │     Weather         │  │
                          │   │  Suspense +     │  │  vanilla mount() +  │  │
                          │   │  ErrorBoundary  │  │  loading/error      │  │
                          │   │                 │  ├────────────────────┤   │
                          │   │                 │  │     Bookmarks       │  │
                          │   └───────┬────────┘  └─────────┬──────────┘   │
                          └───────────┼─────────────────────┼──────────────┘
              runtime import()        │                     │
        ┌───────────────────┬─────────┴──────────┬──────────┴───────────────┐
        ▼                   ▼                    ▼                          ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐
│  mfe-headlines   │ │  mfe-bookmarks   │ │          mfe-weather             │
│  React + TS      │ │  React + TS      │ │  VANILLA JS — no React, no TS,   │
│  Tailwind+shadcn │ │  Tailwind+shadcn │ │  hand-written glassmorphism CSS  │
│  :3001           │ │  :3002           │ │  :3003                           │
│  exposes         │ │  exposes         │ │  exposes                         │
│  ./HeadlinesApp  │ │  ./BookmarksApp  │ │  ./WeatherWidget → mount(id)     │
└────────┬─────────┘ └─────────▲────────┘ └──────────────────────────────────┘
         │                     │
         │   window CustomEvent('article-saved', { detail: article })
         └─────────────────────┘   ← the cross-MFE event bus (no shared store)
```

| App             | Framework         | Language       | Styling                   | Port |
| --------------- | ----------------- | -------------- | ------------------------- | ---- |
| `shell`         | React 18          | TypeScript     | Tailwind + shadcn/ui      | 3000 |
| `mfe-headlines` | React 18          | TypeScript     | Tailwind + shadcn/ui      | 3001 |
| `mfe-bookmarks` | React 18          | TypeScript     | Tailwind + shadcn/ui      | 3002 |
| `mfe-weather`   | **Vanilla JS**    | **JavaScript** | **Hand-written CSS**      | 3003 |

The deliberate stack mismatch on `mfe-weather` is the whole point — it proves
the host doesn't care what a remote is built with.

## How to run

> Module Federation remotes must be **built and previewed** — they serve a
> compiled `assets/remoteEntry.js`. Only the shell runs in dev mode.

```bash
# 1. install dependencies in all 4 apps
npm run install:all

# 2. build the three remotes
npm run build:remotes

# 3. start everything (remotes on preview + shell in dev)
npm run start
```

Then open **http://localhost:3000**.

Each app also runs on its own:

```bash
cd mfe-headlines && npm run dev   # → http://localhost:3001
cd mfe-bookmarks && npm run dev   # → http://localhost:3002
cd mfe-weather   && npm run dev   # → http://localhost:3003
cd shell         && npm run dev   # → http://localhost:3000 (needs remotes built + previewed)
```

> **Re-run `npm run build:remotes` whenever you change a remote**, since the
> shell loads each remote's *built* output. After rebuilding, hard-reload the
> shell (Ctrl/Cmd+Shift+R) so the browser fetches the new chunks.

### Root scripts

| Script                   | What it does                                                        |
| ------------------------ | ------------------------------------------------------------------- |
| `npm run install:all`    | `npm i` in each of the 4 apps                                       |
| `npm run build:remotes`  | builds the 3 remotes (`remoteEntry.js` + chunks)                    |
| `npm run preview:remotes`| serves the 3 built remotes on 3001/3002/3003 (via `concurrently`)   |
| `npm run dev:shell`      | runs the shell dev server on 3000                                   |
| `npm run start`          | runs `preview:remotes` **and** `dev:shell` together                 |

## How it works

### Module Federation
Each remote's `vite.config` uses `@originjs/vite-plugin-federation` to `expose`
a module and emit a `remoteEntry.js` manifest. The shell lists the remotes under
`remotes:` and loads them with a normal dynamic `import()`:

```ts
const HeadlinesApp = React.lazy(() => import('mfe_headlines/HeadlinesApp'))
```

Nothing is bundled together at build time — the shell fetches each remote over
HTTP, from its own origin/port, **at runtime**. `react`/`react-dom` are declared
`shared` so the React remotes reuse a single copy.

### The event bus (cross-MFE communication)
MFEs never share a store or import one another. They agree only on an event name
and payload shape, dispatched on `window`:

```ts
window.dispatchEvent(new CustomEvent('article-saved', { detail: article })) // Headlines emits
window.addEventListener('article-saved', handler)                            // Bookmarks listens
```

Clicking **Save Article** in Headlines emits `article-saved`; Bookmarks (which
owns its own `useState`) picks it up and renders it. Saving in one panel
instantly reflects in the other, with zero coupling.

### Why mfe-weather is intentionally different
`mfe-weather` is pure vanilla JS + hand-written glassmorphism CSS — zero React,
TypeScript, or Tailwind. Instead of a component it exposes an imperative
`mount(containerId)` function; the shell wraps it in a small React adapter
(`WeatherWrapper`) that renders loading / error states around the mount target.

### Resilience
Every MFE in the shell is wrapped in `React.Suspense` (skeleton fallback) and an
`ErrorBoundary`. If a remote is down or throws, only its panel degrades to a
"Could not load" card with a red status dot — the rest of the dashboard keeps
working. The live status bar shows each remote's state (green = online, amber =
connecting, red = offline) with a `title` tooltip.

## Two federation gotchas worth knowing (and how they're solved here)

These bit this project during development and are great teaching moments:

1. **A federated expose may be re-wrapped under `default`.**
   `vite-plugin-federation` exposed the vanilla widget as
   `{ default: { mount }, __esModule: true }`, so `mod.mount` was `undefined`
   in the shell even though it works as a direct ESM import standalone. The
   shell resolves it defensively: `const mount = mod.mount ?? mod.default?.mount`.

2. **A remote's CSS only ships if the *exposed* module imports it.**
   The React remotes imported their Tailwind `index.css` in `main.tsx` (the
   standalone entry), but the **exposed** `HeadlinesApp.tsx` / `BookmarksApp.tsx`
   didn't — so in the shell they rendered with only the host's CSS and any
   remote-only utility classes were missing (broken badges/buttons). Fix: import
   the stylesheet inside the exposed component, so federation emits a
   `__federation_expose_*.css` and injects it into the host (the same pattern
   `mfe-weather` already used for `weather.css`).

## For the blog — 5 key demo moments

1. **Runtime composition, not a monolith.** Open the Network tab and watch the
   shell fetch three separate `remoteEntry.js` files from 3001/3002/3003 — the
   apps are stitched together in the browser, not at build time.
2. **Framework agnostic.** A vanilla-JS glassmorphism weather widget sits beside
   React+Tailwind panels, composed via a `mount()` function. Different stacks,
   one dashboard.
3. **Decoupled communication.** Click **Save Article** in Headlines and watch it
   appear in Bookmarks instantly — via a `window` CustomEvent, no shared store,
   no direct import.
4. **Independent deployability + fault isolation.** Stop one remote's preview
   server and reload: its panel shows a degraded "Could not load" card and a red
   status dot while the others keep running.
5. **Independent runnability.** Each MFE boots on its own port with its own
   `index.html` and dev server — teams can build and ship them in isolation.

## Project layout

```
mfe-newsroom/
├── package.json          # root scripts (install:all, build:remotes, start)
├── README.md
├── shell/                # host — composes all MFEs, status bar, error boundaries
│   └── src/
│       ├── App.tsx          # layout, lazy remotes, WeatherWrapper, status bar
│       ├── components/ErrorBoundary.tsx
│       ├── eventBus.ts      # canonical event-bus pattern
│       └── declarations.d.ts# ambient types for the federated remote imports
├── mfe-headlines/        # remote 1 — top tech headlines (emits article-saved)
├── mfe-bookmarks/        # remote 2 — saved bookmarks (listens for article-saved)
└── mfe-weather/          # remote 3 — vanilla JS weather widget (mount())
```

## Data sources (free, no API key)

- Headlines — `https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json`
- Weather — `https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current_weather=true`

## Design tokens / conventions

- **Card radius:** outer MFE panels use `rounded-xl` (12px); inner content cards
  use `rounded-md` (6px) — an intentional visual hierarchy.
- **Saved state:** represented by the same green `Badge` pill in both the
  Headlines and Bookmarks panels for consistency.
- **Tech stack rule for `mfe-weather`:** zero React, zero TypeScript, zero
  Tailwind — pure JS + hand-written CSS only.
