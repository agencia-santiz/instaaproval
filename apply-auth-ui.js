const fs = require('fs');

// 1. ADD getUsers AND loginUser TO SUPABASE.JS
let supabaseCode = fs.readFileSync('js/supabase.js', 'utf8');
if (!supabaseCode.includes('loginUser')) {
  const newFunctions = `
  async loginUser(email, password) {
    try {
      const res = await fetch(\`\${API_BASE}/login\`, {
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
      const res = await fetch(\`\${API_BASE}/users\`, { headers: getSessionHeaders() });
      return await res.json();
    } catch(e) { return []; }
  },
  async createUser(payload) {
    try {
      const res = await fetch(\`\${API_BASE}/users\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getSessionHeaders() },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch(e) { return null; }
  },
  async deleteUser(id) {
    try {
      const res = await fetch(\`\${API_BASE}/users?id=\${id}\`, {
        method: 'DELETE',
        headers: getSessionHeaders()
      });
      return await res.json();
    } catch(e) { return null; }
  },
`;
  supabaseCode = supabaseCode.replace('async uploadAssets(files, options) {', newFunctions + '\\n  async uploadAssets(files, options) {');
  fs.writeFileSync('js/supabase.js', supabaseCode);
}

// 2. ADD USERS LINK TO HTML
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('id="nav-users"')) {
  html = html.replace('id="nav-guidelines"><i data-lucide="book-open"></i> Brand Guidelines</a>', 'id="nav-guidelines"><i data-lucide="book-open"></i> Brand Guidelines</a>\\n          <a class="nav-link admin-only" id="nav-users" style="display:none;"><i data-lucide="users"></i> Usuários</a>');
  fs.writeFileSync('index.html', html.replace(/\\\\n/g, '\\n'));
}

// 3. REWRITE openAccessModal AND ADD renderUsers IN APP-ENHANCED
let appCode = fs.readFileSync('js/app-enhanced.js', 'utf8');

