const supabaseUrl = process.env.SUPABASE_URL || 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

export default async function handler(req, res) {
  const { postId, clientId, status } = req.query;
  const allowedStatuses = ['pending', 'approved', 'changes_requested', 'rejected'];
  const tenantClientId = req.headers['x-client-id'];
  const userRole = req.headers['x-user-role'] || 'viewer';
  const isAdmin = userRole === 'admin';
  const canCreate = isAdmin || userRole === 'editor';
  const canUpdateStatus = isAdmin || userRole === 'approver';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  if (req.method === 'GET') {
    try {
      let url = `${supabaseUrl}/rest/v1/posts?select=*`;
      const params = [];
      
      if (tenantClientId && !isAdmin) {
        params.push(`client_id=eq.${tenantClientId}`);
      } else if (clientId) {
        params.push(`client_id=eq.${clientId}`);
      }
      if (status && status !== 'all' && allowedStatuses.includes(status)) params.push(`status=eq.${status}`);
      
      if (params.length > 0) url += `&${params.join('&')}`;
      url += '&order=date.desc';
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    if (!canCreate) {
      res.status(403).json({ error: 'Role cannot create posts' });
      return;
    }
    try {
      const body = { ...(req.body || {}) };
      const actorName = body.actor_name || 'Sistema';
      delete body.actor_name;
      if (!body.status) body.status = 'pending';
      if (!allowedStatuses.includes(body.status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      if (tenantClientId && !isAdmin) {
        body.client_id = tenantClientId;
      } else if (tenantClientId && body.client_id && body.client_id !== tenantClientId) {
        res.status(403).json({ error: 'Tenant mismatch for post create' });
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }

      const createdPost = Array.isArray(data) ? data[0] : null;
      if (createdPost?.id) {
        await fetch(`${supabaseUrl}/rest/v1/post_status_history`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            post_id: createdPost.id,
            client_id: createdPost.client_id || body.client_id || tenantClientId || null,
            from_status: null,
            to_status: body.status,
            actor_name: req.body?.actor_name || 'Sistema'
          })
        });
      }

      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT' && postId) {
    if (!canUpdateStatus) {
      res.status(403).json({ error: 'Role cannot update post status' });
      return;
    }
    try {
      const nextStatus = req.body?.status;
      const actorName = req.body?.actor_name || 'Sistema';
      if (!allowedStatuses.includes(nextStatus)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }

      const scopedPostUrl = `${supabaseUrl}/rest/v1/posts?id=eq.${postId}${tenantClientId && !isAdmin ? `&client_id=eq.${tenantClientId}` : ''}&select=id,status,client_id`;
      const currentPostRes = await fetch(scopedPostUrl, { headers });
      const currentPostData = await currentPostRes.json();
      const currentPost = Array.isArray(currentPostData) ? currentPostData[0] : null;
      if (!currentPost) {
        res.status(404).json({ error: 'Post not found for this tenant' });
        return;
      }

      const tenantFilter = tenantClientId && !isAdmin ? `&client_id=eq.${tenantClientId}` : '';
      const response = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}${tenantFilter}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }

      if (currentPost.status !== nextStatus) {
        await fetch(`${supabaseUrl}/rest/v1/post_status_history`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            post_id: postId,
            client_id: currentPost.client_id,
            from_status: currentPost.status,
            to_status: nextStatus,
            actor_name: actorName
          })
        });
      }

      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PATCH' && postId) {
    if (!canCreate) {
      res.status(403).json({ error: 'Role cannot edit posts' });
      return;
    }
    try {
      const tenantFilter = tenantClientId && !isAdmin ? `&client_id=eq.${tenantClientId}` : '';
      const response = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}${tenantFilter}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(req.body || {})
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE' && postId) {
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can delete posts' });
      return;
    }
    try {
      const tenantFilter = tenantClientId && !isAdmin ? `&client_id=eq.${tenantClientId}` : '';
      const response = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}${tenantFilter}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) {
         const data = await response.json();
         res.status(response.status).json(data);
         return;
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
