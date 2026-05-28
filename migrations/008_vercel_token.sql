-- Migration 008: Add Vercel OAuth token to user_auth
ALTER TABLE user_auth
ADD COLUMN IF NOT EXISTS vercel_access_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vercel_team_id TEXT DEFAULT NULL;
