-- ─── Spec Hub Database Schema ──────────────────────────────────────
-- Run this in Supabase SQL Editor to set up the database

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
  created_at    TIMESTAMPTZ DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
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
  created_by    UUID REFERENCES auth.users(id)
);

-- Comments table (separate for realtime)
CREATE TABLE comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  text        TEXT NOT NULL,
  timestamp   TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_items_project_id ON items(project_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_comments_item_id ON comments(item_id);

-- ─── Row Level Security ───────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Projects: authenticated users can read and write all projects
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated USING (true);

-- Items: authenticated users can read and write all items
CREATE POLICY "items_select" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "items_update" ON items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "items_delete" ON items FOR DELETE TO authenticated USING (true);

-- Comments: authenticated users can read and write all comments
CREATE POLICY "comments_select" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "comments_update" ON comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE TO authenticated USING (true);

-- Enable realtime for items and comments
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
