import { afterEach, describe, expect, it } from 'vitest'
import { getCheckoutPlanOptions, getPlanForPriceId, getPriceIdForPlan, parseCheckoutPlan } from './stripe'

const ENV_KEYS = ['STRIPE_MODE', 'STRIPE_PRO_PRICE_ID', 'STRIPE_SCALE_PRICE_ID', 'STRIPE_BYOK_PRICE_ID'] as const
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('Stripe plan mapping', () => {
  it('resolves price IDs for every paid plan and maps them back', () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
    process.env.STRIPE_SCALE_PRICE_ID = 'price_scale'
    process.env.STRIPE_BYOK_PRICE_ID = 'price_byok'

    expect(getPriceIdForPlan('pro')).toBe('price_pro')
    expect(getPriceIdForPlan('scale')).toBe('price_scale')
    expect(getPriceIdForPlan('byok')).toBe('price_byok')
    expect(getPlanForPriceId('price_scale')).toBe('scale')
    expect(getPlanForPriceId('price_byok')).toBe('byok')
    expect(getPlanForPriceId('price_pro')).toBe('pro')
    expect(getPlanForPriceId(null)).toBe('pro')
  })

  it('only accepts known checkout plans', () => {
    expect(parseCheckoutPlan('byok')).toBe('byok')
    expect(parseCheckoutPlan('scale')).toBe('scale')
    expect(parseCheckoutPlan('enterprise')).toBe('pro')
    expect(parseCheckoutPlan(undefined)).toBe('pro')
  })

  it('gives Pro a no-card 7-day trial and bills other plans immediately', () => {
    expect(getCheckoutPlanOptions('pro')).toEqual({ trialDays: 7, paymentMethodCollection: 'if_required' })
    expect(getCheckoutPlanOptions('byok')).toEqual({ trialDays: null, paymentMethodCollection: 'always' })
    expect(getCheckoutPlanOptions('scale')).toEqual({ trialDays: null, paymentMethodCollection: 'always' })
  })
})
