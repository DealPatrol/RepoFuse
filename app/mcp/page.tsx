import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'MCP Server',
  description: 'Connect RepoFuse to Claude, ChatGPT, Cursor, or Claude Code over MCP.',
}

const endpoint = 'https://repofuse.com/api/mcp'

export default function McpPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">RepoFuse MCP</p>
          <h1 className="text-4xl font-bold">Find new apps hidden in your GitHub code</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Connect an AI assistant to RepoFuse to list your repositories, analyze reusable code,
            inspect saved blueprint gaps, generate scaffolds, and create a repository after you confirm it.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-2xl font-semibold">Hosted endpoint</h2>
          <code className="block overflow-x-auto rounded bg-muted p-4">{endpoint}</code>
          <p className="mt-3 text-sm text-muted-foreground">
            The endpoint uses Streamable HTTP and OAuth. Your assistant opens RepoFuse sign-in and asks
            you to authorize access. RepoFuse resolves your GitHub token server-side; never paste a token
            into an assistant.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Connect an assistant</h2>

          <ConnectStep title="Claude">
            Open Settings → Connectors, choose Add custom connector, and enter <code>{endpoint}</code>.
            Complete the RepoFuse OAuth prompt.
          </ConnectStep>

          <ConnectStep title="ChatGPT">
            In ChatGPT Settings, enable Developer mode, create a connector for <code>{endpoint}</code>,
            and complete OAuth. Availability depends on your ChatGPT workspace plan and admin settings.
          </ConnectStep>

          <ConnectStep title="Cursor">
            Add an MCP server named <code>repofuse</code> with URL <code>{endpoint}</code> from Customize,
            or install the RepoFuse plugin after it is listed in the Cursor Marketplace.
          </ConnectStep>

          <ConnectStep title="Claude Code">
            Run <code>claude mcp add --transport http repofuse {endpoint}</code>, then use{' '}
            <code>/mcp</code> in Claude Code to authenticate.
          </ConnectStep>
        </section>

        <section className="space-y-3 rounded-xl border border-border p-6">
          <h2 className="text-2xl font-semibold">Permissions and billing</h2>
          <p className="text-muted-foreground">
            Repository listing and gap inspection are read-only. Analysis follows your plan’s monthly
            limits. Scaffold generation requires Pro and uses RepoFuse credits. Creating a repository
            requires Pro and only runs after an explicit tool call; it does not delete or overwrite an
            existing repository.
          </p>
        </section>

        <footer className="flex flex-wrap gap-5 text-sm">
          <Link className="underline hover:text-cyan-400" href="/privacy">Privacy Policy</Link>
          <Link className="underline hover:text-cyan-400" href="/terms">Terms</Link>
          <Link className="underline hover:text-cyan-400" href="/legal/support">Support</Link>
        </footer>
      </div>
    </main>
  )
}

function ConnectStep({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <article className="rounded-lg border border-border p-5">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </article>
  )
}
