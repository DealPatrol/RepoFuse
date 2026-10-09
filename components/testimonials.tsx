'use client'

import { Card } from '@/components/ui/card'

const capabilities = [
  {
    title: 'Scan connected repos',
    copy: 'RepoFuse reads repositories you authorize and maps reusable code, routes, and product logic.',
  },
  {
    title: 'Rank product ideas',
    copy: 'Ideas are ordered by reuse, effort, and demand so you can see what is closest to a shippable product.',
  },
  {
    title: 'Write a launch brief',
    copy: 'Each idea can include positioning, MVP scope, stack reuse, and the first paid-plan hook.',
  },
  {
    title: 'Generate a scaffold',
    copy: 'On a paid plan, a selected idea can become a starter project instead of a blank repository.',
  },
]

export function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            What RepoFuse does
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect a repository, review the ideas it can support, and generate a scaffold when you are ready to build.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((item) => (
            <Card
              key={item.title}
              className="p-8 bg-card hover:shadow-lg hover:shadow-black/5 transition-all duration-300 flex flex-col"
            >
              <h3 className="font-semibold text-foreground mb-3">{item.title}</h3>
              <p className="text-foreground flex-grow leading-relaxed">{item.copy}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
