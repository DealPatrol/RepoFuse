'use client'

import Link from 'next/link'
import {
  Rocket,
  Zap,
  CheckCircle2,
  ArrowRight,
  Package,
  Clock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Template } from '@/lib/queries'

interface TemplateAssemblyCardProps {
  template: Template
  onSelect?: (template: Template) => void
}

const tierConfig = {
  quick_start: {
    icon: Rocket,
    label: 'Quick Start',
    description: 'Build in minutes',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-500 hover:bg-green-600',
  },
  standard: {
    icon: Package,
    label: 'Standard',
    description: 'Build in hours',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-500 hover:bg-blue-600',
  },
  comprehensive: {
    icon: Layers,
    label: 'Comprehensive',
    description: 'Build in days',
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-500 hover:bg-purple-600',
  },
}

export function TemplateAssemblyCard({
  template,
  onSelect,
}: TemplateAssemblyCardProps) {
  const config = tierConfig[template.tier]
  const TierIcon = config.icon

  const percentMissing = template.total_files > 0
    ? Math.round((template.missing_files / template.total_files) * 100)
    : 0

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg border-2 cursor-pointer ${config.color}`}
      onClick={() => onSelect?.(template)}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TierIcon className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-lg font-semibold">{template.name}</h3>
            </div>
            {template.description && (
              <p className="text-sm text-foreground/70 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          <Badge className={`${config.badgeColor} flex-shrink-0`}>
            {config.label}
          </Badge>
        </div>

        {/* Tech Stack */}
        {template.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tech_stack.slice(0, 4).map(tech => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {template.tech_stack.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tech_stack.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Reusable Code</p>
            <p className="text-lg font-bold text-chart-1">
              {template.reuse_percentage}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Build Time</p>
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-chart-4" />
              <p className="text-lg font-bold">{template.estimated_hours}h</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Missing</p>
            <p className="text-lg font-bold text-chart-5">{percentMissing}%</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">
              {template.total_files - template.missing_files}/{template.total_files} files
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-chart-1 to-chart-2 transition-all"
              style={{
                width: `${100 - percentMissing}%`,
              }}
            />
          </div>
        </div>

        {/* CTA */}
        {onSelect ? (
          <Button className="w-full group" variant="default" onClick={() => onSelect(template)}>
            Use This Template
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        ) : (
          <Button className="w-full group" variant="default" asChild>
            <Link href="/dashboard/templates/browse">
              Use This Template
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )
}
