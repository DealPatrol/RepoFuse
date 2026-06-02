import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">RepoFuse · 404</p>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">This route does not exist.</h1>
        <p className="mt-3 text-sm text-gray-400">
          Either the page moved or never existed. Head back to the dashboard or homepage.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
