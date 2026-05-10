// ---------------------------------------------------------------------------
// ErrorBoundary — route-level fallback so one broken page can't blank the app.
// Class component required; hooks cannot catch render errors.
// ---------------------------------------------------------------------------
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional label shown in the error card (defaults to "this page") */
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep visible in production for quick triage; filter out in tests if needed
    if (import.meta.env.DEV) {
      console.warn('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-danger-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            {this.props.label ?? 'This page'} ran into an unexpected error.
            {import.meta.env.DEV && (
              <span className="block mt-2 font-mono text-xs text-danger-600 bg-danger-50 rounded p-2 text-left">
                {this.state.error.message}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
