import { useCallback, useEffect, useState } from 'react'
// Import styles in the EXPOSED module so the remote's Tailwind CSS ships with
// the federated chunk and is injected into the shell (the standalone main.tsx
// import only covers port 3001). Without this, the shell renders this MFE with
// only the host's CSS, so remote-only utilities are missing.
import './index.css'
import { Bookmark, BookmarkCheck, Newspaper, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { eventBus, type Article } from '@/eventBus'

const NEWS_URL =
  'https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json'

type Status = 'loading' | 'ready' | 'error'

export default function HeadlinesApp() {
  const [articles, setArticles] = useState<Article[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch(NEWS_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setArticles((data.articles ?? []).slice(0, 12))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = (article: Article) => {
    // Emit a CustomEvent on window — the Bookmarks MFE listens for this.
    eventBus.emit('article-saved', article)
    setSavedUrls((prev) => new Set(prev).add(article.url))
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <Newspaper className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-bold">Top Headlines</h2>
        {/* Always visible; shows a shortened label on small screens. (#12) */}
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          <span className="sm:hidden">Technology</span>
          <span className="hidden sm:inline">Technology · India</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0"
          onClick={load}
          title="Refresh"
          aria-label="Refresh headlines"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {status === 'loading' &&
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}

        {status === 'error' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-red-700">Couldn't load headlines.</p>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'ready' &&
          articles.map((article) => {
            const saved = savedUrls.has(article.url)
            return (
              <Card key={article.url} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {article.source?.name ?? 'Unknown'} ·{' '}
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                {article.urlToImage && (
                  <CardContent>
                    {/* Fixed-height container + object-cover → uniform card images. (#4) */}
                    <img
                      src={article.urlToImage}
                      alt=""
                      loading="lazy"
                      className="h-48 w-full rounded-md bg-muted object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </CardContent>
                )}
                <CardFooter>
                  {/* Saved state is a Badge pill — identical to the Bookmarks panel. (#5, #6) */}
                  {saved ? (
                    <Badge variant="success" className="h-8 px-3">
                      <BookmarkCheck className="h-4 w-4" />
                      Saved
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleSave(article)}>
                      <Bookmark className="h-4 w-4" />
                      Save Article
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
