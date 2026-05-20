'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CreditsDisplay } from '@/components/credits-display'
import {
  CreditCard,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  ExternalLink,
  Zap,
  Crown,
  Rocket,
  Key,
} from 'lucide-react'

interface BillingClientProps {
  plan: 'free' | 'pro' | 'scale' | 'byok'
  planName: string
  analysesUsed: number
  analysesLimit: number
  blueprintsUsed?: number
  blueprintsLimit?: number
  reposLimit: number
  status: string
  currentPeriodEnd: string | null
  hasStripeCustomer: boolean
  userId?: string
  isTrialing?: boolean
}

const PLAN_CONFIGS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try it out',
    icon: Zap,
    features: ['1 repository', '1 analysis/month', '1 blueprint view', '200 credits'],
    cta: null,
    ctaHref: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: '7-day free trial',
    icon: Crown,
    features: ['Unlimited repos', 'Unlimited analyses', '3,000 credits/month', 'Scaffold generation', 'App Idea Chat', 'Build This App'],
    cta: 'Start Free Trial',
    ctaHref: null, // handled by handleUpgrade
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$49',
    period: '/mo',
    description: 'Power users & teams',
    icon: Rocket,
    features: ['Everything in Pro', '12,000 credits/month', 'Highest priority AI', 'Early access', 'Dedicated support'],
    cta: 'Get Scale',
    ctaHref: 'https://buy.stripe.com/3cIcN65VJ55g6nC9gkbjW00',
  },
  {
    id: 'byok',
    name: 'BYOK',
    price: '$9',
    period: '/mo',
    description: 'Your own API key',
    icon: Key,
    features: ['Unlimited repos', 'Unlimited analyses', 'Use own Anthropic/OpenAI key', 'No per-credit billing', 'Up to 90% cheaper'],
    cta: 'Set Up BYOK',
    ctaHref: '/dashboard/settings',
  },
] as const

