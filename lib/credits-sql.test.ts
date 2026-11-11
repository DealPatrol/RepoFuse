import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

describe('credit SQL parameter typing', () => {
  it('casts every idempotency key parameter so Postgres can type a null key', () => {
    const source = readFileSync('lib/credits.ts', 'utf8')
    const untyped = source.match(/\$\{idempotencyKey\}(?!::text)/g) ?? []
    expect(untyped).toEqual([])
  })
})
