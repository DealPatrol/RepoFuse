import Link from 'next/link'
import { RepoFuseLogo3D } from '@/components/repofuse-logo-3d'
import { NavDropdown } from '@/components/nav-dropdown'
import { HeroChat } from '@/components/hero-chat'
import {
  Github, ArrowRight, AlertCircle, Zap, Play,
  GitPullRequest, Mail, CheckCircle2, Workflow,
  MessageSquare, Layers, Activity, Database, Terminal,
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

  export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams
    const errorMessage = error ? ERROR_MESSAGES[error] ?? 'An unexpected error occurred.' : null

    return (
      <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] overflow-x-hidden">
        {errorMessage && (
          <div className="bg-red-950/50 border-b border-red-500/30 px-4 py-3 flex items-center gap-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Noise overlay */}
        <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px'
        }} />

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#30363D] bg-[#0D1117]/80 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 pl-4">
              <RepoFuseLogo3D className="h-9 w-9 mt-4" />
              <span className="text-sm font-bold text-[#F0F6FC] hidden sm:block font-mono">RepoFuse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] transition-colors">Features</a>
              <a href="#how" className="text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] transition-colors">How It Works</a>
              <Link href="/pricing" className="text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] transition-colors">Pricing</Link>
              <NavDropdown />
            </nav>

            <div className="flex items-center gap-3">
              <a href="/api/auth/github/login" className="flex items-center gap-2 text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] px-3 py-2 rounded-lg border border-[#30363D] hover:border-[#8B949E] transition-all bg-[#161B22]">
                <Github className="h-3.5 w-3.5" />
                Sign in
              </a>
            </div>
          </div>
        </header>

        <main>
          {/* ── Hero ── */}
          <section className="relative pt-12 pb-20 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08)_0%,rgba(13,17,23,0)_70%)] pointer-events-none" />
            <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06)_0%,rgba(13,17,23,0)_70%)] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
              {/* Hero Chat - Interactive Intent Capture at Top */}
              <div className="mb-20">
                <HeroChat />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] mb-6 text-xs font-mono text-[#8B949E]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="flex items-center gap-1.5 font-semibold">
                  <Zap className="h-3.5 w-3.5" />
                  AI-POWERED
                </span>
                <span className="w-px h-4 bg-[#F59E0B]/30" />
                The #1 Repo Intelligence Platform
              </div>

              {/* Headline */}
              <h1 className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8 text-[#F0F6FC]">
                Unlock ideas from<br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#F59E0B]">
                  {' '}your code.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-[#8B949E] max-w-2xl mx-auto leading-relaxed mb-12">
                RepoFuse scans your GitHub and GitLab repos, surfaces project ideas, and turns scattered code into your next launch —{' '}
                <strong className="text-[#F0F6FC] font-semibold">automatically.</strong>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <a
                  href="/api/auth/github/login"
                  className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto sm:min-w-64 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
                >
                  <Github className="h-5 w-5" />
                  Scan My Repos Free
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-4 rounded-xl border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#8B949E] hover:bg-[#161B22] transition-all text-base font-medium"
                >
                  <Play className="h-4 w-4 text-[#F59E0B]" />
                  See how it works
                </a>
              </div>

              <p className="text-sm text-[#8B949E] mt-2 flex items-center justify-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#06B6D4]" />
                Free plan includes 200 credits — enough for 1 full repo scan. No credit card.
              </p>

              {/* Social proof + testimonial */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-[#161B22] border border-[#30363D] rounded-2xl p-6 max-w-3xl mx-auto text-left mt-10 shadow-xl">
                <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-[#30363D] pb-6 md:pb-0 md:pr-8 flex-shrink-0">
                  <div className="flex -space-x-2">
                    {['#06B6D4','#F59E0B','#10B981','#8B5CF6'].map((c, i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2 border-[#161B22] flex items-center justify-center font-bold text-xs text-[#0D1117]" style={{ backgroundColor: c }}>
                        {['A','S','M','J'][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-[#F0F6FC]">2,400+ developers</p>
                    <p className="text-xs text-[#8B949E]">scanning their code</p>
                  </div>
                </div>
                <div className="flex gap-4 flex-1">
                  <div className="text-[#06B6D4] flex-shrink-0 mt-0.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                  </div>
                  <div>
                    <p className="text-[#F0F6FC] font-medium italic mb-1">"Found 3 billable ideas in 4 minutes. Shipped one 3 weeks later."</p>
                    <p className="text-sm text-[#8B949E]">@IndieHacker_X · Twitter</p>
                  </div>
                </div>
              </div>

              {/* Terminal preview */}
              <div className="mt-14 text-left rounded-2xl overflow-hidden border border-[#30363D] bg-[#161B22] shadow-2xl shadow-black/60">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#30363D] bg-[#0D1117]/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs font-mono text-[#8B949E]">RepoFuse Dashboard</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-xs font-mono text-[#10B981]">Online</span>
                  </div>
                </div>
                <div className="p-6 font-mono text-sm space-y-3">
                  <div className="flex gap-3 text-[#8B949E]">
                    <span className="text-[#06B6D4]">$</span>
                    <span className="text-[#F0F6FC]">repofuse scan --org DealPatrol --all-repos</span>
                  </div>
                  <div className="space-y-1.5 text-[#8B949E] pl-6">
                    <div>▸ Connecting to GitHub API...</div>
                    <div className="text-[#06B6D4]">✓ Found 14 repositories</div>
                    <div>▸ Analyzing code patterns &amp; dependencies...</div>
                  </div>
                  <div className="pl-6 space-y-1 pt-1">
                    <div className="text-[#8B949E]">📦 <span className="text-[#F0F6FC]">repo-app-architect</span></div>
                    <div className="text-[#F59E0B] pl-4">⚡ 3 buildable ideas detected</div>
                    <div className="text-[#06B6D4] pl-6">→ SaaS: AI Code Review Tool · <span className="text-[#10B981]">94% match</span></div>
                    <div className="text-[#06B6D4] pl-6">→ Tool: Repo Health Dashboard · <span className="text-[#F59E0B]">88% match</span></div>
                    <div className="text-[#06B6D4] pl-6">→ API: Webhook Automation Kit · <span className="text-[#8B949E]">72% match</span></div>
                  </div>
                  <div className="pl-6 text-[#8B949E]">▸ Generating full project briefs...</div>
                  <div className="flex gap-3 text-[#8B949E] pl-0 pt-1">
                    <span className="text-[#06B6D4]">$</span>
                    <span className="w-2 h-4 bg-[#06B6D4] animate-pulse inline-block" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Metrics ── */}
          <section className="border-y border-[#30363D] py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
                {[
                  { val: '12k+', label: 'Repos Scanned', color: 'text-[#06B6D4]' },
                  { val: '4.1k', label: 'Ideas Found', color: 'text-[#F59E0B]' },
                  { val: '89%', label: 'Code Reuse', color: 'text-[#8B5CF6]' },
                  { val: '<30s', label: 'Analysis Time', color: 'text-[#10B981]' },
                ].map((m) => (
                  <div key={m.label} className="space-y-1">
                    <p className={`text-3xl md:text-4xl font-black font-mono tabular-nums ${m.color}`}>{m.val}</p>
                    <p className="text-xs text-[#8B949E] uppercase tracking-widest">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section id="how" className="py-24 bg-[#111827] border-y border-[#30363D]">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] mb-5 text-xs font-mono text-[#8B949E]">
                  HOW IT WORKS
                </div>
                <h2 className="font-mono text-4xl md:text-5xl font-bold text-[#F0F6FC] mb-3">
                  From dormant code<br />to shipped product.
                </h2>
                <p className="text-lg text-[#8B949E]">We don&apos;t just find ideas — we structure them into buildable plans.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    num: '01', title: 'Deep Scan', icon: '🔍',
                    desc: 'AI analyzes architecture, dependencies, and business logic patterns.',
                    accent: '#06B6D4',
                    preview: (
                      <div className="bg-[#0D1117] p-5 flex-1 flex flex-col justify-center">
                        <div className="space-y-2 font-mono text-xs">
                          <div className="text-[#8B949E]">$ repofuse scan --all</div>
                          <div className="text-[#06B6D4]">Scanning user-auth-api... [OK]</div>
                          <div className="text-[#06B6D4]">Scanning payment-service... [OK]</div>
                          <div className="text-[#F59E0B]">Analyzing 43 endpoints...</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    num: '02', title: 'Idea Generation', icon: '💡',
                    desc: 'We synthesize patterns into concepts ranked by demand and buildability.',
                    accent: '#F59E0B',
                    preview: null,
                  },
                  {
                    num: '03', title: 'Scaffold &amp; Build', icon: '🚀',
                    desc: 'One click generates a boilerplate repo and opens a pull request.',
                    accent: '#10B981',
                    preview: null,
                  },
                ].map((step, i) => (
                  <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden flex flex-col" style={{ '--step-accent': step.accent } as React.CSSProperties}>
                    <div className="p-6 border-b border-[#30363D]">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-[#1C2333] text-[#F0F6FC] font-mono text-sm border border-[#30363D]">{step.num}</span>
                        <h3 className="font-mono font-semibold text-lg text-[#F0F6FC]">{step.title}</h3>
                      </div>
                      <p className="text-sm text-[#8B949E]">{step.desc}</p>
                    </div>
                    <div className="bg-[#0D1117] p-5 flex-1 flex flex-col justify-center">
                      {i === 0 && (
                        <div className="space-y-2 font-mono text-xs">
                          <div className="text-[#8B949E]">$ repofuse scan --all</div>
                          <div className="text-[#06B6D4]">Scanning auth-api... [OK]</div>
                          <div className="text-[#06B6D4]">Scanning payment-svc... [OK]</div>
                          <div className="text-[#F59E0B]">Analyzing 43 endpoints...</div>
                        </div>
                      )}
                      {i === 1 && (
                        <div className="space-y-2">
                          <div className="bg-[#1C2333] border border-[#30363D] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold font-mono text-[#06B6D4]">SaaS Billing Core</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] font-mono">94% match</span>
                            </div>
                            <div className="space-y-1">
                              <div className="h-1.5 bg-[#30363D] rounded-full w-3/4" style={{ backgroundColor: '#F59E0B80' }}></div>
                              <div className="h-1.5 bg-[#30363D] rounded-full w-1/2"></div>
                            </div>
                          </div>
                          <div className="bg-[#1C2333] border border-[#30363D] rounded-lg p-3 opacity-60">
                            <span className="text-xs font-mono text-[#8B949E]">CLI Config Manager · 72% match</span>
                          </div>
                        </div>
                      )}
                      {i === 2 && (
                        <div className="border border-[#30363D] rounded-lg bg-[#161B22] p-3 text-xs font-mono">
                          <div className="flex items-center gap-2 mb-2 border-b border-[#30363D] pb-2">
                            <GitPullRequest className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#F0F6FC]">PR #142 opened</span>
                          </div>
                          <div className="text-[#8B949E] mb-1">feat: scaffold for Billing Core</div>
                          <div className="text-[#10B981]">+24 files, 1,420 lines added</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Feature Grid ── */}
          <section id="features" className="py-24">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] mb-5 text-xs font-mono text-[#8B949E]">
                  CAPABILITIES
                </div>
                <h2 className="font-mono text-4xl md:text-5xl font-bold text-[#F0F6FC] mb-3">
                  Everything your repos<br />
                  <span className="text-[#06B6D4]">have been waiting for</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: '⚡', title: 'AI Repo Scanner', desc: 'Deep analysis of your codebase structure and patterns in seconds.' },
                  { icon: '💡', title: 'Idea Surfacer', desc: 'Turns existing code into ranked, buildable project ideas.' },
                  { icon: '🔗', title: 'Multi-Repo Fusion', desc: 'Cross-reference patterns across all your repos simultaneously.' },
                  { icon: '📊', title: 'Health Dashboard', desc: 'Live metrics on code quality and technical debt.' },
                  { icon: '📋', title: 'Launch Briefs', desc: 'AI-generated product briefs for every detected idea.' },
                  { icon: '🔒', title: 'Private by Default', desc: 'Your code is never stored. Read-only access, always.' },
                ].map((f, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#161B22] border border-[#30363D] hover:border-[#06B6D4]/50 transition-all group cursor-pointer">
                    <div className="text-2xl mb-3">{f.icon}</div>
                    <h3 className="font-mono font-bold text-[#F0F6FC] mb-1.5">{f.title}</h3>
                    <p className="text-sm text-[#8B949E]">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Idea Pipeline Board ── */}
          <section className="py-24 border-t border-[#30363D]">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5">
                  <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center mb-6">
                    <Workflow className="w-6 h-6 text-[#06B6D4]" />
                  </div>
                  <h2 className="font-mono text-3xl font-bold text-[#F0F6FC] mb-4">Idea Pipeline Board</h2>
                  <p className="text-lg text-[#8B949E] mb-6">
                    Every idea RepoFuse surfaces lands in a visual Kanban pipeline. Track ideas from Discovered → Validated → Building → Shipped. No idea gets lost.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Estimated effort metrics (S / M / L)',
                      'AI confidence scoring per idea',
                      'Tech stack requirements auto-detected',
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-[#8B949E]">
                        <CheckCircle2 className="w-5 h-5 text-[#06B6D4] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <a href="/api/auth/github/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#06B6D4] hover:text-[#22d3ee] transition-colors">
                    See your pipeline <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="lg:col-span-7 bg-[#161B22] rounded-2xl p-6 border border-[#30363D] shadow-2xl overflow-x-auto">
                  <div className="flex gap-4 min-w-[600px]">
                    {[
                      { col: 'Discovered', accent: '#8B949E', count: 3, ideas: [
                        { name: 'Event Tracking SDK', tag: 'Analytics', match: '94%', matchColor: '#10B981' },
                        { name: 'CLI Config Manager', tag: 'DevTools', match: '72%', matchColor: '#F59E0B' },
                      ]},
                      { col: 'Validated', accent: '#F59E0B', count: 1, ideas: [
                        { name: 'SaaS Billing Core', tag: 'Fintech', match: '98%', matchColor: '#10B981' },
                      ]},
                      { col: 'Building', accent: '#06B6D4', count: 1, ideas: [
                        { name: 'Stripe Clone', tag: 'Fintech', match: '91%', matchColor: '#10B981' },
                      ]},
                      { col: 'Shipped', accent: '#10B981', count: 1, ideas: [
                        { name: 'Audit Tool', tag: 'DevTools', match: '85%', matchColor: '#F59E0B' },
                      ]},
                    ].map((col) => (
                      <div key={col.col} className="flex-1 bg-[#0D1117] rounded-xl p-4 border border-[#30363D] min-w-[140px]">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-mono font-semibold text-sm text-[#F0F6FC]">{col.col}</h5>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2333] text-[#8B949E] font-mono">{col.count}</span>
                        </div>
                        <div className="space-y-2">
                          {col.ideas.map((idea) => (
                            <div key={idea.name} className="bg-[#161B22] p-3 rounded-lg border border-[#30363D] hover:border-[#06B6D4]/40 transition-colors cursor-grab">
                              <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: col.accent + '20', color: col.accent }}>{idea.tag}</span>
                                <span className="text-[10px] font-mono" style={{ color: idea.matchColor }}>{idea.match}</span>
                              </div>
                              <p className="text-xs font-medium text-[#F0F6FC]">{idea.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Team Workspace ── */}
          <section className="py-24 border-t border-[#30363D]">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-7 bg-[#161B22] rounded-2xl p-6 border border-[#30363D] shadow-2xl order-2 lg:order-1">
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-4 mb-5">
                    <div>
                      <h3 className="font-mono text-base font-semibold text-[#F0F6FC]">SaaS Billing Core</h3>
                      <p className="text-xs text-[#8B949E] mt-0.5">Extracted from <span className="text-[#06B6D4]">payments-service</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8B949E]">4 reviewing</span>
                      <div className="flex -space-x-2">
                        {[['JD','#1C2333'],['AK','#06B6D4'],['MR','#F59E0B']].map(([initials, bg]) => (
                          <div key={initials} className="w-8 h-8 rounded-full border-2 border-[#161B22] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: bg as string }}>{initials}</div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-[#161B22] bg-[#30363D] flex items-center justify-center text-[10px] text-[#8B949E]">+1</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-[#0D1117] p-4 rounded-xl border border-[#30363D]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-[#06B6D4]">AK</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[#F0F6FC]">Alex K.</span>
                            <span className="text-xs text-[#8B949E]">2h ago</span>
                          </div>
                          <p className="text-sm text-[#8B949E]"><span className="text-[#06B6D4]">@team</span> This is basically what Vercel charges $200/mo for. We already have the webhook handling robust enough.</p>
                          <button className="flex items-center gap-1.5 mt-3 text-xs text-[#8B949E] hover:text-[#06B6D4] transition-colors">
                            <span>👍</span> 5
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0D1117] p-4 rounded-xl border border-[#30363D] ml-11">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#F0F6FC] bg-[#1C2333]">JD</div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[#F0F6FC]">John D.</span>
                            <span className="text-xs text-[#8B949E]">1h ago</span>
                          </div>
                          <p className="text-sm text-[#8B949E]">Agreed. Reddit r/webdev has 140 posts asking for this. Let&apos;s move it to Validated.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                  <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-6">
                    <MessageSquare className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <h2 className="font-mono text-3xl font-bold text-[#F0F6FC] mb-4">Team Workspace</h2>
                  <p className="text-lg text-[#8B949E] mb-6">
                    Invite your team to review AI-generated blueprints, debate technical approaches, and upvote the winners — all without leaving RepoFuse.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Comment threads on every blueprint',
                      'Upvote to surface the best ideas',
                      "Context that doesn't get lost in Slack",
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-[#8B949E]">
                        <CheckCircle2 className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <a href="/api/auth/github/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F59E0B] hover:text-[#fbbf24] transition-colors">
                    Start collaborating <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── One-click Scaffold ── */}
          <section className="py-24 border-t border-[#30363D] bg-[#111827]">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-6">
                    <Layers className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h2 className="font-mono text-3xl font-bold text-[#F0F6FC] mb-4">One-Click Scaffold</h2>
                  <p className="text-lg text-[#8B949E] mb-6">
                    Once an idea is validated, click &quot;Build.&quot; RepoFuse extracts the relevant code from your repo, generates a fresh boilerplate, and opens a GitHub PR — ready for review.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Auto-generated files, folder structure, CI config',
                      'Pull request opened directly in your org',
                      'All checks green before you touch a line',
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-[#8B949E]">
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <a href="/api/auth/github/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#10B981] hover:text-[#34d399] transition-colors">
                    Try Build This Idea <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="lg:col-span-7 relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#10B981]/10 to-transparent blur-2xl rounded-[3rem] -z-10" />
                  <div className="bg-[#161B22] rounded-2xl overflow-hidden border border-[#30363D] shadow-2xl">
                    <div className="p-4 border-b border-[#30363D] flex items-start gap-4 bg-[#0D1117]/50">
                      <div className="mt-0.5 bg-[#238636] p-1.5 rounded">
                        <GitPullRequest className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-mono text-base font-semibold text-[#F0F6FC]">
                          Initial Scaffold: SaaS Billing Core <span className="text-[#8B949E] font-normal">#142</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-sm">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#238636]/15 text-[#3FB950] border border-[#238636]/30 font-mono">Open</span>
                          <span className="text-xs text-[#8B949E]">repofuse-bot → <code className="bg-[#1C2333] px-1 rounded text-[#06B6D4]">main</code></span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-[#0D1117]">
                      <div className="border border-[#30363D] rounded-lg p-4 mb-4 bg-[#161B22]">
                        <p className="text-sm text-[#8B949E] mb-3">Scaffold for <strong className="text-[#F0F6FC]">SaaS Billing Core</strong>, based on patterns found in <code className="text-[#06B6D4]">payments-service</code>.</p>
                        <ul className="text-sm text-[#8B949E] list-disc list-inside space-y-1 ml-2">
                          <li>Extracted Go struct definitions for Webhook payloads</li>
                          <li>Dockerfile + Postgres schema initialized</li>
                          <li>Base README.md with setup instructions</li>
                        </ul>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#3FB950] font-mono">+1,420</span>
                          <span className="text-[#F85149] font-mono">-0</span>
                          <span className="text-[#8B949E]">24 files changed</span>
                        </div>
                        <button className="bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          Merge pull request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Weekly Digest ── */}
          <section className="py-24 border-t border-[#30363D]">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mb-6">
                  <Mail className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <h2 className="font-mono text-3xl font-bold text-[#F0F6FC] mb-4">Weekly Digest</h2>
                <p className="text-lg text-[#8B949E]">
                  Every Monday, get a briefing on new patterns, heating ideas, and what&apos;s scaffold-ready across your repos — delivered before your first meeting.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="bg-[#161B22] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#30363D] hover:border-[#8B5CF6]/50 transition-all duration-500 p-6 transform rotate-1 hover:rotate-0">
                  <div className="flex items-center gap-2 border-b border-[#30363D] pb-4 mb-5">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-[#06B6D4] to-[#0369A1] flex items-center justify-center text-white text-[10px] font-bold">RF</div>
                    <span className="font-mono text-sm font-semibold text-[#F0F6FC]">RepoFuse Digest</span>
                    <span className="ml-auto text-xs text-[#8B949E]">Mon 9:04 AM</span>
                  </div>
                  <h4 className="font-mono font-semibold text-[#F0F6FC] mb-4">This week across your 14 repos</h4>
                  <div className="space-y-3">
                    {[
                      { Icon: Activity, color: '#06B6D4', title: '3 new patterns detected', sub: 'in payment-service' },
                      { Icon: Activity, color: '#F59E0B', title: '2 repos went stale', sub: 'review archival recommendations' },
                      { Icon: Activity, color: '#10B981', title: 'Top idea gained 5 votes', sub: 'SaaS Billing Core is trending' },
                    ].map(({ Icon, color, title, sub }, i) => (
                      <div key={i} className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                          <div>
                            <p className="text-sm font-medium text-[#F0F6FC]">{title}</p>
                            <p className="text-xs text-[#8B949E] mt-0.5">{sub}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a href="/api/auth/github/login" className="block w-full text-center py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-sm mt-5 transition-colors">
                    View Full Report →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── Bottom CTA ── */}
          <section className="py-24 border-t border-[#30363D] bg-[#111827]">
            <div className="container mx-auto px-4 max-w-xl text-center">
              <h2 className="font-mono text-4xl md:text-5xl font-bold text-[#F0F6FC] mb-4">
                Your next product is<br />
                <span className="text-[#06B6D4]">already in your repos</span>
              </h2>
              <p className="text-lg text-[#8B949E] mb-8">
                Join 2,400+ developers who&apos;ve stopped guessing and started shipping.
              </p>
              <a
                href="/api/auth/github/login"
                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto sm:min-w-64 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5"
              >
                <Github className="h-5 w-5" />
                Start Scanning Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-[#8B949E] font-mono mt-5">
                no credit card · read-only access · cancel anytime
              </p>
            </div>
          </section>
        </main>

        {/* Featured On Section */}
        <section className="py-12 border-t border-[#30363D] bg-[#0D1117]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center gap-6">
              <p className="text-xs text-[#8B949E] uppercase tracking-widest font-mono">Featured On</p>
              <a 
                href="https://www.toolpilot.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Featured on ToolPilot"
              >
                <div className="bg-white px-6 py-3 rounded-lg flex items-center gap-2">
                  <span className="text-sm font-bold text-black">FEATURED ON</span>
                  <span className="text-sm font-bold" style={{ color: '#FF6B35' }}>TOOLPILOT</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#30363D] py-8">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B949E]">
            <span>© 2025 RepoFuse. Built by developers, for developers.</span>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="hover:text-[#F0F6FC] transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-[#F0F6FC] transition-colors">Dashboard</Link>
            </div>
          </div>
        </footer>
      </div>
    )
  }
  
