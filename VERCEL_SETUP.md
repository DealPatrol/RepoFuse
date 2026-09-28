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
| `AI_GATEWAY_API_KEY` | Optional | Static AI Gateway key. Not required when OIDC is enabled |
| `ANTHROPIC_API_KEY` | Development only | Direct Anthropic fallback when AI Gateway credentials are absent |
| `STRIPE_SECRET_KEY` | Production | Live secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Production | Signing secret (`whsec_...`) from the **live** webhook endpoint |
| `STRIPE_PRO_PRICE_ID` | Production | Pro plan Price ID |
| `STRIPE_SCALE_PRICE_ID` | Production | Scale plan Price ID (optional) |

### Stripe webhooks (live mode)

1. [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) (ensure **Live** mode toggle is on).
2. Endpoint URL: `https://repofuse.com/api/stripe/webhook`  
   (`https://RepoFuse.com/...` works too; hostnames are case-insensitive.)
3. Subscribe to at least: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
4. Copy **Signing secret** → Vercel env `STRIPE_WEBHOOK_SECRET` for **Production** only.
5. Redeploy after changing `STRIPE_WEBHOOK_SECRET`.

**If Stripe emails about failed deliveries:** open the webhook → **Event deliveries** and check the HTTP status. `400 Invalid signature` means `STRIPE_WEBHOOK_SECRET` does not match that endpoint’s signing secret. `503 Webhook not configured` means the env var is missing on Vercel.

### AI Gateway (required for production LLM calls)

RepoFuse routes analysis, blueprint/scaffold generation, and hosted MCP LLM calls through the Vercel AI Gateway. A funded Anthropic account is not required.

1. In the Vercel project `repofuse`, open **Settings → AI Gateway** and enable it. Usage is billed on the Vercel account.
2. Keep **Settings → Security → Secure Backend Access with OpenID Connect** enabled so Production and Preview functions receive `VERCEL_OIDC_TOKEN`. Redeploy after turning it on.
3. Optional: create an AI Gateway API key and set `AI_GATEWAY_API_KEY` if you do not want to use OIDC.
4. Do not add the Anthropic API key as a gateway bring-your-own-key credential. The app ignores `ANTHROPIC_API_KEY` whenever `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is present.

Optional model override: `ANTHROPIC_MODEL` or `REPOFUSE_MODEL` (`anthropic/claude-opus-4.6` or `claude-opus-4-6`).

| Variable | Environment | Description |
|----------|-------------|-------------|
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
| `AI_GATEWAY_API_KEY` | Optional static AI Gateway key. OIDC covers Vercel deployments |
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

**AI analysis fails** → Enable AI Gateway on the Vercel project and confirm `VERCEL_OIDC_TOKEN` is present at runtime (OIDC), or set `AI_GATEWAY_API_KEY`

**Scaffold generation fails** → Same AI Gateway setup. `ANTHROPIC_API_KEY` is only the local fallback when gateway credentials are missing

**GitHub Actions deploy fails** → Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set as GitHub secrets
