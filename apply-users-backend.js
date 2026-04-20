const fs = require('fs');

// 1. Update Schema
let schema = fs.readFileSync('supabase/schema.sql', 'utf8');
if (!schema.includes('app_users')) {
  schema += `

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
`;
  fs.writeFileSync('supabase/schema.sql', schema);
}

// 2. Create api/users.js
const apiUsers = `
const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': \`Bearer \${supabaseKey}\`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  if (req.method === 'GET') {
    const response = await fetch(\`\${supabaseUrl}/rest/v1/app_users?select=*\`, { headers });
    res.status(response.status).json(await response.json());
  } else if (req.method === 'POST') {
    const response = await fetch(\`\${supabaseUrl}/rest/v1/app_users\`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });
    res.status(response.status).json(await response.json());
  } else if (req.method === 'DELETE') {
    const response = await fetch(\`\${supabaseUrl}/rest/v1/app_users?id=eq.\${req.query.id}\`, {
      method: 'DELETE',
      headers
    });
    res.status(response.status).json({ success: response.ok });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
`;
if (!fs.existsSync('api/users.js')) fs.writeFileSync('api/users.js', apiUsers);

// 3. Create api/login.js
const apiLogin = `
const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const headers = {
    'apikey': supabaseKey,
    'Authorization': \`Bearer \${supabaseKey}\`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(\`\${supabaseUrl}/rest/v1/app_users?email=eq.\${encodeURIComponent(email)}&select=*\`, { headers });
  const users = await response.json();
  
  if (!users || users.length === 0) {
    return res.status(401).json({ error: 'E-mail não encontrado' });
  }

  const user = users[0];
  if (user.password !== password) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  // Remove password from payload
  delete user.password;
  
  res.status(200).json({ user });
}
`;
if (!fs.existsSync('api/login.js')) fs.writeFileSync('api/login.js', apiLogin);

console.log('API and Schema updated.');
