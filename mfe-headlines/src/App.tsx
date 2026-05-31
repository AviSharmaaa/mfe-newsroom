import HeadlinesApp from './HeadlinesApp'

// Standalone wrapper so the MFE runs independently on port 3001.
export default function App() {
  return (
    <div className="mx-auto h-screen max-w-2xl bg-muted/30">
      <HeadlinesApp />
    </div>
  )
}