export function BillingClient({
  plan,
  planName,
  analysesUsed,
  analysesLimit,
  blueprintsUsed = 0,
  blueprintsLimit = 1,
  reposLimit,
  status,
  currentPeriodEnd,
  hasStripeCustomer,
  userId,
  isTrialing = false,
}: BillingClientProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const isPaid = plan === 'pro' || plan === 'scale' || plan === 'byok'
  const isPro = plan === 'pro'
  const usagePercent = analysesLimit > 0 ? Math.min(100, Math.round((analysesUsed / analysesLimit) * 100)) : 0

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json().catch(() => ({ error: 'Unexpected server error' }))
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Billing is not available right now. Please try again later.')
      }
    } catch {
      alert('Could not connect to billing. Please check your connection and try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({ error: 'Unexpected server error' }))
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Billing portal is not available right now.')
      }
    } catch {
      alert('Could not connect to billing. Please check your connection and try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-lg">Manage your subscription and usage</p>
      </div>

      {/* Current plan + usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                {isPro ? (
                  <Crown className="h-5 w-5 text-chart-4" />
                ) : (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
                <h2 className="text-2xl font-bold text-foreground">{planName}</h2>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              status === 'active' ? 'bg-chart-1/15 text-chart-1' :
              status === 'trialing' ? 'bg-chart-4/15 text-chart-4' :
              status === 'past_due' ? 'bg-destructive/15 text-destructive' :
              'bg-muted text-muted-foreground'
            }`}>
              {status === 'active' ? 'Active' :
               status === 'trialing' ? 'Trial' :
               status === 'past_due' ? 'Past Due' :
               'Canceled'}
            </span>
          </div>

          {isPro && currentPeriodEnd && (
            <p className="text-sm text-muted-foreground mb-4">
              Renews {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-chart-1" />
              <span className="text-muted-foreground">
                {isPaid ? 'Unlimited repositories' : `Up to ${reposLimit} repositor${reposLimit === 1 ? 'y' : 'ies'}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-chart-1" />
              <span className="text-muted-foreground">
                {isPaid ? 'Unlimited analyses' : `${analysesLimit} analysis per month`}
              </span>
            </div>
            {isPaid && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-chart-1" />
                  <span className="text-muted-foreground">Scaffold generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-chart-1" />
                  <span className="text-muted-foreground">Priority AI processing</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            {isPaid && hasStripeCustomer ? (
              <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading} className="w-full">
                {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                Manage Subscription
              </Button>
            ) : !isPaid ? (
              <Button onClick={handleUpgrade} disabled={checkoutLoading} className="w-full shadow-lg shadow-primary/20">
                {checkoutLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Upgrade to Pro — 7 days free, then $19/mo
              </Button>
            ) : null}
          </div>
        </Card>

        {/* Usage */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Usage This Month</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Analyses</span>
                <span className="font-medium text-foreground">
                  {analysesUsed}{analysesLimit > 0 ? ` / ${analysesLimit}` : ' / ∞'}
                </span>
              </div>
              {analysesLimit > 0 ? (
                <Progress value={usagePercent} className="h-2" />
              ) : (
                <div className="h-2 rounded-full bg-chart-1/20" />
              )}
              {!isPaid && analysesLimit > 0 && usagePercent >= 80 && (
                <p className="text-xs text-destructive mt-2">
                  {usagePercent >= 100 ? "You've reached your monthly limit." : 'Approaching your monthly limit.'}
                  {' '}
                  <button onClick={handleUpgrade} className="underline font-medium hover:no-underline">
                    Upgrade to Pro
                  </button>
                </p>
              )}
            </div>

            {!isPaid && blueprintsLimit > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Blueprints Viewed</span>
                  <span className="font-medium text-foreground">
                    {blueprintsUsed} / {blueprintsLimit}
                  </span>
                </div>
                <Progress value={Math.min(100, Math.round((blueprintsUsed / blueprintsLimit) * 100))} className="h-2" />
                {blueprintsUsed >= blueprintsLimit && (
                  <p className="text-xs text-destructive mt-2">
                    You&apos;ve viewed all your free blueprints.{' '}
                    <button onClick={handleUpgrade} className="underline font-medium hover:no-underline">
                      Upgrade for unlimited
                    </button>
                  </p>
                )}
              </div>
            )}

            {!isPaid && (
              <div className="rounded-xl border border-chart-1/20 bg-chart-1/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-chart-1 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Unlock unlimited analyses</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pro gives you unlimited analyses, repos, scaffold generation, and priority AI.
                    </p>
                    <Button size="sm" className="mt-3" onClick={handleUpgrade} disabled={checkoutLoading}>
                      Upgrade Now <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Credits for paid users */}
      {isPaid && userId && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Credits & Usage</h2>
            <p className="text-sm text-muted-foreground">Track your credits and see how they&apos;re used</p>
          </div>
          <CreditsDisplay userId={userId} />
        </div>
      )}

      {/* All plans comparison */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">All Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Compare plans and upgrade when you&apos;re ready</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_CONFIGS.map((p) => {
            const PlanIcon = p.icon
            const isCurrent = plan === p.id
            const highlighted = 'highlighted' in p && p.highlighted

            return (
              <Card
                key={p.id}
                className={`p-5 flex flex-col relative ${
                  isCurrent ? 'ring-2 ring-chart-1' : highlighted ? 'ring-1 ring-chart-1/30' : ''
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-chart-1 text-background text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Current Plan
                    </span>
                  </div>
                )}
                {highlighted && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center mb-2">
                    <PlanIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">{p.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{p.period}</span>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-chart-1/15 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2 w-2 text-chart-1" />
                      </span>
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && p.cta && (
                  p.ctaHref ? (
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <Link href={p.ctaHref}>
                        {p.cta} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={highlighted ? 'default' : 'outline'}
                      className="w-full"
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                      {p.cta} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  )
                )}
                {isCurrent && (
                  <div className="text-xs text-center text-chart-1 font-medium py-1">
                    ✓ Your current plan
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
