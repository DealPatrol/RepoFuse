'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">RepoFuse</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Something broke loading this page.</h1>
          <p className="mt-3 text-sm text-gray-400">
            We logged it. Try again, or head back home.
          </p>
          {error?.digest ? (
            <code className="mt-4 rounded bg-white/5 px-2 py-1 text-xs text-gray-500">
              ref: {error.digest}
            </code>
          ) : null}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
