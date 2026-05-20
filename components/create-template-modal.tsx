'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Sparkles, Check } from 'lucide-react'

interface BlueprintOption {
  id: string
  name: string
  description?: string
  technologies: string[]
}

interface AnalysisOption {
  id: string
  name: string
  status: string
}

export function CreateTemplateModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select-analysis' | 'select-blueprints' | 'name'>('select-analysis')
  const [analyses, setAnalyses] = useState<AnalysisOption[]>([])
  const [blueprints, setBlueprints] = useState<BlueprintOption[]>([])
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('')
  const [selectedBlueprintIds, setSelectedBlueprintIds] = useState<string[]>([])
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [loadingBlueprints, setLoadingBlueprints] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchAnalyses()
    }
  }, [open])

  const fetchAnalyses = async () => {
    setLoadingAnalyses(true)
    try {
      const res = await fetch('/api/analyses')
      if (!res.ok) throw new Error('Failed to load analyses')
      const data: AnalysisOption[] = await res.json()
      setAnalyses(data.filter((a) => a.status === 'complete'))
    } catch {
      setError('Could not load analyses')
    } finally {
      setLoadingAnalyses(false)
    }
  }

  const fetchBlueprints = async (analysisId: string) => {
    setLoadingBlueprints(true)
    setBlueprints([])
    setSelectedBlueprintIds([])
    try {
      const res = await fetch(`/api/analyses/${analysisId}/blueprints`)
      if (res.ok) {
        const data: BlueprintOption[] = await res.json()
        setBlueprints(data)
      } else {
        // Fallback: use analysis detail endpoint
        const res2 = await fetch(`/api/analyses/${analysisId}`)
        if (res2.ok) {
          const analysis = await res2.json()
          setBlueprints(analysis.blueprints || [])
        }
      }
    } catch {
      setError('Could not load blueprints for this analysis')
    } finally {
      setLoadingBlueprints(false)
    }
  }

  const handleAnalysisSelect = async (id: string) => {
    setSelectedAnalysisId(id)
    setError(null)
    await fetchBlueprints(id)
    setStep('select-blueprints')
  }

  const toggleBlueprint = (id: string) => {
    setSelectedBlueprintIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    )
  }

  const handleCreate = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name')
      return
    }
    if (selectedBlueprintIds.length < 2) {
      setError('Select at least 2 blueprints to combine')
      return
    }

    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          blueprintIds: selectedBlueprintIds,
          tier: 'standard',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create template')
      }
      setOpen(false)
      reset()
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  const reset = () => {
    setStep('select-analysis')
    setSelectedAnalysisId('')
    setSelectedBlueprintIds([])
    setTemplateName('')
    setTemplateDescription('')
    setBlueprints([])
    setError(null)
  }

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Template
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-chart-2" />
              Create Template
            </DialogTitle>
            <DialogDescription>
              Combine blueprints from a completed analysis into a reusable template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step 1: Select analysis */}
            {step === 'select-analysis' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Pick a completed analysis</p>
                {loadingAnalyses ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading analyses...
                  </div>
                ) : analyses.length === 0 ? (
                  <Card className="p-4 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No completed analyses found. Run an analysis first to generate blueprints.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {analyses.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleAnalysisSelect(a.id)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-chart-1/50 hover:bg-muted/30 transition-colors"
                      >
                        <p className="font-medium text-sm text-foreground">{a.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select blueprints */}
            {step === 'select-blueprints' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Select blueprints to combine</p>
                  <span className="text-xs text-muted-foreground">
                    {selectedBlueprintIds.length} selected (min 2)
                  </span>
                </div>

                {loadingBlueprints ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading blueprints...
                  </div>
                ) : blueprints.length === 0 ? (
                  <Card className="p-4 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No blueprints found for this analysis. Run the analysis again or pick a different one.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {blueprints.map((bp) => {
                      const selected = selectedBlueprintIds.includes(bp.id)
                      return (
                        <button
                          key={bp.id}
                          onClick={() => toggleBlueprint(bp.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${
                            selected
                              ? 'border-chart-1/60 bg-chart-1/5'
                              : 'border-border hover:border-chart-1/30 hover:bg-muted/30'
                          }`}
                        >
                          <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border ${selected ? 'bg-chart-1 border-chart-1' : 'border-border'}`}>
                            {selected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{bp.name}</p>
                            {bp.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {bp.technologies.slice(0, 3).map((t) => (
                                  <Badge key={t} variant="outline" className="text-xs py-0">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedBlueprintIds.length >= 2 && (
                  <Button
                    className="w-full"
                    onClick={() => setStep('name')}
                  >
                    Continue
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={() => setStep('select-analysis')}>
                  ← Back
                </Button>
              </div>
            )}

            {/* Step 3: Name the template */}
            {step === 'name' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Template Name
                  </label>
                  <Input
                    placeholder="e.g. Full-Stack SaaS Starter"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="What can someone build with this template?"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Combining {selectedBlueprintIds.length} blueprints
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('select-blueprints')}>
                  ← Back
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {step === 'name' && (
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !templateName.trim()}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Create Template</>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
