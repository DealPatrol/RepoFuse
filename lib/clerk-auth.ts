/** Clerk is optional — legacy GitHub OAuth cookies remain supported when unset. */

/** Server-side: both keys required for Clerk APIs. */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  )
}

/** Client-safe: publishable key present (Clerk UI can render). */
export function isClerkEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim())
}

export function clerkSignInUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() || '/sign-in'
}

export function clerkSignUpUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() || '/sign-up'
}
