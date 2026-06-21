import Image from 'next/image'
import Link from 'next/link'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { NavDropdown } from '@/components/nav-dropdown'
import { HeroChat } from '@/components/hero-chat'
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
  Star,
  Terminal,
  Workflow,
  Zap,
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
    color: '#10B981',
  },
  {
    title: 'Repo health dashboard',
    source: 'analytics-api, ci-reporter',
    score: '91',
    revenue: '$49/mo team upsell',
    color: '#06B6D4',
  },
  {
    title: 'Webhook automation starter',
    source: 'events-core, admin-console',
    score: '84',
    revenue: 'BYOK developer plan',
    color: '#F59E0B',
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
  'Read-only GitHub and GitLab access',
  'Source code is not stored',
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
    <div className="min-h-screen overflow-x-hidden bg-[#0B0F14] text-[#F0F6FC]">
      {errorMessage && (
        <div className="border-b border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-[#30363D] bg-[#0B0F14]/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <RepoFuseLogo3D className="h-9 w-9" />
            <span className="hidden font-mono text-sm font-bold text-[#F0F6FC] sm:inline">RepoFuse</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#scan" className="text-xs font-medium text-[#8B949E] transition-colors hover:text-[#F0F6FC]">
              Product scan
            </a>
            <a href="#workflow" className="text-xs font-medium text-[#8B949E] transition-colors hover:text-[#F0F6FC]">
              Workflow
            </a>
            <Link href="/pricing" className="text-xs font-medium text-[#8B949E] transition-colors hover:text-[#F0F6FC]">
              Pricing
            </Link>
            <NavDropdown />
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden rounded-lg border border-[#30363D] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#C9D1D9] transition-all hover:border-[#8B949E] hover:text-white sm:inline-flex"
            >
              View pricing
            </Link>
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-3.5 py-2 text-xs font-bold text-[#061018] shadow-[0_0_18px_rgba(6,182,212,0.25)] transition-all hover:bg-[#22D3EE]"
            >
              <Github className="h-3.5 w-3.5" />
              Scan free
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — full viewport, grid background */}
        <section className="hero-grid relative flex min-h-[calc(100vh-57px)] items-center border-b border-[#30363D] bg-[#0B0F14]">
          {/* radial fade to hide grid edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #0B0F14 100%)',
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 sm:px-6">
            <HeroChat />
          </div>
        </section>

        {/* Scan demo section */}
        <section id="scan" className="border-b border-[#30363D] bg-[linear-gradient(180deg,#0B0F14_0%,#101722_100%)]">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:pb-20">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-mono font-semibold text-[#FBBF24]">
                  <Zap className="h-3.5 w-3.5" />
                  Find the paid product hiding in your repos
                </div>

                <h2 className="max-w-3xl font-mono text-3xl font-black leading-[1.08] tracking-normal text-[#F0F6FC] sm:text-4xl lg:text-5xl">
                  Turn unused code into your next subscription product.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-7 text-[#AEB8C5] sm:text-lg">
                  RepoFuse scans your repositories, ranks the most sellable product ideas, and gives you the launch brief and scaffold plan to start charging faster.
                </p>

                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#8B949E]">
                  {proofPoints.map((point) => (
                    <span key={point} className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                      {point}
                    </span>
                  ))}
                </div>

                <div className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-[#30363D] bg-[#111827]">
                  {conversionStats.map((stat) => (
                    <div key={stat.label} className="border-r border-[#30363D] p-4 last:border-r-0">
                      <div className="font-mono text-2xl font-black text-[#F0F6FC] sm:text-3xl">{stat.value}</div>
                      <div className="mt-1 text-xs leading-5 text-[#8B949E]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl border border-[#30363D] bg-[#111827] shadow-2xl shadow-black/50">
                  <div className="flex items-center gap-2 border-b border-[#30363D] bg-[#0D1117] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-[#F85149]" />
                    <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                    <span className="h-3 w-3 rounded-full bg-[#10B981]" />
                    <span className="ml-3 font-mono text-xs text-[#8B949E]">RepoFuse Opportunity Scan</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2 py-1 text-[11px] font-mono text-[#3FB950]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3FB950]" />
                      live
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-4 rounded-xl border border-[#30363D] bg-[#0B0F14] p-4">
                      <Image
                        src="/repofuse-logo-3d.jpg"
                        alt="RepoFuse logo"
                        width={64}
                        height={64}
                        className="h-14 w-14 rounded-xl object-cover"
                        priority
                      />
                      <div>
                        <div className="font-mono text-sm font-bold text-[#F0F6FC]">DealPatrol workspace</div>
                        <div className="mt-1 text-xs text-[#8B949E]">Analyzing 14 repos, 43 services, 2,813 files</div>
                      </div>
                    </div>

                    <div className="mb-5 rounded-xl border border-[#30363D] bg-[#0B0F14] p-4 font-mono text-sm">
                      <div className="flex gap-3 text-[#8B949E]">
                        <Terminal className="mt-0.5 h-4 w-4 text-[#06B6D4]" />
                        <span className="text-[#F0F6FC]">repofuse scan --find-subscription-products</span>
                      </div>
                      <div className="mt-3 space-y-2 pl-7 text-xs text-[#8B949E]">
                        <div>Connected with read-only access</div>
                        <div className="text-[#06B6D4]">Mapped reusable billing, auth, and analytics logic</div>
                        <div className="text-[#F59E0B]">Detected 3 monetizable product wedges</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {scanFindings.map((finding) => (
                        <div key={finding.title} className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-mono text-sm font-bold text-[#F0F6FC]">{finding.title}</h3>
                              <p className="mt-1 text-xs text-[#8B949E]">Found in {finding.source}</p>
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
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#30363D]">
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

        <section className="border-b border-[#30363D] bg-[#0B0F14] py-14">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3">
            {outcomeCards.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-xl border border-[#30363D] bg-[#111827] p-6">
                <Icon className="h-6 w-6 text-[#06B6D4]" />
                <h2 className="mt-5 font-mono text-lg font-bold text-[#F0F6FC]">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#8B949E]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-b border-[#30363D] bg-[#101722] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#30363D] bg-[#111827] px-3 py-1.5 text-xs font-mono text-[#8B949E]">
                <Activity className="h-3.5 w-3.5 text-[#F59E0B]" />
                Subscription workflow
              </div>
              <h2 className="font-mono text-3xl font-black text-[#F0F6FC] sm:text-5xl">
                A straight path from repo scan to paid plan.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#AEB8C5]">
                The homepage now sells the workflow buyers care about: connect safely, find revenue-grade ideas, validate the winner, and upgrade when they need more scans and scaffolds.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {workflowSteps.map(({ icon: Icon, title, copy }, index) => (
                <div key={title} className="rounded-xl border border-[#30363D] bg-[#0B0F14] p-5">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-[#06B6D4]" />
                    <span className="font-mono text-xs text-[#8B949E]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-mono text-base font-bold text-[#F0F6FC]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#8B949E]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#30363D] bg-[#0B0F14] py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10">
                <LockKeyhole className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <h2 className="font-mono text-3xl font-black text-[#F0F6FC] sm:text-4xl">
                Remove the two reasons developers hesitate.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#AEB8C5]">
                Subscription pages lose buyers when they worry about source-code access or cannot see why Pro is worth paying for. RepoFuse answers both before the pricing click.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ['Security', 'Read-only OAuth. No stored source code.'],
                  ['Value', 'Free scan proves the opportunity before upgrade.'],
                  ['Speed', 'From repo map to launch brief in minutes.'],
                  ['Expansion', 'Team, scaffold, digest, and Scale upgrades.'],
                ].map(([label, copy]) => (
                  <div key={label} className="rounded-lg border border-[#30363D] bg-[#111827] p-4">
                    <div className="font-mono text-sm font-bold text-[#F0F6FC]">{label}</div>
                    <div className="mt-1 text-sm leading-6 text-[#8B949E]">{copy}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#30363D] bg-[#111827] p-5 shadow-2xl shadow-black/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] pb-4">
                <div>
                  <div className="font-mono text-sm font-bold text-[#F0F6FC]">Launch brief preview</div>
                  <div className="mt-1 text-xs text-[#8B949E]">Generated after the first free scan</div>
                </div>
                <span className="rounded-lg bg-[#10B981]/10 px-3 py-1.5 text-xs font-bold text-[#3FB950]">
                  Ready for Pro scaffold
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#30363D] bg-[#0B0F14] p-4">
                  <Code2 className="h-5 w-5 text-[#06B6D4]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#F0F6FC]">Reusable code</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8B949E]">Auth middleware, billing webhooks, analytics events, and dashboard shells already exist.</p>
                </div>
                <div className="rounded-xl border border-[#30363D] bg-[#0B0F14] p-4">
                  <KeyRound className="h-5 w-5 text-[#F59E0B]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#F0F6FC]">Paid-plan angle</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8B949E]">Free health score, Pro automated reports, Scale multi-org monitoring.</p>
                </div>
                <div className="rounded-xl border border-[#30363D] bg-[#0B0F14] p-4">
                  <Clock3 className="h-5 w-5 text-[#8B5CF6]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#F0F6FC]">Build estimate</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8B949E]">Small MVP, 6 reusable modules, 2 risky integrations, 1 test harness needed.</p>
                </div>
                <div className="rounded-xl border border-[#30363D] bg-[#0B0F14] p-4">
                  <GitBranch className="h-5 w-5 text-[#10B981]" />
                  <h3 className="mt-4 font-mono text-sm font-bold text-[#F0F6FC]">Next action</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8B949E]">Upgrade to Pro, generate scaffold, and open the starter PR.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#30363D] bg-[#101722] py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <blockquote className="max-w-3xl text-2xl font-semibold leading-10 text-[#F0F6FC] sm:text-3xl">
                &quot;RepoFuse found the one product idea we could actually ship from code we already had. The Pro upgrade made sense the moment the launch brief appeared.&quot;
              </blockquote>
              <div className="mt-5 text-sm text-[#8B949E]">Indie founder using RepoFuse for multi-repo product discovery</div>
            </div>

            <div className="rounded-2xl border border-[#06B6D4]/40 bg-[#0B0F14] p-6 shadow-[0_0_36px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-sm font-bold text-[#F0F6FC]">Pro plan</div>
                  <div className="mt-1 text-sm text-[#8B949E]">Best for turning scan results into shipped products.</div>
                </div>
                <BadgeCheck className="h-8 w-8 text-[#06B6D4]" />
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-mono text-5xl font-black text-[#F0F6FC]">$19</span>
                <span className="pb-2 text-sm text-[#8B949E]">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {planHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#D0D7DE]">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#10B981]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 grid gap-3">
                <a
                  href="/api/auth/github/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#06B6D4] px-5 py-3 text-sm font-black text-[#061018] transition-all hover:bg-[#22D3EE]"
                >
                  Start with a free scan
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#30363D] bg-[#111827] px-5 py-3 text-sm font-bold text-[#D0D7DE] transition-all hover:border-[#8B949E]"
                >
                  Compare all plans
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0B0F14] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[#30363D] bg-[#111827]">
              <Layers className="h-7 w-7 text-[#F59E0B]" />
            </div>
            <h2 className="font-mono text-3xl font-black text-[#F0F6FC] sm:text-5xl">
              Your next subscription can start with a repo scan.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#AEB8C5]">
              Connect your repos, get the first opportunity map free, and upgrade when you are ready to generate more scans, launch briefs, and scaffold-ready product plans.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/api/auth/github/login"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-[#06B6D4] px-8 py-4 text-base font-black text-[#061018] shadow-[0_0_28px_rgba(6,182,212,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#22D3EE]"
              >
                <Github className="h-5 w-5" />
                Scan my repos free
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/pricing"
                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#30363D] bg-[#111827] px-8 py-4 text-base font-bold text-[#D0D7DE] transition-all hover:border-[#8B949E]"
              >
                See subscription plans
              </Link>
            </div>
            <p className="mt-5 font-mono text-xs text-[#8B949E]">
              No credit card for the first scan. Read-only access. Source code is not stored.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