if (!appCode.includes('renderUsers()')) {
  // Update Routing
  const routingTarget = `        renderGuidelines();
    });`;
  const newRouting = routingTarget + `

    document.getElementById('nav-users')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'users';
        renderCurrentView();
    });`;
  appCode = appCode.replace(routingTarget, newRouting);

  const currentViewDispatchTarget = `    if (state.activeView === 'guidelines') {
        renderGuidelines();
        return;
    }`;
  const newCurrentViewDispatch = currentViewDispatchTarget + `
    if (state.activeView === 'users') {
        renderUsers();
        return;
    }`;
  appCode = appCode.replace(currentViewDispatchTarget, newCurrentViewDispatch);

  // Expose admin tabs conditionally in UI
  const setAdminTabs = `
    if (isAdmin()) {
        const uTab = document.getElementById('nav-users');
        if (uTab) uTab.style.display = 'flex';
    } else {
        const uTab = document.getElementById('nav-users');
        if (uTab) uTab.style.display = 'none';
        
        // Non-admins shouldn't see multiple clients
        const clientList = document.getElementById('client-list');
        if (clientList && state.auth && state.auth.clientId) {
            clientList.style.display = 'none'; // Lock to single implicit client
        }
    }`;
    
  appCode = appCode.replace('renderClientList();\\n    renderCurrentView();', 'renderClientList();\\n    ' + setAdminTabs + '\\n    renderCurrentView();');

  // Replace Login Modal
  const oldLoginModal = `function openAccessModal() {`;
  // We'll replace the inside of the function using regex
  const regexModal = /function openAccessModal\(\) \{[\s\S]*?\}\s+async function handleAccessSubmit\(event\) \{[\s\S]*?closeModal\(\);\s*\}/;
  
  const newLoginModal = `
function openAccessModal() {
    openModal(\`
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Acesso</p>
                    <h3>Login Profissional</h3>
                </div>
            </div>
            <form id="access-form" class="modal-form">
                <label>E-mail
                    <input name="email" type="email" placeholder="nome@agencia.com" required>
                </label>
                <label>Senha
                    <input name="password" type="password" placeholder="******" required>
                </label>
                <div id="login-error" class="text-secondary" style="color:var(--color-danger);font-size:12px;margin-top:-8px;"></div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="login-btn">Entrar na Plataforma</button>
                    <!-- Dev helper because DB might not be seeded yet -->
                    <button type="button" class="btn btn-secondary" onclick="document.querySelector('[name=email]').value='admin@santiz.com';document.querySelector('[name=password]').value='admin123';">Preencher Admin</button>
                </div>
            </form>
        </div>
    \`);
    document.getElementById('access-form')?.addEventListener('submit', handleAccessSubmit);
}

async function handleAccessSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    
    btn.disabled = true;
    err.textContent = 'Autenticando...';
    
    try {
        const formData = new FormData(form);
        const { user, error } = await api().loginUser(formData.get('email'), formData.get('password'));
        
        if (error) throw new Error(error);
        if (!user) throw new Error('Falha catastrófica no login');

        const session = {
            id: user.id,
            name: user.name,
            role: user.role,
            clientId: user.client_id
        };

        persistSession(session);
        await initApp(); // fully reload UI state safely
        closeModal();
    } catch(e) {
        err.textContent = e.message;
        btn.disabled = false;
    }
}
`;

  appCode = appCode.replace(regexModal, newLoginModal);
  
  // Add renderUsers function
  const renderUsersCode = `
async function renderUsers() {
    state.activeView = 'users';
    const container = document.getElementById('main-content-area');
    if (!container) return;
    
    if (!isAdmin()) {
        container.innerHTML = '<div class="empty-state">Sem permissão.</div>';
        return;
    }

    container.innerHTML = '<div class="loading-dots" style="padding: 24px;">Carregando usuários...</div>';
    
    const users = await api().getUsers?.() || [];
    
    let rows = users.map(u => {
        const clientObj = getClientById(u.client_id);
        const clientName = clientObj ? clientObj.name : (u.role === 'admin' ? 'Admin Global' : 'Sem cliente vinculado');
        return \`
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 12px;">\${u.name}</td>
                <td style="padding: 12px;">\${u.email}</td>
                <td style="padding: 12px;">\${u.role}</td>
                <td style="padding: 12px;">\${clientName}</td>
                <td style="padding: 12px; text-align:right;">
                    <button class="btn btn-secondary" onclick="deleteSysUser('\${u.id}')" style="color:var(--color-danger); border:none;" title="Deletar">Remover</button>
                </td>
            </tr>
        \`;
    }).join('');

    container.innerHTML = \`
        <div style="background: #FFFFFF; padding: 32px; border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>
                    <p class="eyebrow">Gestão</p>
                    <h3>Acesso e Usuários</h3>
                </div>
                <button class="btn btn-primary" onclick="openNewUserModal()">
                    <i data-lucide="user-plus"></i> Convidar Usuário
                </button>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <thead>
                    <tr style="border-bottom: 2px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02);">
                        <th style="padding: 12px;">Nome</th>
                        <th style="padding: 12px;">E-mail</th>
                        <th style="padding: 12px;">Perfil</th>
                        <th style="padding: 12px;">Vinculado a:</th>
                        <th style="padding: 12px; text-align:right;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    \${rows || '<tr><td colspan="5" style="text-align:center; padding: 24px;">Nenhum usuário cadastrado.</td></tr>'}
                </tbody>
            </table>
        </div>
    \`;
    lucide.createIcons();
}

window.deleteSysUser = async (id) => {
    if(!confirm('Certeza?')) return;
    await api().deleteUser?.(id);
    renderUsers();
};

window.openNewUserModal = () => {
    const clientOptions = state.data.clients.map(client => \`
        <option value="\${client.id}">\${client.name}</option>
    \`).join('');

    openModal(\`
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Novo Acesso</p>
                    <h3>Criar Perfil</h3>
                </div>
                <button class="icon-btn" onclick="closeModal()" aria-label="Fechar">x</button>
            </div>
            <form id="new-user-form" class="modal-form">
                <label>Nome Completo
                    <input name="name" type="text" required>
                </label>
                <label>E-mail de Login
                    <input name="email" type="email" required>
                </label>
                <label>Senha Inicial
                    <input name="password" type="text" value="\${Math.random().toString(36).slice(-8)}" required>
                </label>
                <label>Tipo de Perfil
                    <select name="role">
                        <option value="viewer">Cliente Observador (Somente leitura)</option>
                        <option value="approver">Cliente Aprovador (Aprova posts e comenta)</option>
                        <option value="editor">Criador / Editor (Sobe posts)</option>
                        <option value="admin">Administrador (Agência Total)</option>
                    </select>
                </label>
                <label>Vincular Cliente (Ignorado se admin)
                    <select name="client_id">
                        <option value="">Acesso Global / Sem cliente</option>
                        \${clientOptions}
                    </select>
                </label>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="save-usr-btn">Cadastrar Perfil</button>
                </div>
            </form>
        </div>
    \`);
    
    document.getElementById('new-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        document.getElementById('save-usr-btn').disabled = true;
        
        await api().createUser?.({
            name: f.get('name'),
            email: f.get('email'),
            password: f.get('password'),
            role: f.get('role'),
            client_id: f.get('client_id') || null
        });
        
        closeModal();
        renderUsers();
    });
};
`;
  appCode += renderUsersCode;

  fs.writeFileSync('js/app-enhanced.js', appCode);
}

console.log('Frontend Auth and Admin panel patched.');
