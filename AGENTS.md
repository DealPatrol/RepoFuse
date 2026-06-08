# AGENTS.md

## Cursor Cloud specific instructions

### Overview

RepoFuse is a Next.js 16 app (App Router) that connects to GitHub repos, scans file trees, and uses Anthropic Claude to generate "App Blueprints" showing what new apps can be built from existing code.

### Tech stack

- **Runtime**: Node.js 20+, pnpm
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon PostgreSQL (via `@neondatabase/serverless` HTTP driver)
- **AI**: Vercel AI Gateway + AI SDK v6 (primary for chat/scaffold/build), Anthropic Messages API via gateway for analysis tool-calling (`/api/analyses/[id]/run`), OpenAI (legacy `/api/analyze`)
- **Auth**: GitHub OAuth cookies (default) or optional Clerk (`@clerk/nextjs`) with GitHub social login
- **UI**: React 19, Shadcn/Radix, Tailwind CSS v4

### Required environment variables

See `.env.example` for the full list. Critical ones:
- `DATABASE_URL` — Neon PostgreSQL connection string (HTTPS-based, not standard pg protocol)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth app
- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` (from `vercel env pull`) — preferred for AI on Vercel; or a direct Anthropic API key env var as fallback (see `.env.example`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — optional; enables `/sign-in` with Clerk GitHub OAuth
- `NEXT_PUBLIC_APP_URL` — Set to local dev URL (port 3000) for local development

### Running the app

```bash
pnpm dev        # starts Next.js dev server on port 3000
pnpm lint       # ESLint (pre-existing: 45 errors, 56 warnings — all from existing code)
npx tsc --noEmit  # TypeScript type check
pnpm build      # production build (requires valid DATABASE_URL at build time)
```

### Key architecture notes

- The Neon serverless driver (`@neondatabase/serverless`) uses HTTPS to communicate with Neon's proxy. It does **not** support standard PostgreSQL connections (no local pg via `psql`). You must have a real Neon `DATABASE_URL`.
- Blueprint creation happens entirely in `POST /api/analyses/[id]/run` via SSE streaming. The `/api/analyses/[id]/analyze` endpoint is a legacy route that does NOT write blueprints to the database.
- Auth: legacy GitHub OAuth cookies (`github_user_id` + `github_access_token`), or Clerk when configured. `middleware.ts` protects `/dashboard/*` (Clerk `auth.protect()` or cookie check).
- Do **not** add both `middleware.ts` and `proxy.ts` — Next.js 16 build fails if both exist.
- To bypass auth for local testing, set cookies in the browser: `document.cookie = "github_user_id=12345; path=/"; document.cookie = "github_access_token=TOKEN; path=/";`

### Testing notes

- No automated test suite exists in this repo.
- Manual testing flow: Sign in via GitHub OAuth → Add repositories → Create analysis → Run analysis → View blueprints.
- The `pnpm lint` command has pre-existing errors (45 errors, 56 warnings) that are not caused by agent changes.

### Dev server startup notes

- The dev server starts successfully even with a placeholder `DATABASE_URL`. Database connections are lazy (on-demand via API routes), so the server itself boots fine.
- `pnpm install` may show a warning about ignored build scripts for `sharp` and `unrs-resolver`. These do not affect development.
- The GitHub OAuth env vars in this repo use `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (not `GITHUB_ID` / `GITHUB_SECRET`). If secrets are injected under different names, map them in `.env.local`.
- `NEXT_PUBLIC_APP_URL` must be set to the local dev server URL (default port 3000) for local OAuth callback redirects to work.

### Cloud agent secrets and local bootstrap

- Copy `.env.example` to `.env.local` and fill in secrets — `.env.local` is gitignored and is **not** injected automatically by the VM; request `DATABASE_URL`, `GITHUB_CLIENT_SECRET`, and an AI credential (`AI_GATEWAY_API_KEY` or `ANTHROPIC_API_KEY`) via Cursor secrets if missing.
- One-time schema init: `curl http://localhost:3000/api/setup/init-db` (idempotent; safe to re-run).
- `pnpm mcp:test` runs a structural MCP smoke test (no live GitHub/AI credentials required).
- Cookie auth bypass gets you past `/dashboard/*` middleware, but API routes still validate the token against GitHub or a matching `user_auth` row. Analysis detail pages return 404 when the analysis is not owned by the signed-in user.
- Running an analysis (`POST /api/analyses/[id]/run`) requires a configured AI provider; without it the UI shows "AI is not configured".
