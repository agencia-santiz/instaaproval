const fs = require('fs');

let code = fs.readFileSync('js/app-enhanced.js', 'utf8');

// 1. Add exportCalendarToICS to the global window
if (!code.includes('exportCalendarToICS')) {
  const exportFunc = `
window.exportCalendarToICS = () => {
    const posts = getCalendarScopedPosts();
    if (!posts || posts.length === 0) return alert('Não há posts agendados para este cliente no momento.');
    
    let icsContent = "BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//Santiz Agência//InstaAproval//PT-BR\\n";
    
    posts.forEach(post => {
        if (!post.date) return;
        const [year, month, day] = post.date.split('-');
        
        let formattedCaption = (post.caption || "Sem legenda").replace(/\\n/g, '\\\\n');
        
        // Formata data pro ICS (YYYYMMDD) T (HHMMSS) Z
        // Assuming 12:00 PM for all posts
        const startDate = \`\${year}\${month}\${day}T120000Z\`;
        const endDate = \`\${year}\${month}\${day}T130000Z\`;
        
        const summary = \`Insta: \${post.type.toUpperCase()} (\${getStatusMeta(post.status).text})\`;
        
        icsContent += "BEGIN:VEVENT\\n";
        icsContent += \`UID:\${post.id}@instaaproval.santiz\\n\`;
        icsContent += \`DTSTAMP:\${startDate}\\n\`;
        icsContent += \`DTSTART:\${startDate}\\n\`;
        icsContent += \`DTEND:\${endDate}\\n\`;
        icsContent += \`SUMMARY:\${summary}\\n\`;
        icsContent += \`DESCRIPTION:\${formattedCaption}\\n\`;
        icsContent += "END:VEVENT\\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', \`posts_\${state.calendarClientFilter || 'geral'}.ics\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
`;
  code += exportFunc;
}

// 2. Add Export button to HTML generation string
const oldBtnArea = `<button class="btn btn-secondary" onclick="goToMonth(-1)" aria-label="Mes anterior">Anterior</button>`;
if (code.includes(oldBtnArea) && !code.includes('exportCalendarToICS()')) {
  const newBtnArea = `<button class="btn btn-secondary" onclick="exportCalendarToICS()" aria-label="Exportar para Calendar" title="Exportar para Google Calendar / iOS"><i data-lucide="calendar-plus"></i> Exportar</button>
                    <button class="btn btn-secondary" onclick="goToMonth(-1)" aria-label="Mes anterior">Anterior</button>`;
  code = code.replace(oldBtnArea, newBtnArea);
}

// 3. Add renderAnalytics function and append to routing
if (!code.includes('renderAnalytics')) {
  const routingTarget = `        renderFeed();
    });

    document.getElementById('nav-calendario')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'calendar';
        selectFirstCalendarDay();
        renderCalendar();
    });`;

  const newRouting = routingTarget + `

    document.getElementById('nav-analytics')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'analytics';
        renderCurrentView();
    });`;

  code = code.replace(routingTarget, newRouting);
  
  const currentViewDispatchTarget = `    if (state.activeView === 'calendar') {
        renderCalendar();
        return;
    }`;
  const newCurrentViewDispatch = currentViewDispatchTarget + `
    if (state.activeView === 'analytics') {
        renderAnalytics();
        return;
    }`;
    
  code = code.replace(currentViewDispatchTarget, newCurrentViewDispatch);
  
  const analyticsFunc = `
function renderAnalytics() {
    state.activeView = 'analytics';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const posts = getCalendarScopedPosts();
    const approvedCount = posts.filter(p => p.status === 'approved').length;
    const pendingCount = posts.filter(p => p.status === 'pending').length;
    const totalCount = posts.length;
    
    let approvalRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0;

    container.innerHTML = \`
        <div class="metrics-bar">
            <div class="metric-card">
                <div class="metric-value">\${approvalRate}%</div>
                <div class="metric-label">Taxa de Aprovação</div>
            </div>
            <div class="metric-card metric-success">
                <div class="metric-value">\${approvedCount}</div>
                <div class="metric-label">Posts Prontos</div>
            </div>
            <div class="metric-card metric-warning">
                <div class="metric-value">\${pendingCount}</div>
                <div class="metric-label">Aguardando Avaliação</div>
            </div>
        </div>
        
        <div style="background: #FFFFFF; padding: 32px; border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 16px;">
            <h3>Visão Geral Trimestral</h3>
            <p class="text-secondary" style="margin-top: 8px;">Esta aba trará gráficos de engajamento estimado, conversões das CTAs e histórico de rejeição por cliente. (Fase 3 WIP)</p>
            
            <div style="margin-top: 32px; height: 180px; width: 100%; display: flex; align-items: flex-end; gap: 4px;">
                <div style="flex:1; background: var(--color-success); height: \${approvalRate}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                <div style="flex:1; background: var(--color-warning); height: \${100 - approvalRate}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 8px; text-align: center; font-size: 11px; font-weight: bold;">
                 <div style="flex:1;">Aprovado (\${approvalRate}%)</div>
                 <div style="flex:1;">Outros</div>
            </div>
        </div>
    \`;
    lucide.createIcons();
}
`;
  code += analyticsFunc;
}

fs.writeFileSync('js/app-enhanced.js', code);
console.log('Phase 3 Roadmap patches applied (Analytics + Google Calendar ICS).');
