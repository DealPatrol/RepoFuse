import Image from 'next/image'
import Link from 'next/link'
import { NavDropdown } from '@/components/nav-dropdown'
import { HeroChat } from '@/components/hero-chat'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/site'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  GitBranch,
  Github,
  GitPullRequest,
  KeyRound,
  Layers,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react'

export const metadata = pageMetadata({
  title: 'RepoFuse — Discover Apps Hidden in Your Code',
  description:
    'RepoFuse scans your GitHub or GitLab repos, finds reusable code, and ranks the products you could build and sell from it, with launch briefs and scaffold plans.',
  path: '/',
  absoluteTitle: true,
})

const ERROR_MESSAGES: Record<string, string> = {
  auth_required: 'You must sign in to access the dashboard.',
  github_oauth_not_configured: 'GitHub OAuth is not configured.',
  github_not_linked: 'Connect GitHub in your account settings to list repositories and run analyses.',
  gitlab_oauth_not_configured: 'GitLab OAuth is not configured.',
  invalid_oauth_state: 'Sign-in session expired or cookies were blocked.',
  missing_code: 'Your OAuth provider did not return an authorization code.',
  token_exchange_failed: 'Could not exchange the authorization code for a token.',
  github_user_fetch_failed: 'Signed in but could not load your profile.',
  gitlab_user_fetch_failed: 'Signed in but could not load your profile.',
  oauth_callback_failed: 'Something went wrong finishing sign-in.',
}

const conversionStats = [
  { value: '14', label: 'repos scanned in the demo workspace' },
  { value: '3', label: 'subscription-ready ideas surfaced' },
  { value: '9 min', label: 'to a launch brief and scaffold plan' },
]

const scanFindings = [
  {
    title: 'Usage-based billing kit',
    source: 'payments-service, webhook-worker',
    score: '96',
    revenue: '$19/mo Pro wedge',
    color: '#989AA0',
  },
  {
    title: 'Repo health dashboard',
    source: 'analytics-api, ci-reporter',
    score: '91',
    revenue: '$49/mo team upsell',
    color: '#D3D4DC',
  },
  {
    title: 'Webhook automation starter',
    source: 'events-core, admin-console',
    score: '84',
    revenue: 'BYOK developer plan',
    color: '#989AA0',
  },
]

const outcomeCards = [
  {
    icon: Sparkles,
    title: 'Ideas ranked by revenue fit',
    copy: 'RepoFuse connects code patterns to buyer intent, demand signals, and build effort so the best paid products float to the top.',
  },
  {
    icon: Workflow,
    title: 'Launch briefs your team can act on',
    copy: 'Every idea includes positioning, MVP scope, stack reuse, risks, and the first paid-plan hook.',
  },
  {
    icon: GitPullRequest,
    title: 'Scaffold paths that shorten the build',
    copy: 'Turn selected ideas into implementation plans and starter PRs instead of another brainstorm document.',
  },
]

const planHighlights = [
  'Unlimited repository scans',
  '3,000 Pro credits every month',
  'Build This App scaffold generation',
  'Team workspace and weekly digest',
]

const proofPoints = [
  'Scans only the repos you pick',
  'Source files are not stored',
  'Free scan before you upgrade',
  'Cancel anytime from billing',
]

