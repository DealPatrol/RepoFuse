'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FolderGit2, Sparkles, AlertCircle, Loader2, Github } from 'lucide-react'

interface Repository {
  id: string
  github_id: number
  name: string
  full_name: string
  description: string | null
  url: string
  language: string | null
  stars: number
  default_branch: string
}

export function RepositorySelector() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/repositories', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to fetch imported repositories' }))
        throw new Error(data.error || 'Failed to fetch imported repositories')
      }
      const data = await res.json()
      setRepos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRepositories()
  }, [fetchRepositories])

  const toggleRepo = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      if (newSelected.size >= 20) {
        alert('Maximum 20 repositories can be selected')
        return
      }
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const handleAnalyze = async () => {
    if (selected.size < 2) {
      alert('Please select at least 2 repositories')
      return
    }

    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Analysis - ${new Date().toLocaleDateString()}`,
          repositoryIds: Array.from(selected),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create analysis')
      }
      const analysis = await res.json()
      window.location.href = `/dashboard/analyses/${analysis.id}`
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start analysis'
      console.error('[v0] Analysis creation error:', errorMsg)
      alert(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground/50" />
          <p className="text-muted-foreground">Loading your repositories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-red-900/30 bg-red-900/10">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Error Loading Repositories</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Select Repositories</h2>
        <p className="text-muted-foreground">
          Choose between 2 and 20 repositories to analyze. We will discover what apps you can build from your code.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selected.size} of {repos.length} selected
        </span>
        {selected.size >= 2 && (
          <div className="w-full bg-border rounded-full h-2 ml-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(selected.size / 20) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {repos.map((repo) => (
          <Card
            key={repo.id}
            className={`p-4 cursor-pointer transition-all ${
              selected.has(repo.id) ? 'border-primary bg-primary/5' : 'hover:border-foreground/50'
            }`}
            onClick={() => toggleRepo(repo.id)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected.has(repo.id)}
                onChange={() => toggleRepo(repo.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-medium text-foreground truncate">{repo.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{repo.full_name}</p>
                {repo.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {repo.language && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {repo.language}
                    </span>
                  )}
                  {repo.stars > 0 && (
                    <span className="text-xs text-muted-foreground">⭐ {repo.stars}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {repos.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <FolderGit2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No repositories found</h3>
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
      )}

      <div className="flex gap-3 pt-4">
        <Button
          size="lg"
          disabled={selected.size < 2}
          onClick={handleAnalyze}
          className="flex-1 gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Analyze {selected.size} Repositories
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Select at least 2 repositories to enable analysis
      </p>
    </div>
  )
}
