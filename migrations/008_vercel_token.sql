-- Migration 008: Add Vercel OAuth token to users
-- When null, deployments fall back to RepoFuse's shared Vercel account

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vercel_access_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vercel_team_id TEXT DEFAULT NULL;
