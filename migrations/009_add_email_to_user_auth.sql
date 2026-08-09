-- Migration: Add email column to user_auth for marketing list capture
  -- Run after 008_*.sql migrations

  ALTER TABLE user_auth
    ADD COLUMN IF NOT EXISTS email TEXT;

  -- Index for fast email lookups
  CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth (email)
    WHERE email IS NOT NULL;
  