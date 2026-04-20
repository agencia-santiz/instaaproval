const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

export default async function handler(req, res) {
  const { clientId } = req.query;
  const tenantClientId = req.headers['x-client-id'];
  const userRole = req.headers['x-user-role'] || 'viewer';
  const isAdmin = userRole === 'admin';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  if (req.method === 'GET') {
    try {
      let scopedClientId = clientId;
      if (tenantClientId && !isAdmin) scopedClientId = tenantClientId;

      const url = scopedClientId
        ? `${supabaseUrl}/rest/v1/clients?id=eq.${scopedClientId}`
        : `${supabaseUrl}/rest/v1/clients`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admin can create clients' });
      return;
    }
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
