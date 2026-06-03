'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import Link from 'next/link'

export function HeroChat() {
  const [message, setMessage] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [userMessage, setUserMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setUserMessage(message)
      setHasSubmitted(true)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!hasSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chat Input */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/20 to-[#F59E0B]/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-[#161B22] border border-[#30363D] rounded-xl p-1">
              <div className="flex items-center gap-2 bg-[#0D1117] rounded-lg p-4">
                <input
                  type="text"
                  placeholder="What do you want to build? (AI SaaS, mobile app, open-source project...)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-transparent text-[#F0F6FC] placeholder-[#8B949E] outline-none text-base"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="flex-shrink-0 p-2 rounded-lg bg-[#06B6D4] hover:bg-[#06B6D4]/90 disabled:bg-[#30363D] disabled:cursor-not-allowed text-[#0D1117] transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center text-sm text-[#8B949E] font-medium">
            Your million dollar idea is hiding in your codebase
          </p>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-xs bg-[#06B6D4] text-[#0D1117] rounded-lg px-4 py-3">
              <p className="text-sm font-medium">{userMessage}</p>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className="max-w-xs bg-[#161B22] border border-[#30363D] text-[#F0F6FC] rounded-lg px-4 py-3 space-y-3">
              <p className="text-sm">
                Amazing! Let me analyze your codebase and surface opportunities tailored to a{' '}
                <span className="font-semibold text-[#06B6D4]">{userMessage}</span>.
              </p>
              <p className="text-xs text-[#8B949E]">To continue, you&apos;ll need to sign in with GitHub.</p>
            </div>
          </div>

          {/* Sign In CTA */}
          <div className="flex justify-center pt-4">
            <Link
              href="/api/auth/github/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-[#0D1117] font-semibold transition-colors"
            >
              Sign in to Continue
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
