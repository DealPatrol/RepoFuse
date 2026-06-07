'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, FolderGit2, Code2, Sparkles, AlertCircle, Github } from 'lucide-react'

interface Repo {
  id: string
  github_id: number
  name: string
  full_name: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

export function RepoPicker() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch('/api/repositories', { cache: 'no-store' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to fetch imported repositories' }))
          throw new Error(data.error || 'Failed to fetch imported repositories')
        }
        const data = await res.json()
        setRepos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repositories')
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  const toggleRepo = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      if (newSelected.size >= 20) return
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const handleAnalyze = async () => {
    if (selected.size < 2) {
      setError('Please select at least 2 repositories')
      return
    }

    setAnalyzing(true)
    setError(null)
    try {
      const analysisRes = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Analysis - ${selected.size} repos`,
          repositoryIds: Array.from(selected),
        }),
      })

      if (!analysisRes.ok) throw new Error('Failed to create analysis')
      const analysis = await analysisRes.json()

      window.location.href = `/dashboard/analyses/${analysis.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis')
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading your repositories...</p>
        </div>
      </div>
    )
  }

  if (error && repos.length === 0) {
    return (
      <Card className="border-red-900/30 bg-red-900/10 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load repositories</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    )
  }

  if (repos.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No repositories found</h3>
        <p className="text-sm text-muted-foreground">
          Import repositories from GitHub before starting an analysis.
        </p>
        <Button asChild className="mt-4">
          <a href="/dashboard/repositories">
            <Github className="h-4 w-4 mr-2" />
            Import repositories
          </a>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-900/30 bg-red-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Repositories</h2>
          <Badge variant="outline">
            {selected.size} / 20 selected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Select 2-20 repositories to analyze what apps you can build by combining their code.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <Card
            key={repo.id}
            className={`p-4 cursor-pointer transition-all ${
              selected.has(repo.id)
                ? 'border-primary bg-primary/5'
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => toggleRepo(repo.id)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected.has(repo.id)}
                onChange={() => toggleRepo(repo.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground truncate">{repo.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{repo.full_name}</p>

                {repo.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{repo.description}</p>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {repo.language && (
                    <Badge variant="secondary" className="text-xs">
                      <Code2 className="h-3 w-3 mr-1" />
                      {repo.language}
                    </Badge>
                  )}
                  {repo.stars > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ⭐ {repo.stars}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Ready to discover apps?</h3>
            <p className="text-sm text-muted-foreground">
              AI will scan {selected.size > 0 ? selected.size : 'your selected'}{' '}
              {selected.size === 1 ? 'repository' : 'repositories'} and find all possible applications
              you can build by combining their code.
            </p>
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={selected.size < 2 || selected.size > 20 || analyzing}
          className="w-full md:w-auto"
          size="lg"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze {selected.size > 0 ? `(${selected.size})` : ''} Repositories
            </>
          )}
        </Button>

        {selected.size < 2 && (
          <p className="text-xs text-muted-foreground mt-2">
            Select at least 2 repositories to begin analysis
          </p>
        )}
      </Card>
    </div>
  )
}
