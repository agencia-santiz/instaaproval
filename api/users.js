
const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

export default async function handler(req, res) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  if (req.method === 'GET') {
    const response = await fetch(`${supabaseUrl}/rest/v1/app_users?select=*`, { headers });
    res.status(response.status).json(await response.json());
  } else if (req.method === 'POST') {
    const response = await fetch(`${supabaseUrl}/rest/v1/app_users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });
    res.status(response.status).json(await response.json());
  } else if (req.method === 'DELETE') {
    const response = await fetch(`${supabaseUrl}/rest/v1/app_users?id=eq.${req.query.id}`, {
      method: 'DELETE',
      headers
    });
    res.status(response.status).json({ success: response.ok });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
