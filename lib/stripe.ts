import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getLiveStripeEnv(name: 'SECRET_KEY' | 'WEBHOOK_SECRET' | 'PRO_PRICE_ID' | 'SCALE_PRICE_ID'): string {
  return process.env[`STRIPE_LIVE_${name}`] || process.env[`STRIPE_${name}`] || ''
}

export function isStripeConfigured(): boolean {
  return !!(getLiveStripeEnv('SECRET_KEY') && getLiveStripeEnv('PRO_PRICE_ID'))
}

export function getPriceIdForPlan(plan: 'pro' | 'scale'): string {
  if (plan === 'scale') return getLiveStripeEnv('SCALE_PRICE_ID')
  return getLiveStripeEnv('PRO_PRICE_ID')
}

export function getStripe(): Stripe {
  const secretKey = getLiveStripeEnv('SECRET_KEY')
  console.log('[v0] getStripe() called')
  console.log('[v0] Checking env vars:')
  console.log('[v0] STRIPE_LIVE_SECRET_KEY:', process.env.STRIPE_LIVE_SECRET_KEY ? '***SET***' : 'NOT SET')
  console.log('[v0] STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '***SET***' : 'NOT SET')
  console.log('[v0] Available env keys containing STRIPE:', Object.keys(process.env).filter(k => k.includes('STRIPE')))
  
  if (!secretKey) {
    throw new Error('STRIPE_LIVE_SECRET_KEY is not set')
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return stripeInstance
}

export function getStripeWebhookSecret(): string {
  return getLiveStripeEnv('WEBHOOK_SECRET')
}

export const PLANS = {
  free: {
    name: 'Free',
    analyses_per_month: 1,
    blueprints_viewable: 1,
    repos_limit: 1,
    price_monthly: 0,
    credits_per_month: 200,
    ai_provider: 'builtin' as const,
    description: 'Explore the basics, no card needed',
  },
  pro: {
    name: 'Pro',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 19,
    credits_per_month: 3000,
    trial_days: 7,
    ai_provider: 'builtin' as const,
    description: '7-day free trial, then $19/mo',
  },
  scale: {
    name: 'Scale',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 49,
    credits_per_month: 12000,
    ai_provider: 'builtin' as const,
    description: 'For power users and teams',
  },
  byok: {
    name: 'BYOK',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 9,
    credits_per_month: -1,
    ai_provider: 'user' as const,
    description: 'Unlimited with your own API key',
  },
} as const

export type PlanId = keyof typeof PLANS

export function isPaidPlan(plan: string | null | undefined): plan is Exclude<PlanId, 'free'> {
  return plan === 'pro' || plan === 'scale' || plan === 'byok'
}

export function getPriceId(): string {
  return getPriceIdForPlan('pro')
}

export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    throw new Error('STRIPE_PRO_PRICE_ID is not configured')
  }
  return priceId
}

export function getAppUrl(origin?: string): string {
  return process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
}
