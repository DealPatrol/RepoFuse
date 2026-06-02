-- Build plans generated from app blueprint opportunities
CREATE TABLE IF NOT EXISTS build_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blueprint_id)
);

CREATE INDEX IF NOT EXISTS idx_build_plans_blueprint_id ON build_plans(blueprint_id);
