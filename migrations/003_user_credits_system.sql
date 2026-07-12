-- Add user_credits table for tracking credit balance
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_auth(id) ON DELETE CASCADE,
  current_balance BIGINT NOT NULL DEFAULT 0,
  total_granted BIGINT NOT NULL DEFAULT 0,
  total_used BIGINT NOT NULL DEFAULT 0,
  last_renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Add credit_transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_auth(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'grant', 'analysis', 'scaffold', 'refund', 'renewal'
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  balance_after BIGINT NOT NULL,
  idempotency_key TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_idempotency_key
  ON credit_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add trigger to update updated_at on user_credits
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_timestamp_trigger
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_user_credits_timestamp();
