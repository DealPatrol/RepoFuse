import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { NavDropdown } from '@/components/nav-dropdown'
import { Github, ArrowRight, AlertCircle, Zap } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  auth_required: 'You must sign in to access the dashboard.',
  github_oauth_not_configured: 'GitHub OAuth is not configured.',
  gitlab_oauth_not_configured: 'GitLab OAuth is not configured.',
  invalid_oauth_state: 'Sign-in session expired or cookies were blocked.',
  missing_code: 'Your OAuth provider did not return an authorization code.',
  token_exchange_failed: 'Could not exchange the authorization code for a token.',
  github_user_fetch_failed: 'Signed in but could not load your profile.',
  gitlab_user_fetch_failed: 'Signed in but could not load your profile.',
  oauth_callback_failed: 'Something went wrong finishing sign-in.',
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'An unexpected error occurred.' : null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {errorMessage && (
        <div className="bg-red-950/50 border-b border-red-500/30 px-4 py-3 flex items-center gap-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px'
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <RepoFuseLogo3D className="h-9 w-9 mt-4" />
            <span className="text-sm font-bold text-white hidden sm:block">RepoFuse</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">How It Works</a>
            <Link href="/pricing" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <NavDropdown />
          </nav>

          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <NavDropdown />
            </div>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm px-4 py-2 rounded-full transition-colors shadow-lg shadow-cyan-500/25"
            >
              <Github className="h-4 w-4" />
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16">
          {/* Subtle radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="container mx-auto px-4 max-w-3xl text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-10">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Zap className="h-3.5 w-3.5" />
                AI-POWERED
              </span>
              <span className="w-px h-4 bg-white/20" />
              The #1 Repo Intelligence Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span className="block text-white">Your repos are hiding</span>
              <span className="block text-cyan-400 mt-2">buildable apps</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed mb-10">
              RepoFuse scans your GitHub and GitLab repos, surfaces project ideas, and turns scattered code into your next launch —{' '}
              <strong className="text-gray-200 font-semibold">automatically.</strong>
            </p>

            {/* Primary CTA */}
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto sm:min-w-72 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/40 hover:-translate-y-0.5"
            >
              <Github className="h-5 w-5" />
              Scan My Repos Free
            </a>

            {/* Sub-text */}
            <p className="text-sm text-gray-500 mt-4">
              Connect in seconds. No credit card required.
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500">
              <div className="flex -space-x-1">
                {['#22d3ee','#a78bfa','#fb923c','#4ade80'].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0f]" style={{ backgroundColor: c + '60' }} />
                ))}
              </div>
              <span><strong className="text-cyan-400">2,400+</strong> developers already scanning</span>
            </div>

            {/* Terminal preview */}
            <div className="mt-14 text-left rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d14] shadow-2xl shadow-black/60">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8 bg-white/3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs font-mono text-gray-500">RepoFuse Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-green-400">Online</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 font-mono text-sm space-y-3">
                <div className="flex gap-3 text-gray-400">
                  <span className="text-cyan-500">$</span>
                  <span className="text-white">repofuse scan --org DealPatrol --all-repos</span>
                </div>
                <div className="space-y-1.5 text-gray-500 pl-6">
                  <div>▸ Connecting to GitHub API...</div>
                  <div className="text-cyan-400">✓ Found 14 repositories</div>
                  <div>▸ Analyzing code patterns &amp; dependencies...</div>
                </div>
                <div className="pl-6 space-y-1 pt-1">
                  <div className="text-gray-300">📦 <span className="text-white">repo-app-architect</span></div>
                  <div className="text-orange-400 pl-4">⚡ 3 buildable ideas detected</div>
                  <div className="text-cyan-400 pl-6">→ SaaS: AI Code Review Tool</div>
                  <div className="text-cyan-400 pl-6">→ Tool: Repo Health Dashboard</div>
                  <div className="text-cyan-400 pl-6">→ API: Webhook Automation Kit</div>
                </div>
                <div className="pl-6 text-gray-500">▸ Generating full project briefs...</div>
                <div className="flex gap-3 text-gray-400 pl-0 pt-1">
                  <span className="text-cyan-500">$</span>
                  <span className="w-2 h-4 bg-cyan-400 animate-pulse inline-block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Strip */}
        <section className="border-y border-white/5 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
              {[
                { val: '12k+', label: 'Repos Scanned', color: 'text-cyan-400' },
                { val: '4.1k', label: 'Ideas Found', color: 'text-orange-400' },
                { val: '89%', label: 'Code Reuse', color: 'text-purple-400' },
                { val: '<30s', label: 'Analysis Time', color: 'text-cyan-400' },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <p className={`text-3xl md:text-4xl font-black tabular-nums ${m.color}`}>{m.val}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / After comparison */}
        <section className="py-20 border-b border-white/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <img
              src="/comparison-preview.svg"
              alt="Without RepoFuse: repos collecting dust, no launches. With RepoFuse: 7 buildable apps detected, full blueprints, push to GitHub in one click."
              className="w-full rounded-2xl shadow-2xl shadow-cyan-500/10"
            />
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-20 border-b border-white/5">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-xs font-mono text-gray-400">
                HOW IT WORKS
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
                Four steps to<br />
                <span className="text-cyan-400">buildable blueprints</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { num: '01', title: 'Connect', icon: '🔗', desc: 'OAuth in one click. Read-only access to your repos.' },
                { num: '02', title: 'Scan', icon: '⚡', desc: 'AI analyzes structure, patterns, and dependencies.' },
                { num: '03', title: 'Discover', icon: '💡', desc: 'Ideas surface instantly, ranked by viability.' },
                { num: '04', title: 'Build', icon: '🚀', desc: 'Get full briefs, stack recs, and MVP roadmaps.' },
              ].map((step, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-cyan-500/30 hover:bg-white/5 transition-all text-center group">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <div className="text-xs font-mono text-cyan-500 mb-1">{step.num}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-xs font-mono text-gray-400">
                FEATURES
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
                Everything your repos<br />
                <span className="text-cyan-400">have been waiting for</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '⚡', title: 'AI Repo Scanner', desc: 'Deep analysis of your codebase structure and patterns in seconds.' },
                { icon: '💡', title: 'Idea Surfacer', desc: 'Turns existing code into ranked, buildable project ideas.' },
                { icon: '🔗', title: 'Multi-Repo Fusion', desc: 'Cross-reference patterns across all your repos simultaneously.' },
                { icon: '📊', title: 'Health Dashboard', desc: 'Live metrics on code quality and technical debt.' },
                { icon: '📋', title: 'Launch Briefs', desc: 'AI-generated product briefs for every detected idea.' },
                { icon: '🔒', title: 'Private by Default', desc: 'Your code never leaves your control.' },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-cyan-500/30 hover:bg-white/5 transition-all group cursor-pointer">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4 max-w-xl text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Your next product is<br />
              <span className="text-cyan-400">already in your repos</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join 2,400+ developers who've stopped guessing and started shipping.
            </p>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto sm:min-w-64 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/30 hover:-translate-y-0.5"
            >
              <Github className="h-5 w-5" />
              Start Scanning Now
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="text-xs text-gray-600 font-mono mt-5">
              no credit card · read-only access · cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© 2025 RepoFuse. Built by developers, for developers.</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-gray-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
