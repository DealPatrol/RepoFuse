export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/60 border-t-transparent" />
        <p className="mt-4 text-sm font-mono uppercase tracking-widest text-cyan-400/70">Loading…</p>
      </div>
    </div>
  )
}