const workflowSteps = [
  {
    icon: Github,
    title: 'Connect',
    copy: 'Sign in with GitHub or GitLab and choose the repos you want to evaluate.',
  },
  {
    icon: Database,
    title: 'Scan',
    copy: 'RepoFuse maps dependencies, routes, domain models, and repeated product logic.',
  },
  {
    icon: BarChart3,
    title: 'Prioritize',
    copy: 'Ideas are ranked by demand, reuse, effort, and subscription potential.',
  },
  {
    icon: Rocket,
    title: 'Launch',
    copy: 'Export briefs, scaffold the project, and move the winning idea into production.',
  },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'An unexpected error occurred.' : null

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1D2122] text-[#D3D4DC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'RepoFuse',
            url: 'https://repofuse.com',
            logo: 'https://repofuse.com/brand-logo.png',
          }),
        }}
      />
      {errorMessage && (
        <div className="border-b border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-[#363C3E] bg-[#1D2122]/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-header-dark.png" alt="RepoFuse" width={168} height={40} className="block h-10 w-auto" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#scan" className="text-xs font-medium text-[#989AA0] transition-colors hover:text-[#D3D4DC]">
              Product scan
            </a>
            <a href="#workflow" className="text-xs font-medium text-[#989AA0] transition-colors hover:text-[#D3D4DC]">
              Workflow
            </a>
            <Link href="/pricing" className="text-xs font-medium text-[#989AA0] transition-colors hover:text-[#D3D4DC]">
              Pricing
            </Link>
            <NavDropdown />
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden rounded-lg border border-[#363C3E] bg-[#2B3031] px-3 py-2 text-xs font-semibold text-[#D3D4DC] transition-all hover:border-[#989AA0] hover:text-white sm:inline-flex"
            >
              View pricing
            </Link>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FFC93C] px-3.5 py-2 text-xs font-bold text-[#1D2122] transition-all hover:bg-[#F2B824]"
            >
              <Github className="h-3.5 w-3.5" />
              Scan free
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — full viewport, grid background */}
        <section className="hero-grid relative flex min-h-[calc(100vh-57px)] items-center border-b border-[#363C3E] bg-[#1D2122]">
          {/* radial fade to hide grid edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #1D2122 100%)',
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 sm:px-6">
            <HeroChat />
          </div>
        </section>

        {/* Scan demo section */}
        <section id="scan" className="border-b border-[#363C3E] bg-[linear-gradient(180deg,#1D2122_0%,#1D2122_100%)]">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:pb-20">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#989AA0]/30 bg-[#989AA0]/10 px-3 py-1.5 text-xs font-mono font-semibold text-[#D3D4DC]">
                  <Zap className="h-3.5 w-3.5" />
                  Find the paid product hiding in your repos
                </div>

                <h2 className="max-w-3xl font-mono text-3xl font-black leading-[1.08] tracking-normal text-[#D3D4DC] sm:text-4xl lg:text-5xl">
                  Turn unused code into your next subscription product.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-7 text-[#989AA0] sm:text-lg">
                  RepoFuse scans your repositories, ranks the most sellable product ideas, and gives you the launch brief and scaffold plan to start charging faster.
                </p>

                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#989AA0]">
                  {proofPoints.map((point) => (
                    <span key={point} className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#989AA0]" />
                      {point}
                    </span>
                  ))}
                </div>

                <div className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-[#363C3E] bg-[#2B3031]">
                  {conversionStats.map((stat) => (
                    <div key={stat.label} className="border-r border-[#363C3E] p-4 last:border-r-0">
                      <div className="font-mono text-2xl font-black text-[#D3D4DC] sm:text-3xl">{stat.value}</div>
                      <div className="mt-1 text-xs leading-5 text-[#989AA0]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl border border-[#363C3E] bg-[#2B3031] shadow-2xl shadow-black/50">
                  <div className="flex items-center gap-2 border-b border-[#363C3E] bg-[#1D2122] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-[#6A7075]" />
                    <span className="h-3 w-3 rounded-full bg-[#989AA0]" />
                    <span className="h-3 w-3 rounded-full bg-[#D3D4DC]" />
                    <span className="ml-3 font-mono text-xs text-[#989AA0]">RepoFuse Opportunity Scan</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#989AA0]/10 px-2 py-1 text-[11px] font-mono text-[#D3D4DC]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D3D4DC]" />
                      demo
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-4 rounded-xl border border-[#363C3E] bg-[#1D2122] p-4">
                      <Image
                        src="/repofuse-logo-3d.jpg"
                        alt="RepoFuse logo"
                        width={64}
                        height={64}
                        className="h-14 w-14 rounded-xl object-cover"
                        priority
                      />
                      <div>
                        <div className="font-mono text-sm font-bold text-[#D3D4DC]">Demo workspace</div>
                        <div className="mt-1 text-xs text-[#989AA0]">Analyzing 14 repos, 43 services, 2,813 files</div>
                      </div>
                    </div>

                    <div className="mb-5 rounded-xl border border-[#363C3E] bg-[#1D2122] p-4 font-mono text-sm">
                      <div className="flex gap-3 text-[#989AA0]">
                        <Terminal className="mt-0.5 h-4 w-4 text-[#D3D4DC]" />
                        <span className="text-[#D3D4DC]">repofuse scan --find-subscription-products</span>
                      </div>
                      <div className="mt-3 space-y-2 pl-7 text-xs text-[#989AA0]">
                        <div>Connected to 14 selected repos</div>
                        <div className="text-[#D3D4DC]">Mapped reusable billing, auth, and analytics logic</div>
                        <div className="text-[#989AA0]">Detected 3 monetizable product wedges</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {scanFindings.map((finding) => (
                        <div key={finding.title} className="rounded-xl border border-[#363C3E] bg-[#2B3031] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-mono text-sm font-bold text-[#D3D4DC]">{finding.title}</h3>
                              <p className="mt-1 text-xs text-[#989AA0]">Found in {finding.source}</p>
                            </div>
                            <span
                              className="rounded-lg px-2.5 py-1 font-mono text-xs font-black"
                              style={{ backgroundColor: `${finding.color}1A`, color: finding.color }}
                            >
                              {finding.score}%
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-[#D0D7DE]">{finding.revenue}</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#363C3E]">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${finding.score}%`, backgroundColor: finding.color }}
                              />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#363C3E] bg-[#1D2122] py-14">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3">
            {outcomeCards.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-xl border border-[#363C3E] bg-[#2B3031] p-6">
                <Icon className="h-6 w-6 text-[#D3D4DC]" />
                <h2 className="mt-5 font-mono text-lg font-bold text-[#D3D4DC]">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#989AA0]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-b border-[#363C3E] bg-[#1D2122] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#363C3E] bg-[#2B3031] px-3 py-1.5 text-xs font-mono text-[#989AA0]">
                <Activity className="h-3.5 w-3.5 text-[#989AA0]" />
                Subscription workflow
              </div>
              <h2 className="font-mono text-3xl font-black text-[#D3D4DC] sm:text-5xl">
                A straight path from repo scan to paid plan.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#989AA0]">
                Connect the repos you choose, see which ideas are worth charging for, validate the winner, and upgrade when you need more scans and scaffolds.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {workflowSteps.map(({ icon: Icon, title, copy }, index) => (
                <div key={title} className="rounded-xl border border-[#363C3E] bg-[#1D2122] p-5">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-[#D3D4DC]" />
                    <span className="font-mono text-xs text-[#989AA0]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-mono text-base font-bold text-[#D3D4DC]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#989AA0]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#363C3E] bg-[#1D2122] py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#989AA0]/30 bg-[#989AA0]/10">
                <LockKeyhole className="h-6 w-6 text-[#989AA0]" />
              </div>
              <h2 className="font-mono text-3xl font-black text-[#D3D4DC] sm:text-4xl">
                Safe to connect. Clear about what Pro adds.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#989AA0]">
                You choose which repositories RepoFuse scans, source files are never stored, and your first scan is free, so you can judge the results before you pay.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ['Security', 'You pick the repos. Source files are not stored.'],
                  ['Value', 'Free scan proves the opportunity before upgrade.'],
                  ['Speed', 'From repo map to launch brief in minutes.'],
                  ['Expansion', 'Team, scaffold, digest, and Scale upgrades.'],
                ].map(([label, copy]) => (
                  <div key={label} className="rounded-lg border border-[#363C3E] bg-[#2B3031] p-4">
                    <div className="font-mono text-sm font-bold text-[#D3D4DC]">{label}</div>
                    <div className="mt-1 text-sm leading-6 text-[#989AA0]">{copy}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#363C3E] bg-[#2B3031] p-5 shadow-2xl shadow-black/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#363C3E] pb-4">
                <div>
                  <div className="font-mono text-sm font-bold text-[#D3D4DC]">Launch brief preview</div>
                  <div className="mt-1 text-xs text-[#989AA0]">Generated after the first free scan</div>
                </div>
                <span className="rounded-lg bg-[#989AA0]/10 px-3 py-1.5 text-xs font-bold text-[#D3D4DC]">
                  Ready for Pro scaffold
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#363C3E] bg-[#1D2122] p-4">
                  <Code2 className="h-5 w-5 text-[#D3D4DC]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#D3D4DC]">Reusable code</h3>
                  <p className="mt-2 text-sm leading-6 text-[#989AA0]">Auth middleware, billing webhooks, analytics events, and dashboard shells already exist.</p>
                </div>
                <div className="rounded-xl border border-[#363C3E] bg-[#1D2122] p-4">
                  <KeyRound className="h-5 w-5 text-[#989AA0]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#D3D4DC]">Paid-plan angle</h3>
                  <p className="mt-2 text-sm leading-6 text-[#989AA0]">Free health score, Pro automated reports, Scale multi-org monitoring.</p>
                </div>
                <div className="rounded-xl border border-[#363C3E] bg-[#1D2122] p-4">
                  <Clock3 className="h-5 w-5 text-[#989AA0]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#D3D4DC]">Build estimate</h3>
                  <p className="mt-2 text-sm leading-6 text-[#989AA0]">Small MVP, 6 reusable modules, 2 risky integrations, 1 test harness needed.</p>
                </div>
                <div className="rounded-xl border border-[#363C3E] bg-[#1D2122] p-4">
                  <GitBranch className="h-5 w-5 text-[#989AA0]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#D3D4DC]">Next action</h3>
                  <p className="mt-2 text-sm leading-6 text-[#989AA0]">Upgrade to Pro, generate scaffold, and open the starter PR.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#363C3E] bg-[#1D2122] py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <h2 className="max-w-3xl font-mono text-3xl font-black leading-tight text-[#D3D4DC] sm:text-4xl">
                A free scan shows what you can ship next.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#989AA0]">
                RepoFuse reads the repositories you connect, maps reusable code, and ranks product ideas by demand, reuse, and effort. Upgrade to Pro when you want launch briefs and scaffold generation.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D3D4DC]/40 bg-[#1D2122] p-6 ">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-sm font-bold text-[#D3D4DC]">Pro plan</div>
                  <div className="mt-1 text-sm text-[#989AA0]">Best for turning scan results into shipped products.</div>
                </div>
                <BadgeCheck className="h-8 w-8 text-[#D3D4DC]" />
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-mono text-5xl font-black text-[#D3D4DC]">$19</span>
                <span className="pb-2 text-sm text-[#989AA0]">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {planHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#D0D7DE]">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#989AA0]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 grid gap-3">
                <a
                  href="/api/auth/github/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D3D4DC] px-5 py-3 text-sm font-black text-[#1D2122] transition-all hover:bg-[#F2B824]"
                >
                  Start with a free scan
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#363C3E] bg-[#2B3031] px-5 py-3 text-sm font-bold text-[#D0D7DE] transition-all hover:border-[#989AA0]"
                >
                  Compare all plans
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1D2122] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[#363C3E] bg-[#2B3031]">
              <Layers className="h-7 w-7 text-[#989AA0]" />
            </div>
            <h2 className="font-mono text-3xl font-black text-[#D3D4DC] sm:text-5xl">
              Your next subscription can start with a repo scan.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#989AA0]">
              Connect your repos, get the first opportunity map free, and upgrade when you are ready to generate more scans, launch briefs, and scaffold-ready product plans.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/api/auth/github/login"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-[#D3D4DC] px-8 py-4 text-base font-black text-[#1D2122]  transition-all hover:-translate-y-0.5 hover:bg-[#F2B824]"
              >
                <Github className="h-5 w-5" />
                Scan my repos free
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/pricing"
                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#363C3E] bg-[#2B3031] px-8 py-4 text-base font-bold text-[#D0D7DE] transition-all hover:border-[#989AA0]"
              >
                See subscription plans
              </Link>
            </div>
            <p className="mt-5 font-mono text-xs text-[#989AA0]">
              No credit card for the first scan. Source files are not stored.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
