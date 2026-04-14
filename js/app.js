// app.js - Main Application Logic

let state = {
    currentClient: 'c1',
    activeView: 'feed',
    carousels: {},
    statusFilter: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initApp();
});

function initApp() {
    renderClientList();
    renderFeed();
    setupEventListeners();
    addGrainOverlay();
}

function addGrainOverlay() {
    if (!document.querySelector('.grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'grain-overlay';
        document.body.appendChild(grain);
    }
}

function renderClientList() {
    const listEl = document.getElementById('client-list');
    listEl.innerHTML = '';
    
    MOCK_DATA.clients.forEach(client => {
        const link = document.createElement('a');
        link.className = `nav-link ${state.currentClient === client.id ? 'active' : ''}`;
        link.innerHTML = `
            <div class="client-dot" style="background: ${getColorForClient(client.id)}"></div>
            ${client.name}
        `;
        link.onclick = () => {
            state.currentClient = client.id;
            renderClientList(); // update active state
            renderFeed();
            document.getElementById('current-view-title').textContent = `Cliente: ${client.name}`;
        };
        listEl.appendChild(link);
    });
}

function getColorForClient(id) {
    const colors = { 'c1': '#C9A962', 'c2': '#ec4899', 'c3': '#3b82f6' };
    return colors[id] || '#fff';
}

function renderFeed() {
    state.activeView = 'feed';
    const container = document.getElementById('main-content-area');
    container.innerHTML = '';
    
    const filterHTML = `
        <div class="filter-bar">
            <button class="filter-btn ${state.statusFilter === 'all' ? 'active' : ''}" onclick="setStatusFilter('all')">Todos</button>
            <button class="filter-btn ${state.statusFilter === 'pending' ? 'active' : ''}" onclick="setStatusFilter('pending')">Pendentes</button>
            <button class="filter-btn ${state.statusFilter === 'approved' ? 'active' : ''}" onclick="setStatusFilter('approved')">Aprovados</button>
            <button class="filter-btn ${state.statusFilter === 'rejected' ? 'active' : ''}" onclick="setStatusFilter('rejected')">Rejeitados</button>
        </div>
    `;
    
    let posts = MOCK_DATA.posts.filter(p => p.clientId === state.currentClient);
    
    if (state.statusFilter !== 'all') {
        posts = posts.filter(p => p.status === state.statusFilter);
    }
    
    if(posts.length === 0) {
        container.innerHTML = filterHTML + `<div class="text-secondary" style="text-align:center; padding: 40px;">Nenhum post encontrado.</div>`;
        return;
    }
    
    container.innerHTML = filterHTML;
    
    posts.forEach(post => {
        container.appendChild(createPostInterface(post));
    });
    
    lucide.createIcons();
}

window.setStatusFilter = (filter) => {
    state.statusFilter = filter;
    renderFeed();
};

// -----------------------------------------
// COMPONENT: Post Approval Interface
// -----------------------------------------
function createPostInterface(post) {
    const el = document.createElement('div');
    el.className = 'approval-grid';
    el.style.marginBottom = '60px'; // spacing between posts
    
    // Status Text
    const statusMap = {
        'pending': { text: 'Aprovação Pendente', class: 'status-pending' },
        'approved': { text: 'Aprovado', class: 'status-approved' },
        'rejected': { text: 'Rejeitado / Com Ajustes', class: 'status-rejected' }
    };
    const s = statusMap[post.status];

    const igMarkup = buildInstagramCard(post);
    const commentsMarkup = post.comments.map(c => `
        <div class="comment-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                <b>${c.author}</b>
                <span class="text-secondary" style="font-size:11px">${c.date}</span>
            </div>
            ${c.text}
        </div>
    `).join('');

    el.innerHTML = `
        <div class="preview-col">
            ${igMarkup}
        </div>
        
        <div class="action-col">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:16px;">
                <div>
                    <h3 style="margin-bottom:8px;">Planejamento: ${post.date}</h3>
                    <span class="status-badge ${s.class}">${s.text}</span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-danger" onclick="updateStatus('${post.id}', 'rejected')"><i data-lucide="x"></i> Recusar</button>
                    <button class="btn btn-success" onclick="updateStatus('${post.id}', 'approved')"><i data-lucide="check"></i> Aprovar</button>
                </div>
            </div>
            
            <div style="margin-top: 16px;">
                <h4>Trilha de Comentários</h4>
            </div>
            
            <div class="feedback-list" id="comments-${post.id}">
                ${commentsMarkup || '<div class="text-secondary">Nenhum comentário.</div>'}
            </div>
            
            <div class="comment-input-area">
                <input type="text" class="comment-input" placeholder="Adicionar feedback..." id="input-${post.id}">
                <button class="btn btn-primary" onclick="addComment('${post.id}')"><i data-lucide="send"></i></button>
            </div>
        </div>
    `;
    
    return el;
}

// -----------------------------------------
// INSTAGRAM CARD SIMULATOR
// -----------------------------------------
function buildInstagramCard(post) {
    
    state.carousels[post.id] = 0; // initialize carousel state
    const isCarousel = post.media.length > 1;
    
    // Images setup
    let mediaHTML = '';
    let indicatorsHTML = '';
    
    if (isCarousel) {
        mediaHTML = post.media.map(src => `<img class="ig-media-item" src="${src}">`).join('');
        indicatorsHTML = `
            <div class="ig-carousel-indicators" id="ind-${post.id}">
                ${post.media.map((_, i) => `<div class="ig-indicator ${i===0?'active':''}"></div>`).join('')}
            </div>
        `;
    } else {
        mediaHTML = `<img class="ig-media-item" src="${post.media[0]}">`;
    }
    
    // Format caption rendering (hashtags in blue)
    let formattedCaption = post.caption.replace(/#([\w]+)/g, '<span style="color:var(--color-ig-blue);">#$1</span>');
    formattedCaption = formattedCaption.replace(/\n/g, '<br>');

    // Icons from lucide with specific strokes
    return `
    <div class="ig-post-wrapper">
        <div class="ig-header">
            <img class="ig-avatar" src="${post.userAvatar}">
            <div class="ig-username">${post.username}</div>
            <i data-lucide="more-horizontal" class="ig-dots"></i>
        </div>
        
        <div class="ig-media-container">
            <div class="ig-media-track" id="track-${post.id}">
                ${mediaHTML}
            </div>
            ${isCarousel ? `
                <div class="ig-carousel-btn ig-carousel-prev" onclick="moveCarousel('${post.id}', -1)" style="display:none;" id="prev-${post.id}">❮</div>
                <div class="ig-carousel-btn ig-carousel-next" onclick="moveCarousel('${post.id}', 1)" id="next-${post.id}">❯</div>
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
        
        <div class="ig-likes">${post.likes.toLocaleString()} curtidas</div>
        
        <div class="ig-caption-container">
            <span class="ig-caption-username">${post.username}</span> ${formattedCaption}
        </div>
        
        ${post.comments.length > 0 ? `<div class="ig-comments-count">Ver todos os ${post.comments.length} comentários</div>` : ''}
        
        <div class="ig-timestamp">HÁ 2 HORAS</div>
    </div>
    `;
}

// -----------------------------------------
// Logic Functions
// -----------------------------------------

window.moveCarousel = (postId, dir) => {
    const post = MOCK_DATA.posts.find(p => p.id === postId);
    const maxIdx = post.media.length - 1;
    let idx = state.carousels[postId];
    
    idx += dir;
    if (idx < 0) idx = 0;
    if (idx > maxIdx) idx = maxIdx;
    
    state.carousels[postId] = idx;
    
    // Update Track
    const track = document.getElementById(`track-${postId}`);
    track.style.transform = `translateX(-${idx * 100}%)`;
    
    // Update Buttons
    const prev = document.getElementById(`prev-${postId}`);
    const next = document.getElementById(`next-${postId}`);
    prev.style.display = idx === 0 ? 'none' : 'flex';
    next.style.display = idx === maxIdx ? 'none' : 'flex';
    
    // Update Indicators
    const indContainer = document.getElementById(`ind-${postId}`);
    Array.from(indContainer.children).forEach((dot, i) => {
        dot.className = `ig-indicator ${i === idx ? 'active' : ''}`;
    });
};

window.updateStatus = (postId, status) => {
    const post = MOCK_DATA.posts.find(p => p.id === postId);
    post.status = status;
    renderFeed();
};

window.addComment = (postId) => {
    const input = document.getElementById(`input-${postId}`);
    if(!input.value.trim()) return;
    
    const post = MOCK_DATA.posts.find(p => p.id === postId);
    post.comments.push({
        author: 'Você (Admin)',
        text: input.value,
        date: new Date().toLocaleDateString(),
        type: 'internal'
    });
    
    input.value = '';
    renderFeed();
};

function setupEventListeners() {
    document.getElementById('nav-feed').addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderFeed();
    });
    
    document.getElementById('nav-calendario').addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderCalendar();
    });
}

function renderCalendar() {
    state.activeView = 'calendar';
    const container = document.getElementById('main-content-area');
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const posts = MOCK_DATA.posts.filter(p => p.clientId === state.currentClient);
    const postsByDay = {};
    posts.forEach(post => {
        const day = parseInt(post.date.split('-')[2]);
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push(post);
    });
    
    let daysHTML = '';
    
    for (let i = 0; i < firstDay; i++) {
        daysHTML += `<div class="calendar-day empty"></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayPosts = postsByDay[day] || [];
        const hasPosts = dayPosts.length > 0;
        const postsList = dayPosts.map(p => {
            const statusColor = p.status === 'approved' ? 'var(--color-success)' : p.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-warning)';
            return `<div class="calendar-post-dot" style="background:${statusColor}" title="${p.caption.substring(0, 30)}..."></div>`;
        }).join('');
        
        daysHTML += `
            <div class="calendar-day ${hasPosts ? 'has-posts' : ''}">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-posts">${postsList}</div>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="calendar-container">
            <div class="calendar-header-row">
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
            </div>
            <div class="calendar-weekdays">
                ${dayNames.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
            </div>
            <div class="calendar-grid">
                ${daysHTML}
            </div>
            <div class="calendar-legend">
                <span class="legend-item"><span class="legend-dot pending"></span> Pendente</span>
                <span class="legend-item"><span class="legend-dot approved"></span> Aprovado</span>
                <span class="legend-item"><span class="legend-dot rejected"></span> Rejeitado</span>
            </div>
        </div>
    `;
}
