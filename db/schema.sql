-- ─── Spec Hub Database Schema (Self-Hosted) ─────────────────────────

-- Users table (self-managed auth)
CREATE TABLE users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  icon_name     TEXT DEFAULT 'Flask',
  color         TEXT DEFAULT 'blue',
  modules       JSONB DEFAULT '[]'::jsonb,
  statuses      JSONB DEFAULT '{}'::jsonb,
  done_statuses JSONB DEFAULT '[]'::jsonb,
  priorities    JSONB DEFAULT '[]'::jsonb,
  dependencies  JSONB DEFAULT '[]'::jsonb,
  sources       JSONB DEFAULT '[]'::jsonb,
  team_members  JSONB DEFAULT '[]'::jsonb,
  enabled_types JSONB DEFAULT '[]'::jsonb,
  meta          JSONB DEFAULT '{}'::jsonb,   -- engagement: customer, clouds, type, phase
  created_at    TIMESTAMPTZ DEFAULT now(),
  created_by    UUID REFERENCES users(id)
);

-- Items table (polymorphic — all 5 item types)
CREATE TABLE items (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT DEFAULT '',
  module        TEXT DEFAULT '',
  source        TEXT DEFAULT '',
  owner         TEXT DEFAULT '',
  assignee      TEXT DEFAULT '',
  status        TEXT DEFAULT '',
  tags          JSONB DEFAULT '[]'::jsonb,
  related_items JSONB DEFAULT '[]'::jsonb,
  activity_log  JSONB DEFAULT '[]'::jsonb,
  type_fields   JSONB DEFAULT '{}'::jsonb,
  created_at    TEXT,
  updated_at    TEXT,
  created_by    UUID REFERENCES users(id)
);

-- Comments table
CREATE TABLE comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  text        TEXT NOT NULL,
  timestamp   TEXT NOT NULL,
  created_by  UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_items_project_id ON items(project_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_comments_item_id ON comments(item_id);
