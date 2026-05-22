# RepoFuse Backend

An AI-powered code intelligence platform that scans your GitHub repositories and discovers what applications you can build by combining existing files and components.

## Features

- **GitHub App Auth**: Connect your GitHub account with a single click using GitHub App user authorization
- **Repository Management**: Add and manage GitHub repositories for analysis
- **AI Code Analysis**: AI scans every file to identify purpose, exports, and reusability
- **App Blueprint Discovery**: Discover applications you can build from your existing code
- **Gap Analysis**: See exactly which files you're missing and generate them with AI
- **Export**: Download blueprint JSON for offline use or share with your team
- **Stripe Billing**: Real checkout flow for RepoFuse Pro upgrades and billing management

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon PostgreSQL with connection pooling
- **AI**: Vercel AI SDK (OpenAI GPT-4)
- **UI Components**: Shadcn UI with Radix primitives
- **Styling**: Tailwind CSS v4
- **Auth**: GitHub App user authorization (custom)

## Project Structure

```
app/
├── api/                              # API Routes
│   ├── auth/github/callback/         # GitHub App callback
│   ├── github/repos/                 # Fetch user's GitHub repos
│   ├── github/create-repo/           # Create repo from blueprint
│   ├── repositories/                 # Repository CRUD
│   ├── analyses/                     # Analysis management
│   │   └── [id]/
│   │       ├── run/                  # Run analysis (SSE stream)
│   │       └── analyze/              # AI analysis endpoint
│   └── export/
│       ├── blueprint/                # Export blueprint as JSON
│       └── pdf/                      # Export blueprint as PDF
├── dashboard/                        # Dashboard pages
│   ├── layout.tsx                    # Dashboard layout
│   ├── page.tsx                      # Overview
│   ├── repositories/                 # Repository management
│   └── analyses/                     # Analysis pages
│       └── [id]/                     # Analysis detail
components/
├── repositories-list.tsx             # Repository list + add form
├── repository-selector.tsx           # Multi-repo selector
├── analyses-list.tsx                 # Analyses list
├── analysis-detail.tsx               # Analysis results + blueprints
├── app-suggestions.tsx               # App idea cards
└── ui/                               # Shadcn components
lib/
├── db.ts                             # Neon database client
├── queries.ts                        # Database queries
└── utils.ts                          # Utility functions
scripts/
└── 01-create-schema.sql              # Database migration
```

## Database Schema

### user_auth
- `github_id`: Unique GitHub user ID
- `github_username`: GitHub login name
- `github_avatar_url`: Profile picture URL
- `access_token`: GitHub user access token
- `stripe_customer_id`: Stripe customer linked to the user
- `stripe_subscription_id`: Active or latest Stripe subscription id
- `stripe_price_id`: Stripe price id for the user’s current plan
- `plan_tier`: free / pro
- `subscription_status`: Stripe subscription status

### repositories
- `github_id`: Unique GitHub repo ID
- `name`, `full_name`: Repo name and owner/name
- `description`, `url`: Metadata
- `default_branch`, `language`, `stars`: Additional info

### repo_files
- `repository_id`: Foreign key to repositories
- `path`, `name`, `extension`: File location info
- `file_type`: component / hook / utility / api / page / etc.
- `purpose`, `ai_summary`: AI-generated descriptions
- `technologies`, `exports`, `imports`: Detected patterns (JSONB)
- `reusability_score`: 0–100 reusability rating

### analyses
- `name`: User-defined analysis name
- `status`: pending / scanning / analyzing / complete / failed
- `total_files`, `analyzed_files`: Progress tracking

### analysis_repositories
- Junction table linking analyses to repositories

### app_blueprints
- `analysis_id`: Foreign key to analyses
- `name`, `description`, `app_type`: Blueprint info
- `complexity`: simple / moderate / complex
- `reuse_percentage`: How much existing code can be reused
- `existing_files`, `missing_files`: File lists (JSONB)
- `estimated_effort`: Human-readable time estimate
- `technologies`: Detected stack (JSONB)
- `ai_explanation`: AI-written rationale

## Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd repofuse-backend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

4. **Set up the database**
Run the schema migration in your Neon console or with psql:
```bash
psql $DATABASE_URL -f scripts/01-create-schema.sql
```

5. **Run the development server**
```bash
pnpm dev
```

6. **Access the application**
Open http://localhost:3000 in your browser

## RepoFuse MCP Server

This repo now includes a standalone stdio MCP server at `mcp/repofuse.mjs`.

### What it exposes
- `list_github_repositories`
- `analyze_repositories`
- `generate_scaffold`
- `create_repo_from_blueprint`

### Environment variables
The MCP server expects:
- `GITHUB_TOKEN`
- `ANTHROPIC_API_KEY`
- optional: `REPOFUSE_MODEL`, `REPOFUSE_MAX_FILES_PER_REPO`, `REPOFUSE_MAX_BLUEPRINTS`

### Run it locally
```bash
pnpm mcp:repofuse
```

### Smoke-test the MCP server
```bash
pnpm mcp:test
```

Use the live variant when you want to verify startup with real credentials:
```bash
pnpm mcp:test:live
```

### Streamable HTTP endpoint inside RepoFuse
RepoFuse also exposes a stateless MCP endpoint at `/api/mcp` for authenticated web-app sessions.
It reuses the same RepoFuse MCP tool definitions as the stdio server.

### Example Claude Desktop config
See `examples/claude-desktop.mcp.json`.

### Example Cursor config
See `examples/cursor.mcp.json`.

### Repo-ready Cursor workspace config
See `.cursor/mcp.json`.

### Full MCP setup guide
See `docs/MCP_SETUP.md` and `docs/CLIENT_SETUP_QUICK.md`.

## API Endpoints

### Authentication
- `GET /api/auth/github/callback` - GitHub App callback

### Repositories
- `GET /api/repositories` - List tracked repositories
- `POST /api/repositories` - Add repository by URL
- `GET /api/repositories/[id]` - Get repository details
- `DELETE /api/repositories/[id]` - Remove repository

### GitHub
- `GET /api/github/repos` - Fetch repos available to the signed-in GitHub App user
- `POST /api/github/create-repo` - Create new repo from blueprint (Pro)

### Billing
- `GET /pricing` - Pricing page
- `GET /api/checkout?plan=pro` - Start Stripe checkout for Pro
- `GET /api/checkout/success` - Finalize successful checkout and sync subscription
- `GET /api/billing/portal` - Open Stripe billing portal

### Analyses
- `GET /api/analyses` - List analyses
- `POST /api/analyses` - Create new analysis
- `POST /api/analyses/[id]/run` - Run analysis (Server-Sent Events)
- `POST /api/analyses/[id]/analyze` - AI pattern analysis

### Export
- `POST /api/export/blueprint` - Export blueprint as JSON
- `POST /api/export/pdf` - Export blueprint as PDF

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard (see `.env.example`)
   - For paid upgrades, create a recurring Stripe Price for RepoFuse Pro and set `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`
4. Deploy

## Security

- GitHub App permissions are fine-grained and should be configured read-only for analysis access
- Access tokens are stored in the database (encrypt at rest in production)
- Code is scanned in memory; file contents are never permanently stored
- All API routes validate authentication via session cookie

## License

MIT License
