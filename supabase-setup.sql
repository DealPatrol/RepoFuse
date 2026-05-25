-- RepoFuse Supabase Database Schema
-- Complete schema for PostgreSQL with all tables and migrations

-- Users table (base table for all user-related data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT NOT NULL UNIQUE,
  github_username VARCHAR(255) NOT NULL,
  github_avatar_url TEXT,
  access_token TEXT NOT NULL,
  preferred_ai_provider VARCHAR(50) DEFAULT 'builtin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT NOT NULL UNIQUE,
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

-- Repository files table
CREATE TABLE IF NOT EXISTS repo_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  extension VARCHAR(50),
  size_bytes INTEGER,
  file_type VARCHAR(50),
  purpose TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  exports JSONB DEFAULT '[]'::jsonb,
  imports JSONB DEFAULT '[]'::jsonb,
  reusability_score NUMERIC(4,2) DEFAULT 0,
  ai_summary TEXT,
  content_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(repository_id, path)
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'failed')),
  total_files INTEGER DEFAULT 0,
  analyzed_files INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis repositories junction table
CREATE TABLE IF NOT EXISTS analysis_repositories (
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  PRIMARY KEY (analysis_id, repository_id)
);

-- App blueprints
CREATE TABLE IF NOT EXISTS app_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  app_type VARCHAR(100),
  complexity VARCHAR(50) DEFAULT 'moderate' CHECK (complexity IN ('simple', 'moderate', 'complex')),
  reuse_percentage NUMERIC(5,2) DEFAULT 0,
  existing_files JSONB DEFAULT '[]'::jsonb,
  missing_files JSONB DEFAULT '[]'::jsonb,
  estimated_effort VARCHAR(100),
  technologies JSONB DEFAULT '[]'::jsonb,
  ai_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (Stripe billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT NOT NULL UNIQUE REFERENCES users(github_id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'byok', 'pro', 'scale')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  analyses_used_this_month INTEGER DEFAULT 0,
  billing_cycle_anchor TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User credits tracking
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_balance BIGINT NOT NULL DEFAULT 0,
  total_granted BIGINT NOT NULL DEFAULT 0,
  total_used BIGINT NOT NULL DEFAULT 0,
  last_renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missing file gaps
CREATE TABLE IF NOT EXISTS missing_file_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  purpose TEXT,
  complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_hours NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
  category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'api', 'ui', 'database', 'utils', 'config', 'other')),
  dependencies JSONB DEFAULT '[]'::jsonb,
  is_blocking BOOLEAN DEFAULT FALSE,
  suggested_stub TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blueprint_id, file_path)
);

-- Completed gaps
CREATE TABLE IF NOT EXISTS completed_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id UUID NOT NULL REFERENCES missing_file_gaps(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gap_id, blueprint_id)
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  blueprint_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_hours NUMERIC(10, 2) NOT NULL DEFAULT 4.0,
  reuse_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50,
  total_files INTEGER NOT NULL DEFAULT 0,
  missing_files INTEGER NOT NULL DEFAULT 0,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('quick_start', 'standard', 'comprehensive')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User API keys for multi-AI support
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Reddit posts cache
CREATE TABLE IF NOT EXISTS reddit_posts (
  id VARCHAR(100) PRIMARY KEY,
  subreddit VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  score INT DEFAULT 0,
  comments INT DEFAULT 0,
  posted_at TIMESTAMP,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subreddit, id)
);

-- App demand signals from Reddit
CREATE TABLE IF NOT EXISTS app_demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type VARCHAR(100) NOT NULL UNIQUE,
  demand_score INT DEFAULT 0,
  trending_keywords TEXT[],
  pain_points TEXT[],
  source VARCHAR(50) DEFAULT 'reddit',
  post_count INT DEFAULT 0,
  avg_engagement INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Demand metrics per analysis
CREATE TABLE IF NOT EXISTS demand_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  app_type VARCHAR(100),
  demand_score_at_time INT,
  market_fit_percentage INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  tokens_used INT,
  estimated_cost DECIMAL(10, 4),
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create all indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repo_files_repository_id ON repo_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_file_type ON repo_files(file_type);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_repositories_analysis_id ON analysis_repositories(analysis_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_analysis_id ON app_blueprints(analysis_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_reuse_percentage ON app_blueprints(reuse_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_github_id ON subscriptions(github_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_blueprint_id ON missing_file_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_category ON missing_file_gaps(category);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_is_blocking ON missing_file_gaps(is_blocking);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_gap_id ON completed_gaps(gap_id);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_blueprint_id ON completed_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_templates_tier ON templates(tier);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(featured);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_cached_at ON reddit_posts(cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_demand_signals_app_type ON app_demand_signals(app_type);
CREATE INDEX IF NOT EXISTS idx_app_demand_signals_score ON app_demand_signals(demand_score DESC);
CREATE INDEX IF NOT EXISTS idx_demand_metrics_analysis_id ON demand_metrics(analysis_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_analysis_id ON token_usage(analysis_id);

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_credits_updated_at_trigger
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_user_credits_updated_at();

CREATE OR REPLACE FUNCTION update_missing_file_gaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER missing_file_gaps_updated_at_trigger
BEFORE UPDATE ON missing_file_gaps
FOR EACH ROW
EXECUTE FUNCTION update_missing_file_gaps_updated_at();

CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at_trigger
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION update_templates_updated_at();
