import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Prospect } from '@/lib/prospect-engine/types'

interface ProspectTableProps {
  prospects: Prospect[]
}

function scoreTone(score: number) {
  if (score >= 75) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
  if (score >= 55) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
  return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
}

export function ProspectTable({ prospects }: ProspectTableProps) {
  if (prospects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No prospects matched these filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Public contact</th>
              <th className="px-4 py-3">Repos</th>
              <th className="px-4 py-3">Followers</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Keywords</th>
              <th className="px-4 py-3">PH</th>
              <th className="px-4 py-3">BIP</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="bg-background/60">
                <td className="px-4 py-4 align-top">
                  <div className="font-medium">{prospect.name}</div>
                  <a
                    href={prospect.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    @{prospect.githubUsername}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-4 align-top text-muted-foreground">{prospect.email || 'Not public'}</td>
                <td className="px-4 py-4 align-top">{prospect.repoCount}</td>
                <td className="px-4 py-4 align-top">{prospect.followers.toLocaleString()}</td>
                <td className="px-4 py-4 align-top">{prospect.recentActivityScore}</td>
                <td className="px-4 py-4 align-top">{prospect.keywordScore}</td>
                <td className="px-4 py-4 align-top">{prospect.productHuntScore}</td>
                <td className="px-4 py-4 align-top">{prospect.buildInPublicScore}</td>
                <td className="px-4 py-4 align-top">
                  <Badge variant="outline" className={scoreTone(prospect.totalScore)}>
                    {prospect.totalScore}
                  </Badge>
                </td>
                <td className="px-4 py-4 align-top">
                  <Badge variant="secondary" className="capitalize">
                    {prospect.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 align-top">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/prospects/${prospect.id}`}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
