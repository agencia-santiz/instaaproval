const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('id="nav-guidelines"')) {
  html = html.replace('id="nav-analytics"><i data-lucide="bar-chart-2"></i> Analytics</a>', 'id="nav-analytics"><i data-lucide="bar-chart-2"></i> Analytics</a>\\n          <a class="nav-link" id="nav-guidelines"><i data-lucide="book-open"></i> Brand Guidelines</a>');
  fs.writeFileSync('index.html', html.replace(/\\\\n/g, '\\n'));
  console.log('Guidelines link added to HTML.');
}

let js = fs.readFileSync('js/app-enhanced.js', 'utf8');

if (!js.includes('renderGuidelines')) {
  const routingTarget = `        renderAnalytics();
    });`;

  const newRouting = routingTarget + `

    document.getElementById('nav-guidelines')?.addEventListener('click', event => {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.activeView = 'guidelines';
        renderCurrentView();
    });`;

  js = js.replace(routingTarget, newRouting);
  
  const currentViewDispatchTarget = `    if (state.activeView === 'analytics') {
        renderAnalytics();
        return;
    }`;
  const newCurrentViewDispatch = currentViewDispatchTarget + `
    if (state.activeView === 'guidelines') {
        renderGuidelines();
        return;
    }`;
    
  js = js.replace(currentViewDispatchTarget, newCurrentViewDispatch);

  const guidelinesFunc = `
function renderGuidelines() {
    state.activeView = 'guidelines';
    const container = document.getElementById('main-content-area');
    if (!container) return;

    const client = getClientById(state.currentClient) || state.data.clients[0];
    const brandColor = client?.color || '#BA0C2F';
    const clientName = client?.name || 'Cliente';

    container.innerHTML = \`
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
                
                <p class="text-secondary" style="margin-bottom: 32px;">Essas são as chaves mestras de comunicação de <strong>\${clientName}</strong>. Criadores de conteúdo devem consumir esta página antes de pautar ou desenhar novos posts.</p>
                
                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0;">
                
                <h4>Cores Institucionais</h4>
                <div style="display: flex; gap: 16px; margin-top: 16px;">
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 100%; height: 80px; border-radius: 8px; background: \${brandColor}; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 8px;"></div>
                        <span style="font-size: 12px; font-family: monospace;">\${brandColor}</span>
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
                        <div class="metric-value" style="font-size: 16px;">\u2705 O que <b>SIM</b> falar</div>
                        <div class="metric-label" style="font-size: 14px; margin-top: 8px; line-height: 1.5;">Gírias modernas do nicho do cliente, tom professoral mas acessível, analogias simples e uso frequente de "Nós".</div>
                    </div>
                    <div class="metric-card metric-danger" style="box-shadow: none; border-color: rgba(239, 68, 68, 0.4);">
                        <div class="metric-value" style="font-size: 16px; color: var(--color-danger);"><i data-lucide="slash" style="width:16px; height: 16px; display:inline"></i> O que <b>NÃO</b> falar</div>
                        <div class="metric-label" style="font-size: 14px; margin-top: 8px; line-height: 1.5; color: #555;">Evitar voz passiva e institucional engessada ("A empresa informa..."). Evitar polêmicas religiosas ou políticas.</div>
                    </div>
                </div>
            </div>
        </div>
    \`;
    lucide.createIcons();
}
`;
  js += guidelinesFunc;
  fs.writeFileSync('js/app-enhanced.js', js);
  console.log('Brand Guidelines link added to JS.');
}

console.log('All changes applied successfully!');
