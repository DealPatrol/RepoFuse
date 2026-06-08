-- RepoFuse Backend Database Schema
-- AI-powered code analysis tool for discovering apps hidden in your repos

-- User authentication table (GitHub OAuth)
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
);

ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);

-- Repositories table (GitHub repos added by users)
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
);

-- Repository files table (individual files scanned from repos)
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
);

-- Analyses table (a code analysis run across selected repos)
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
);

-- Junction table linking analyses to repositories
CREATE TABLE IF NOT EXISTS analysis_repositories (
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  PRIMARY KEY (analysis_id, repository_id)
);

-- App blueprints discovered by AI analysis
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
);

-- Subscriptions table (Stripe billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT NOT NULL UNIQUE REFERENCES user_auth(github_id),
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'scale', 'byok')),
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'byok', 'pro', 'scale')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  analyses_used_this_month INTEGER DEFAULT 0,
  billing_cycle_anchor TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_github_id ON subscriptions(github_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_auth_github_id ON user_auth(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_repositories_user_github_id ON repositories(user_id, github_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repo_files_repository_id ON repo_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_file_type ON repo_files(file_type);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_repositories_analysis_id ON analysis_repositories(analysis_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_analysis_id ON app_blueprints(analysis_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_user_id ON app_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_reuse_percentage ON app_blueprints(reuse_percentage DESC);

-- Missing file gaps discovered from blueprints
CREATE TABLE IF NOT EXISTS missing_file_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  purpose TEXT,
  complexity VARCHAR(20) DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_hours NUMERIC(6,2) DEFAULT 0,
  category VARCHAR(20) DEFAULT 'other' CHECK (category IN ('auth', 'api', 'ui', 'database', 'utils', 'config', 'other')),
  dependencies JSONB DEFAULT '[]',
  is_blocking BOOLEAN DEFAULT false,
  suggested_stub TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blueprint_id, file_path)
);

-- Gaps a user has marked complete
CREATE TABLE IF NOT EXISTS completed_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id UUID NOT NULL REFERENCES missing_file_gaps(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gap_id, user_id)
);

-- Templates that combine multiple blueprints
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  blueprint_ids JSONB DEFAULT '[]',
  tech_stack JSONB DEFAULT '[]',
  estimated_hours NUMERIC(8,2) DEFAULT 0,
  reuse_percentage NUMERIC(5,2) DEFAULT 0,
  total_files INTEGER DEFAULT 0,
  missing_files INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('quick_start', 'standard', 'comprehensive')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blueprint view tracking for usage limits
CREATE TABLE IF NOT EXISTS blueprint_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_auth(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  first_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, blueprint_id)
);

CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_blueprint_id ON missing_file_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_blueprint_id ON completed_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_user_id ON completed_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_views_user_id ON blueprint_views(user_id);

