import { useEffect, useState } from 'react'
// Import styles in the EXPOSED module so the remote's Tailwind CSS ships with
// the federated chunk and is injected into the shell (the standalone main.tsx
// import only covers port 3002). Without this, the shell renders this MFE with
// only the host's CSS, so remote-only utilities are missing.
import './index.css'
import { BookmarkCheck, Inbox, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { eventBus, type Article } from '@/eventBus'

export default function BookmarksApp() {
  // Owns its own state — completely separate from the Headlines MFE.
  const [saved, setSaved] = useState<Article[]>([])

  useEffect(() => {
    const handler = (e: CustomEvent<Article>) => {
      const article = e.detail
      setSaved((prev) =>
        prev.some((a) => a.url === article.url) ? prev : [article, ...prev],
      )
    }
    eventBus.on('article-saved', handler)
    return () => eventBus.off('article-saved', handler)
  }, [])

  const remove = (url: string) => setSaved((prev) => prev.filter((a) => a.url !== url))

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <BookmarkCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-bold">Bookmarks</h2>
        <Badge className="ml-auto shrink-0">{saved.length}</Badge>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {saved.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-40" aria-hidden="true" />
            <p className="text-sm font-medium">No saved articles yet.</p>
            <p className="text-xs">Hit save on a headline!</p>
          </div>
        ) : (
          saved.map((article) => (
            <Card key={article.url}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{article.title}</CardTitle>
                  {/* Same "Saved" pill the Headlines panel uses. (#6) */}
                  <Badge variant="success" className="shrink-0">
                    <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                    Saved
                  </Badge>
                </div>
                {/* Source · Date — matches the Headlines feed metadata format. (#7) */}
                <p className="text-xs text-muted-foreground">
                  {article.source?.name ?? 'Unknown'} ·{' '}
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {/* Outlined destructive, inline icon+text — coherent with "Save Article". (#8) */}
                <Button
                  size="sm"
                  variant="destructiveOutline"
                  onClick={() => remove(article.url)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
