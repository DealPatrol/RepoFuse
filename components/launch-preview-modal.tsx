'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Wrench,
  Upload,
  FolderGit2,
  Rocket,
  Eye,
  EyeOff,
} from 'lucide-react'

type PreviewStep =
  | { id: 'idle' }
  | { id: 'fetching' }
  | { id: 'fixing' }
  | { id: 'pushing' }
  | { id: 'creating' }
  | { id: 'deploying'; message?: string }
  | { id: 'done'; previewUrl: string }
  | { id: 'error'; message: string }

interface LaunchPreviewModalProps {
  repoOwner: string
  repoName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = [
  { key: 'fetching', label: 'Fetching package.json', icon: Download },
  { key: 'fixing', label: 'Updating dependencies', icon: Wrench },
  { key: 'pushing', label: 'Pushing changes', icon: Upload },
  { key: 'creating', label: 'Creating Vercel project', icon: FolderGit2 },
  { key: 'deploying', label: 'Building & deploying', icon: Rocket },
  { key: 'done', label: 'Live!', icon: CheckCircle2 },
]

function stepIndex(step: PreviewStep): number {
  if (step.id === 'idle') return -1
  if (step.id === 'fetching') return 0
  if (step.id === 'fixing') return 1
  if (step.id === 'pushing') return 2
  if (step.id === 'creating') return 3
  if (step.id === 'deploying') return 4
  if (step.id === 'done') return 5
  return -1
}

export function LaunchPreviewModal({
  repoOwner,
  repoName,
  open,
  onOpenChange,
}: LaunchPreviewModalProps) {
  const [vercelToken, setVercelToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [step, setStep] = useState<PreviewStep>({ id: 'idle' })
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const isDeploying =
    step.id !== 'idle' && step.id !== 'done' && step.id !== 'error'

  const handleLaunch = async () => {
    if (!vercelToken.trim()) return
    setStep({ id: 'fetching' })

    try {
      const res = await fetch('/api/launch-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoOwner, repoName, vercelToken }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setStep({ id: 'error', message: (data as { error?: string }).error ?? 'Request failed' })
        return
      }

      const reader = res.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (value) buf += decoder.decode(value, { stream: true })
        if (done) { buf += decoder.decode(undefined, { stream: false }) }

        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const data = JSON.parse(trimmed.slice(6)) as {
              step: string
              message?: string
              previewUrl?: string
            }

            if (data.step === 'fetching') {
              setStep({ id: 'fetching' })
            } else if (data.step === 'fixing') {
              setStep({ id: 'fixing' })
            } else if (data.step === 'pushing') {
              setStep({ id: 'pushing' })
            } else if (data.step === 'creating') {
              setStep({ id: 'creating' })
            } else if (data.step === 'deploying') {
              setStep({ id: 'deploying', message: data.message })
            } else if (data.step === 'done') {
              setStep({ id: 'done', previewUrl: data.previewUrl! })
            } else if (data.step === 'error') {
              setStep({ id: 'error', message: data.message ?? 'Preview launch failed' })
            }
          } catch {
            // incomplete chunk
          }
        }

        if (done) break
      }

      setStep((prev: PreviewStep) =>
        prev.id !== 'done' && prev.id !== 'error'
          ? { id: 'error', message: 'Operation timed out — please try again.' }
          : prev,
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Launch failed'
      setStep({
        id: 'error',
        message:
          msg === 'Load failed' || msg === 'Failed to fetch'
            ? 'Connection timed out — please try again.'
            : msg,
      })
    }
  }

  const handleClose = (open: boolean) => {
    if (isDeploying) return
    setStep({ id: 'idle' })
    onOpenChange(open)
  }

  const currentStepIdx = stepIndex(step)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-chart-2" />
            <DialogTitle>Launch Preview</DialogTitle>
          </div>
          <DialogDescription>
            Deploy{' '}
            <span className="font-mono text-xs">
              {repoOwner}/{repoName}
            </span>{' '}
            to Vercel and get a live preview URL.
          </DialogDescription>
        </DialogHeader>

        {step.id === 'idle' || step.id === 'error' ? (
          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <Label htmlFor="vercel-token">Vercel API Token</Label>
              <div className="relative">
                <Input
                  id="vercel-token"
                  type={showToken ? 'text' : 'password'}
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="paste your Vercel token here"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create a token at{' '}
                <span className="font-mono">vercel.com/account/tokens</span>. Your token is sent
                directly to Vercel and is never stored.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">What happens:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Claude updates your package.json to latest stable deps</li>
                <li>• A Vercel project is created and linked to your GitHub repo</li>
                <li>• Your app is built and deployed (~60–90 seconds)</li>
                <li>• You receive a live preview URL</li>
              </ul>
            </div>

            {step.id === 'error' && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{step.message}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleLaunch}
              disabled={!vercelToken.trim()}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Launch Preview on Vercel
            </Button>
          </div>
        ) : step.id === 'done' ? (
          <div className="space-y-5 pt-1">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="h-14 w-14 rounded-full bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-chart-1" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Your app is live!</p>
                <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
                  {step.previewUrl}
                </p>
              </div>
            </div>
            <Button className="w-full" asChild>
              <a href={step.previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Preview
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            <div className="space-y-3">
              {STEPS.map((s, idx) => {
                const isDone = currentStepIdx > idx
                const isActive = currentStepIdx === idx
                const Icon = s.icon
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-chart-1/10'
                          : isActive
                          ? 'bg-chart-2/10'
                          : 'bg-muted'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-chart-1" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 text-chart-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isDone
                            ? 'text-chart-1'
                            : isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground/40'
                        }`}
                      >
                        {s.label}
                      </p>
                      {isActive && step.id === 'deploying' && step.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.message}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Vercel builds may take up to 90 seconds — keep this window open.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
