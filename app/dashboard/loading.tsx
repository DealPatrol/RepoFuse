export default function DashboardLoading() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-500/60 border-t-transparent" />
      <p className="mt-3 text-xs font-mono uppercase tracking-widest text-cyan-400/70">Loading dashboard…</p>
    </div>
  )
}
