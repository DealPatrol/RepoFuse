import { getDb } from '@/lib/db'

const DEFAULT_LIMIT = 60
const WINDOW_MS = 60_000

export async function consumeMcpRateLimit(
  userId: string,
  limit = DEFAULT_LIMIT,
): Promise<{ allowed: boolean; limit: number; retryAfterSeconds: number }> {
  if (!userId) {
    return { allowed: false, limit, retryAfterSeconds: 60 }
  }

  const now = Date.now()
  const windowStartMs = Math.floor(now / WINDOW_MS) * WINDOW_MS
  const windowStart = new Date(windowStartMs).toISOString()
  const sql = getDb()
  const result = await sql`
    INSERT INTO mcp_rate_limits (user_id, window_start, request_count)
    VALUES (${userId}, ${windowStart}, 1)
    ON CONFLICT (user_id, window_start)
    DO UPDATE SET request_count = mcp_rate_limits.request_count + 1
    WHERE mcp_rate_limits.request_count < ${limit}
    RETURNING request_count
  `

  return {
    allowed: result.length > 0,
    limit,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + WINDOW_MS - now) / 1000)),
  }
}
