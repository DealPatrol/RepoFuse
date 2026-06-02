import { SignIn } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/clerk-auth'

export default function SignInPage() {
  if (!isClerkConfigured()) {
    redirect('/api/auth/github/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  )
}
