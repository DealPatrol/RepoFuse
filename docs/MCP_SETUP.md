# RepoFuse MCP Setup

RepoFuse supports two MCP modes:

1. **Local stdio MCP server** for Claude Desktop, Cursor, or any MCP client that can launch a local process
2. **OAuth-protected Streamable HTTP endpoint** at `https://repofuse.com/api/mcp` for outside AI
   assistants and signed-in website sessions

## 1) Local stdio setup

### Required env
- `GITHUB_TOKEN`
- One of `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`, or `ANTHROPIC_API_KEY` (gateway credentials win)

Optional:
- `REPOFUSE_MODEL` (gateway id such as `anthropic/claude-opus-4.6`, or a direct id such as `claude-opus-4-6`)
- `REPOFUSE_MAX_FILES_PER_REPO`
- `REPOFUSE_MAX_BLUEPRINTS`

### Start the server

```bash
pnpm mcp:repofuse
```

The publishable local package metadata and package-scoped MIT license live under `mcp/`. The root
RepoFuse SaaS package remains private. Validate a future package without publishing it with:

```bash
npm pack --dry-run --prefix mcp
```

### Structural smoke test

This checks that the MCP server boots and registers the expected tools.
It does **not** call GitHub or Anthropic unless you pass `--live`.

```bash
pnpm mcp:test
```

### Live smoke test

This requires a real `GITHUB_TOKEN` plus either gateway credentials (`AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`) or `ANTHROPIC_API_KEY`.

```bash
pnpm mcp:test:live
```

### Claude Code

This repo can be discovered directly by Claude Code through a project-level `.mcp.json` file at the repo root.

If you want a local wrapper that loads `.env.local` automatically before starting the server, use `scripts/run-repofuse-mcp.sh` as the command target.

### Claude Desktop

Use `examples/claude-desktop.mcp.json` as your starting template.

### Cursor

Use `examples/cursor.mcp.json` as your starting template.

You can keep it as a repo-level config or copy it into your global Cursor MCP config, depending on how you want the server discovered.

## 2) Hosted Streamable HTTP endpoint

Production URL:

```text
https://repofuse.com/api/mcp
```

Behavior:
- supports Clerk OAuth access tokens and existing authenticated RepoFuse web sessions
- resolves the authorized user's GitHub token server-side
- allows `create_repo_from_blueprint` only when billing permits Pro features
- enforces free-plan analysis limits, 100-credit paid analyses, Pro scaffold access, 150-credit
  scaffolds, retry idempotency, and per-user MCP rate limits
- shares the same MCP tool definitions as the stdio server
- allows up to 300 seconds for long repository analyses

OAuth discovery:

- `/.well-known/oauth-protected-resource` — RFC 9728 metadata for `/api/mcp`
- `/.well-known/oauth-authorization-server` — compatibility metadata proxied from Clerk
- unauthenticated calls return `401` with a `WWW-Authenticate` challenge whose
  `resource_metadata` points to the protected-resource document

Client setup instructions are published at `https://repofuse.com/mcp`.

## 3) Vercel + GitHub deployment wiring

### Vercel
Set the app environment variables in Vercel and redeploy after changes.

Key values for MCP-capable behavior:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` (preferred). `ANTHROPIC_API_KEY` is used only when neither is set
- optional: `REPOFUSE_MODEL`

Apply `migrations/010_mcp_rate_limits.sql` and
`migrations/011_mcp_analysis_idempotency.sql` before enabling the hosted endpoint.

In Clerk OAuth Applications → Settings → Client onboarding:

- leave **Publish CIMD support** off. Production clients use dynamic client registration, and RepoFuse must not advertise `client_id_metadata_document_supported: true`.
- enable **Publish DCR support**
- require PKCE with `S256`
- configure default scopes: `openid profile email`

`/.well-known/oauth-authorization-server` mirrors Clerk's live authorization-server metadata. When that document would advertise Client ID Metadata Documents, RepoFuse omits `client_id_metadata_document_supported` so clients keep using the `registration_endpoint`.

See `docs/LISTING.md` for deployment, reviewer-account, and directory-owner steps.

### GitHub Actions
This repo already includes GitHub Actions workflows in `.github/workflows/`.

`ci.yml` now runs:
- install
- `pnpm mcp:test`
- typecheck
- lint

`deploy.yml` uses Vercel CLI with:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Exposed tools
- `list_github_repositories`
- `analyze_repositories`
- `generate_scaffold`
- `create_repo_from_blueprint`
- hosted only: `get_blueprint_gaps`
