ALTER TABLE user_auth
  ADD COLUMN IF NOT EXISTS vercel_access_token TEXT,
  ADD COLUMN IF NOT EXISTS vercel_team_id TEXT;

ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_idempotency_key
  ON credit_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
