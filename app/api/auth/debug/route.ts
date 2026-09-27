import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

// Diagnostic endpoint — visit /api/auth/debug to see what the server sees.
// Remove or restrict this once the auth issue is resolved.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get('github_user_id')?.value
  const stateCookie = !!cookieStore.get('github_oauth_state')?.value

  const result: Record<string, unknown> = {
    cookies: {
      github_user_id: userIdCookie ? 'present' : 'missing',
      github_oauth_state: stateCookie ? 'present' : 'missing',
    },
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      GITHUB_CLIENT_ID: !!(process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID),
      GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'not set',
      NODE_ENV: process.env.NODE_ENV,
    },
    db: { status: 'not tested' },
    user: null,
  }

  // Test DB connection and user lookup
  try {
    const sql = getDb()

    // Check if the user_auth table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_auth'
      ) AS exists
    `
    const tableExists = tableCheck[0]?.exists ?? false
    result.db = { status: 'connected', user_auth_table_exists: tableExists }

    if (tableExists && userIdCookie) {
      const githubId = Number.parseInt(userIdCookie, 10)
      const users = await sql`
        SELECT github_id, github_username FROM user_auth WHERE github_id = ${githubId} LIMIT 1
      `
      result.user = users[0]
        ? { found: true, github_username: (users[0] as { github_username: string }).github_username }
        : { found: false }
    }
  } catch (err) {
    result.db = { status: 'error', message: String(err) }
  }

  return NextResponse.json(result)
}
