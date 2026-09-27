import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as checkout } from './checkout/route'
import { POST as portal } from './portal/route'
import { getCurrentUser } from '@/lib/auth'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscriptionByGithubId } from '@/lib/queries'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  getPriceId: vi.fn(() => 'price_pro'),
  getPriceIdForPlan: vi.fn(() => 'price_scale'),
  getStripe: vi.fn(),
  isStripeConfigured: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  getSubscriptionByGithubId: vi.fn(),
  upsertSubscription: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const stripeConfigured = vi.mocked(isStripeConfigured)
const stripeClient = vi.mocked(getStripe)
const subscription = vi.mocked(getSubscriptionByGithubId)

describe('Stripe billing route authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    stripeConfigured.mockReturnValue(true)
    currentUser.mockResolvedValue(null)
  })

  it('does not create checkout resources without an authenticated user', async () => {
    const response = await checkout(
      new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      }),
    )

    expect(response.status).toBe(401)
    expect(subscription).not.toHaveBeenCalled()
    expect(stripeClient).not.toHaveBeenCalled()
  })

  it('does not open the billing portal without an authenticated user', async () => {
    const response = await portal()

    expect(response.status).toBe(401)
    expect(subscription).not.toHaveBeenCalled()
    expect(stripeClient).not.toHaveBeenCalled()
  })
})
