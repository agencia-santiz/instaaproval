const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

export default async function handler(req, res) {
  const { postId } = req.query;
  const tenantClientId = req.headers['x-client-id'];
  const userRole = req.headers['x-user-role'] || 'viewer';
  const isAdmin = userRole === 'admin';

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!postId) {
    res.status(400).json({ error: 'postId is required' });
    return;
  }

  try {
    if (tenantClientId && !isAdmin) {
      const postRes = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}&client_id=eq.${tenantClientId}&select=id`, { headers });
      const postData = await postRes.json();
      if (!Array.isArray(postData) || postData.length === 0) {
        res.status(403).json({ error: 'Tenant mismatch for status history read' });
        return;
      }
    }

    const url = `${supabaseUrl}/rest/v1/post_status_history?post_id=eq.${postId}&order=created_at.desc`;
    const response = await fetch(url, { headers });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
