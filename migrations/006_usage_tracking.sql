-- Migration: Usage Tracking for Blueprint Views
-- Purpose: Track which blueprints users have viewed to enforce free tier limits

-- Table to track blueprint views per user
CREATE TABLE IF NOT EXISTS blueprint_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_auth(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES app_blueprints(id) ON DELETE CASCADE,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 1,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, blueprint_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_blueprint_views_user_id ON blueprint_views(user_id);

-- Index for counting views per user
CREATE INDEX IF NOT EXISTS idx_blueprint_views_user_count ON blueprint_views(user_id, first_viewed_at);

-- Function to track or update a blueprint view
CREATE OR REPLACE FUNCTION track_blueprint_view(p_user_id UUID, p_blueprint_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO blueprint_views (user_id, blueprint_id, first_viewed_at, view_count, last_viewed_at)
  VALUES (p_user_id, p_blueprint_id, NOW(), 1, NOW())
  ON CONFLICT (user_id, blueprint_id) 
  DO UPDATE SET 
    view_count = blueprint_views.view_count + 1,
    last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to count unique blueprints viewed by a user
CREATE OR REPLACE FUNCTION count_user_blueprint_views(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM blueprint_views
  WHERE user_id = p_user_id;
  
  RETURN view_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can view more blueprints (based on plan limit)
CREATE OR REPLACE FUNCTION can_view_blueprint(p_user_id UUID, p_blueprint_id UUID, p_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_views INTEGER;
  already_viewed BOOLEAN;
BEGIN
  -- Check if user already viewed this blueprint
  SELECT EXISTS(
    SELECT 1 FROM blueprint_views 
    WHERE user_id = p_user_id AND blueprint_id = p_blueprint_id
  ) INTO already_viewed;
  
  -- If already viewed, always allow
  IF already_viewed THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  SELECT COUNT(*) INTO current_views
  FROM blueprint_views
  WHERE user_id = p_user_id;
  
  RETURN current_views < p_limit;
END;
$$ LANGUAGE plpgsql;
