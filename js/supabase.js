const supabaseUrl = 'https://dbrbieetsihnlzfjjrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBiYW5lIiwicmVmIjoiZGJyYmllZXRzaWhubHpmanJidyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc2MTI0MzE1LCJleHAiOjIwOTE3MDAzMTV9.v99ZcA8NIRD2-w6YpSb_ffMnvk3-eyPAMRT_4hAdGsU';

const API_BASE = '/api';

const supabase = {
  async getClients() {
    try {
      const res = await fetch(`${API_BASE}/clients`);
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
      
      const res = await fetch(`${API_BASE}/posts?${params}`);
      return await res.json();
    } catch (e) {
      console.error('Supabase getPosts error:', e);
      return null;
    }
  },

  async updatePostStatus(postId, status) {
    try {
      const res = await fetch(`${API_BASE}/posts?postId=${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase updatePostStatus error:', e);
      return null;
    }
  },

  async addComment(postId, author, text, type = 'internal') {
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      return await res.json();
    } catch (e) {
      console.error('Supabase createPost error:', e);
      return null;
    }
  }
};

window.supabase = supabase;