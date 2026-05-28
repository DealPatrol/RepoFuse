import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/clerk-auth'

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    redirect('/api/auth/github/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  )
}
