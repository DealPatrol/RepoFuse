// app/api/auth/vercel/disconnect/route.ts
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  await db`
    UPDATE users
    SET vercel_access_token = NULL,
        vercel_team_id      = NULL,
        updated_at          = NOW()
    WHERE id = ${user.id}
  `
  return new Response('OK')
}
