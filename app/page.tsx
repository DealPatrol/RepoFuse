import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Github,
  Sparkles,
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

const stats = [
  { value: '14,500+', label: 'Developers' },
  { value: '320,000+', label: 'Repos Scanned' },
  { value: '98%', label: 'Code Reuse Rate' },
  { value: '6x', label: 'Faster to Ship' },
]

const platforms = [
  { name: 'GitHub', status: 'LIVE', live: true },
  { name: 'GitLab', status: 'SOON', live: false },
  { name: 'Bitbucket', status: 'SOON', live: false },
  { name: 'Azure DevOps', status: 'SOON', live: false },
  { name: 'Linear', status: 'SOON', live: false },
  { name: 'Self-hosted Git', status: 'SOON', live: false },
]

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'An unexpected error occurred.' : null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020815] text-white">
      {errorMessage && (
        <div className="border-b border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,153,255,0.16),transparent_45%),radial-gradient(circle_at_30%_55%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_72%_46%,rgba(167,139,250,0.08),transparent_44%)]" />

      <header className="relative z-20 border-b border-white/10 bg-[#040d1d]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-400/10 p-1 shadow-[0_0_18px_rgba(34,211,238,.45)]">
              <Image src="/repofuse-logo-3d.jpg" alt="RepoFuse" width={28} height={28} className="rounded" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              REPO<span className="text-orange-400">FUSE</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/35 hover:text-white"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </a>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center rounded-full border border-cyan-200/55 bg-[#21b9df] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(56,189,248,.45)] transition-transform hover:-translate-y-0.5"
            >
              Scan My Repos Free
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-20">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-300/45 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,.45)] rf-float-slow">
            <Image src="/repofuse-logo-3d.jpg" alt="RepoFuse icon" width={42} height={42} className="rounded" />
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
            Your Million Dollar Idea
            <span className="mt-3 block bg-gradient-to-r from-cyan-300 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
              is hiding in your code
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300/90 sm:text-2xl">
            Describe what you want to build — RepoFuse will scan your repos and surface hidden opportunities,
            reuse your best code, and ship it straight to GitHub.
          </p>

          <div className="mx-auto mt-10 flex max-w-3xl items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.04] p-2 shadow-[0_0_45px_rgba(56,189,248,.12)]">
            <input
              aria-label="What do you want to build"
              placeholder="What do you want to build?"
              className="h-12 w-full bg-transparent px-4 text-lg text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button className="h-12 rounded-xl border border-cyan-200/50 bg-[#20b8df] px-7 text-base font-semibold text-white transition-colors hover:bg-[#18a9cf]">
              Generate
            </button>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-lg text-slate-300/75">
            <Github className="h-4 w-4" />
            Sign in with GitHub to analyze your repositories
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/api/auth/github/login"
              className="inline-flex min-w-72 items-center justify-center gap-2 rounded-2xl border border-cyan-200/55 bg-[#1db8de] px-9 py-4 text-3xl font-semibold text-white shadow-[0_0_28px_rgba(56,189,248,.5)] transition-transform hover:-translate-y-0.5"
            >
              <Github className="h-6 w-6" />
              Scan My Repos Free
            </a>
            <a
              href="#how"
              className="inline-flex min-w-72 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-9 py-4 text-3xl font-medium text-white/95 transition-colors hover:bg-white/10"
            >
              See How It Works
              <ArrowRight className="h-6 w-6" />
            </a>
          </div>

          <div className="mx-auto mt-12 inline-flex items-center overflow-hidden rounded-full border border-white/16 bg-white/[0.03] text-sm font-semibold text-slate-200/90">
            <span className="flex items-center gap-2 border-r border-white/14 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              <Sparkles className="h-4 w-4 text-cyan-300" />
              AI-POWERED
            </span>
            <span className="px-4 py-2.5 text-slate-400">The #1 Repo Intelligence Platform</span>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#060f1f]/90 py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 text-center sm:px-6 md:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label}>
                <p className="text-5xl font-extrabold text-cyan-300 sm:text-6xl">{item.value}</p>
                <p className="mt-2 text-lg text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 pb-24 pt-20 text-center sm:px-6">
          <p className="text-lg font-semibold tracking-[0.2em] text-slate-400">WORKS WHERE YOUR CODE ALREADY LIVES</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform, index) => (
              <div
                key={platform.name}
                className="rf-slide-in flex items-center justify-between rounded-2xl border border-white/14 bg-white/[0.03] px-5 py-4"
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                <span className="text-2xl font-semibold text-white">{platform.name}</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    platform.live
                      ? 'bg-cyan-400/20 text-cyan-300'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {platform.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:px-6">
          <span>© 2026 RepoFuse. Built by developers, for developers.</span>
          <div className="flex items-center gap-5">
            <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>

      <div className="pointer-events-none absolute inset-x-0 top-32 h-80 bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[42rem] h-72 bg-[radial-gradient(circle,rgba(45,212,191,0.10),transparent_70%)]" />
    </div>
  )
}
