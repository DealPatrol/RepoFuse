'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Star,
  GitFork,
  ShieldCheck,
  Sparkles,
  Loader2,
  ArrowRight,
  Package,
  Download,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface ComponentMatch {
  id: string
  category: string
  repo: string
  description: string
  stars: number
  forks: number
  license: string
  lastUpdated: string
  qualityScore: number
  url: string
}

const CATEGORY_PRESETS = [
  'Calendar',
  'Chat',
  'Payments',
  'Authentication',
  'Maps',
  'Notifications',
  'File Upload',
  'Charts',
]

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-cyan-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-zinc-400'
}

function MatchCard({ match }: { match: ComponentMatch }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-cyan-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
            {match.category}
          </span>
          <p className="text-sm font-semibold text-zinc-100 truncate">{match.repo}</p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={cn('text-2xl font-black tabular-nums leading-none', scoreColor(match.qualityScore))}>
            {match.qualityScore}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">score</span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 line-clamp-2">{match.description}</p>

      <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{match.stars.toLocaleString()}</span>
        <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{match.forks.toLocaleString()}</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{match.license}</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-zinc-600">Updated {match.lastUpdated}</span>
        <div className="flex items-center gap-2">
          <a
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-300 transition-colors"
          >
            View
          </a>
          <Button size="sm" variant="secondary" className="h-7 text-[11px]">
            <Download className="h-3 w-3 mr-1" />Import
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ComponentHunterPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ComponentMatch[]>([])
  const [searched, setSearched] = useState(false)

  async function runHunt(term: string) {
    const trimmed = term.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch('/api/component-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(Array.isArray(data.matches) ? data.matches : [])
    } catch {
      setError('Could not complete the component hunt. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">RepoFuse</p>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-cyan-400" />
            Open Source Component Hunter
          </h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-2xl">
            Detect the components you are missing, then scan public GitHub for the best open-source
            match. Each candidate is scored on quality, stars, maintenance, and license so you can
            import the right fit instead of building from scratch.
          </p>
        </div>
      </div>

      {/* search */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runHunt(query)
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What component are you missing? e.g. booking calendar, payment system..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Hunting</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Hunt Components</>
            )}
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Common gaps:</span>
          {CATEGORY_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setQuery(preset)
                runHunt(preset)
              }}
              className="text-[11px] font-mono text-cyan-400/60 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/20 rounded-full px-2.5 py-1 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* results */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-zinc-400">Scanning public GitHub for the best matches...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <Package className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-sm text-zinc-400 mb-1">No matching components found</p>
          <p className="text-xs text-zinc-600">Try a broader search term or a different component category.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-5">
            <Package className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-zinc-300 mb-2">Find the missing piece</h3>
          <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
            Search for a component you need and RepoFuse will hunt down the best-maintained
            open-source repositories to fill the gap.
          </p>
          <Link
            href="/dashboard/gaps"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/70 hover:text-cyan-300 transition-colors"
          >
            View your detected gaps <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
