import { clerkSignInUrl, isClerkConfigured } from '@/lib/clerk-auth'
import { sanitizeReturnTo } from '@/lib/auth'

/** Sign-in URL for links (Clerk or legacy GitHub OAuth). */
export function getSignInUrl(returnTo?: string): string {
  const safeReturn = returnTo ? sanitizeReturnTo(returnTo, '/dashboard') : undefined

  if (isClerkConfigured()) {
    if (!safeReturn) return clerkSignInUrl()
    return `${clerkSignInUrl()}?redirect_url=${encodeURIComponent(safeReturn)}`
  }

  if (!safeReturn) return '/api/auth/github/login'
  return `/api/auth/github/login?returnTo=${encodeURIComponent(safeReturn)}`
}
