-- Projects table: full lifecycle tracking from planning → deployed
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user_auth(id) ON DELETE CASCADE,
  blueprint_id  UUID REFERENCES app_blueprints(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  repo_url      TEXT,
  deployment_url TEXT,
  status        VARCHAR(50) NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning','building','deployed','paused','archived')),
  tech_stack    JSONB NOT NULL DEFAULT '[]',
  frontend_status VARCHAR(50) NOT NULL DEFAULT 'not_started'
                CHECK (frontend_status IN ('not_started','in_progress','complete')),
  backend_status  VARCHAR(50) NOT NULL DEFAULT 'not_started'
                CHECK (backend_status IN ('not_started','in_progress','complete')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects(status);

-- Milestone tracking per project — grouped by phase
CREATE TABLE IF NOT EXISTS project_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  phase       VARCHAR(50) NOT NULL DEFAULT 'other'
              CHECK (phase IN ('planning','backend','frontend','integration','deployment','other')),
  completed   BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
