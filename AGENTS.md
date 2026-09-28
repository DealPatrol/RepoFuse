# AGENTS.md

## Cursor Cloud specific instructions

### Overview

RepoFuse is a Next.js 16 app (App Router) that connects to GitHub repos, scans file trees, and uses Anthropic Claude to generate "App Blueprints" showing what new apps can be built from existing code.

### Tech stack

- **Runtime**: Node.js 20+, pnpm
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon PostgreSQL (via `@neondatabase/serverless` HTTP driver)
- **AI**: Vercel AI Gateway + AI SDK (`gateway('anthropic/...')` / plain provider model strings). On Vercel this authenticates with `VERCEL_OIDC_TOKEN` (or `AI_GATEWAY_API_KEY`). Direct Anthropic via `ANTHROPIC_API_KEY` is only the local fallback when neither gateway credential is set. Analysis, scaffold, build, chat, and hosted MCP all use this path.
- **Auth**: GitHub OAuth cookies (default) or optional Clerk (`@clerk/nextjs`) with GitHub social login
- **UI**: React 19, Shadcn/Radix, Tailwind CSS v4

### Required environment variables

See `.env.example` for the full list. Critical ones:
- `DATABASE_URL` — Neon PostgreSQL connection string (HTTPS-based, not standard pg protocol)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth app
- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` (from `vercel env pull`) — preferred for AI on Vercel; the app uses the AI SDK gateway provider and does not require a funded Anthropic account. `ANTHROPIC_API_KEY` is a local-dev fallback when neither gateway credential is set (see `.env.example`)
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
- Auth: legacy GitHub OAuth cookies (`github_user_id` + `github_access_token`), or Clerk when configured. Root `proxy.ts` (Next.js 16's `proxy` convention, not `src/middleware.ts`) runs `clerkMiddleware()` with Clerk's recommended matcher so `auth()` works on pages and API routes. It calls `auth.protect()` for `/dashboard/*` only. Without Clerk keys, the same file checks the legacy GitHub cookies on dashboard routes. `/api/mcp` and `/.well-known/oauth-*` keep their own handlers.
- Do **not** add both `middleware.ts` and `proxy.ts` — Next.js 16 build fails if both exist. This repo uses `proxy.ts`.
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
