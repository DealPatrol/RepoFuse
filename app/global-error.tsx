'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 12 }}>RepoFuse</p>
          <h1 style={{ fontSize: 32, marginTop: 16 }}>The page hit an unrecoverable error.</h1>
          <p style={{ color: '#9ca3af', marginTop: 12 }}>We logged it. Try again or go home.</p>
          {error?.digest ? (
            <code style={{ color: '#6b7280', marginTop: 16, display: 'inline-block' }}>ref: {error.digest}</code>
          ) : null}
          <div style={{ marginTop: 32 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#06b6d4',
                color: '#000',
                padding: '10px 16px',
                borderRadius: 9999,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
