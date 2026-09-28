# @repofuse/mcp

Local stdio MCP server for RepoFuse.

## Run without publishing

From the RepoFuse repository root:

```bash
GITHUB_TOKEN=ghp_... AI_GATEWAY_API_KEY=... pnpm mcp:repofuse
# or, without gateway credentials:
GITHUB_TOKEN=ghp_... ANTHROPIC_API_KEY=sk-ant-... pnpm mcp:repofuse
```

Required environment variables:

- `GITHUB_TOKEN`
- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`, otherwise `ANTHROPIC_API_KEY`

Optional environment variables:

- `REPOFUSE_MODEL`
- `REPOFUSE_MAX_FILES_PER_REPO`
- `REPOFUSE_MAX_BLUEPRINTS`

The hosted OAuth server is available at `https://repofuse.com/api/mcp`.
