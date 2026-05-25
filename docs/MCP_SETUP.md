# RepoFuse MCP Setup

RepoFuse supports two MCP modes:

1. **Local stdio MCP server** for Claude Desktop, Cursor, or any MCP client that can launch a local process
2. **Authenticated HTTP MCP endpoint** at `/api/mcp` for users already signed into the web app

## 1) Local stdio setup

### Required env
- `GITHUB_TOKEN`
- `ANTHROPIC_API_KEY`

Optional:
- `REPOFUSE_MODEL`
- `REPOFUSE_MAX_FILES_PER_REPO`
- `REPOFUSE_MAX_BLUEPRINTS`

### Start the server

```bash
pnpm mcp:repofuse
```

### Structural smoke test

This checks that the MCP server boots and registers the expected tools.
It does **not** call GitHub or Anthropic unless you pass `--live`.

```bash
pnpm mcp:test
```

### Live smoke test

This requires real `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` values in your environment.

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

## 2) HTTP MCP endpoint inside the app

Route:

```text
/api/mcp
```

Behavior:
- requires an authenticated RepoFuse web session
- uses the signed-in user's GitHub access token
- allows `create_repo_from_blueprint` only when billing permits Pro features
- shares the same MCP tool definitions as the stdio server

## 3) Vercel + GitHub deployment wiring

### Vercel
Set the app environment variables in Vercel and redeploy after changes.

Key values for MCP-capable behavior:
- `DATABASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- optional: `ANTHROPIC_MODEL`

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
