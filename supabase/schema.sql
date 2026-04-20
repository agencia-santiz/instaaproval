-- Supabase Schema for InstaAproval
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  instagram_username TEXT,
  instagram_profile_photo TEXT,
  color TEXT DEFAULT '#BA0C2F',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_profile_photo TEXT;

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
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

-- Ensure status constraint includes the "changes_requested" flow
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts
ADD CONSTRAINT posts_status_check
CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected'));

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'client')),
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Status History Table
CREATE TABLE IF NOT EXISTS post_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  actor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_status_history ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust as needed for your auth setup)
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON post_status_history FOR SELECT USING (true);

-- Allow insert/update (for authenticated users - adjust as needed)
CREATE POLICY "Allow authenticated insert" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON post_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_client_id ON posts(client_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_status_history_post_id ON post_status_history(post_id);

-- Storage bucket for uploaded assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-assets', 'post-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read post assets" ON storage.objects;
CREATE POLICY "Public read post assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-assets');

-- Insert sample data
INSERT INTO clients (name, avatar_url, instagram_username, instagram_profile_photo, color) VALUES
  ('Brothers Filmes', 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070', 'brothersfilmes', 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070', '#C9A962'),
  ('Designers Papelee', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1974', 'designerspapelee', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1974', '#ec4899'),
  ('Asfer Quimica', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1974', 'asferquimica', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1974', '#3b82f6');

-- Insert sample posts
INSERT INTO posts (client_id, type, status, date, username, user_avatar, media, likes, caption, cta_text)
SELECT 
  c.id,
  'carousel',
  'pending',
  '2026-04-15',
  'brothersfilmes',
  c.avatar_url,
  '["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000","https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000","https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1000"]',
  124,
  'Aquela luz de final de tarde que transforma o filme do seu casamento em uma obra de arte. âœ¨ðŸŽ¬',
  'Ver PortfÃ³lio'
FROM clients c WHERE c.name = 'Brothers Filmes';

INSERT INTO posts (client_id, type, status, date, username, user_avatar, media, likes, caption, cta_text)
SELECT 
  c.id,
  'reels',
  'approved',
  '2026-04-18',
  'brothersfilmes',
  c.avatar_url,
  '["https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000"]',
  589,
  'Bastidores de uma captaÃ§Ã£o em 4K. Ã‰ assim que nÃ³s fazemos a mÃ¡gica acontecer! ðŸŽ¥ðŸ”¥',
  ''
FROM clients c WHERE c.name = 'Brothers Filmes';

INSERT INTO posts (client_id, type, status, date, username, user_avatar, media, likes, caption, cta_text)
SELECT 
  c.id,
  'image',
  'pending',
  '2026-04-20',
  'designerspapelee',
  c.avatar_url,
  '["https://images.unsplash.com/photo-1512403754473-27825d481ee6?q=80&w=1000"]',
  45,
  'Nova identidade visual para nossa linha de convites premium. Papel com textura especial 300g. ðŸ’Œ',
  'Comprar agora'
FROM clients c WHERE c.name = 'Designers Papelee';



-- App Users Table (Custom Auth for Vercel Serverless)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Stored as plaintext for prototype/MVP (migrate to bcrypt in Prod)
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'approver', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Admin User (Password: admin123)
INSERT INTO app_users (name, email, password, role) 
VALUES ('Administrador', 'admin@santiz.com', 'admin123', 'admin')
ON CONFLICT DO NOTHING;

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON app_users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON app_users FOR DELETE USING (true);
