import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface CheckResult {
  ok: boolean
  detail?: string
}

async function checkDatabase(): Promise<CheckResult> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, detail: 'DATABASE_URL not set' }
  }
  try {
    const sql = getDb()
    await sql`SELECT 1 as ping`
    return { ok: true }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'unknown error' }
  }
}

function checkEnv(): Record<string, boolean> {
  return {
    DATABASE_URL: !!process.env.DATABASE_URL,
    GITHUB_CLIENT_ID: !!(process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID),
    GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRO_PRICE_ID: !!process.env.STRIPE_PRO_PRICE_ID,
  }
}

export async function GET() {
  const startedAt = Date.now()
  const database = await checkDatabase()
  const env = checkEnv()

  const status = database.ok ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      uptime_ms: Date.now() - startedAt,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env,
      checks: {
        database,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
