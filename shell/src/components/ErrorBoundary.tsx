import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  name: string
  onStatus?: (ok: boolean) => void
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

// Isolates each MFE: if a remote fails to load or throws while rendering,
// only its card shows a degraded state — the rest of the dashboard survives.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onStatus?.(false)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="font-semibold text-red-700">{this.props.name}</p>
          <p className="text-sm text-red-600">Could not load this micro frontend.</p>
        </div>
      )
    }
    return this.props.children
  }
}
