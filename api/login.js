
const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const url = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&select=*`;
    const response = await fetch(url, { headers });
    const body = await response.json();

    // Supabase error (RLS, bad key, table missing, etc.)
    if (!response.ok) {
      console.error('Supabase query failed:', response.status, body);
      return res.status(500).json({ error: body.message || body.hint || 'Erro ao consultar banco de dados' });
    }

    // Not an array → unexpected shape
    if (!Array.isArray(body)) {
      console.error('Supabase returned non-array:', body);
      return res.status(500).json({ error: 'Resposta inesperada do banco de dados' });
    }

    if (body.length === 0) {
      return res.status(401).json({ error: 'E-mail não encontrado' });
    }

    const user = body[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Remove password from payload
    delete user.password;

    res.status(200).json({ user });
  } catch (err) {
    console.error('Login handler error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
