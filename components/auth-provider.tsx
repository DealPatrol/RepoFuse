'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { isClerkEnabled } from '@/lib/clerk-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabled()) {
    return <>{children}</>
  }

  return <ClerkProvider>{children}</ClerkProvider>
}
