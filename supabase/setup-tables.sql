-- Check if tables exist first, if not create them

-- Posts Table (if not exists)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID,
  type TEXT DEFAULT 'image',
  status TEXT DEFAULT 'pending',
  date DATE NOT NULL,
  username TEXT,
  user_avatar TEXT,
  media JSONB DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  caption TEXT,
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Enable RLS if not enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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