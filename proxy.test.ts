import { describe, expect, it } from 'vitest'
import { config } from '@/proxy'

describe('clerk proxy matcher', () => {
  it('uses Clerk’s recommended matcher so auth() runs for pages and API routes', () => {
    expect(config.matcher).toEqual([
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
      '/__clerk/(.*)',
    ])
  })
})
