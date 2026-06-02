'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

interface LaunchSignupProps {
  onComplete?: (email: string) => void
}

export function LaunchSignup({ onComplete }: LaunchSignupProps) {
  const [step, setStep] = useState<'info' | 'trial-choice' | 'loading' | 'success'>('info')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [trialChoice, setTrialChoice] = useState<'14-days' | '3-analyses'>('14-days')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Store email and move to trial choice
    localStorage.setItem('launch_signup_email', formData.email)
    localStorage.setItem('launch_signup_name', formData.name)
    setStep('trial-choice')
  }

  const handleTrialChoice = async (choice: 'launch-with-stripe' | 'free-trial') => {
    setIsLoading(true)
    setError('')

    try {
      // First, save the signup data
      const res = await fetch('/api/auth/signup-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          trialType: choice === 'free-trial' ? '14-days' : 'pro',
          wantsStripe: choice === 'launch-with-stripe',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save signup data')
      }

      // Redirect to GitHub OAuth to authenticate
      // After OAuth completes, the callback will check for the launch_signup cookie
      // and either start the free trial or redirect to Stripe checkout
      window.location.href = `/api/auth/github/login?launch=${choice === 'launch-with-stripe' ? 'pro' : 'free'}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  if (step === 'info') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Join the First 1,000</h3>
          <p className="text-cyan-200/80">Lock in lifetime pricing. Launch day exclusive.</p>
        </div>

        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-cyan-300 font-semibold">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex Developer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 bg-black/50 border-cyan-500/30 text-white placeholder:text-cyan-400/30"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-cyan-300 font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 bg-black/50 border-cyan-500/30 text-white placeholder:text-cyan-400/30"
            />
          </div>

          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-red-950/30 border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold h-11"
          >
            Continue
          </Button>
        </form>

        <p className="text-xs text-cyan-400/50 text-center">
          We&apos;ll never spam. Read our{' '}
          <a href="/legal/privacy-policy" className="underline hover:text-cyan-300">
            privacy policy
          </a>
          .
        </p>
      </div>
    )
  }

  if (step === 'trial-choice') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Choose Your Launch Offer</h3>
          <p className="text-cyan-200/80">Both come with full feature access. Connect GitHub or GitLab to continue.</p>
        </div>

        <div className="space-y-3">
          {/* 14 Days Free Option */}
          <button
            onClick={() => handleTrialChoice('free-trial')}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-cyan-500/50 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-white">14 Days Free</p>
                <p className="text-sm text-cyan-300 mt-1">Full access. No credit card needed. Connect your repos to start.</p>
              </div>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />}
            </div>
          </button>

          {/* Paid Subscription Option */}
          <button
            onClick={() => handleTrialChoice('launch-with-stripe')}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-950/20 hover:bg-yellow-950/40 hover:border-yellow-400 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-white">
                  Start Pro ($20/mo)
                  <span className="text-xs text-yellow-400 ml-2">← Lock in Launch Pricing</span>
                </p>
                <p className="text-sm text-yellow-300 mt-1">14 days free, then $20/mo. Unlimited everything.</p>
              </div>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />}
            </div>
          </button>
        </div>

        {error && (
          <div className="flex gap-2 items-start p-3 rounded-lg bg-red-950/30 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <p className="text-xs text-cyan-400/50 text-center">
          You&apos;ll connect GitHub or GitLab next. Pro trial converts to $20/mo after 14 days unless cancelled.
        </p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
        <div>
          <h3 className="text-2xl font-bold text-white">Welcome to RepoFuse!</h3>
          <p className="text-cyan-200/80 mt-2">Check your email to confirm. Redirecting...</p>
        </div>
      </div>
    )
  }

  return null
}
