'use client'

import { useState } from 'react'
import { ArrowRight, Github, Loader2, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react'

type AuthResponse = {
  authenticated?: boolean
  billing?: {
    canAccessPro?: boolean
  }
}

function ideaParam(idea: string) {
  return encodeURIComponent(idea.trim())
}

export function HeroChat() {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const idea = message.trim()
    if (!idea || submitted) return

    setSubmitted(true)
    setError(null)

    const returnTo = `/dashboard?idea=${ideaParam(idea)}`

    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })

      if (!response.ok) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent(returnTo)}&idea=${ideaParam(idea)}`
        return
      }

      const auth = (await response.json()) as AuthResponse

      if (!auth.authenticated) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent(returnTo)}&idea=${ideaParam(idea)}`
        return
      }

      if (auth.billing?.canAccessPro) {
        window.location.href = returnTo
        return
      }

      window.location.href = `/pricing?idea=${ideaParam(idea)}`
    } catch {
      setSubmitted(false)
      setError('Could not check your session. Try again or sign in below.')
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl text-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-mono font-semibold text-[#FBBF24]">
        <Sparkles className="h-3.5 w-3.5" />
        AI product discovery from your repositories
      </div>

      <h1 className="mx-auto max-w-3xl font-mono text-4xl font-black leading-[1.05] tracking-normal text-[#F0F6FC] sm:text-5xl lg:text-6xl">
        What should your code become next?
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#AEB8C5] sm:text-lg">
        Type an idea, then RepoFuse matches it against your GitHub, GitLab, or Bitbucket repos to find reusable code, launch angles, and subscription-ready opportunities.
      </p>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#30363D] bg-[#111827] p-3 text-left shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-[#30363D] px-2 pb-3">
          <MessageSquareText className="h-4 w-4 text-[#06B6D4]" />
          <span className="font-mono text-xs font-semibold text-[#8B949E]">RepoFuse AI idea prompt</span>
          <span className="ml-auto rounded-full bg-[#10B981]/10 px-2 py-1 text-[11px] font-mono text-[#3FB950]">
            read-only scan
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: I want to turn my internal billing tools into a self-serve SaaS..."
            rows={3}
            autoFocus
            className="min-h-24 flex-1 resize-none rounded-xl border border-[#30363D] bg-[#0B0F14] px-4 py-3 text-sm leading-6 text-[#F0F6FC] outline-none transition-colors placeholder:text-[#6E7681] focus:border-[#06B6D4]"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!message.trim() || submitted}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#06B6D4] px-6 py-4 text-sm font-black text-[#061018] transition-all hover:bg-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
          >
            {submitted ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {error && <p className="px-2 pt-3 text-sm text-red-300">{error}</p>}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#8B949E]">
        {['Sign in with GitHub, GitLab, or Bitbucket', 'No credit card for the first scan', 'Source code is not stored'].map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            {item.startsWith('Sign') ? <Github className="h-4 w-4 text-[#06B6D4]" /> : <ShieldCheck className="h-4 w-4 text-[#10B981]" />}
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
