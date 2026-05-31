import BookmarksApp from './BookmarksApp'
import { Button } from '@/components/ui/button'
import { eventBus } from '@/eventBus'

// Standalone wrapper so the MFE runs independently on port 3002.
// The demo button lets you fire a fake 'article-saved' event without the Shell.
export default function App() {
  const fakeSave = () =>
    eventBus.emit('article-saved', {
      title: 'Demo article saved at ' + new Date().toLocaleTimeString(),
      source: { name: 'Standalone Demo' },
      publishedAt: new Date().toISOString(),
      urlToImage: null,
      url: 'demo-' + Math.random().toString(36).slice(2),
    })

  return (
    <div className="mx-auto h-screen max-w-2xl bg-muted/30">
      <div className="border-b border-border bg-yellow-50 px-4 py-2">
        <Button size="sm" variant="outline" onClick={fakeSave}>
          + Emit test article-saved event
        </Button>
      </div>
      <BookmarksApp />
    </div>
  )
}
