-- Optional PostgreSQL storage. Existing project tables are preserved.
CREATE TABLE IF NOT EXISTS survivor_runs (
  id UUID PRIMARY KEY,
  map_id VARCHAR(32) NOT NULL,
  survived_sec INTEGER NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  victory BOOLEAN NOT NULL DEFAULT FALSE,
  players JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS survivor_runs_score ON survivor_runs (victory DESC, survived_sec DESC, kills DESC);
