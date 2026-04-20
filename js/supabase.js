const supabaseUrl = 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

const API_BASE = '/api';
const SESSION_KEY = 'instaaproval_session';

const supabase = {
  async loginUser(email, password) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return res.ok ? data : { error: data.error };
    } catch(e) {
      return { error: 'Backend error' };
    }
  },
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: getSessionHeaders() });
      return await res.json();
    } catch(e) { return []; }
  },
  async createUser(payload) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch(e) { return null; }
  },
  async deleteUser(id) {
    try {
      const res = await fetch(`${API_BASE}/users?id=${id}`, {
        method: 'DELETE',
        headers: getSessionHeaders()
      });
      return await res.json();
    } catch(e) { return null; }
  },

  async uploadAssets(files, options = {}) {
    try {
      const bucket = options.bucket || 'post-assets';
      const folder = options.folder || 'posts';
      const uploads = [];

      for (const file of files) {
        const base64Data = await fileToBase64(file);
        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
          body: JSON.stringify({
            bucket,
            folder,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            base64Data
          })
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Upload failed');
        }

        const payload = await res.json();
        if (payload.publicUrl) uploads.push(payload.publicUrl);
      }

      return uploads;
    } catch (e) {
      console.error('Supabase uploadAssets error:', e);
      return null;
    }
  },

  async getClients() {
    try {
      const res = await fetch(`${API_BASE}/clients`, { headers: getSessionHeaders() });
      return await res.json();
    } catch (e) {
      console.error('Supabase getClients error:', e);
      return null;
    }
  },

  async getPosts(clientId, status = 'all') {
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId);
      if (status !== 'all') params.append('status', status);
      
      const res = await fetch(`${API_BASE}/posts?${params}`, { headers: getSessionHeaders() });
      return await res.json();
    } catch (e) {
      console.error('Supabase getPosts error:', e);
      return null;
    }
  },

  async getComments(postId) {
    try {
      const params = new URLSearchParams();
      if (postId) params.append('postId', postId);

      const res = await fetch(`${API_BASE}/comments?${params}`, { headers: getSessionHeaders() });
      return await res.json();
    } catch (e) {
      console.error('Supabase getComments error:', e);
      return null;
    }
  },

  async getStatusHistory(postId) {
    try {
      const params = new URLSearchParams();
      if (postId) params.append('postId', postId);
      const res = await fetch(`${API_BASE}/status-history?${params}`, { headers: getSessionHeaders() });
      return await res.json();
    } catch (e) {
      console.error('Supabase getStatusHistory error:', e);
      return null;
    }
  },

  async updatePostStatus(postId, status, actorName = 'Sistema') {
    try {
      const res = await fetch(`${API_BASE}/posts?postId=${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify({ status, actor_name: actorName })
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase updatePostStatus error:', e);
      return null;
    }
  },

  async updatePostContent(postId, payload) {
    try {
      const res = await fetch(`${API_BASE}/posts?postId=${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase updatePostContent error:', e);
      return null;
    }
  },

  async deletePost(postId) {
    try {
      const res = await fetch(`${API_BASE}/posts?postId=${postId}`, {
        method: 'DELETE',
        headers: getSessionHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase deletePost error:', e);
      return null;
    }
  },

  async addComment(postId, author, text, type = 'internal') {
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify({ post_id: postId, author, text, type })
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase addComment error:', e);
      return null;
    }
  },

  async createPost(postData) {
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify(postData)
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase createPost error:', e);
      return null;
    }
  },

  async createClient(clientData) {
    try {
      const res = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify(clientData)
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase createClient error:', e);
      return null;
    }
  }
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getSessionHeaders() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const session = JSON.parse(raw);
    const headers = {};
    if (session?.clientId) headers['x-client-id'] = String(session.clientId);
    if (session?.role) headers['x-user-role'] = String(session.role);
    return headers;
  } catch (e) {
    return {};
  }
}

window.supabase = supabase;
