'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Copy,
  Download,
  ExternalLink,
  Hammer,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AppBlueprint, BuildPlanRecord } from '@/lib/queries'
import {
  BUILD_PLAN_SECTIONS,
  buildCursorDeeplinks,
  buildCursorPrompt,
  buildPlanSectionToMarkdown,
  buildPlanToMarkdown,
  type BuildPlanContent,
  type BuildPlanSectionKey,
} from '@/lib/build-plan'

interface BuildThisAppProps {
  blueprint: AppBlueprint
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SectionContent({ sectionKey, content }: { sectionKey: BuildPlanSectionKey; content: BuildPlanContent }) {
  switch (sectionKey) {
    case 'product_requirements': {
      const prd = content.product_requirements
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{prd.overview}</p>
          <div>
            <p className="font-medium text-foreground mb-1">Target users</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {prd.target_users.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Goals</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {prd.goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Features</p>
            <ul className="space-y-2">
              {prd.features.map((f, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="text-xs uppercase font-semibold text-chart-1 mr-2">{f.priority}</span>
                  <span className="font-medium text-foreground">{f.name}</span>
                  {' — '}
                  {f.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
    case 'tech_stack': {
      const stack = content.tech_stack
      const groups = [
        { label: 'Frontend', items: stack.frontend },
        { label: 'Backend', items: stack.backend },
        { label: 'Database', items: stack.database },
        { label: 'Infrastructure', items: stack.infrastructure },
      ]
      return (
        <div className="space-y-3 text-sm">
          {groups.map(
            (group) =>
              group.items.length > 0 && (
                <div key={group.label}>
                  <p className="font-medium text-foreground mb-1">{group.label}</p>
                  <ul className="space-y-1">
                    {group.items.map((item, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{item.name}</span> — {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
          {stack.existing_reuse.length > 0 && (
            <div>
              <p className="font-medium text-foreground mb-1">Existing code to reuse</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5 font-mono text-xs">
                {stack.existing_reuse.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
    case 'database_schema':
      return (
        <div className="space-y-4 text-sm">
          {content.database_schema.tables.map((table, i) => (
            <div key={i}>
              <p className="font-medium text-foreground">{table.name}</p>
              <p className="text-muted-foreground text-xs mb-2">{table.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border rounded-md">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-2">Column</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Constraints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, j) => (
                      <tr key={j} className="border-b border-border/50">
                        <td className="p-2 font-mono">{col.name}</td>
                        <td className="p-2">{col.type}</td>
                        <td className="p-2 text-muted-foreground">{col.constraints ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )
    case 'api_routes':
      return (
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-xs border border-border rounded-md">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-2">Method</th>
                <th className="text-left p-2">Path</th>
                <th className="text-left p-2">Auth</th>
                <th className="text-left p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {content.api_routes.map((route, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-2 font-mono font-semibold">{route.method}</td>
                  <td className="p-2 font-mono">{route.path}</td>
                  <td className="p-2">{route.auth_required ? 'Yes' : 'No'}</td>
                  <td className="p-2 text-muted-foreground">{route.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'frontend_pages':
      return (
        <div className="space-y-3 text-sm">
          {content.frontend_pages.map((page, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">
                {page.name}{' '}
                <span className="font-mono text-xs text-muted-foreground">{page.path}</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">{page.description}</p>
              <p className="text-xs mt-2 text-foreground">Components: {page.components.join(', ')}</p>
            </div>
          ))}
        </div>
      )
    case 'components':
      return (
        <div className="space-y-2 text-sm">
          {content.components.map((c, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{c.path}</p>
              <p className="text-muted-foreground text-xs mt-1">{c.description}</p>
              {c.props?.length ? (
                <p className="text-xs mt-1">Props: {c.props.join(', ')}</p>
              ) : null}
            </div>
          ))}
        </div>
      )
    case 'deployment_plan': {
      const plan = content.deployment_plan
      return (
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium text-foreground">Hosting:</span>{' '}
            <span className="text-muted-foreground">{plan.hosting_recommendation}</span>
          </p>
          <div>
            <p className="font-medium text-foreground mb-1">CI/CD</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {plan.ci_cd.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          {plan.stages.map((stage, i) => (
            <div key={i}>
              <p className="font-medium text-foreground">{stage.name}</p>
              <p className="text-muted-foreground text-xs">{stage.description}</p>
              <ul className="mt-1 space-y-0.5">
                {stage.tasks.map((t, j) => (
                  <li key={j} className="text-xs text-muted-foreground">
                    ☐ {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }
    case 'monetization': {
      const m = content.monetization
      return (
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium text-foreground">Primary model:</span>{' '}
            {m.model}
          </p>
          <ul className="space-y-2">
            {m.suggestions.map((s, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="font-medium text-foreground">{s.strategy}</span>
                {s.pricing_hint ? ` (${s.pricing_hint})` : ''}: {s.description}
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case 'mvp_timeline': {
      const timeline = content.mvp_timeline
      return (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">{timeline.total_weeks} weeks total</p>
          {timeline.phases.map((phase, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">
                {phase.name}{' '}
                <span className="text-xs text-muted-foreground">({phase.duration})</span>
              </p>
              <ul className="mt-2 space-y-0.5">
                {phase.deliverables.map((d, j) => (
                  <li key={j} className="text-xs text-muted-foreground">
                    • {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

export function BuildThisApp({ blueprint, open, onOpenChange }: BuildThisAppProps) {
  const [buildPlan, setBuildPlan] = useState<BuildPlanRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const fetchOrGenerate = useCallback(
    async (regenerate = false) => {
      setError(null)
      if (regenerate) {
        setRegenerating(true)
      } else {
        setLoading(true)
      }

      try {
        const res = await fetch(`/api/blueprints/${blueprint.id}/build-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regenerate }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to generate build plan')
        }
        setBuildPlan((data as { buildPlan: BuildPlanRecord }).buildPlan)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
        setRegenerating(false)
      }
    },
    [blueprint.id],
  )

  useEffect(() => {
    if (!open) return

    let cancelled = false
    async function loadExisting() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/blueprints/${blueprint.id}/build-plan`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load build plan')
        }
        if (cancelled) return
        if ((data as { buildPlan: BuildPlanRecord | null }).buildPlan) {
          setBuildPlan((data as { buildPlan: BuildPlanRecord }).buildPlan)
          setLoading(false)
        } else {
          await fetchOrGenerate(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong')
          setLoading(false)
        }
      }
    }

    void loadExisting()
    return () => {
      cancelled = true
    }
  }, [open, blueprint.id, fetchOrGenerate])

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(label)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch {
      alert('Could not copy to clipboard')
    }
  }

  const exportJson = () => {
    if (!buildPlan) return
    const payload = {
      exported_at: new Date().toISOString(),
      app_name: blueprint.name,
      blueprint_id: blueprint.id,
      version: buildPlan.version,
      content: buildPlan.content,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${blueprint.name.replace(/\s+/g, '-').toLowerCase()}-build-plan.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportMarkdown = () => {
    if (!buildPlan) return
    const markdown = buildPlanToMarkdown(blueprint.name, buildPlan.content)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${blueprint.name.replace(/\s+/g, '-').toLowerCase()}-build-plan.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openInCursor = () => {
    if (!buildPlan) return
    const prompt = buildCursorPrompt(blueprint.name, buildPlan.content)
    const links = buildCursorDeeplinks(prompt)
    window.open(links.web, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Build This App: {blueprint.name}
          </DialogTitle>
          <DialogDescription>
            AI-generated product spec, architecture, and launch plan grounded in your repository analysis.
          </DialogDescription>
          {buildPlan && (
            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="outline" size="sm" type="button" onClick={exportJson}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={exportMarkdown}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Markdown
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={openInCursor}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open in Cursor
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={regenerating}
                onClick={() => void fetchOrGenerate(true)}
              >
                {regenerating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Regenerate
              </Button>
              {buildPlan.version > 1 && (
                <span className="text-xs text-muted-foreground self-center ml-1">
                  v{buildPlan.version}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-4">
            {loading && (
              <Card className="p-12 text-center border-dashed">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-chart-1" />
                <p className="font-medium text-foreground">Generating your build plan…</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creating PRD, tech stack, schema, routes, and launch timeline
                </p>
              </Card>
            )}

            {error && (
              <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  type="button"
                  onClick={() => void fetchOrGenerate(false)}
                >
                  Try again
                </Button>
              </Card>
            )}

            {buildPlan && !loading && (
              <div className="grid gap-4 md:grid-cols-2">
                {BUILD_PLAN_SECTIONS.map(({ key, title }) => {
                  const sectionMarkdown = buildPlanSectionToMarkdown(key, buildPlan.content)
                  return (
                    <Card key={key} className="p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 px-2 shrink-0"
                          onClick={() => void copyText(sectionMarkdown, key)}
                        >
                          {copiedSection === key ? (
                            'Copied!'
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <SectionContent sectionKey={key} content={buildPlan.content} />
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
