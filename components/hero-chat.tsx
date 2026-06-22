'use client'

import { useState } from 'react'
import { ArrowRight, Code2, Globe, Loader2, Smartphone, Sparkles, Zap } from 'lucide-react'

type AuthResponse = {
  authenticated?: boolean
  billing?: {
    canAccessPro?: boolean
  }
}

function ideaParam(idea: string) {
  return encodeURIComponent(idea.trim())
}

const categories = [
  { id: 'fullstack', icon: Code2, label: 'Full Stack App' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile App' },
  { id: 'landing', icon: Globe, label: 'Landing Page' },
  { id: 'brainstorm', icon: Sparkles, label: 'Brainstorm' },
]

const exampleCards = [
  {
    title: 'Task Manager',
    description: 'Build me a task manager with team collaboration, priorities, and deadline tracking',
  },
  {
    title: 'Real Estate CRM',
    description: 'Build a CRM for managing property listings, client contacts, and deal pipelines',
  },
  {
    title: 'SaaS Dashboard',
    description: 'Build a SaaS analytics dashboard with subscription billing and usage metrics',
  },
]

export function HeroChat() {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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
    <section className="mx-auto w-full max-w-3xl text-center">
      {/* Badge */}
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2 text-sm font-semibold text-[#10B981]">
        <Zap className="h-4 w-4" />
        Start Experimenting
      </div>

      {/* Headline */}
      <h1 className="mx-auto font-mono text-5xl font-black leading-[1.06] tracking-tight text-[#F0F6FC] sm:text-6xl lg:text-7xl">
        What will you{' '}
        <span className="bg-gradient-to-r from-[#F0F6FC] via-[#67E8F9] to-[#06B6D4] bg-clip-text text-transparent">
          build today?
        </span>
      </h1>

      {/* Category tabs */}
      <div className="mt-9 flex flex-wrap justify-center gap-2">
        {categories.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveCategory(id === activeCategory ? null : id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === id
                ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]'
                : 'border-[#30363D] bg-[#111827] text-[#8B949E] hover:border-[#8B949E] hover:text-[#F0F6FC]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="mx-auto mt-5 overflow-hidden rounded-2xl border border-[#30363D] bg-[#111827] shadow-2xl shadow-black/60">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Build me an app to manage bookings, payments and customer relationships..."
          rows={4}
          autoFocus
          className="w-full resize-none bg-transparent px-5 pt-5 pb-3 text-base leading-7 text-[#F0F6FC] outline-none placeholder:text-[#6E7681]"
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-t border-[#30363D] px-4 py-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0B0F14] px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span className="font-mono text-xs text-[#8B949E]">Claude 4.7 Opus</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0B0F14] px-3 py-1.5">
            <Globe className="h-3.5 w-3.5 text-[#8B949E]" />
            <span className="font-mono text-xs text-[#8B949E]">Public</span>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!message.trim() || submitted}
            aria-label="Send message"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#10B981] text-white transition-all hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitted ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {error && (
          <p className="border-t border-[#30363D] px-5 py-3 text-left text-sm text-red-300">{error}</p>
        )}
      </div>

      {/* Example cards */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {exampleCards.map(({ title, description }) => (
          <button
            key={title}
            type="button"
            onClick={() => setMessage(description)}
            className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 text-left transition-all hover:border-[#8B949E] hover:bg-[#161B22]"
          >
            <div className="font-mono text-xs font-bold text-[#F0F6FC]">{title}</div>
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#8B949E]">{description}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
