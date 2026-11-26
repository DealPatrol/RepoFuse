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
          <h3 className="text-2xl font-bold text-white mb-2">Create your account</h3>
          <p className="text-[#D3D4DC]">Lock in lifetime pricing. Launch day exclusive.</p>
        </div>

        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-[#D3D4DC] font-semibold">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex Developer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 bg-black/50 border-[#363C3E] text-white placeholder:text-[#D3D4DC]"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-[#D3D4DC] font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 bg-black/50 border-[#363C3E] text-white placeholder:text-[#D3D4DC]"
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
            className="w-full bg-[#FFC93C] hover:bg-[#F2B824] text-[#1D2122] font-bold h-11"
          >
            Continue
          </Button>
        </form>

        <p className="text-xs text-[#D3D4DC] text-center">
          We&apos;ll never spam. Read our{' '}
          <a href="/legal/privacy-policy" className="underline hover:text-[#D3D4DC]">
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
          <p className="text-[#D3D4DC]">Both come with full feature access. Connect GitHub or GitLab to continue.</p>
        </div>

        <div className="space-y-3">
          {/* 14 Days Free Option */}
          <button
            onClick={() => handleTrialChoice('free-trial')}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-[#363C3E] bg-[#363C3E] hover:bg-[#363C3E] hover:border-[#363C3E] transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-white">14 Days Free</p>
                <p className="text-sm text-[#D3D4DC] mt-1">Full access. No credit card needed. Connect your repos to start.</p>
              </div>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#D3D4DC]" />}
            </div>
          </button>

          {/* Paid Subscription Option */}
          <button
            onClick={() => handleTrialChoice('launch-with-stripe')}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-yellow-500/50 bg-[#363C3E] hover:bg-[#363C3E] hover:border-yellow-400 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-white">
                  Start Pro ($20/mo)
                  <span className="text-xs text-[#D3D4DC] ml-2">← Lock in Launch Pricing</span>
                </p>
                <p className="text-sm text-[#D3D4DC] mt-1">14 days free, then $20/mo. Unlimited everything.</p>
              </div>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#D3D4DC]" />}
            </div>
          </button>
        </div>

        {error && (
          <div className="flex gap-2 items-start p-3 rounded-lg bg-red-950/30 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <p className="text-xs text-[#D3D4DC] text-center">
          You&apos;ll connect GitHub or GitLab next. Pro trial converts to $20/mo after 14 days unless cancelled.
        </p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#D3D4DC] mx-auto" />
        <div>
          <h3 className="text-2xl font-bold text-white">Welcome to RepoFuse!</h3>
          <p className="text-[#D3D4DC] mt-2">Check your email to confirm. Redirecting...</p>
        </div>
      </div>
    )
  }

  return null
}
