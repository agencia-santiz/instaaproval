// app-enhanced.js - workflow dashboard with calendar details and post intake

let state = {
    currentClient: 'c1',
    activeView: 'feed',
    currentDate: new Date(),
    calendarClientFilter: 'current',
    selectedCalendarDay: null,
    carousels: {},
    statusFilter: 'all',
    auth: null,
    loading: false,
    data: { clients: [], posts: [], allPosts: [] }
};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initPreloader();
    initApp();
});

function api() {
    return window.supabase || {};
}

function restoreSession() {
    try {
        const raw = localStorage.getItem('instaaproval_session');
        if (!raw) {
            state.auth = null;
            return;
        }
        const session = JSON.parse(raw);
        // Validate session structure (new auth system has id or email)
        if (!session.id && !session.email && session.name) {
            console.log('Legacy session detected, clearing...');
            localStorage.removeItem('instaaproval_session');
            state.auth = null;
        } else {
            state.auth = session;
        }
    } catch (error) {
        state.auth = null;
    }
}

function persistSession(session) {
    state.auth = session;
    localStorage.setItem('instaaproval_session', JSON.stringify(session));
}

function isAdmin() {
    return state.auth?.role === 'admin';
}

function canCreatePosts() {
    return state.auth && (state.auth.role === 'admin' || state.auth.role === 'editor');
}

function canApprovePosts() {
    return state.auth && (state.auth.role === 'admin' || state.auth.role === 'approver');
}

function canCommentPosts() {
    return !!state.auth && state.auth.role !== 'viewer';
}

function canManageClients() {
    return !!state.auth && state.auth.role === 'admin';
}

function applyAuthScope() {
    if (!state.auth) return;
    if (state.auth.clientId && !isAdmin()) {
        state.data.clients = state.data.clients.filter(client => client.id === state.auth.clientId);
        if (state.data.clients.length > 0) {
            state.currentClient = state.data.clients[0].id;
        }
    }
}

function normalizeClient(client) {
    return {
        id: client.id,
        name: client.name,
        avatar: client.avatar_url || client.instagram_profile_photo || client.avatar || '',
        color: client.color || '#BA0C2F',
        instagramUsername: client.instagram_username || '',
        instagramProfilePhoto: client.instagram_profile_photo || client.avatar_url || ''
    };
}

function isApiError(payload) {
    if (!payload) return true;
    if (payload.error || payload.message) return true;
    return false;
}

function renderTopbarUser() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;

    const oldChip = actions.querySelector('.session-chip');
    const oldSwitch = actions.querySelector('.btn-switch-access');
    const oldClientBtn = actions.querySelector('.btn-manage-client');
    if (oldChip) oldChip.remove();
    if (oldSwitch) oldSwitch.remove();
    if (oldClientBtn) oldClientBtn.remove();

    const badge = document.createElement('span');
    badge.className = 'session-chip';
    badge.textContent = state.auth
        ? `${state.auth.name} · ${state.auth.role}`
        : 'Sem acesso';

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-secondary';
    logoutBtn.type = 'button';
    logoutBtn.innerHTML = '<i data-lucide="log-out"></i> Sair';
    logoutBtn.onclick = () => {
        if(confirm('Deseja realmente sair?')) {
            localStorage.removeItem('instaaproval_session');
            location.reload();
        }
    };

    actions.prepend(logoutBtn);
    actions.prepend(badge);

    if (canManageClients()) {
        const clientBtn = document.createElement('button');
        clientBtn.className = 'btn btn-secondary btn-manage-client';
        clientBtn.type = 'button';
        clientBtn.innerHTML = '<i data-lucide="users-round"></i> Novo Cliente';
        clientBtn.onclick = () => openNewClientModal();
        actions.prepend(clientBtn);
    }

    const postBtn = actions.querySelector('button.btn.btn-primary');
    if (postBtn) {
        postBtn.disabled = !canCreatePosts();
        if (!canCreatePosts()) {
            postBtn.title = 'Seu perfil nao pode criar posts';
        } else {
            postBtn.title = '';
        }
    }
}

async function initApp() {
    showLoading();
    restoreSession();

    // AUTH DISABLED — auto-assign admin session for development
    if (!state.auth) {
        persistSession({ id: 'dev', name: 'Admin', email: 'admin@santiz.com', role: 'admin', clientId: null });
    }

    await loadData();
    applyAuthScope();
    setTopbarTitle(getClientById(state.currentClient)?.name || 'Cliente');
    renderClientList();
    
    // Visibility logic for Admins and Clients
    if (isAdmin()) {
        const uTab = document.getElementById('nav-users');
        if (uTab) uTab.style.display = 'flex';
    } else {
        const uTab = document.getElementById('nav-users');
        if (uTab) uTab.style.display = 'none';
        
        // Non-admins shouldn't see the client switcher sidebar
        const clientList = document.getElementById('client-list');
        const clientGroup = clientList?.closest('.nav-group');
        if (clientGroup && state.auth && state.auth.clientId) {
            clientGroup.style.display = 'none';
        }
    }

    renderCurrentView();
    setupEventListeners();
    addGrainOverlay();
    injectModalRoot();
    renderTopbarUser();
    initScrollAnimator();
    initScrollProgress();
    dismissPreloader();

    // AUTH DISABLED — login modal skipped
    // if (!state.auth) {
    //     openAccessModal();
    // }
}


async function loadData() {
    try {
        const clients = await api().getClients?.();
        if (Array.isArray(clients) && clients.length > 0) {
            state.data.clients = clients.map(normalizeClient);

            const hasCurrentClient = state.data.clients.some(client => client.id === state.currentClient);
            state.currentClient = hasCurrentClient ? state.currentClient : state.data.clients[0].id;
            const posts = await hydratePosts(state.currentClient);
            state.data.posts = normalizePosts(Array.isArray(posts) ? posts : []);
            await refreshAllPostsCache(true);
            setTopbarTitle(getClientById(state.currentClient)?.name || state.data.clients[0].name);
            return;
        }
    } catch (error) {
        console.warn('Falling back to mock data:', error);
    }

    state.data.clients = MOCK_DATA.clients.map(client => normalizeClient({
        ...client,
        avatar_url: client.avatar,
        instagram_profile_photo: client.avatar,
        instagram_username: client.instagramUsername || ''
    }));
    state.data.posts = normalizePosts(MOCK_DATA.posts);
    state.data.allPosts = normalizePosts(MOCK_DATA.posts);
    setTopbarTitle(state.data.clients[0]?.name || 'Cliente');
}

function normalizePosts(posts) {
    return posts.map(post => ({
        id: post.id,
        clientId: post.client_id || post.clientId,
        type: post.type || 'image',
        status: post.status || 'pending',
        date: post.date,
        username: post.username || '',
        userAvatar: post.user_avatar || post.userAvatar || '',
        media: Array.isArray(post.media) ? post.media : [],
        likes: Number(post.likes || 0),
        caption: post.caption || '',
        ctaText: post.cta_text || post.ctaText || '',
        comments: Array.isArray(post.comments) ? post.comments : [],
        statusHistory: Array.isArray(post.statusHistory) ? post.statusHistory : []
    }));
}

function setTopbarTitle(clientName) {
    const el = document.getElementById('current-view-title');
    if (el) el.textContent = `Cliente: ${clientName}`;
}

