-- Check if tables exist first, if not create them

-- Ensure clients table has Instagram profile fields
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS instagram_profile_photo TEXT;

-- Posts Table (if not exists)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID,
  type TEXT DEFAULT 'image',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  date DATE NOT NULL,
  username TEXT,
  user_avatar TEXT,
  media JSONB DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  caption TEXT,
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts
ADD CONSTRAINT posts_status_check
CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected'));

-- Comments Table (if not exists)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'internal',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post status history table
CREATE TABLE IF NOT EXISTS post_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID,
  client_id UUID,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  actor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict, then create new ones
DROP POLICY IF EXISTS "Allow public read" ON posts;
DROP POLICY IF EXISTS "Public read" ON posts;
DROP POLICY IF EXISTS "Allow authenticated insert" ON posts;
DROP POLICY IF EXISTS "Public insert" ON posts;
DROP POLICY IF EXISTS "Allow authenticated update" ON posts;
DROP POLICY IF EXISTS "Public update" ON posts;

CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public insert posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update posts" ON posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON comments;
DROP POLICY IF EXISTS "Public read" ON comments;
DROP POLICY IF EXISTS "Allow authenticated insert" ON comments;
DROP POLICY IF EXISTS "Public insert" ON comments;

CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read status history" ON post_status_history;
DROP POLICY IF EXISTS "Public insert status history" ON post_status_history;
CREATE POLICY "Public read status history" ON post_status_history FOR SELECT USING (true);
CREATE POLICY "Public insert status history" ON post_status_history FOR INSERT WITH CHECK (true);

-- Storage bucket for uploaded assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-assets', 'post-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read post assets" ON storage.objects;
CREATE POLICY "Public read post assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-assets');
