'use client'

<<<<<<< HEAD
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
=======
import { useEffect } from 'react'
import Link from 'next/link'
>>>>>>> origin/main

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
<<<<<<< HEAD
    console.error('[dashboard] error boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
        Dashboard
      </p>
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">This panel could not load.</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Try refreshing the panel. If it keeps happening, check your environment
          variables on Vercel.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard home</Link>
        </Button>
=======
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
>>>>>>> origin/main
      </div>
    </div>
  )
}
