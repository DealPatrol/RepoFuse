-- SaaS foundation: user-scoped product data and expanded paid plan support.

ALTER TABLE repositories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE;
ALTER TABLE app_blueprints ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE;
ALTER TABLE completed_gaps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_auth(id) ON DELETE CASCADE;

UPDATE app_blueprints b
SET user_id = a.user_id
FROM analyses a
WHERE b.analysis_id = a.id
  AND b.user_id IS NULL
  AND a.user_id IS NOT NULL;

UPDATE templates t
SET user_id = b.user_id
FROM app_blueprints b
WHERE t.user_id IS NULL
  AND jsonb_array_length(t.blueprint_ids) > 0
  AND t.blueprint_ids->>0 = b.id::text
  AND b.user_id IS NOT NULL;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'scale', 'byok'));

ALTER TABLE user_auth DROP CONSTRAINT IF EXISTS user_auth_plan_tier_check;
ALTER TABLE user_auth
  ADD CONSTRAINT user_auth_plan_tier_check CHECK (plan_tier IN ('free', 'pro', 'scale', 'byok'));

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

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_repositories_user_github_id
  ON repositories(user_id, github_id)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_repositories_legacy_github_id
  ON repositories(github_id)
  WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_app_blueprints_user_id ON app_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_user_id ON completed_gaps(user_id);

DO $$
BEGIN
  IF to_regclass('user_credits') IS NOT NULL THEN
    ALTER TABLE user_credits DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey;
    ALTER TABLE user_credits
      ADD CONSTRAINT user_credits_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_auth(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('credit_transactions') IS NOT NULL THEN
    ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
    ALTER TABLE credit_transactions
      ADD CONSTRAINT credit_transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_auth(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('blueprint_views') IS NOT NULL THEN
    ALTER TABLE blueprint_views DROP CONSTRAINT IF EXISTS blueprint_views_user_id_fkey;
    ALTER TABLE blueprint_views
      ADD CONSTRAINT blueprint_views_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_auth(id) ON DELETE CASCADE;
  END IF;
END $$;
