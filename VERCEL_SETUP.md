# RepoFuse - Vercel Deployment Setup

## Option A: Vercel Native Integration (Simplest)

Connect your GitHub repo directly in the Vercel dashboard. No GitHub Actions needed.

### 1. Set Environment Variables on Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add all of these:

| Variable | Environment | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Production, Preview, Development | Neon PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | Production, Preview, Development | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Production, Preview, Development | GitHub OAuth App client secret |
| `NEXT_PUBLIC_APP_URL` | Production | Your production URL (e.g. `https://repofuse.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Preview | Leave blank — Vercel sets this automatically for previews |
| `OPENAI_API_KEY` | Production, Preview | OpenAI API key for AI analysis |
| `ANTHROPIC_API_KEY` | Production, Preview | Anthropic API key for scaffold generation and MCP-backed scaffold generation |
| `ANTHROPIC_MODEL` | Optional | Override the Claude model used for scaffold generation |
| `STRIPE_SECRET_KEY` | Production, Preview | Stripe secret key for checkout + billing portal |
| `STRIPE_PRO_PRICE_ID` | Production, Preview | Stripe price ID for the Pro subscription |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signing secret |

RepoFuse's authenticated MCP endpoint lives at `/api/mcp` and uses the signed-in user's GitHub access token, so no separate `GITHUB_TOKEN` secret is needed on Vercel for that web-app route.

---

## Option B: GitHub Actions Deployment

If you prefer CI-driven deploys, the `.github/workflows/deploy.yml` workflow handles this.

### 1. Get your Vercel IDs

```bash
npx vercel link        # links project and creates .vercel/project.json
cat .vercel/project.json
# → { "orgId": "...", "projectId": "..." }
```

### 2. Set GitHub Repository Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Where to find it |
|--------|-----------------|
| `VERCEL_TOKEN` | vercel.com/account/tokens → Create token |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` field |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` field |

### 3. Set app environment variables in Vercel dashboard

The workflow pulls env vars from Vercel automatically via `vercel pull`. Set these in Vercel → **Settings** → **Environment Variables**:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_APP_URL` | Your production URL |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `ANTHROPIC_API_KEY` | Anthropic API key for scaffold generation |
| `ANTHROPIC_MODEL` | Optional Claude model override |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PRO_PRICE_ID` | Stripe Pro price ID |

---

## Update GitHub OAuth App

Once deployed, update your GitHub OAuth callback URL:

1. Go to https://github.com/settings/developers
2. Open your OAuth App
3. Add or update the **Authorization callback URL** to:
   `https://your-app.vercel.app/api/auth/github/callback`
4. Keep repo access read-only at the application level where possible

## Run Database Migration

Run the schema SQL in your Neon console:

```sql
-- Paste contents of scripts/01-create-schema.sql
```

Or use psql:

```bash
psql $DATABASE_URL -f scripts/01-create-schema.sql
```

## Troubleshooting

**GitHub auth redirects fail** → Check `NEXT_PUBLIC_APP_URL` matches your Vercel URL exactly and your GitHub OAuth callback URL is updated

**Database errors** → Verify `DATABASE_URL` is correct and Neon project is active

**AI analysis fails** → Check `OPENAI_API_KEY` has sufficient credits

**Scaffold generation fails** → Check `ANTHROPIC_API_KEY` is set and valid

**GitHub Actions deploy fails** → Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set as GitHub secrets
