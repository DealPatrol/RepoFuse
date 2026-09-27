CREATE TABLE IF NOT EXISTS mcp_analysis_usage_reservations (
  idempotency_key TEXT PRIMARY KEY,
  github_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcp_analysis_usage_reservations_github_id
  ON mcp_analysis_usage_reservations (github_id);

CREATE INDEX IF NOT EXISTS idx_mcp_analysis_usage_reservations_created_at
  ON mcp_analysis_usage_reservations (created_at);
