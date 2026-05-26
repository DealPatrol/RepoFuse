-- Migration 007: Ephemeral Previews
-- Stores preview deployments so users can revisit them

CREATE TABLE IF NOT EXISTS previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_owner VARCHAR(255) NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  preview_url TEXT NOT NULL,
  vercel_deployment_id TEXT,
  dep_changes JSONB DEFAULT '[]'::jsonb,   -- list of fixes Claude made
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS previews_user_id_idx ON previews(user_id);

-- Fast lookups by repo
CREATE INDEX IF NOT EXISTS previews_repo_idx ON previews(user_id, repo_owner, repo_name);
