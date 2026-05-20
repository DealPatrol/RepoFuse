'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    quote:
      'RepoFuse discovered 3 hidden apps in our codebase. We shipped one in 2 weeks and it generated $50k in revenue.',
    author: 'Alex Chen',
    title: 'Founder & CTO',
    company: 'TechStartup Inc',
  },
  {
    quote:
      'Instead of starting from scratch, RepoFuse helped us assemble products from existing code. Saved us 6 months of development time.',
    author: 'Sarah Johnson',
    title: 'Product Lead',
    company: 'Global Tech',
  },
  {
    quote:
      'The demand insights showed us exactly what users were asking for. We built exactly what the market needed.',
    author: 'Marcus Rodriguez',
    title: 'Indie Developer',
    company: 'Solo Founder',
  },
  {
    quote:
      'Reduced our AI costs by 60% using the BYOK plan. Quality stayed the same, profit went way up.',
    author: 'Emily Watson',
    title: 'Engineering Manager',
    company: 'Scale.io',
  },
]

type TestimonialsProps = {
  variant?: 'default' | 'marketing'
}

export function Testimonials({ variant = 'default' }: TestimonialsProps) {
  const isMarketing = variant === 'marketing'

  return (
    <section
      className={cn(
        'py-20 px-4',
        isMarketing && 'border-b border-white/5',
      )}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {isMarketing && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 text-xs font-mono text-gray-400">
              TESTIMONIALS
            </div>
          )}
          <h2
            className={cn(
              'font-black mb-4',
              isMarketing ? 'text-4xl md:text-5xl text-white' : 'text-3xl sm:text-4xl font-bold tracking-tight text-foreground',
            )}
          >
            Developers ship faster with RepoFuse
          </h2>
          <p
            className={cn(
              'text-lg max-w-2xl mx-auto',
              isMarketing ? 'text-gray-400' : 'text-muted-foreground',
            )}
          >
            Join builders discovering, assembling, and shipping apps from their existing code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, idx) => (
            <Card
              key={idx}
              className={cn(
                'p-8 flex flex-col transition-all duration-300',
                isMarketing
                  ? 'border-white/10 bg-white/3 hover:bg-white/5 hover:border-cyan-500/30'
                  : 'bg-card hover:shadow-lg hover:shadow-black/5',
              )}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={isMarketing ? 'text-orange-400' : 'text-chart-1'}>
                    ★
                  </span>
                ))}
              </div>
              <p
                className={cn(
                  'mb-6 flex-grow leading-relaxed',
                  isMarketing ? 'text-gray-300' : 'text-foreground',
                )}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className={cn('font-semibold', isMarketing ? 'text-white' : 'text-foreground')}>
                  {testimonial.author}
                </p>
                <p className={cn('text-sm', isMarketing ? 'text-gray-500' : 'text-muted-foreground')}>
                  {testimonial.title} at {testimonial.company}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
