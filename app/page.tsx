import Link from 'next/link'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { NavDropdown } from '@/components/nav-dropdown'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Github,
  Play,
  Sparkles,
  Star,
  WandSparkles,
} from 'lucide-react'

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

const featureCards = [
  {
    title: 'Deep repository intelligence',
    description: 'Map architecture, dependencies, and repeated product patterns in minutes.',
  },
  {
    title: 'Demand-backed launch ideas',
    description: 'Auto-rank opportunities by reuse potential, velocity, and market pull.',
  },
  {
    title: 'Build-ready briefs',
    description: 'Turn findings into structured implementation plans your team can ship from.',
  },
]

const flowSteps = [
  'Connect GitHub in one click',
  'Scan repositories with AI analysis',
  'Review ranked ideas in your dashboard',
  'Launch with scaffold-ready project briefs',
]

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'An unexpected error occurred.' : null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05071a] text-[#e5e7ff]">
      {errorMessage && (
        <div className="border-b border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,.32),transparent_45%),radial-gradient(circle_at_78%_18%,rgba(34,211,238,.24),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(217,70,239,.22),transparent_48%)]" />

      <div className="rf-float-slow pointer-events-none absolute -left-28 top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="rf-float-fast pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05071a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <RepoFuseLogo3D className="h-9 w-9" />
            <span className="hidden font-mono text-sm font-bold sm:block">RepoFuse</span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs text-indigo-100/70 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
            <NavDropdown />
          </nav>

          <a
            href="/api/auth/github/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-indigo-100/90 transition-all hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-white"
          >
            <Github className="h-3.5 w-3.5" />
            Sign in
          </a>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              New landing experience
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Turn your repositories into
              <span className="block bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                your next shipped product.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-indigo-100/75 sm:text-lg">
              RepoFuse scans your existing code, finds high-leverage product opportunities, and gives your team
              a clean launch plan with momentum built in.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/api/auth/github/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 px-7 py-3.5 text-sm font-semibold text-[#030712] shadow-[0_20px_60px_rgba(79,70,229,.38)] transition-transform hover:-translate-y-0.5"
              >
                Start free scan
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:border-cyan-200/60 hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Explore flow
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-indigo-100/65 sm:gap-6">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-cyan-300" />
                2,400+ teams onboarded
              </span>
              <span>Read-only access</span>
              <span>No credit card required</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-400/20 via-indigo-400/20 to-fuchsia-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0a102e]/90 shadow-[0_20px_70px_rgba(2,6,23,.65)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <p className="font-mono text-xs text-indigo-100/70">Live insight console</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                <span className="rf-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Running
                </span>
              </div>

              <div className="space-y-3 p-5 font-mono text-sm text-indigo-100/75">
                <p><span className="text-cyan-300">$</span> repofuse scan --workspace DealPatrol</p>
                <p className="rf-slide-in" style={{ animationDelay: '120ms' }}>✓ 14 repositories connected</p>
                <p className="rf-slide-in" style={{ animationDelay: '260ms' }}>✓ 39 reusable service patterns detected</p>
                <p className="rf-slide-in" style={{ animationDelay: '420ms' }}>✓ 6 launch-ready ideas with high confidence</p>
                <div className="rf-slide-in rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-indigo-100/75" style={{ animationDelay: '580ms' }}>
                  <p className="font-semibold text-white">Top opportunity: Billing orchestration API</p>
                  <p className="mt-1 text-cyan-200">94% reuse match · estimated 9-day build window</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="group rounded-3xl border border-white/12 bg-white/[0.04] p-6 shadow-[0_12px_35px_rgba(15,23,42,.35)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-cyan-200/45 hover:bg-white/[0.07]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300/35 to-indigo-400/35 text-cyan-100">
                  <WandSparkles className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-indigo-100/70">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[#070d27]/85 shadow-[0_20px_70px_rgba(2,6,23,.55)]">
            <div className="grid gap-10 p-7 md:grid-cols-[1fr_.95fr] md:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">How it works</p>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Motion from code insight to launch plan.</h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-indigo-100/72 sm:text-base">
                  The flow is designed for speed: scan quickly, prioritize confidently, and move your team into build mode
                  with clear implementation context.
                </p>
                <a
                  href="/api/auth/github/login"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/20"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="space-y-3">
                {flowSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rf-slide-in flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-indigo-100/80"
                    style={{ animationDelay: `${150 + index * 120}ms` }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/20 text-cyan-200">
                      <Check className="h-4 w-4" />
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 text-center sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-r from-cyan-400/15 via-indigo-500/12 to-fuchsia-500/15 px-6 py-14 shadow-[0_15px_55px_rgba(12,15,40,.55)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_60%)]" />
            <h2 className="relative text-3xl font-semibold text-white sm:text-4xl">Your next product is already in your repos.</h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-indigo-100/80 sm:text-base">
              Replace guesswork with signal. Start a scan and walk away with opportunities your team can actually ship.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/api/auth/github/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b102d] transition-transform hover:-translate-y-0.5"
              >
                Connect GitHub
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/95 transition-colors hover:bg-white/10"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 pb-10 pt-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-indigo-100/60 sm:flex-row sm:px-6">
          <span>© 2026 RepoFuse. Built by developers, for developers.</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
