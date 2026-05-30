'use client'

  import { useState } from 'react'
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import { Check, ArrowRight, Sparkles, Github, Crown, Zap, Rocket, Key } from 'lucide-react'
  import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
  import { PLANS } from '@/lib/stripe'
  import { CREDITS } from '@/lib/credits'

  const creditCosts = [
    { action: 'Analyze Repo', cost: CREDITS.ANALYZE_COST, icon: '🔍' },
    { action: 'Generate Scaffold', cost: CREDITS.SCAFFOLD_COST, icon: '🏗️' },
    { action: 'Pattern Analyzer', cost: CREDITS.PATTERN_ANALYZER_COST, icon: '✨' },
    { action: 'Build This App', cost: CREDITS.BUILD_APP_COST, icon: '🚀' },
  ]

  const MAX_CREDITS = 12000

  export default function PricingPage() {
    const [annual, setAnnual] = useState(false)

    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: { monthly: '$0', annual: '$0' },
        period: 'forever',
        description: 'Explore your codebase, no card needed',
        credits: PLANS.free.credits_per_month,
        features: [
          `${PLANS.free.repos_limit} repository`,
          `${PLANS.free.analyses_per_month} analysis per month`,
          `${PLANS.free.blueprints_viewable} blueprint view`,
          `${PLANS.free.credits_per_month} credits to start`,
          'AI-powered app blueprints',
          'Gap discovery & analysis',
          'JSON export',
        ],
        icon: Zap,
        cta: 'Get Started Free',
        ctaHref: '/api/auth/github/login',
        highlighted: false,
        badge: null,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: { monthly: `$${PLANS.pro.price_monthly}`, annual: `$${Math.floor(PLANS.pro.price_monthly * 0.8)}` },
        period: '/month',
        description: '7-day free trial, cancel anytime',
        credits: PLANS.pro.credits_per_month,
        features: [
          '7-day free trial',
          'Unlimited repositories',
          'Unlimited analyses',
          `${PLANS.pro.credits_per_month.toLocaleString()} credits/month`,
          'AI app blueprints + scaffold generation',
          'Build This App — push to GitHub/GitLab',
          'Pattern Analyzer — new project ideas',
          'Complete gap roadmaps',
          'Priority AI processing',
          'Cancel anytime',
        ],
        icon: Crown,
        cta: 'Start Free Trial',
        ctaHref: '/dashboard/billing',
        highlighted: true,
        badge: 'Most Popular',
      },
      {
        id: 'scale',
        name: 'Scale',
        price: { monthly: `$${PLANS.scale.price_monthly}`, annual: `$${Math.floor(PLANS.scale.price_monthly * 0.8)}` },
        period: '/month',
        description: 'For power users and teams',
        credits: PLANS.scale.credits_per_month,
        features: [
          'Everything in Pro',
          `${PLANS.scale.credits_per_month.toLocaleString()} credits/month`,
          'Highest priority AI processing',
          'Early access to new features',
          'Dedicated support',
          'Cancel anytime',
        ],
        icon: Rocket,
        cta: 'Get Scale',
        ctaHref: '/dashboard/billing',
        highlighted: false,
        badge: null,
      },
      {
        id: 'byok',
        name: 'BYOK',
        price: { monthly: `$${PLANS.byok.price_monthly}`, annual: `$${Math.floor(PLANS.byok.price_monthly * 0.8)}` },
        period: '/month',
        description: 'Unlimited with your own API key',
        credits: null,
        features: [
          'Unlimited repositories',
          'Unlimited analyses',
          'Use your own Anthropic / OpenAI key',
          'No per-credit billing',
          'Up to 90% cheaper than Pro',
          'Full feature access',
          'Cancel anytime',
        ],
        icon: Key,
        cta: 'Start BYOK',
        ctaHref: '/dashboard/settings',
        highlighted: false,
        badge: 'Developer',
      },
    ]

    return (
      <div className="min-h-screen bg-[#0D1117] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0D1117]/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center mt-5">
              <RepoFuseLogo3D className="h-10 w-10" />
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xs font-mono tracking-widest text-cyan-400/60 hover:text-cyan-300 transition-colors uppercase">
                Dashboard
              </Link>
              <Button size="sm" className="bg-[#24292e] hover:bg-[#2f363d] text-white border border-gray-700 hover:border-gray-600 gap-1.5" asChild>
                <a href="/api/auth/github/login">
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </a>
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-20">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-sm text-cyan-300/70 mb-6">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Pick your plan
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Start free and upgrade when you need more power — unlimited repos, more credits, and the ability to build and push real apps.
            </p>

            {/* Annual / Monthly Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!annual ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Annual
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${annual ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-400'}`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const PlanIcon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 flex flex-col rounded-xl border bg-[#161B22] backdrop-blur-sm ${
                    plan.highlighted
                      ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                      : plan.badge === 'Developer'
                      ? 'border-amber-500/30'
                      : 'border-white/8'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                        plan.badge === 'Most Popular'
                          ? 'bg-cyan-500 text-black'
                          : 'bg-amber-500 text-black'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                      <PlanIcon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-white">{annual ? plan.price.annual : plan.price.monthly}</span>
                      <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                    </div>
                    {annual && plan.id !== 'free' && (
                      <p className="text-xs text-amber-400 font-medium mt-0.5">Billed annually</p>
                    )}
                    {plan.credits != null && (
                      <>
                        <p className="text-xs text-cyan-400 font-medium mt-2 mb-1">
                          {plan.credits.toLocaleString()} credits/mo
                        </p>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                            style={{ width: `${Math.min((plan.credits / MAX_CREDITS) * 100, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-0.5 h-4 w-4 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-cyan-400" />
                        </span>
                        <span className="text-xs text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`w-full text-center text-xs font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      plan.highlighted
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                        : 'border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 hover:bg-cyan-950/20'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Credit costs table */}
          <div className="mt-20 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">How credits work</h2>
              <p className="text-gray-400 text-sm">
                Each action costs credits. Pro gets 3,000/mo, Scale gets 12,000/mo — unused credits don&apos;t roll over.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {creditCosts.map((item) => (
                <div key={item.action} className="p-4 text-center rounded-xl border border-white/8 bg-[#161B22]">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs text-gray-500 mb-1">{item.action}</p>
                  <p className="text-lg font-bold text-white">{item.cost}</p>
                  <p className="text-xs text-gray-500">credits</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-12 max-w-lg mx-auto">
            All plans include read-only repository access. Your code is never stored — we only analyze file structures and patterns.
          </p>
        </main>
      </div>
    )
  }
  