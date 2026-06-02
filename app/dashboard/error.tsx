'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">Dashboard</p>
      <h1 className="mt-3 text-2xl font-semibold">This panel could not load.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Try refreshing the panel. If it keeps happening, check your environment variables on Vercel.
      </p>
      {error?.digest ? (
        <code className="mt-3 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          ref: {error.digest}
        </code>
      ) : null}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          Dashboard home
        </Link>
      </div>
    </div>
  )
}
