'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { clerkSignInUrl, isClerkEnabled } from '@/lib/clerk-auth'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type Props = {
  className?: string
  children?: React.ReactNode
  returnTo?: string
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
}

export function AuthSignInLink({
  className,
  children = 'Sign in with GitHub',
  returnTo,
  variant,
  size,
}: Props) {
  if (!isClerkEnabled()) {
    const href = returnTo
      ? `/api/auth/github/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/github/login'
    return (
      <Button asChild className={className} variant={variant} size={size}>
        <Link href={href}>{children}</Link>
      </Button>
    )
  }

  return (
    <SignInButton mode="redirect" forceRedirectUrl={returnTo}>
      <Button className={className} variant={variant} size={size} type="button">
        {children}
      </Button>
    </SignInButton>
  )
}

export function authSignInHref(returnTo?: string): string {
  if (!isClerkEnabled()) {
    return returnTo
      ? `/api/auth/github/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/github/login'
  }
  return returnTo ? `${clerkSignInUrl()}?redirect_url=${encodeURIComponent(returnTo)}` : clerkSignInUrl()
}
