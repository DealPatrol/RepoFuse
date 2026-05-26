'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ExternalLink,
  FolderGit2,
  Github,
  GitBranch,
  Loader2,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react'
import type { Repository } from '@/lib/queries'

interface RepositoriesListProps {
  repositories: Repository[]
}

interface AuthStatus {
  authenticated: boolean
  user?: {
    github_id: number
    github_username: string
    github_avatar_url: string | null
  }
  error?: string
}

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  url: string
  language: string | null
  stars: number
  default_branch: string
  private: boolean
}

export function RepositoriesList({ repositories }: RepositoriesListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [auth, setAuth] = useState<AuthStatus | null>(null)
  const [githubRepos, setGitHubRepos] = useState<GitHubRepository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<number[]>([])
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingGitHubRepos, setLoadingGitHubRepos] = useState(false)
  const [importing, setImporting] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [addingManualRepo, setAddingManualRepo] = useState(false)
  const [error, setError] = useState('')

  const importedGithubIds = useMemo(
    () => new Set(repositories.map((repo) => repo.github_id)),
    [repositories],
  )

  const selectableGithubIds = useMemo(
    () => githubRepos.filter((repo) => !importedGithubIds.has(repo.id)).map((repo) => repo.id),
    [githubRepos, importedGithubIds],
  )

  const allSelectableSelected = useMemo(() => {
    if (selectableGithubIds.length === 0) return false
    return selectableGithubIds.every((id) => selectedRepos.includes(id))
  }, [selectableGithubIds, selectedRepos])
  const trackedLanguages = useMemo(
    () => Array.from(new Set(repositories.map((repo) => repo.language).filter(Boolean))),
    [repositories],
  )
  const totalStars = useMemo(
    () => repositories.reduce((sum, repo) => sum + repo.stars, 0),
    [repositories],
  )
  const oauthError = searchParams.get('error')
  const oauthConnected = searchParams.get('connected')

  const loadGitHubRepos = useCallback(async () => {
    setLoadingGitHubRepos(true)
    setError('')
    try {
      const res = await fetch('/api/github/repos', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to load GitHub repositories' }))
        throw new Error(data.error || 'Failed to load GitHub repositories')
      }

      const data = await res.json()
      setGitHubRepos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub repositories')
    } finally {
      setLoadingGitHubRepos(false)
    }
  }, [])

  const loadAuthStatus = useCallback(async () => {
    setLoadingAuth(true)
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        setAuth({ authenticated: false })
        return
      }

      const data = await res.json()
      setAuth(data)
      if (data.authenticated) {
        await loadGitHubRepos()
      }
    } catch (err) {
      setAuth({ authenticated: false, error: err instanceof Error ? err.message : 'Failed to load auth status' })
    } finally {
      setLoadingAuth(false)
    }
  }, [loadGitHubRepos])

  useEffect(() => {
    void loadAuthStatus()
  }, [loadAuthStatus])

  useEffect(() => {
    if (auth?.authenticated && oauthConnected) {
      router.replace('/dashboard/repositories', { scroll: false })
    }
  }, [auth?.authenticated, oauthConnected, router])

  const handleImportSelected = async () => {
    const reposToImport = selectedRepos.filter((id) => !importedGithubIds.has(id))
    if (reposToImport.length === 0) {
      setError('Select at least one repository that has not already been imported.')
      return
    }

    setImporting(true)
    setError('')

    try {
      const res = await fetch('/api/repositories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryIds: reposToImport }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to import repositories' }))
        throw new Error(data.error || 'Failed to import repositories')
      }

      setSelectedRepos([])
      router.refresh()
      await loadGitHubRepos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repositories')
    } finally {
      setImporting(false)
    }
  }

  const handleManualAdd = async () => {
    if (!manualUrl.trim()) {
      setError('Please enter a repository URL')
      return
    }

    setAddingManualRepo(true)
    setError('')

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualUrl.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to add repository' }))
        throw new Error(data.error || 'Failed to add repository')
      }

      setManualUrl('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
    } finally {
      setAddingManualRepo(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) return

    try {
      const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      setError('Failed to remove repository')
    }
  }

  const toggleSelection = (id: number) => {
    setSelectedRepos((current) =>
      current.includes(id) ? current.filter((repoId) => repoId !== id) : [...current, id],
    )
  }

  const selectAllSelectable = () => {
    setSelectedRepos(selectableGithubIds)
  }

  const clearImportSelection = () => {
    setSelectedRepos([])
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-card to-card p-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <FolderGit2 className="h-3.5 w-3.5" />
              Repo workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Repositories</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Connect your code sources, import the repos RepoFuse can analyze, and turn existing files into VibeCoding build blocks.
            </p>
          </div>
          {loadingAuth ? (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking GitHub
            </Button>
          ) : auth?.authenticated ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 sm:min-w-72">
              <div className="text-sm text-muted-foreground">
                Connected as <span className="font-medium text-foreground">@{auth.user?.github_username}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void loadGitHubRepos()} disabled={loadingGitHubRepos}>
                  {loadingGitHubRepos ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
                  Sync repos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    setAuth({ authenticated: false })
                    setGitHubRepos([])
                    setSelectedRepos([])
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <Button asChild>
              <a href="/api/auth/github/login">
                <Github className="h-4 w-4 mr-2" />
                Sign in with GitHub
              </a>
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10">
              <FolderGit2 className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{repositories.length}</p>
              <p className="text-xs text-muted-foreground">Tracked repos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10">
              <Star className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{totalStars.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Stars imported</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10">
              <GitBranch className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{trackedLanguages.length}</p>
              <p className="text-xs text-muted-foreground">Languages detected</p>
            </div>
          </div>
        </Card>
      </div>

      {(oauthConnected || error || auth?.error || oauthError) && (
        <Card className={oauthConnected ? 'border-primary/30 bg-primary/5 p-4 text-sm text-primary' : 'border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'}>
          {oauthConnected
            ? 'GitHub connected successfully. You can import repositories now.'
            : error || auth?.error || `GitHub sign-in failed: ${oauthError}`}
        </Card>
      )}

      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Import from GitHub</h2>
            <p className="text-sm text-muted-foreground">
              Choose public or private repositories to make available for scans, app ideas, and code assembly.
            </p>
          </div>
          {auth?.authenticated ? (
            <Button variant="outline" onClick={() => void loadGitHubRepos()} disabled={loadingGitHubRepos}>
              {loadingGitHubRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          ) : null}
        </div>

        {!auth?.authenticated ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Github className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">Connect your GitHub account</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Once you sign in, RepoFuse can read your repositories and show what you can build from the code you already own.
            </p>
            <Button className="mt-4" asChild>
              <a href="/api/auth/github/login">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Continue with GitHub
              </a>
            </Button>
          </div>
        ) : loadingGitHubRepos ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading repositories from GitHub...
          </div>
        ) : githubRepos.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <FolderGit2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No GitHub repositories found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not find any repositories on the connected GitHub account yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                {githubRepos.length} repositories available from GitHub
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedRepos.length} selected</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllSelectable}
                  disabled={
                    importing ||
                    loadingGitHubRepos ||
                    selectableGithubIds.length === 0 ||
                    allSelectableSelected
                  }
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearImportSelection}
                  disabled={importing || selectedRepos.length === 0}
                >
                  Clear selection
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              {githubRepos.map((repo) => {
                const alreadyImported = importedGithubIds.has(repo.id)
                return (
                  <Card key={repo.id} className="p-4 transition-colors hover:border-cyan-500/30">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        checked={alreadyImported || selectedRepos.includes(repo.id)}
                        disabled={alreadyImported || importing}
                        onCheckedChange={() => toggleSelection(repo.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{repo.full_name}</span>
                          {repo.private ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Private</span>
                          ) : null}
                          {alreadyImported ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Imported</span>
                          ) : null}
                        </div>
                        {repo.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{repo.description}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {repo.language ? <span>{repo.language}</span> : null}
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
                          <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{repo.default_branch}</span>
                        </div>
                      </div>
                    </label>
                  </Card>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleImportSelected} disabled={importing || selectedRepos.length === 0}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Import selected repositories
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tracked repositories</h2>
          <p className="text-sm text-muted-foreground">These repos power analyses, VibeCoding Chat context, and build plans.</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="manual-repo-url">Add a public repository by URL</Label>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              id="manual-repo-url"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={addingManualRepo}
            />
            <Button onClick={handleManualAdd} disabled={addingManualRepo}>
              {addingManualRepo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add repository
            </Button>
          </div>
        </div>

        {repositories.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <FolderGit2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No repositories imported yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Import repositories from GitHub above, or add a public repository URL manually.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo) => (
              <Card key={repo.id} className="group p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FolderGit2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(repo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{repo.name}</h3>
                <p className="mb-1 text-xs text-muted-foreground">{repo.full_name}</p>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {repo.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {repo.language ? <span>{repo.language}</span> : null}
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
                  <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{repo.default_branch}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
