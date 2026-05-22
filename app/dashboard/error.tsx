'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
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
      </div>
    </div>
  )
}
