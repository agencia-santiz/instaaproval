const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

function sanitizeFileName(fileName) {
  return String(fileName || 'asset')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userRole = req.headers['x-user-role'] || 'viewer';
  const canUpload = userRole === 'admin' || userRole === 'editor';
  if (!canUpload) {
    res.status(403).json({ error: 'Role cannot upload assets' });
    return;
  }

  if (!serviceRoleKey) {
    res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY' });
    return;
  }

  try {
    const {
      bucket = 'post-assets',
      folder = 'posts',
      fileName,
      contentType = 'application/octet-stream',
      base64Data
    } = req.body || {};

    if (!base64Data) {
      res.status(400).json({ error: 'base64Data is required' });
      return;
    }

    const cleanName = sanitizeFileName(fileName);
    const uniquePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName}`;
    const binary = Buffer.from(base64Data, 'base64');

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${uniquePath}`;
    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': contentType,
      'x-upsert': 'false'
    };

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: binary
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      res.status(uploadRes.status).json({ error: 'Upload failed', detail: errorText });
      return;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${uniquePath}`;
    res.status(200).json({
      bucket,
      path: uniquePath,
      publicUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unexpected upload error' });
  }
}
