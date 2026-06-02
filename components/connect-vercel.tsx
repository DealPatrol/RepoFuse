'use client'
// components/connect-vercel.tsx
// Drop this on the settings page to let users link their Vercel account

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  isConnected: boolean
}

export function ConnectVercel({ isConnected }: Props) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (searchParams.get('vercel') === 'connected') {
      setStatus('success')
      // Clean URL
      router.replace('/dashboard/settings')
    }
    const err = searchParams.get('error')
    if (err?.startsWith('vercel') || err?.startsWith('token') || err?.startsWith('invalid')) {
      setStatus('error')
      setErrorMsg(err.replace(/_/g, ' '))
      router.replace('/dashboard/settings')
    }
  }, [searchParams, router])

  const handleDisconnect = async () => {
    await fetch('/api/auth/vercel/disconnect', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Vercel Account</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isConnected
              ? 'Ephemeral previews deploy to your Vercel account.'
              : 'Connect to deploy previews directly to your own Vercel account.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Connected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs h-7"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="text-xs h-7 bg-black hover:bg-zinc-900 text-white border border-zinc-700"
              onClick={() => { window.location.href = '/api/auth/vercel' }}
            >
              ▲ Connect Vercel
            </Button>
          )}
        </div>
      </div>

      {status === 'success' && (
        <p className="text-xs text-emerald-400">
          ✓ Vercel connected — previews will now deploy to your account.
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400">
          Connection failed: {errorMsg}. Please try again.
        </p>
      )}
    </div>
  )
}
