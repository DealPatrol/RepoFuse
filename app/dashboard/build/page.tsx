import Link from 'next/link'
import { ArrowRight, Rocket, Sparkles, Lock, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllBlueprints, type AppBlueprint } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { resolveProAccess } from '@/lib/pro-access'
import { BuildLauncher } from '@/components/build-launcher'

export const dynamic = 'force-dynamic'

export default async function BuildPage() {
  const user = await getCurrentUser().catch(() => null)

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
          <Rocket className="h-8 w-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-black text-white">Click here and I'll build it</h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Sign in to turn the apps hidden in your code into real, deployed repositories &mdash;
          generated and pushed for you automatically.
        </p>
        <Button asChild size="lg">
          <Link href="/api/auth/login">Sign in to start building</Link>
        </Button>
      </div>
    )
  }

  const { canAccessPro } = await resolveProAccess(user)

  let blueprints: AppBlueprint[] = []
  try {
    blueprints = await getAllBlueprints(user.id)
  } catch {
    blueprints = []
  }

  // Most "launch-ready" first: highest reuse, then fewest missing files.
  const launchable = [...blueprints].sort((a, b) => {
    const ra = Number(a.reuse_percentage) || 0
    const rb = Number(b.reuse_percentage) || 0
    if (rb !== ra) return rb - ra
    return (a.missing_files?.length || 0) - (b.missing_files?.length || 0)
  })

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-black to-violet-950/30 px-8 py-12 sm:px-12">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-cyan-300">
            <Sparkles className="h-3 w-3" /> The flagship feature
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.05]">
            Click here and<br />I&apos;ll build it.
          </h1>
          <p className="text-lg text-zinc-300/90 leading-relaxed">
            Other tools tell you what you already have. RepoFuse tells you what you can launch next week &mdash;
            then builds it for you. Pick an app below and Claude will generate every missing file
            and push a complete, ready-to-run repository to your account.
          </p>
        </div>
      </div>

      {!canAccessPro && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-orange-950/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Building apps is a Pro feature</p>
              <p className="text-sm text-zinc-400">Upgrade to let RepoFuse generate and push complete repositories for you.</p>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold flex-shrink-0">
            <Link href="/pricing">
              <Lock className="h-4 w-4 mr-2" /> Upgrade to Pro
            </Link>
          </Button>
        </div>
      )}

      {launchable.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-5">
            <Rocket className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">No launchable apps yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            Run an analysis on your repositories and RepoFuse will discover apps hidden in your
            code &mdash; ready for you to build with one click.
          </p>
          <Button asChild>
            <Link href="/dashboard/analyses">
              <Sparkles className="h-4 w-4 mr-2" /> Run an Analysis <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {launchable.length} app{launchable.length !== 1 ? 's' : ''} ready to launch
            </h2>
            <Link href="/dashboard/analyses" className="text-sm font-mono text-cyan-400/70 hover:text-cyan-300 flex items-center gap-1">
              Discover more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <BuildLauncher blueprints={launchable} canBuild={canAccessPro} />
        </div>
      )}
    </div>
  )
}
