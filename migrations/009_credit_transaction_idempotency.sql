ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_idempotency_key
  ON credit_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
