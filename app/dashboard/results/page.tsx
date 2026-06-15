'use client'

import { useState, useEffect } from 'react'
import { AppDiscoveryResults, DiscoveredApp } from '@/components/app-discovery-results'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface BuildProgress {
  appName: string
  messages: string[]
  repoUrl: string | null
  done: boolean
  error: string | null
}

export default function ResultsPage() {
  const [apps, setApps] = useState<DiscoveredApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const analysisId = params.get('id')
    if (analysisId) fetchResults(analysisId)
  }, [])

  const fetchResults = async (analysisId: string) => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}`)
      const data = await res.json()
      setApps(data.apps || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateScaffold = async (app: DiscoveredApp) => {
    const repoName = window.prompt(
      `Name your new GitHub repository for "${app.name}":`,
      app.name.toLowerCase().replace(/\s+/g, '-'),
    )
    if (!repoName?.trim()) return

    setBuildProgress({ appName: app.name, messages: ['Starting…'], repoUrl: null, done: false, error: null })

    const blueprint = {
      name: app.name,
      description: app.description,
      app_type: app.category === 'ready' ? 'application' : app.category === 'quick-win' ? 'tool' : 'prototype',
      technologies: app.technologies,
      existing_files: app.existingFiles.map((f) => ({ path: f, purpose: 'Existing file from your codebase' })),
      missing_files: app.missingFiles.map((f) => ({ name: f, purpose: 'File to be generated' })),
      complexity: app.category === 'concept' ? ('complex' as const) : app.category === 'quick-win' ? ('moderate' as const) : ('simple' as const),
      estimated_effort: app.estimatedBuildTime,
      ai_explanation: null,
    }

    try {
      const res = await fetch('/api/build-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'github', repoName: repoName.trim(), blueprint }),
      })

      if (!res.ok || !res.body) {
        setBuildProgress((p) => p && { ...p, error: 'Failed to start build.', done: true })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            setBuildProgress((p) => {
              if (!p) return p
              const messages = [...p.messages, event.message].filter(Boolean)
              return {
                ...p,
                messages,
                repoUrl: event.repoUrl ?? p.repoUrl,
                done: event.step === 'done' || event.step === 'error',
                error: event.step === 'error' ? event.message : p.error,
              }
            })
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error('Build failed:', error)
      setBuildProgress((p) => p && { ...p, error: 'Unexpected error during build.', done: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discovered Applications</h1>
          <p className="text-muted-foreground">
            AI found {apps.length} applications you can build from your code
          </p>
        </div>
      </div>

      {buildProgress && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium">
            {!buildProgress.done && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Building &ldquo;{buildProgress.appName}&rdquo;</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {buildProgress.messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          {buildProgress.repoUrl && (
            <a
              href={buildProgress.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              Open repository →
            </a>
          )}
          {buildProgress.done && (
            <Button variant="outline" size="sm" onClick={() => setBuildProgress(null)}>
              Dismiss
            </Button>
          )}
        </div>
      )}

      <AppDiscoveryResults apps={apps} isLoading={isLoading} onGenerateScaffold={handleGenerateScaffold} />
    </div>
  )
}
