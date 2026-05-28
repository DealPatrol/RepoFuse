import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// One-time database schema initializer.
// Visit GET /api/setup/init-db in your browser to create all tables.
// Safe to call multiple times — all statements use IF NOT EXISTS.
export async function GET() {
  return run()
}

export async function POST() {
  return run()
}

async function run() {
  try {
    const sql = getDb()

    await sql`
      CREATE TABLE IF NOT EXISTS user_auth (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        github_id BIGINT NOT NULL UNIQUE,
        github_username VARCHAR(255) NOT NULL,
        github_avatar_url TEXT,
        access_token TEXT NOT NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        stripe_price_id TEXT,
        plan_tier VARCHAR(20) DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'scale', 'byok')),
        subscription_status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`
    await sql`ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`
    await sql`ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_price_id TEXT`
    await sql`ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free'`
    await sql`ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50)`

    await sql`
      CREATE TABLE IF NOT EXISTS repositories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
        github_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        full_name VARCHAR(500) NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        default_branch VARCHAR(255) DEFAULT 'main',
        language VARCHAR(100),
        stars INTEGER DEFAULT 0,
        last_synced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS repo_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        extension VARCHAR(50),
        size_bytes INTEGER,
        file_type VARCHAR(50),
        purpose TEXT,
        technologies JSONB DEFAULT '[]',
        exports JSONB DEFAULT '[]',
        imports JSONB DEFAULT '[]',
        reusability_score NUMERIC(4,2) DEFAULT 0,
        ai_summary TEXT,
        content_hash VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(repository_id, path)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'failed')),
        total_files INTEGER DEFAULT 0,
        analyzed_files INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS analysis_repositories (
        analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        PRIMARY KEY (analysis_id, repository_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS app_blueprints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        app_type VARCHAR(100),
        complexity VARCHAR(50) DEFAULT 'moderate' CHECK (complexity IN ('simple', 'moderate', 'complex')),
        reuse_percentage NUMERIC(5,2) DEFAULT 0,
        existing_files JSONB DEFAULT '[]',
        missing_files JSONB DEFAULT '[]',
        estimated_effort VARCHAR(100),
        technologies JSONB DEFAULT '[]',
        ai_explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE`
    await sql`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE`
    await sql`ALTER TABLE app_blueprints ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE`

    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        github_id BIGINT NOT NULL UNIQUE,
        stripe_customer_id VARCHAR(255) UNIQUE,
        stripe_subscription_id VARCHAR(255) UNIQUE,
        plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'scale', 'byok')),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
        current_period_end TIMESTAMP WITH TIME ZONE,
        analyses_used_this_month INTEGER DEFAULT 0,
        billing_cycle_anchor TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check`
    await sql`ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'scale', 'byok'))`

    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_github_id ON subscriptions(github_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id)`

    await sql`CREATE INDEX IF NOT EXISTS idx_user_auth_github_id ON user_auth(github_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id)`
    await sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'repositories_github_id_key'
            AND conrelid = 'repositories'::regclass
        ) THEN
          ALTER TABLE repositories DROP CONSTRAINT repositories_github_id_key;
        END IF;
      END $$;
    `
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_repositories_user_github_id ON repositories(user_id, github_id) WHERE user_id IS NOT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name)`
    await sql`CREATE INDEX IF NOT EXISTS idx_repo_files_repository_id ON repo_files(repository_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_app_blueprints_analysis_id ON app_blueprints(analysis_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_app_blueprints_user_id ON app_blueprints(user_id)`

    return NextResponse.json({ success: true, message: 'Database schema initialized successfully.' })
  } catch (err) {
    console.error('[setup] DB init failed:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