function addGrainOverlay() {
    if (!document.querySelector('.grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'grain-overlay';
        document.body.appendChild(grain);
    }
}

function injectModalRoot() {
    if (!document.getElementById('modal-root')) {
        const root = document.createElement('div');
        root.id = 'modal-root';
        document.body.appendChild(root);
    }
}

function showLoading() {
    const container = document.getElementById('main-content-area');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding: 60px;">
            <div class="loading-skeleton" style="width:48px; height:48px; border-radius:50%; margin:0 auto 16px;"></div>
            <p class="text-secondary loading-dots">Carregando</p>
        </div>
    `;
}

function renderCurrentView() {
    if (state.activeView === 'calendar') {
        renderCalendar();
        return;
    }
    if (state.activeView === 'analytics') {
        renderAnalytics();
        return;
    }
    if (state.activeView === 'guidelines') {
        renderGuidelines();
        return;
    }
    if (state.activeView === 'users') {
        renderUsers();
        return;
    }
    renderFeed();
}

function renderClientList() {
    const listEl = document.getElementById('client-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (!state.data.clients.length) {
        listEl.innerHTML = '<div class="text-secondary" style="padding: 16px; font-size: 14px;">Nenhum cliente encontrado.</div>';
        return;
    }

    state.data.clients.forEach((client, index) => {
        const link = document.createElement('a');
        link.className = `nav-link ${state.currentClient === client.id ? 'active' : ''}`;
        link.setAttribute('role', 'button');
        link.setAttribute('tabindex', '0');
        link.setAttribute('aria-pressed', state.currentClient === client.id);
        link.innerHTML = `
            <div class="client-dot" style="background: ${client.color || getColorForClient(client.id)}"></div>
            ${client.name}
        `;
        link.onclick = () => selectClient(client.id, client.name);
        link.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectClient(client.id, client.name);
            }
        });
        link.style.animationDelay = `${index * 50}ms`;
        listEl.appendChild(link);
    });
}

async function selectClient(clientId, clientName) {
    if (state.auth && !isAdmin() && state.auth.clientId !== clientId) return;
    state.currentClient = clientId;
    state.calendarClientFilter = 'current';
    state.selectedCalendarDay = null;
    renderClientList();
    setTopbarTitle(clientName);
    await loadClientPosts(clientId);
}

async function loadClientPosts(clientId) {
    showLoading();
    try {
        const posts = await hydratePosts(clientId);
        state.data.posts = normalizePosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
        console.warn('Could not load posts from API:', error);
        state.data.posts = normalizePosts(MOCK_DATA.posts.filter(post => post.clientId === clientId));
    }
    await refreshAllPostsCache();
    renderCurrentView();
}

async function refreshAllPostsCache(force = false) {
    if (!isAdmin()) {
        state.data.allPosts = [...state.data.posts];
        return;
    }
    if (!force && Array.isArray(state.data.allPosts) && state.data.allPosts.length > 0) return;
    try {
        const posts = await hydratePosts();
        state.data.allPosts = normalizePosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
        console.warn('Could not load all posts cache:', error);
        if (!Array.isArray(state.data.allPosts) || state.data.allPosts.length === 0) {
            state.data.allPosts = [...state.data.posts];
        }
    }
}

async function hydratePosts(clientId) {
    const posts = await api().getPosts?.(clientId);
    if (!Array.isArray(posts) || !posts.length) return posts || [];

    const hydrated = await Promise.all(posts.map(async post => {
        const comments = await api().getComments?.(post.id);
        const statusHistory = await api().getStatusHistory?.(post.id);
        return {
            ...post,
            comments: Array.isArray(comments) ? comments : [],
            statusHistory: Array.isArray(statusHistory) ? statusHistory : []
        };
    }));

    return hydrated;
}

function getColorForClient(id) {
    const colors = { c1: '#C9A962', c2: '#ec4899', c3: '#3b82f6' };
    return colors[id] || '#BA0C2F';
}

function getClientPosts() {
    return state.data.posts.filter(post => post.clientId === state.currentClient);
}

function getPostPoolForCalendar() {
    if (!isAdmin()) return state.data.posts;
    return Array.isArray(state.data.allPosts) && state.data.allPosts.length > 0
        ? state.data.allPosts
        : state.data.posts;
}

function getCalendarScopedPosts() {
    const postPool = getPostPoolForCalendar();
    if (state.calendarClientFilter === 'all') {
        return [...postPool];
    }
    const clientId = state.calendarClientFilter === 'current'
        ? state.currentClient
        : state.calendarClientFilter;
    return postPool.filter(post => post.clientId === clientId);
}

function getClientById(clientId) {
    return state.data.clients.find(client => client.id === clientId);
}

function getPostById(postId) {
    const allPosts = getPostPoolForCalendar();
    const foundInPool = allPosts.find(post => post.id === postId);
    if (foundInPool) return foundInPool;
    return state.data.posts.find(post => post.id === postId);
}

function syncPostAcrossCaches(postId, updater) {
    [state.data.posts, state.data.allPosts].forEach(collection => {
        if (!Array.isArray(collection)) return;
        const post = collection.find(item => item.id === postId);
        if (!post) return;
        updater(post);
    });
}

function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays < 7) return `${diffDays}d atras`;
    return dateStr;
}

function formatDateLabel(dateStr) {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function getStatusMeta(status) {
    const map = {
        pending: {
            text: 'Aprovacao pendente',
            badgeClass: 'status-pending',
            color: 'var(--color-warning)'
        },
        approved: {
            text: 'Aprovado',
            badgeClass: 'status-approved',
            color: 'var(--color-success)'
        },
        changes_requested: {
            text: 'Solicitar alteracao',
            badgeClass: 'status-changes-requested',
            color: 'var(--color-review)'
        },
        rejected: {
            text: 'Rejeitado',
            badgeClass: 'status-rejected',
            color: 'var(--color-danger)'
        }
    };
    return map[status] || map.pending;
}

function formatDateTime(value) {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

window.setStatusFilter = filter => {
    state.statusFilter = filter;
    renderFeed();
};

function renderFeed() {
    state.activeView = 'feed';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const clientPosts = getClientPosts();
    const total = clientPosts.length;
    const pending = clientPosts.filter(post => post.status === 'pending').length;
    const approved = clientPosts.filter(post => post.status === 'approved').length;
    const changesRequested = clientPosts.filter(post => post.status === 'changes_requested').length;
    const rejected = clientPosts.filter(post => post.status === 'rejected').length;

    let posts = [...clientPosts];
    if (state.statusFilter !== 'all') {
        posts = posts.filter(post => post.status === state.statusFilter);
    }

    const metricsHTML = `
        <div class="metrics-bar" data-animate-stagger role="region" aria-label="Metricas do cliente">
            <div class="metric-card">
                <div class="metric-value">${total}</div>
                <div class="metric-label">Total</div>
            </div>
            <div class="metric-card metric-warning">
                <div class="metric-value">${pending}</div>
                <div class="metric-label">Pendentes</div>
            </div>
            <div class="metric-card metric-success">
                <div class="metric-value">${approved}</div>
                <div class="metric-label">Aprovados</div>
            </div>
            <div class="metric-card metric-review">
                <div class="metric-value">${changesRequested}</div>
                <div class="metric-label">Alteracao</div>
            </div>
            <div class="metric-card metric-danger">
                <div class="metric-value">${rejected}</div>
                <div class="metric-label">Rejeitados</div>
            </div>
        </div>
    `;

    const filterHTML = `
        <div class="filter-bar" role="group" aria-label="Filtrar por status">
            <button class="filter-btn ${state.statusFilter === 'all' ? 'active' : ''}" onclick="setStatusFilter('all')" aria-pressed="${state.statusFilter === 'all'}">Todos</button>
            <button class="filter-btn ${state.statusFilter === 'pending' ? 'active' : ''}" onclick="setStatusFilter('pending')" aria-pressed="${state.statusFilter === 'pending'}">Pendentes</button>
            <button class="filter-btn ${state.statusFilter === 'approved' ? 'active' : ''}" onclick="setStatusFilter('approved')" aria-pressed="${state.statusFilter === 'approved'}">Aprovados</button>
            <button class="filter-btn ${state.statusFilter === 'changes_requested' ? 'active' : ''}" onclick="setStatusFilter('changes_requested')" aria-pressed="${state.statusFilter === 'changes_requested'}">Solicitar alteracao</button>
            <button class="filter-btn ${state.statusFilter === 'rejected' ? 'active' : ''}" onclick="setStatusFilter('rejected')" aria-pressed="${state.statusFilter === 'rejected'}">Rejeitados</button>
        </div>
    `;

    if (!posts.length) {
        container.innerHTML = metricsHTML + filterHTML + `<div class="empty-state" role="status" aria-live="polite">Nenhum post encontrado.</div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = metricsHTML + filterHTML + '<div class="feed-grid" id="feed-grid-container"></div>';
    const gridContainer = document.getElementById('feed-grid-container');
    posts.forEach(post => gridContainer.appendChild(createPostInterface(post)));
    lucide.createIcons();
    rescanAnimations();
}

function createPostInterface(post) {
    const el = document.createElement('div');
    el.className = 'feed-card';
    el.onclick = () => openPostModal(post.id);

    const status = getStatusMeta(post.status);
    const mediaUrl = post.media && post.media.length > 0 ? post.media[0] : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
    
    // check if it's a video/reels
    const isVideo = post.type === 'reels' || mediaUrl.match(/\.(mp4|webm|ogg)$/i);
    let mediaEl = isVideo ? `<video class="feed-card-img" src="${mediaUrl}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>` : `<img class="feed-card-img" src="${mediaUrl}" loading="lazy">`;

    let cleanCaption = (post.caption || '').replace(/\n/g, ' ').substring(0, 60);

    el.innerHTML = `
        ${mediaEl}
        <div class="feed-card-body">
            <div class="feed-card-header">
                <span class="feed-card-title">${formatDateLabel(post.date)}</span>
                <span class="status-badge ${status.badgeClass}" style="align-self: flex-start; margin-top:4px;">${status.text}</span>
            </div>
            <div style="font-size: 13px; color: var(--palette-text-secondary); margin-top: 4px;">
                ${cleanCaption}...
            </div>
        </div>
    `;

    return el;
}

window.openPostModal = (postId) => {
    const post = state.data.posts.find(p => p.id === postId);
    if (!post) return;

    const status = getStatusMeta(post.status);

    const commentsMarkup = (post.comments || []).map(comment => {
        const timeAgo = getTimeAgo(comment.date);
        return `
            <div class="comment-box" role="article" aria-label="Comentario de ${comment.author}">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <b>${comment.author}</b>
                    <span class="text-secondary" style="font-size:11px" title="${comment.date}">${timeAgo}</span>
                </div>
                ${comment.text}
            </div>
        `;
    }).join('');

    const historyMarkup = (post.statusHistory || []).map(item => {
        const fromMeta = item.from_status ? getStatusMeta(item.from_status).text : 'Sem status';
        const toMeta = getStatusMeta(item.to_status).text;
        return `
            <div class="history-item">
                <div class="history-title">${fromMeta} -> ${toMeta}</div>
                <div class="history-meta">${item.actor_name || 'Sistema'} - ${formatDateTime(item.created_at)}</div>
            </div>
        `;
    }).join('');

    const modalHTML = `
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-shell">
            <div class="modal-card modal-card-preview">
                <div class="modal-header">
                    <div>
                        <h3>Aprovação de Postagem</h3>
                        <div class="text-secondary" style="margin-top:4px;">Planejamento: ${formatDateLabel(post.date)}</div>
                    </div>
                    <button class="icon-btn" onclick="closeModal()" aria-label="Fechar"><i data-lucide="x"></i></button>
                </div>
                <div class="calendar-preview-wrap">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        ${buildInstagramCard(post)}
                    </div>
                    <div class="action-col" style="box-shadow:none; padding:0; background:transparent;">
                        <div class="action-header" style="border-bottom:none; flex-direction:column; gap:var(--space-2);">
                            <span class="status-badge ${status.badgeClass}">${status.text}</span>
                        </div>
                        
                        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom: 24px;">
                            <button class="btn btn-success" style="flex:1; padding:10px;" onclick="updateStatus('${post.id}', 'approved'); closeModal();" ${canApprovePosts() ? '' : 'disabled'}><i data-lucide="check"></i> Aprovar</button>
                            <button class="btn btn-warning" style="flex:1; padding:10px;" onclick="updateStatus('${post.id}', 'changes_requested'); closeModal();" ${canApprovePosts() ? '' : 'disabled'}><i data-lucide="message-square"></i> Alteração</button>
                            <button class="btn btn-danger" style="flex:1; padding:10px;" onclick="updateStatus('${post.id}', 'rejected'); closeModal();" ${canApprovePosts() ? '' : 'disabled'}><i data-lucide="x"></i> Rejeitar</button>
                            ${isAdmin() ? `<button class="btn btn-secondary" style="padding:10px; border-color: var(--color-danger); color: var(--color-danger);" onclick="deletePost('${post.id}'); closeModal();"><i data-lucide="trash-2"></i></button>` : ''}
                        </div>

                        <h4>Comentários</h4>
                        <div class="feedback-list" id="comments-${post.id}" style="max-height: 200px; overflow-y:auto; margin: 12px 0;">
                            ${commentsMarkup || '<div class="text-secondary">Nenhum comentário.</div>'}
                        </div>

                        <div class="comment-input-area" style="padding-top:12px;">
                            <input type="text" class="comment-input" id="input-${post.id}" placeholder="Seu feedback..." ${canCommentPosts() ? '' : 'disabled'}>
                            <button class="btn btn-primary" onclick="addComment('${post.id}')" ${canCommentPosts() ? '' : 'disabled'}><i data-lucide="send"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const root = document.getElementById('modal-root');
    if (root) {
        root.innerHTML = modalHTML;
        root.classList.add('open');
        document.body.classList.add('modal-open');
        lucide.createIcons();
    }
};

function buildInstagramCard(post) {
    state.carousels[post.id] = state.carousels[post.id] || 0;
    const isCarousel = post.type === 'carousel' && post.media.length > 1;
    const isReels = post.type === 'reels';

    let mediaHTML = '';
    let indicatorsHTML = '';

    if (isReels) {
        const videoSrc = post.media[0] || '';
        mediaHTML = `
            <div class="ig-video-wrapper">
                <video id="video-${post.id}" poster="${videoSrc}">
                    <source src="${videoSrc}" type="video/mp4">
                </video>
                <div class="ig-reels-badge">
                    <i data-lucide="play" style="width:12px;height:12px;"></i> REELS
                </div>
                <div class="ig-video-controls">
                    <button class="ig-play-btn" onclick="toggleVideo('${post.id}')" aria-label="Reproduzir video">
                        <i data-lucide="play"></i>
                    </button>
                </div>
            </div>
        `;
    } else if (isCarousel) {
        mediaHTML = post.media.map(src => `<img class="ig-media-item" src="${src}" alt="Slide" loading="lazy">`).join('');
        indicatorsHTML = `
            <div class="ig-carousel-indicators" id="ind-${post.id}" role="group" aria-label="Navegar carrossel">
                ${post.media.map((_, index) => `<div class="ig-indicator ${index === 0 ? 'active' : ''}" role="button" tabindex="0"></div>`).join('')}
            </div>
        `;
    } else {
        const imageSrc = post.media[0] || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
        mediaHTML = `<img class="ig-media-item" src="${imageSrc}" alt="Post" loading="lazy">`;
    }

    let formattedCaption = (post.caption || '').replace(/#([\w]+)/g, '<span style="color:var(--color-ig-blue);">#$1</span>');
    formattedCaption = formattedCaption.replace(/\n/g, '<br>');

    return `
        <div class="ig-post-wrapper">
            <div class="ig-header">
                <img class="ig-avatar" src="${post.userAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop'}" alt="Avatar">
                <div class="ig-username">${post.username}</div>
                <i data-lucide="more-horizontal" class="ig-dots"></i>
            </div>

            <div class="ig-media-container">
                <div class="ig-media-track" id="track-${post.id}">
                    ${mediaHTML}
                </div>
                ${isCarousel ? `
                    <div class="ig-carousel-btn ig-carousel-prev" onclick="moveCarousel('${post.id}', -1)" style="display:none;" id="prev-${post.id}">&lt;</div>
                    <div class="ig-carousel-btn ig-carousel-next" onclick="moveCarousel('${post.id}', 1)" id="next-${post.id}">&gt;</div>
                    ${indicatorsHTML}
                ` : ''}
                ${post.ctaText ? `
                    <div class="ig-cta-tag"><i data-lucide="shopping-bag" style="width:14px;height:14px;"></i> ${post.ctaText}</div>
                ` : ''}
            </div>

            <div class="ig-actions">
                <div class="ig-actions-left">
                    <svg class="ig-action-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <svg class="ig-action-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <svg class="ig-action-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </div>
                <div>
                    <svg class="ig-action-icon" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </div>
            </div>

            <div class="ig-likes">${Number(post.likes || 0).toLocaleString()} curtidas</div>
            <div class="ig-caption-container">
                <span class="ig-caption-username">${post.username}</span> ${formattedCaption}
            </div>
            ${post.comments?.length ? `<div class="ig-comments-count">Ver todos os ${post.comments.length} comentarios</div>` : ''}
            <div class="ig-timestamp">HA 2 HORAS</div>
        </div>
    `;
}

window.moveCarousel = (postId, dir) => {
    const post = state.data.posts.find(item => item.id === postId);
    if (!post || !post.media?.length) return;

    const maxIdx = post.media.length - 1;
    let idx = state.carousels[postId] || 0;
    idx += dir;
    if (idx < 0) idx = 0;
    if (idx > maxIdx) idx = maxIdx;
    state.carousels[postId] = idx;

    const track = document.getElementById(`track-${postId}`);
    if (track) track.style.transform = `translateX(-${idx * 100}%)`;

    const prev = document.getElementById(`prev-${postId}`);
    const next = document.getElementById(`next-${postId}`);
    if (prev) prev.style.display = idx === 0 ? 'none' : 'flex';
    if (next) next.style.display = idx === maxIdx ? 'none' : 'flex';

    const indicatorContainer = document.getElementById(`ind-${postId}`);
    if (indicatorContainer) {
        Array.from(indicatorContainer.children).forEach((dot, index) => {
            dot.className = `ig-indicator ${index === idx ? 'active' : ''}`;
        });
    }
};

window.toggleVideo = postId => {
    const video = document.getElementById(`video-${postId}`);
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
};

window.updateStatus = async (postId, status) => {
    if (!canApprovePosts()) return;
    const post = getPostById(postId);
    if (!post) return;

    const previousStatus = post.status;
    const historyEntry = {
        from_status: previousStatus,
        to_status: status,
        actor_name: state.auth?.name || 'Sistema',
        created_at: new Date().toISOString()
    };
    syncPostAcrossCaches(postId, item => {
        item.status = status;
        if (!Array.isArray(item.statusHistory)) item.statusHistory = [];
        item.statusHistory.unshift({ ...historyEntry });
    });

    try {
        await api().updatePostStatus?.(postId, status, state.auth?.name || 'Sistema');
    } catch (error) {
        console.warn('Could not update status:', error);
    }

    renderCurrentView();
    lucide.createIcons();
};

window.addComment = async postId => {
    if (!canCommentPosts()) return;
    const input = document.getElementById(`input-${postId}`);
    if (!input || !input.value.trim()) return;

    const post = getPostById(postId);
    if (!post) return;

    const newComment = {
        author: 'Voce (Admin)',
        text: input.value.trim(),
        date: new Date().toLocaleDateString('pt-BR'),
        type: 'internal'
    };

    syncPostAcrossCaches(postId, item => {
        if (!Array.isArray(item.comments)) item.comments = [];
        item.comments.push({ ...newComment });
    });

    try {
        await api().addComment?.(postId, newComment.author, newComment.text, newComment.type);
    } catch (error) {
        console.warn('Could not save comment:', error);
    }

    input.value = '';
    renderCurrentView();
    lucide.createIcons();
};

function setupEventListeners() {
    document.getElementById('nav-feed')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'feed';
        renderFeed();
    });

    document.getElementById('nav-calendario')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'calendar';
        selectFirstCalendarDay();
        renderCalendar();
    });

    document.getElementById('nav-analytics')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'analytics';
        renderCurrentView();
    });
}

function selectFirstCalendarDay() {
    const scopedPosts = getCalendarScopedPosts();
    const currentMonthPosts = scopedPosts.filter(post => {
        const date = new Date(`${post.date}T12:00:00`);
        return date.getMonth() === state.currentDate.getMonth() && date.getFullYear() === state.currentDate.getFullYear();
    });

    state.selectedCalendarDay = currentMonthPosts[0]?.date || null;
}

function goToMonth(delta) {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + delta, 1);
    selectFirstCalendarDay();
    renderCalendar();
}

window.goToMonth = goToMonth;

function renderCalendar() {
    state.activeView = 'calendar';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const currentMonth = state.currentDate.getMonth();
    const currentYear = state.currentDate.getFullYear();
    const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const posts = getCalendarScopedPosts();
    const canSeeAllClients = isAdmin();
    const selectedFilter = state.calendarClientFilter || 'current';
    const calendarClientOptions = [
        canSeeAllClients ? `<option value="all" ${selectedFilter === 'all' ? 'selected' : ''}>Todos os clientes</option>` : '',
        `<option value="current" ${selectedFilter === 'current' ? 'selected' : ''}>Cliente atual</option>`,
        ...state.data.clients.map(client => `<option value="${client.id}" ${selectedFilter === client.id ? 'selected' : ''}>${client.name}</option>`)
    ].join('');

    const postsByDay = {};
    posts.forEach(post => {
        const date = new Date(`${post.date}T12:00:00`);
        if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return;
        const day = date.getDate();
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push(post);
    });

    if (!state.selectedCalendarDay) {
        selectFirstCalendarDay();
    }

    let daysHTML = '';
    for (let index = 0; index < firstDay; index += 1) {
        daysHTML += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dayPosts = postsByDay[day] || [];
        const hasPosts = dayPosts.length > 0;
        const dayDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = state.selectedCalendarDay === dayDate;
        const postsList = dayPosts.map(post => {
            const statusColor = getStatusMeta(post.status).color;
            return `<div class="calendar-post-dot" style="background:${statusColor}" title="${(post.caption || '').substring(0, 30)}"></div>`;
        }).join('');

        daysHTML += `
            <button class="calendar-day ${hasPosts ? 'has-posts' : ''} ${isSelected ? 'selected' : ''}" type="button" onclick="selectCalendarDay('${dayDate}')">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-posts">${postsList}</div>
            </button>
        `;
    }

    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const visiblePosts = posts.filter(post => post.date.startsWith(monthKey));

    container.innerHTML = `
        <div class="calendar-container">
            <div class="calendar-toolbar">
                <div>
                    <p class="eyebrow">Visao mensal</p>
                    <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                </div>
                <div class="calendar-nav">
                    <select id="calendar-client-filter" class="calendar-client-select" onchange="setCalendarClientFilter(this.value)">
                        ${calendarClientOptions}
                    </select>
                    <button class="btn btn-secondary" onclick="exportCalendarToICS()" aria-label="Exportar para Calendar" title="Exportar para Google Calendar / iOS"><i data-lucide="calendar-plus"></i> Exportar</button>
                    <button class="btn btn-secondary" onclick="goToMonth(-1)" aria-label="Mes anterior">Anterior</button>
                    <button class="btn btn-secondary" onclick="goToMonth(1)" aria-label="Proximo mes">Proximo</button>
                </div>
            </div>
            <div class="calendar-layout">
                <div>
                    <div class="calendar-weekdays">
                        ${dayNames.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
                    </div>
                    <div class="calendar-grid">
                        ${daysHTML}
                    </div>
                    <div class="calendar-legend">
                        <span class="legend-item"><span class="legend-dot pending"></span> Pendente</span>
                        <span class="legend-item"><span class="legend-dot approved"></span> Aprovado</span>
                        <span class="legend-item"><span class="legend-dot changes-requested"></span> Alteracao</span>
                        <span class="legend-item"><span class="legend-dot rejected"></span> Rejeitado</span>
                    </div>
                </div>
                <aside class="calendar-sidebar">
                    ${renderCalendarDetails(state.selectedCalendarDay, postsByDay)}
                    <div class="month-summary">
                        <h4>Resumo do mes</h4>
                        <div class="month-summary-grid">
                            <div><strong>${visiblePosts.length}</strong><span>Posts</span></div>
                            <div><strong>${visiblePosts.filter(post => post.status === 'pending').length}</strong><span>Pendentes</span></div>
                            <div><strong>${visiblePosts.filter(post => post.status === 'approved').length}</strong><span>Aprovados</span></div>
                            <div><strong>${visiblePosts.filter(post => post.status === 'changes_requested').length}</strong><span>Alteracao</span></div>
                            <div><strong>${visiblePosts.filter(post => post.status === 'rejected').length}</strong><span>Rejeitados</span></div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    `;

    lucide.createIcons();
}

window.selectCalendarDay = dayDate => {
    state.selectedCalendarDay = dayDate;
    renderCalendar();
};

function renderCalendarDetails(selectedDay, postsByDay) {
    if (!selectedDay) {
        return `
            <div class="calendar-detail-card">
                <p class="eyebrow">Selecione uma data</p>
                <h4>Detalhes do dia</h4>
                <p class="text-secondary">Clique em um dia com posts para ver a fila de aprovacao e os comentarios daquele planejamento.</p>
            </div>
        `;
    }

    const day = new Date(`${selectedDay}T12:00:00`);
    const dayNumber = day.getDate();
    const dayPosts = postsByDay[dayNumber] || [];

    if (!dayPosts.length) {
        return `
            <div class="calendar-detail-card">
                <p class="eyebrow">Dia selecionado</p>
                <h4>${formatDateLabel(selectedDay)}</h4>
                <p class="text-secondary">Nao ha posts agendados para esta data.</p>
            </div>
        `;
    }

    return `
        <div class="calendar-detail-card">
            <p class="eyebrow">Dia selecionado</p>
            <h4>${formatDateLabel(selectedDay)}</h4>
            <div class="day-post-list">
                ${dayPosts.map(post => `
                    <button class="day-post-item" type="button" onclick="openCalendarPostPreview('${post.id}')">
                        <span class="day-post-title">${post.username}</span>
                        <span class="day-post-meta">${post.type} - ${getStatusMeta(post.status).text}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

window.setCalendarClientFilter = async filter => {
    state.calendarClientFilter = filter || 'current';
    if (isAdmin() && state.calendarClientFilter !== 'current') {
        await refreshAllPostsCache(true);
    }
    state.selectedCalendarDay = null;
    renderCalendar();
};

window.openCalendarPostPreview = postId => {
    const post = getPostById(postId);
    if (!post) return;
    const status = getStatusMeta(post.status);
    openModal(`
        <div class="modal-card modal-card-preview">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Previa do agendamento</p>
                    <h3>${formatDateLabel(post.date)}</h3>
                </div>
                <button class="icon-btn" onclick="closeModal()" aria-label="Fechar modal">x</button>
            </div>
            <div class="calendar-preview-wrap">
                <div>${buildInstagramCard(post)}</div>
                <div class="calendar-preview-meta">
                    <div><strong>Cliente:</strong> ${(getClientById(post.clientId)?.name || 'Cliente')}</div>
                    <div><strong>Status:</strong> <span class="status-badge ${status.badgeClass}">${status.text}</span></div>
                    <div><strong>Legenda:</strong> ${post.caption || '-'}</div>
                </div>
            </div>
        </div>
    `);
    lucide.createIcons();
};

function openModal(contentHTML) {
    const root = document.getElementById('modal-root');
    if (!root) return;
    root.innerHTML = `
        <div class="modal-backdrop" role="presentation" onclick="closeModal()"></div>
        <div class="modal-shell" role="dialog" aria-modal="true">
            ${contentHTML}
        </div>
    `;
    root.classList.add('open');
    document.body.classList.add('modal-open');
}

window.closeModal = () => {
    const root = document.getElementById('modal-root');
    if (root) {
        root.innerHTML = '';
        root.classList.remove('open');
    }
    document.body.classList.remove('modal-open');
};


function openAccessModal() {
    openModal(`
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
    `);
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


window.openNewClientModal = () => {
    if (!canManageClients()) return;
    openModal(`
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Cadastro de cliente</p>
                    <h3>Novo cliente</h3>
                </div>
                <button class="icon-btn" onclick="closeModal()" aria-label="Fechar modal">x</button>
            </div>
            <form id="new-client-form" class="modal-form">
                <label>Nome do cliente
                    <input name="name" type="text" required placeholder="Ex: Brothers Filmes">
                </label>
                <label>Instagram (@usuario)
                    <input name="instagramUsername" type="text" placeholder="brothersfilmes">
                </label>
                <label>Foto de perfil do Instagram (URL)
                    <input name="instagramProfilePhoto" type="url" placeholder="https://...">
                </label>
                <label>Cor da marca
                    <input name="color" type="text" placeholder="#BA0C2F" value="#BA0C2F">
                </label>
                <p id="client-save-status" class="text-secondary" style="font-size:12px;">Esses dados serao usados para autopreencher novos posts.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button id="save-client-btn" type="submit" class="btn btn-primary">Salvar cliente</button>
                </div>
            </form>
        </div>
    `);
    document.getElementById('new-client-form')?.addEventListener('submit', handleNewClientSubmit);
};

async function handleNewClientSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const saveBtn = document.getElementById('save-client-btn');
    const statusEl = document.getElementById('client-save-status');
    if (saveBtn) saveBtn.disabled = true;

    const basePayload = {
        name: String(formData.get('name') || '').trim(),
        color: String(formData.get('color') || '#BA0C2F').trim() || '#BA0C2F',
        avatar_url: String(formData.get('instagramProfilePhoto') || '').trim(),
        instagram_username: String(formData.get('instagramUsername') || '').trim().replace(/^@/, ''),
        instagram_profile_photo: String(formData.get('instagramProfilePhoto') || '').trim()
    };

    let created = await api().createClient?.(basePayload);
    if (isApiError(created)) {
        // Fallback when DB has not been migrated with instagram_* columns yet.
        const fallbackPayload = {
            name: basePayload.name,
            color: basePayload.color,
            avatar_url: basePayload.avatar_url
        };
        created = await api().createClient?.(fallbackPayload);
    }

    if (created && !isApiError(created)) {
        await loadData();
        applyAuthScope();
        renderClientList();
        renderTopbarUser();
        if (statusEl) statusEl.textContent = 'Cliente salvo com sucesso.';
        closeModal();
        return;
    }

    if (statusEl) {
        statusEl.textContent = created?.error
            ? `Erro ao salvar cliente: ${created.error}`
            : 'Nao foi possivel cadastrar o cliente.';
    }
    if (saveBtn) saveBtn.disabled = false;
}

window.openNewPostModal = () => {
    if (!canCreatePosts()) return;
    const selectedClient = getClientById(state.currentClient) || state.data.clients[0];
    const clientOptions = state.data.clients.map(client => `
        <option value="${client.id}" ${client.id === state.currentClient ? 'selected' : ''}>${client.name}</option>
    `).join('');

    openModal(`
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Novo conteudo</p>
                    <h3>Criar post para aprovacao</h3>
                </div>
                <button class="icon-btn" onclick="closeModal()" aria-label="Fechar modal">x</button>
            </div>
            <form id="new-post-form" class="modal-form">
                <label>Cliente
                    <select name="clientId" id="post-client-select">${clientOptions}</select>
                </label>
                <label>Tipo do post
                    <select name="type">
                        <option value="image">Estatico</option>
                        <option value="carousel">Carrossel</option>
                        <option value="reels">Reels</option>
                    </select>
                </label>
                <label>Data de publicacao
                    <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}">
                </label>
                <label>Usuario
                    <input name="username" id="post-username" type="text" placeholder="@seuusuario" value="${selectedClient?.instagramUsername || ''}">
                </label>
                <label>Foto de perfil do Instagram (Upload)
                    <input name="userAvatarFile" type="file" accept="image/*">
                </label>
                <label>Foto de perfil do Instagram (URL Alternativa)
                    <input name="userAvatar" id="post-user-avatar" type="url" placeholder="https://..." value="${selectedClient?.instagramProfilePhoto || selectedClient?.avatar || ''}">
                </label>
                <label>Legenda
                    <textarea name="caption" rows="4" placeholder="Escreva a copy do post"></textarea>
                </label>
                <label>CTA
                    <input name="ctaText" type="text" placeholder="Saiba mais">
                </label>
                <label>Upload de midias (imagens/videos)
                    <input name="assetFiles" type="file" accept="image/*,video/*" multiple>
                </label>
                <label>Midias (URLs separadas por virgula)
                    <textarea name="media" rows="3" placeholder="https://...jpg, https://...jpg"></textarea>
                </label>
                <p id="upload-status" class="text-secondary" style="font-size:12px; margin-top:-4px;">Voce pode subir arquivos locais ou colar URLs.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button id="save-post-btn" type="submit" class="btn btn-primary">Salvar post</button>
                </div>
            </form>
        </div>
    `);

    document.getElementById('new-post-form')?.addEventListener('submit', handleNewPostSubmit);
    document.getElementById('post-client-select')?.addEventListener('change', onPostClientChange);
};

window.onPostClientChange = event => {
    const client = getClientById(event.target.value);
    const usernameInput = document.getElementById('post-username');
    const avatarInput = document.getElementById('post-user-avatar');
    if (usernameInput) usernameInput.value = client?.instagramUsername || '';
    if (avatarInput) avatarInput.value = client?.instagramProfilePhoto || client?.avatar || '';
};

async function handleNewPostSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const saveBtn = document.getElementById('save-post-btn');
    const uploadStatus = document.getElementById('upload-status');
    const uploadedFiles = Array.from(form.querySelector('input[name="assetFiles"]')?.files || []);
    const urlMedia = String(formData.get('media') || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    let media = [...urlMedia];

    const uploadedAvatarFile = form.querySelector('input[name="userAvatarFile"]')?.files[0];
    let userAvatarStr = formData.get('userAvatar') || state.data.clients.find(client => client.id === formData.get('clientId'))?.avatar || '';

    if (saveBtn) saveBtn.disabled = true;
    if (uploadStatus) uploadStatus.textContent = 'Preparando upload...';

    if (uploadedAvatarFile) {
        if (uploadStatus) uploadStatus.textContent = 'Enviando foto de perfil...';
        const avatarUploadedUrls = await api().uploadAssets?.([uploadedAvatarFile], {
            bucket: 'post-assets',
            folder: 'avatars'
        });
        if (Array.isArray(avatarUploadedUrls) && avatarUploadedUrls.length > 0) {
            userAvatarStr = avatarUploadedUrls[0];
        }
    }

    if (uploadedFiles.length > 0) {
        if (uploadStatus) uploadStatus.textContent = `Enviando ${uploadedFiles.length} arquivo(s)...`;
        const uploadedUrls = await api().uploadAssets?.(uploadedFiles, {
            bucket: 'post-assets',
            folder: 'posts'
        });

        if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
            media = [...uploadedUrls, ...urlMedia];
            if (uploadStatus) uploadStatus.textContent = 'Upload finalizado com sucesso.';
        } else if (uploadStatus) {
            uploadStatus.textContent = 'Upload falhou. O post sera salvo com URLs manuais, se houver.';
        }
    }

    const payload = {
        client_id: formData.get('clientId'),
        type: formData.get('type'),
        status: 'pending',
        date: formData.get('date'),
        username: formData.get('username'),
        actor_name: state.auth?.name || 'Sistema',
        user_avatar: userAvatarStr,
        media,
        likes: 0,
        caption: formData.get('caption'),
        cta_text: formData.get('ctaText')
    };

    try {
        const created = await api().createPost?.(payload);
        if (created && !isApiError(created)) {
            closeModal();
            await loadClientPosts(String(formData.get('clientId')));
            await refreshAllPostsCache(true);
            return;
        }
        if (uploadStatus) uploadStatus.textContent = created?.error ? `Erro: ${created.error}` : 'Nao foi possivel salvar no backend.';
        if (saveBtn) saveBtn.disabled = false;
        return;
    } catch (error) {
        console.warn('Could not create post:', error);
        // When backend is offline, fallback to local insertion to avoid blocking workflow.
        if (uploadStatus) uploadStatus.textContent = 'Backend indisponivel. Salvando somente localmente...';
    }

    const fallbackPost = {
        id: `draft-${Date.now()}`,
        clientId: String(formData.get('clientId')),
        type: String(formData.get('type')),
        status: 'pending',
        date: String(formData.get('date')),
        username: String(formData.get('username')),
        userAvatar: userAvatarStr,
        media: media.length > 0 ? media : ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop'],
        likes: 0,
        caption: String(formData.get('caption')),
        ctaText: String(formData.get('ctaText')),
        comments: [],
        statusHistory: [
            {
                from_status: null,
                to_status: 'pending',
                actor_name: state.auth?.name || 'Sistema',
                created_at: new Date().toISOString()
            }
        ]
    };

    state.data.posts = [fallbackPost, ...state.data.posts];
    closeModal();
    renderCurrentView();

    if (saveBtn) saveBtn.disabled = false;
}





// Native Swipe Support for Mobile Carousels
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    const track = e.target.closest('.ig-media-track');
    if (!track) return;
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

document.addEventListener('touchend', e => {
    const track = e.target.closest('.ig-media-track');
    if (!track) return;
    touchEndX = e.changedTouches[0].screenX;
    
    // Calculate distance and determine direction
    const distance = touchStartX - touchEndX;
    const isSwipe = Math.abs(distance) > 40; // Minimum swipe threshold
    
    if (isSwipe) {
        const postId = track.id.replace('track-', '');
        if (distance > 0) {
            // Swipe Left (Next)
            if (window.moveCarousel) window.moveCarousel(postId, 1);
        } else {
            // Swipe Right (Prev)
            if (window.moveCarousel) window.moveCarousel(postId, -1);
        }
    }
}, {passive: true});

window.deletePost = async (postId) => {
    if (!confirm('Tem certeza que deseja deletar este post? Essa ação não pode ser desfeita.')) return;
    
    // Optimistic UI update
    state.data.posts = state.data.posts.filter(p => p.id !== postId);
    if (state.data.allPosts) {
      state.data.allPosts = state.data.allPosts.filter(p => p.id !== postId);
    }
    renderCurrentView();
    
    try {
        await api().deletePost?.(postId);
    } catch(e) {
        console.error('Delete action failed', e);
        // Silent rollback logic omitted for simplicity in MVP
    }
};

window.exportCalendarToICS = () => {
    const posts = getCalendarScopedPosts();
    if (!posts || posts.length === 0) return alert('Não há posts agendados para este cliente no momento.');
    
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Santiz Agência//InstaAproval//PT-BR\n";
    
    posts.forEach(post => {
        if (!post.date) return;
        const [year, month, day] = post.date.split('-');
        
        let formattedCaption = (post.caption || "Sem legenda").replace(/\n/g, '\\n');
        
        // Formata data pro ICS (YYYYMMDD) T (HHMMSS) Z
        // Assuming 12:00 PM for all posts
        const startDate = `${year}${month}${day}T120000Z`;
        const endDate = `${year}${month}${day}T130000Z`;
        
        const summary = `Insta: ${post.type.toUpperCase()} (${getStatusMeta(post.status).text})`;
        
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `UID:${post.id}@instaaproval.santiz\n`;
        icsContent += `DTSTAMP:${startDate}\n`;
        icsContent += `DTSTART:${startDate}\n`;
        icsContent += `DTEND:${endDate}\n`;
        icsContent += `SUMMARY:${summary}\n`;
        icsContent += `DESCRIPTION:${formattedCaption}\n`;
        icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `posts_${state.calendarClientFilter || 'geral'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

function renderAnalytics() {
    state.activeView = 'analytics';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const posts = getCalendarScopedPosts();
    const approvedCount = posts.filter(p => p.status === 'approved').length;
    const pendingCount = posts.filter(p => p.status === 'pending').length;
    const totalCount = posts.length;
    
    let approvalRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0;

    container.innerHTML = `
        <div class="metrics-bar">
            <div class="metric-card">
                <div class="metric-value">${approvalRate}%</div>
                <div class="metric-label">Taxa de Aprovação</div>
            </div>
            <div class="metric-card metric-success">
                <div class="metric-value">${approvedCount}</div>
                <div class="metric-label">Posts Prontos</div>
            </div>
            <div class="metric-card metric-warning">
                <div class="metric-value">${pendingCount}</div>
                <div class="metric-label">Aguardando Avaliação</div>
            </div>
        </div>
        
        <div style="background: #FFFFFF; padding: 32px; border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 16px;">
            <h3>Visão Geral Trimestral</h3>
            <p class="text-secondary" style="margin-top: 8px;">Esta aba trará gráficos de engajamento estimado, conversões das CTAs e histórico de rejeição por cliente. (Fase 3 WIP)</p>
            
            <div style="margin-top: 32px; height: 180px; width: 100%; display: flex; align-items: flex-end; gap: 4px;">
                <div style="flex:1; background: var(--color-success); height: ${approvalRate}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                <div style="flex:1; background: var(--color-warning); height: ${100 - approvalRate}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 8px; text-align: center; font-size: 11px; font-weight: bold;">
                 <div style="flex:1;">Aprovado (${approvalRate}%)</div>
                 <div style="flex:1;">Outros</div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderGuidelines() {
    state.activeView = 'guidelines';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const client = getClientById(state.currentClient) || state.data.clients[0];
    const brandColor = client?.color || '#BA0C2F';
    const clientName = client?.name || 'Cliente';

    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding-bottom: 60px;">
            <div style="background: #FFFFFF; padding: 32px; border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <p class="eyebrow">Diretrizes da Marca</p>
                        <h3>Manual de Identidade Visual e Voz</h3>
                    </div>
                     <button class="btn btn-secondary" onclick="alert('Funcionalidade de PDF na proxima iteracao (Fase 3)')">
                        <i data-lucide="download"></i> Baixar PDF
                    </button>
                </div>
                
                <p class="text-secondary" style="margin-bottom: 32px;">Essas são as chaves mestras de comunicação de <strong>${clientName}</strong>. Criadores de conteúdo devem consumir esta página antes de pautar ou desenhar novos posts.</p>
                
                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0;">
                
                <h4>Cores Institucionais</h4>
                <div style="display: flex; gap: 16px; margin-top: 16px;">
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 100%; height: 80px; border-radius: 8px; background: ${brandColor}; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 8px;"></div>
                        <span style="font-size: 12px; font-family: monospace;">${brandColor}</span>
                        <span style="font-size: 14px; font-weight: 600;">Primária</span>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 100%; height: 80px; border-radius: 8px; background: #27272A; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 8px;"></div>
                        <span style="font-size: 12px; font-family: monospace;">#27272A</span>
                        <span style="font-size: 14px; font-weight: 600;">Superfícies</span>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 100%; height: 80px; border-radius: 8px; background: #F7F7F9; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 8px;"></div>
                        <span style="font-size: 12px; font-family: monospace;">#F7F7F9</span>
                        <span style="font-size: 14px; font-weight: 600;">Off-White (Gelo)</span>
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0;">
                
                <h4>Tipografia (Fontes Atuais)</h4>
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; padding: 24px; background: rgba(0,0,0,0.02); border-radius: 8px;">
                    <div>
                        <div style="font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase;">Headings (Títulos Grandes)</div>
                        <div style="font-size: 32px; font-family: Inter, sans-serif; font-weight: 800; color: #111;">Aa Bb Cc - Inter ExtraBold</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase;">Body Content (Legendas e CTAs)</div>
                        <div style="font-size: 16px; font-family: Inter, sans-serif; font-weight: 400; color: #333;">Aa Bb Cc - Inter Regular (Ler mais texto fluído no carrossel)</div>
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0;">
                
                <h4>O Tom de Voz (Brand Voice)</h4>
                <div class="metrics-bar" style="margin-top: 16px;">
                    <div class="metric-card" style="box-shadow: none;">
                        <div class="metric-value" style="font-size: 16px;">✅ O que <b>SIM</b> falar</div>
                        <div class="metric-label" style="font-size: 14px; margin-top: 8px; line-height: 1.5;">Gírias modernas do nicho do cliente, tom professoral mas acessível, analogias simples e uso frequente de "Nós".</div>
                    </div>
                    <div class="metric-card metric-danger" style="box-shadow: none; border-color: rgba(239, 68, 68, 0.4);">
                        <div class="metric-value" style="font-size: 16px; color: var(--color-danger);"><i data-lucide="slash" style="width:16px; height: 16px; display:inline"></i> O que <b>NÃO</b> falar</div>
                        <div class="metric-label" style="font-size: 14px; margin-top: 8px; line-height: 1.5; color: #555;">Evitar voz passiva e institucional engessada ("A empresa informa..."). Evitar polêmicas religiosas ou políticas.</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

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
        return `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 12px;">${u.name}</td>
                <td style="padding: 12px;">${u.email}</td>
                <td style="padding: 12px;">${u.role}</td>
                <td style="padding: 12px;">${clientName}</td>
                <td style="padding: 12px; text-align:right;">
                    <button class="btn btn-secondary" onclick="deleteSysUser('${u.id}')" style="color:var(--color-danger); border:none;" title="Deletar">Remover</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
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
                    ${rows || '<tr><td colspan="5" style="text-align:center; padding: 24px;">Nenhum usuário cadastrado.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

window.deleteSysUser = async (id) => {
    if(!confirm('Certeza?')) return;
    await api().deleteUser?.(id);
    renderUsers();
};

window.openNewUserModal = () => {
    const clientOptions = state.data.clients.map(client => `
        <option value="${client.id}">${client.name}</option>
    `).join('');

    openModal(`
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
                    <input name="password" type="text" value="${Math.random().toString(36).slice(-8)}" required>
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
                        ${clientOptions}
                    </select>
                </label>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="save-usr-btn">Cadastrar Perfil</button>
                </div>
            </form>
        </div>
    `);
    
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

// ============================================================
// PRELOADER SYSTEM
// ============================================================

let preloaderProgress = 0;
let preloaderTargetProgress = 0;
let preloaderRAF = null;

function initPreloader() {
    const bar = document.getElementById('preloader-bar-fill');
    const counter = document.getElementById('preloader-counter');
    if (!bar || !counter) return;

    // Simulate loading progress
    preloaderTargetProgress = 30;
    animatePreloader(bar, counter);

    // Increment as resources load
    const images = [...document.querySelectorAll('img')];
    const total = images.length || 1;
    let loaded = 0;

    images.forEach(img => {
        if (img.complete) {
            loaded++;
            preloaderTargetProgress = Math.min(90, (loaded / total) * 90);
        } else {
            img.addEventListener('load', () => {
                loaded++;
                preloaderTargetProgress = Math.min(90, (loaded / total) * 90);
            });
            img.addEventListener('error', () => {
                loaded++;
                preloaderTargetProgress = Math.min(90, (loaded / total) * 90);
            });
        }
    });

    // Ensure we reach 90% quickly for fast connections
    setTimeout(() => { preloaderTargetProgress = Math.max(preloaderTargetProgress, 70); }, 300);
    setTimeout(() => { preloaderTargetProgress = Math.max(preloaderTargetProgress, 90); }, 600);
}

function animatePreloader(bar, counter) {
    preloaderProgress += (preloaderTargetProgress - preloaderProgress) * 0.08;
    const rounded = Math.round(preloaderProgress);
    bar.style.width = `${rounded}%`;
    counter.textContent = `${rounded}%`;

    if (preloaderProgress < 99) {
        preloaderRAF = requestAnimationFrame(() => animatePreloader(bar, counter));
    }
}

function dismissPreloader() {
    const bar = document.getElementById('preloader-bar-fill');
    const counter = document.getElementById('preloader-counter');
    preloaderTargetProgress = 100;

    // Quick finish animation
    const finish = () => {
        preloaderProgress += (100 - preloaderProgress) * 0.15;
        if (bar) bar.style.width = `${Math.round(preloaderProgress)}%`;
        if (counter) counter.textContent = `${Math.round(preloaderProgress)}%`;

        if (preloaderProgress >= 99) {
            if (preloaderRAF) cancelAnimationFrame(preloaderRAF);
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('preloader--hide');
                setTimeout(() => preloader.remove(), 600);
            }
            return;
        }
        requestAnimationFrame(finish);
    };
    requestAnimationFrame(finish);
}

// ============================================================
// SCROLL ANIMATOR (IntersectionObserver)
// ============================================================

function initScrollAnimator() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.animateDelay || '0', 10);
                    setTimeout(() => el.classList.add('is-visible'), delay);
                    observer.unobserve(el);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-animate], [data-animate-stagger]').forEach(el => {
        observer.observe(el);
    });

    // Store observer for re-scans on dynamic content
    window._scrollAnimator = observer;
}

// Re-scan for new animated elements after dynamic renders
function rescanAnimations() {
    if (!window._scrollAnimator) return;
    document.querySelectorAll('[data-animate]:not(.is-visible), [data-animate-stagger]:not(.is-visible)').forEach(el => {
        window._scrollAnimator.observe(el);
    });
}

// ============================================================
// SCROLL PROGRESS BAR
// ============================================================

function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    const contentArea = document.querySelector('.content-area');
    if (!progressBar || !contentArea) return;

    contentArea.addEventListener('scroll', () => {
        const scrollTop = contentArea.scrollTop;
        const scrollHeight = contentArea.scrollHeight - contentArea.clientHeight;
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
    }, { passive: true });
}
