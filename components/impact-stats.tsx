'use client'

import { TrendingUp, Zap, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  {
    value: '12,000+',
    label: 'Repos Analyzed',
    icon: TrendingUp,
    description: 'Real codebases scanned worldwide',
    valueClass: 'text-cyan-300',
    labelClass: 'text-cyan-400/60',
  },
  {
    value: '4,100+',
    label: 'Ideas Found',
    icon: Zap,
    description: 'Buildable concepts surfaced',
    valueClass: 'text-orange-300',
    labelClass: 'text-orange-400/60',
  },
  {
    value: '<30s',
    label: 'Analysis Time',
    icon: Clock,
    description: 'Typical scan to first insights',
    valueClass: 'text-fuchsia-300',
    labelClass: 'text-fuchsia-400/60',
  },
]

type ImpactStatsProps = {
  variant?: 'default' | 'marketing'
}

export function ImpactStats({ variant = 'default' }: ImpactStatsProps) {
  const isMarketing = variant === 'marketing'

  return (
    <section
      className={cn(
        isMarketing
          ? 'border-y border-white/5 py-12 px-4'
          : 'py-16 px-4 sm:px-6 lg:px-8 bg-muted/30',
      )}
    >
      <div className={cn('mx-auto', isMarketing ? 'max-w-4xl' : 'max-w-6xl')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="text-center space-y-2">
                {!isMarketing && (
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-chart-1" />
                    </div>
                  </div>
                )}
                <p
                  className={cn(
                    'tabular-nums',
                    isMarketing ? 'text-3xl md:text-4xl font-black' : 'text-4xl font-bold text-foreground mb-1',
                    isMarketing && stat.valueClass,
                  )}
                >
                  {stat.value}
                </p>
                <p
                  className={cn(
                    isMarketing
                      ? cn('text-xs font-mono uppercase tracking-widest', stat.labelClass)
                      : 'text-lg font-semibold text-foreground mb-2',
                  )}
                >
                  {stat.label}
                </p>
                <p className={cn('text-sm', isMarketing ? 'text-gray-500' : 'text-muted-foreground')}>
                  {stat.description}
                </p>
              </div>
            )
          })}
        </div>
        </div>
    </section>
  )
}
