import Link from 'next/link'
import { ArrowRight, GitBranch, Github, LockKeyhole, ShieldCheck } from 'lucide-react'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { sanitizeReturnTo } from '@/lib/auth'

const ERROR_MESSAGES: Record<string, string> = {
  github_oauth_not_configured: 'GitHub OAuth is not configured yet.',
  gitlab_oauth_not_configured: 'GitLab OAuth is not configured yet.',
  bitbucket_oauth_not_configured: 'Bitbucket OAuth is not configured yet.',
  bitbucket_not_available: 'Bitbucket sign-in is visible, but repository scanning is not enabled for Bitbucket yet.',
  invalid_oauth_state: 'Your sign-in session expired. Try again.',
  missing_code: 'The provider did not return an authorization code.',
  token_exchange_failed: 'Could not finish the OAuth token exchange.',
  oauth_callback_failed: 'Something went wrong finishing sign-in.',
}

type SignInPageProps = {
  searchParams: Promise<{
    error?: string
    idea?: string
    returnTo?: string
  }>
}

function providerHref(provider: 'github' | 'gitlab' | 'bitbucket', returnTo: string) {
  return `/api/auth/${provider}/login?returnTo=${encodeURIComponent(returnTo)}`
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const returnTo = sanitizeReturnTo(params.returnTo, '/dashboard')
  const idea = params.idea?.trim()
  const error = params.error ? ERROR_MESSAGES[params.error] ?? 'Could not start sign-in. Try another provider.' : null

  return (
    <main className="min-h-screen bg-[#0B0F14] px-4 py-8 text-[#F0F6FC] sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <RepoFuseLogo3D className="h-10 w-10" />
          <span className="font-mono text-sm font-bold">RepoFuse</span>
        </Link>
        <Link href="/" className="text-sm text-[#8B949E] transition-colors hover:text-[#F0F6FC]">
          Back home
        </Link>
      </div>

      <section className="mx-auto grid max-w-6xl gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-3 py-1.5 text-xs font-mono font-semibold text-[#67E8F9]">
            <LockKeyhole className="h-3.5 w-3.5" />
            Sign in to scan your repos
          </div>
          <h1 className="font-mono text-4xl font-black leading-[1.06] sm:text-5xl">
            Connect your code host to generate your RepoFuse plan.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#AEB8C5]">
            RepoFuse needs a secure provider login before it can match your idea against private repositories, detect reusable code, and create the launch brief.
          </p>

          {idea && (
            <div className="mt-7 rounded-xl border border-[#30363D] bg-[#111827] p-4">
              <div className="font-mono text-xs font-semibold uppercase text-[#8B949E]">Your idea</div>
              <p className="mt-2 text-sm leading-6 text-[#D0D7DE]">{idea}</p>
            </div>
          )}

          <div className="mt-7 space-y-3 text-sm text-[#8B949E]">
            {['Read-only OAuth permissions', 'Source code is not stored', 'Free scan before upgrading'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#30363D] bg-[#111827] p-5 shadow-2xl shadow-black/40">
          <div className="border-b border-[#30363D] pb-5">
            <h2 className="font-mono text-xl font-black">Choose a provider</h2>
            <p className="mt-2 text-sm leading-6 text-[#8B949E]">
              Pick where your repositories live. You can add more providers later from the dashboard.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/35 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <a
              href={providerHref('github', returnTo)}
              className="group flex items-center gap-4 rounded-xl border border-[#30363D] bg-[#0B0F14] p-4 transition-all hover:border-[#06B6D4] hover:bg-[#0E1722]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F0F6FC] text-[#0B0F14]">
                <Github className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-mono text-sm font-bold text-[#F0F6FC]">Continue with GitHub</span>
                <span className="mt-1 block text-xs text-[#8B949E]">Best for GitHub repositories and organizations</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#8B949E] transition-transform group-hover:translate-x-1 group-hover:text-[#06B6D4]" />
            </a>

            <a
              href={providerHref('gitlab', returnTo)}
              className="group flex items-center gap-4 rounded-xl border border-[#30363D] bg-[#0B0F14] p-4 transition-all hover:border-[#F59E0B] hover:bg-[#15120B]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
                <GitBranch className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-mono text-sm font-bold text-[#F0F6FC]">Continue with GitLab</span>
                <span className="mt-1 block text-xs text-[#8B949E]">Connect GitLab projects with read-only access</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#8B949E] transition-transform group-hover:translate-x-1 group-hover:text-[#F59E0B]" />
            </a>

            <a
              href={providerHref('bitbucket', returnTo)}
              className="group flex items-center gap-4 rounded-xl border border-[#30363D] bg-[#0B0F14] p-4 transition-all hover:border-[#8B5CF6] hover:bg-[#12101B]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA]">
                <GitBranch className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-mono text-sm font-bold text-[#F0F6FC]">Continue with Bitbucket</span>
                <span className="mt-1 block text-xs text-[#8B949E]">Requires Bitbucket OAuth configuration</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#8B949E] transition-transform group-hover:translate-x-1 group-hover:text-[#A78BFA]" />
            </a>
          </div>

          <p className="mt-5 text-xs leading-5 text-[#6E7681]">
            By continuing, RepoFuse requests repository read access so it can analyze structure, dependencies, and product patterns.
          </p>
        </div>
      </section>
    </main>
  )
}
