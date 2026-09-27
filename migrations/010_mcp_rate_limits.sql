CREATE TABLE IF NOT EXISTS mcp_rate_limits (
  user_id UUID NOT NULL REFERENCES user_auth(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_mcp_rate_limits_window_start
  ON mcp_rate_limits (window_start);
