'use client'

  import { useState } from 'react'
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import {
    Check, X, ArrowRight, Sparkles, Github,
    Crown, Zap, Rocket, Key, ChevronDown,
  } from 'lucide-react'
  import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'

  // ── Plan data (inlined so this is safe as a client component) ──────────────
  const PLAN_ANNUAL_DISCOUNT = 0.2 // 20% off

  const plans = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      period: 'forever',
      description: "Explore what's possible. No card needed.",
      credits: 200,
      maxCredits: 12000,
      icon: Zap,
      iconBg: '#161B22',
      iconColor: '#8B949E',
      cta: 'Get Started Free',
      ctaHref: '/api/auth/github/login',
      highlighted: false,
      badge: null,
      features: [
        { text: '1 repository', included: true },
        { text: '1 analysis / month', included: true },
        { text: '200 credits to start', included: true },
        { text: 'AI app blueprints', included: true },
        { text: 'Unlimited repositories', included: false },
        { text: 'Scaffold generation', included: false },
        { text: 'Team Workspace', included: false },
        { text: 'Weekly Digest email', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 19,
      period: '/month',
      description: '7-day free trial. No credit card required.',
      credits: 3000,
      maxCredits: 12000,
      icon: Crown,
      iconBg: '#06B6D420',
      iconColor: '#06B6D4',
      cta: 'Start Free Trial',
      ctaHref: '/dashboard/billing',
      highlighted: true,
      badge: 'Most Popular',
      features: [
        { text: 'Unlimited repositories', included: true },
        { text: 'Unlimited analyses', included: true },
        { text: '3,000 credits / month', included: true },
        { text: 'AI app blueprints + scaffold', included: true },
        { text: 'Build This App — push to GitHub', included: true },
        { text: 'Pattern Analyzer', included: true },
        { text: 'Team Workspace', included: true },
        { text: 'Weekly Digest email', included: true },
      ],
    },
    {
      id: 'scale',
      name: 'Scale',
      monthlyPrice: 49,
      period: '/month',
      description: 'For power users and growing teams.',
      credits: 12000,
      maxCredits: 12000,
      icon: Rocket,
      iconBg: '#8B5CF620',
      iconColor: '#8B5CF6',
      cta: 'Get Scale',
      ctaHref: '/dashboard/billing',
      highlighted: false,
      badge: null,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: '12,000 credits / month', included: true },
        { text: 'Highest priority AI processing', included: true },
        { text: 'Early access to new features', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Cancel anytime', included: true },
      ],
    },
  ]

  const creditCosts = [
    { action: 'Analyze Repo', cost: 100, icon: '🔍' },
    { action: 'Scaffold', cost: 150, icon: '🏗️' },
    { action: 'Pattern Scan', cost: 100, icon: '✨' },
    { action: 'Build This App', cost: 500, icon: '🚀' },
  ]

  const faqs = [
    {
      q: 'Do I need a credit card for the free trial?',
      a: 'No. The Pro 7-day trial starts the moment you sign in with GitHub. We only ask for payment details when you decide to continue after the trial ends.',
    },
    {
      q: 'What happens when I run out of credits?',
      a: 'Your account pauses AI actions until the next monthly renewal. You can always upgrade to a higher tier mid-cycle to get more credits immediately.',
    },
    {
      q: 'Does RepoFuse store my source code?',
      a: 'Never. RepoFuse uses read-only OAuth access. We analyze file structure, dependency graphs, and code patterns — but your actual source is never stored on our servers.',
    },
    {
      q: 'What is BYOK and who is it for?',
      a: 'BYOK (Bring Your Own Key) lets you connect your own Anthropic or OpenAI API key. You pay AI costs directly to the provider — often 60–90% less than our hosted credits — and pay us just $9/mo for the platform.',
    },
    {
      q: 'Can I cancel or downgrade at any time?',
      a: 'Yes. Cancel from your billing dashboard at any time and your plan continues until the end of the paid period. No penalties, no dark patterns.',
    },
  ]

  export default function PricingPage() {
    const [annual, setAnnual] = useState(true) // Annual by default
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    function displayPrice(monthly: number) {
      if (monthly === 0) return '$0'
      const price = annual ? Math.floor(monthly * (1 - PLAN_ANNUAL_DISCOUNT)) : monthly
      return `$${price}`
    }

    return (
      <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#30363D] bg-[#0D1117]/80 backdrop-blur-md">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center mt-4">
              <RepoFuseLogo3D className="h-10 w-10" />
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xs font-mono tracking-widest text-[#06B6D4]/60 hover:text-[#06B6D4] transition-colors uppercase">
                Dashboard
              </Link>
              <Button size="sm" className="bg-[#21262D] hover:bg-[#30363D] text-[#F0F6FC] border border-[#30363D] gap-1.5" asChild>
                <a href="/api/auth/github/login">
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </a>
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 pb-32">
          {/* ── Hero ── */}
          <div className="text-center pt-20 pb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#06B6D4]/20 bg-[#06B6D4]/5 text-sm text-[#06B6D4]/80 mb-6">
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              Simple, transparent pricing
            </div>
            <h1 className="font-mono text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#F0F6FC]">
              Pick your plan
            </h1>
            <p className="text-lg text-[#8B949E] max-w-2xl mx-auto mb-10">
              Start free — no card needed. Upgrade when you want unlimited repos, scaffold generation, and the ability to ship real apps from your code.
            </p>

            {/* Annual / Monthly toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#161B22] border border-[#30363D]">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${!annual ? 'bg-[#F0F6FC] text-[#0D1117] font-bold' : 'text-[#8B949E] hover:text-[#F0F6FC]'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-[#F0F6FC] text-[#0D1117] font-bold' : 'text-[#8B949E] hover:text-[#F0F6FC]'}`}
              >
                Annual
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-all ${annual ? 'bg-[#F59E0B] text-[#0D1117]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                  Save 20%
                </span>
              </button>
            </div>
            {annual && (
              <p className="text-xs text-[#F59E0B] mt-3">
                Annual plans billed as a single payment · cancel within 30 days for a full refund
              </p>
            )}
          </div>

          {/* ── Plan Cards ── */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan) => {
              const PlanIcon = plan.icon
              const price = displayPrice(plan.monthlyPrice)
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border transition-all ${
                    plan.highlighted
                      ? 'border-[#06B6D4]/50 bg-[#161B22] shadow-[0_0_40px_rgba(6,182,212,0.12)] ring-1 ring-[#06B6D4]/20 scale-[1.03]'
                      : 'border-[#30363D] bg-[#161B22]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-[#06B6D4] text-[#0D1117] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                        ⭐ {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className={`p-6 ${plan.highlighted ? 'pt-8' : ''}`}>
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#30363D]" style={{ backgroundColor: plan.iconBg }}>
                        <PlanIcon className="h-5 w-5" style={{ color: plan.iconColor }} />
                      </div>
                      <div>
                        <h3 className="font-mono font-bold text-lg text-[#F0F6FC]">{plan.name}</h3>
                        <p className="text-xs text-[#8B949E]">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <div className="flex items-end gap-1">
                        <span className={`font-mono font-bold text-[#F0F6FC] ${plan.highlighted ? 'text-4xl' : 'text-3xl'}`}>{price}</span>
                        {plan.monthlyPrice > 0 && (
                          <span className="text-[#8B949E] text-sm mb-1.5">/mo{annual ? ' · billed annually' : ''}</span>
                        )}
                        {plan.monthlyPrice === 0 && (
                          <span className="text-[#8B949E] text-sm mb-1.5">· forever</span>
                        )}
                      </div>
                      {annual && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-[#8B949E] mt-0.5 line-through">${plan.monthlyPrice}/mo billed monthly</p>
                      )}
                    </div>

                    {/* Credit bar */}
                    {plan.credits > 0 && (
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-mono text-[#06B6D4]">{plan.credits.toLocaleString()} credits/mo</span>
                          <span className="text-[10px] text-[#8B949E]">of {plan.maxCredits.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#30363D] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(plan.credits / plan.maxCredits) * 100}%`,
                              backgroundColor: plan.highlighted ? '#06B6D4' : '#8B949E',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <a
                      href={plan.ctaHref}
                      className={`w-full text-center text-sm font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-6 ${
                        plan.highlighted
                          ? 'bg-[#06B6D4] hover:bg-[#0891B2] text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border border-[#30363D] hover:border-[#8B949E] text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>

                    {plan.highlighted && (
                      <p className="text-center text-xs text-[#8B949E] -mt-4 mb-5">
                        7-day free trial · no card required · cancel anytime
                      </p>
                    )}

                    {/* Divider */}
                    <div className="border-t border-[#30363D] mb-5" />

                    {/* Feature list */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-center gap-2.5">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-[#06B6D4] flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-[#30363D] flex-shrink-0" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-[#8B949E]' : 'text-[#30363D]'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── BYOK Developer Card ── */}
          <div className="max-w-5xl mx-auto mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border border-[#F59E0B]/20 bg-[#161B22] hover:border-[#F59E0B]/40 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                  <Key className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-mono font-bold text-[#F0F6FC]">BYOK — Bring Your Own Key</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] font-bold border border-[#F59E0B]/20">Developer</span>
                  </div>
                  <p className="text-sm text-[#8B949E]">Use your own Anthropic or OpenAI key. Platform access for <strong className="text-[#F0F6FC]">{annual ? '$7' : '$9'}/mo</strong> — AI costs go direct to the provider. Up to 90% cheaper than Pro.</p>
                </div>
              </div>
              <a href="/dashboard/settings" className="flex items-center gap-2 text-sm font-bold text-[#F59E0B] hover:text-[#fbbf24] transition-colors whitespace-nowrap flex-shrink-0">
                Set up BYOK <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* ── Trust Signals ── */}
          <div className="max-w-3xl mx-auto mt-12 flex flex-wrap justify-center gap-6 text-sm text-[#8B949E]">
            {[
              '🔒 Read-only repo access — code never stored',
              '✅ 7-day free trial on Pro',
              '↩️ Cancel anytime, no penalties',
              '🌍 Trusted by 2,400+ developers',
            ].map((t) => (
              <span key={t} className="flex items-center gap-2">{t}</span>
            ))}
          </div>

          {/* ── Credit Costs ── */}
          <div className="mt-24 max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-mono text-2xl font-bold text-[#F0F6FC] mb-2">How credits work</h2>
              <p className="text-[#8B949E] text-sm">
                Credits power every AI action. Pro gets 3,000/mo, Scale gets 12,000/mo. Unused credits don&apos;t roll over.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {creditCosts.map((item) => (
                <div key={item.action} className="p-5 text-center rounded-xl border border-[#30363D] bg-[#161B22] hover:border-[#06B6D4]/30 transition-all">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs text-[#8B949E] mb-1">{item.action}</p>
                  <p className="font-mono text-xl font-bold text-[#F0F6FC]">{item.cost}</p>
                  <p className="text-xs text-[#8B949E]">credits</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Social Proof ── */}
          <div className="mt-24 max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
            {[
              { quote: '"3 hidden apps found in 4 minutes. Shipped the first one 3 weeks later."', author: '@IndieHacker_X' },
              { quote: '"Reduced our AI costs by 60% with BYOK. Same quality, way less spend."', author: 'Emily W., Scale.io' },
              { quote: "The scaffold PR had all checks green. I just hit merge. That's it.", author: 'Marcus R., Solo Founder' },
            ].map((t, i) => (
              <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#06B6D4]/30 transition-all">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, s) => <span key={s} className="text-[#F59E0B] text-xs">★</span>)}
                </div>
                <p className="text-sm text-[#8B949E] italic mb-3">{t.quote}</p>
                <p className="text-xs text-[#8B949E] font-mono">{t.author}</p>
              </div>
            ))}
          </div>

          {/* ── FAQ ── */}
          <div className="mt-24 max-w-2xl mx-auto">
            <h2 className="font-mono text-2xl font-bold text-[#F0F6FC] text-center mb-10">Common questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-[#30363D] rounded-xl overflow-hidden bg-[#161B22]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1C2333] transition-colors"
                  >
                    <span className="font-medium text-[#F0F6FC] pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-[#8B949E] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-[#8B949E] leading-relaxed border-t border-[#30363D] pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-24 text-center">
            <h2 className="font-mono text-3xl font-bold text-[#F0F6FC] mb-4">
              Ready to find what&apos;s hiding<br />in your repos?
            </h2>
            <p className="text-[#8B949E] mb-8">Start free — no credit card. Upgrade in 30 seconds when you&apos;re ready.</p>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center justify-center gap-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold text-lg px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5"
            >
              <Github className="h-5 w-5" />
              Scan My Repos Free
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="text-xs text-[#8B949E] font-mono mt-4">free forever plan · read-only access · no credit card</p>
          </div>
        </main>
      </div>
    )
  }
  