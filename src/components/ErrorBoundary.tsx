'use client'

import React from 'react'
import Link from 'next/link'

type Props = { children: React.ReactNode }

type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-[20px] font-semibold text-[var(--color-text)]">Something went wrong.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--accent-bg)] px-5 text-[17px] font-medium text-[var(--color-text)]"
            >
              Go to Dashboard
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface2)] px-5 text-[17px] font-medium text-[var(--color-text)]"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--negative)]/50 bg-[var(--color-surface2)] px-5 text-[17px] font-medium text-[var(--color-text)]"
              onClick={() => {
                try {
                  localStorage.clear()
                } catch {
                  /* ignore */
                }
                window.location.href = '/'
              }}
            >
              Reset and start fresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
