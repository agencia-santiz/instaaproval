const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { clientId } = req.query;
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  if (req.method === 'GET') {
    try {
      const url = clientId 
        ? `${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`
        : `${supabaseUrl}/rest/v1/clients`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}