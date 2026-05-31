import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { CloudOff, Loader2, Newspaper } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'

// Lazy-load each React MFE from its federated remote.
const HeadlinesApp = React.lazy(() => import('mfe_headlines/HeadlinesApp'))
const BookmarksApp = React.lazy(() => import('mfe_bookmarks/BookmarksApp'))

type MfeKey = 'headlines' | 'weather' | 'bookmarks'
type Status = 'loading' | 'loaded' | 'failed'

// Labels use the "(port)" form — no space before a colon. (#2)
const MFE_LABELS: Record<MfeKey, string> = {
  headlines: 'Headlines (3001)',
  weather: 'Weather (3003)',
  bookmarks: 'Bookmarks (3002)',
}

// Human-readable meaning for each status dot — surfaced via title on hover (#1).
const STATUS_TITLE: Record<Status, string> = {
  loading: 'Connecting…',
  loaded: 'Online',
  failed: 'Offline — failed to load',
}

// Fires onLoaded once its (lazy) parent has successfully rendered.
// Empty deps: report exactly once on mount, never on every re-render.
function ReportLoaded({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function Fallback({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/40" />
        Loading {label}…
      </div>
    </div>
  )
}

// Weather is vanilla JS — wrap the imperative mount() in a component.
// The vanilla widget fills #weather-container imperatively, so the loading /
// error feedback lives in sibling React-controlled overlays (never inside the
// mount target, which mount() overwrites). Exactly one container is rendered —
// no duplicate label/element in the DOM. (#3, #9)
function WeatherWrapper({ onStatus }: { onStatus: (ok: boolean) => void }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    // If the remote never resolves, surface a placeholder instead of a blank panel.
    const timeout = setTimeout(() => {
      if (active) setPhase((p) => (p === 'loading' ? 'error' : p))
    }, 10000)

    import('mfe_weather/WeatherWidget')
      .then((mod) => {
        if (!active) return
        // vite-plugin-federation re-wraps the exposed module under `default`
        // (same as the React remotes), so `mount` may live at either spot.
        const mount = mod.mount ?? mod.default?.mount
        if (typeof mount !== 'function') {
          throw new Error('mfe_weather: mount() export not found')
        }
        mount('weather-container')
        setPhase('ready')
        onStatus(true)
      })
      .catch(() => {
        if (!active) return
        setPhase('error')
        onStatus(false)
      })

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [onStatus])

  return (
    <div className="relative p-5">
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading weather…</p>
        </div>
      )}
      {phase === 'error' && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
          <CloudOff className="h-8 w-8 opacity-50" aria-hidden="true" />
          <p className="text-sm font-medium">Weather data unavailable</p>
          <p className="text-xs">The weather service could not be reached.</p>
        </div>
      )}
      {/* Mount target — kept in the DOM so getElementById works; hidden until ready. */}
      <div id="weather-container" className={cn(phase !== 'ready' && 'hidden')} />
    </div>
  )
}

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        status === 'loaded' && 'bg-green-500',
        status === 'failed' && 'bg-red-500',
        status === 'loading' && 'animate-pulse bg-amber-400',
      )}
    />
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

export default function App() {
  const [status, setStatus] = useState<Record<MfeKey, Status>>({
    headlines: 'loading',
    weather: 'loading',
    bookmarks: 'loading',
  })

  // Stable across renders, and bails out when the status is unchanged so we
  // never trigger a re-render loop (the callbacks below stay referentially
  // stable, so child effects don't re-fire).
  const set = useCallback((key: MfeKey, ok: boolean) => {
    setStatus((prev) => {
      const next: Status = ok ? 'loaded' : 'failed'
      if (prev[key] === next) return prev
      return { ...prev, [key]: next }
    })
  }, [])

  // Stable handler for the weather widget, whose effect depends on it.
  const setWeather = useCallback((ok: boolean) => set('weather', ok), [set])

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Navbar */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-background px-6 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Newspaper className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="mr-auto">
          <h1 className="text-xl font-bold leading-tight tracking-tight">MFE Newsroom</h1>
          <p className="text-xs text-muted-foreground">Micro Frontend Demo</p>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-muted/30 px-4 py-2">
          {(Object.keys(MFE_LABELS) as MfeKey[]).map((key) => (
            <span
              key={key}
              title={`${MFE_LABELS[key]} — ${STATUS_TITLE[status[key]]}`}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground"
            >
              <StatusDot status={status[key]} />
              {MFE_LABELS[key]}
            </span>
          ))}
        </div>
      </header>

      {/* 3-column responsive grid */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-auto p-6 lg:grid-cols-5">
        {/* Left column (~60%) — Headlines */}
        <section className="lg:col-span-3">
          <Panel title="Remote 1 · mfe-headlines (React + TS)">
            <ErrorBoundary name="Headlines" onStatus={(ok) => set('headlines', ok)}>
              <Suspense fallback={<Fallback label="Headlines" />}>
                <HeadlinesApp />
                <ReportLoaded onLoaded={() => set('headlines', true)} />
              </Suspense>
            </ErrorBoundary>
          </Panel>
        </section>

        {/* Right column (~40%) — Weather (top) + Bookmarks (bottom) */}
        <section className="flex flex-col gap-6 lg:col-span-2">
          <div className="h-auto">
            <Panel title="Remote 3 · mfe-weather (Vanilla JS)">
              <ErrorBoundary name="Weather" onStatus={setWeather}>
                <WeatherWrapper onStatus={setWeather} />
              </ErrorBoundary>
            </Panel>
          </div>
          <div className="min-h-0 flex-1">
            <Panel title="Remote 2 · mfe-bookmarks (React + TS)">
              <ErrorBoundary name="Bookmarks" onStatus={(ok) => set('bookmarks', ok)}>
                <Suspense fallback={<Fallback label="Bookmarks" />}>
                  <BookmarksApp />
                  <ReportLoaded onLoaded={() => set('bookmarks', true)} />
                </Suspense>
              </ErrorBoundary>
            </Panel>
          </div>
        </section>
      </main>
    </div>
  )
}
