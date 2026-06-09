-- Fix: migration 002 used MySQL-style inline INDEX declarations which are invalid
-- in PostgreSQL. This migration creates the tables with correct syntax.

CREATE TABLE IF NOT EXISTS missing_file_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  purpose TEXT,
  complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_hours NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'auth', 'api', 'ui', 'database', 'utils', 'config', 'other'
  )),
  dependencies JSONB DEFAULT '[]'::jsonb,
  is_blocking BOOLEAN DEFAULT FALSE,
  suggested_stub TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blueprint_id, file_path)
);

CREATE TABLE IF NOT EXISTS completed_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id UUID NOT NULL REFERENCES missing_file_gaps(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gap_id, blueprint_id)
);

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

CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_blueprint_id ON missing_file_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_category ON missing_file_gaps(category);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_is_blocking ON missing_file_gaps(is_blocking);
CREATE INDEX IF NOT EXISTS idx_missing_file_gaps_blueprint_complexity ON missing_file_gaps(blueprint_id, complexity);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_gap_id ON completed_gaps(gap_id);
CREATE INDEX IF NOT EXISTS idx_completed_gaps_blueprint_id ON completed_gaps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_templates_tier ON templates(tier);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(featured);
CREATE INDEX IF NOT EXISTS idx_templates_tier_featured ON templates(tier, featured);
