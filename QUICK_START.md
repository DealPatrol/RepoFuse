# RepoFuse Backend - Quick Start Guide

## Prerequisites

- Node.js 20+ and pnpm
- A [Neon](https://neon.tech) PostgreSQL database
- A GitHub App (for GitHub integration)
- An OpenAI API key (for AI analysis)

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```
DATABASE_URL=postgresql://...          # From Neon dashboard
GITHUB_CLIENT_ID=...                   # From GitHub App settings
GITHUB_CLIENT_SECRET=...               # From GitHub App settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...                  # From OpenAI dashboard
ANTHROPIC_API_KEY=sk-ant-...           # Optional, for scaffold generation
```

### 3. Create GitHub App

1. Go to https://github.com/settings/apps
2. Click **New GitHub App**
3. Set **Callback URL** to:
   `http://localhost:3000/api/auth/github/callback`
4. Set repository permissions to at least:
   - **Metadata: Read-only**
   - **Contents: Read-only**
5. Create the app, then copy the **Client ID** and generate a **Client Secret**
6. Install the app on the repositories you want to analyze

### 4. Set Up the Database

Run the migration in your Neon SQL Editor or with psql:

```bash
psql $DATABASE_URL -f scripts/01-create-schema.sql
```

This creates the following tables:
- `user_auth` — GitHub App user authorizations
- `repositories` — Tracked repos
- `repo_files` — Scanned files
- `analyses` — Analysis runs
- `analysis_repositories` — Junction table
- `app_blueprints` — Discovered app ideas

### 5. Start the Development Server

```bash
pnpm dev
```

Navigate to **http://localhost:3000** to see the app.

## Key Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/dashboard` | Overview stats |
| `/dashboard/repositories` | Add and manage repos |
| `/dashboard/analyses` | Create and run analyses |
| `/dashboard/analyses/[id]` | Analysis results + blueprints |

## How to Use

1. **Add Repositories** — Go to Repositories and either paste a GitHub URL or connect via GitHub to import installed repos

2. **Create Analysis** — Go to Analyses, click "New Analysis", select repositories, and give it a name

3. **Run the Analysis** — Click "Run Analysis" to start AI scanning. Watch real-time progress via the SSE stream

4. **Explore Blueprints** — See what apps you can build! Each blueprint shows:
   - What existing files you can reuse
   - What files you're missing
   - Estimated build effort
   - Technologies needed

5. **Export or Build** — Download the blueprint JSON or click "Create Repo" to scaffold the project on GitHub

## MCP

RepoFuse includes both a local stdio MCP server and an authenticated `/api/mcp` endpoint.

Useful commands:

```bash
pnpm mcp:repofuse
pnpm mcp:test
pnpm mcp:test:live
```

Templates:
- `examples/claude-desktop.mcp.json`
- `examples/cursor.mcp.json`

Full setup guide: `docs/MCP_SETUP.md`

## Troubleshooting

**Database connection error?**
- Check `DATABASE_URL` is correct
- Verify your Neon project is active

**GitHub App auth not working?**
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Verify the callback URL matches your GitHub App settings
- Verify the app is installed on the repositories you want to analyze
- For production, update `NEXT_PUBLIC_APP_URL`

**AI analysis failing?**
- Check `OPENAI_API_KEY` is set and has credits
- Look at server logs for the specific error
