# InstaAproval - Charter & Governança

## 1. Objetivo

Plataforma de aprovação de posts Instagram para agências de marketing gerenciarem o workflow de aprovação de conteúdo para seus clientes.

---

## 2. Escopo Fixo (Não Alterar)

### 2.1 Nome e Identidade
- **Nome:** InstaAproval
- **Cor primária:** `#BA0C2F` (Santiz Red)
- **Logo:** Texto com gradiente

### 2.2 Stack Tecnológico
- Frontend: Vanilla JS (ES6+)
- CSS: CSS Variables + Modern CSS
- Backend: Supabase (PostgreSQL)
- Hosting: Vercel
- Ícones: Lucide Icons

### 2.3 Arquivo de Estrutura
```
/api           - Serverless functions
/css           - Estilos
/js            - JavaScript
index.html    - Entry point
vercel.json   - Config Vercel
supabase/      - Schema SQL
```

---

## 3. Escopo Variável (Pode Alterar)

### 3.1 Funcionalidades
- Feed de aprovações ✓
- Calendário ✓
- Filtros por status ✓
- Sistema de comentários ✓
- Simulador de card Instagram ✓
- Upload de imagens (futuro)
- Autenticação (futuro)

### 3.2 UI/Estilo Visual
- Glassmorphism
- Animações
- Tipografia
- Cores de status

---

## 4. Regras de Desenvolvimento

### 4.1 Antes de Alterar
- [ ] Verificar Documentação (`SPEC.md`)
- [ ] Revisar skills em `docs/skills/`
- [ ] Testar localmente
- [ ] Verificar acessibilidade (Web Interface Guidelines)

### 4.2 Padrões Obrigatórios
- Acessibilidade: aria-labels, focus states, keyboard navigation
- Performance: lazy loading, preconnect
- SEO: meta tags, semantic HTML
- Error handling: loading states, fallbacks

### 4.3 Commits
- Mensagens claras em português ou inglês
- Um foco por commit
- Testar antes de fazer push

---

## 5. Processo de Mudanças

### 5.1 Solicitar Alteração
1. Descrever o que precisa mudar
2. Prioridade (alta/média/baixa)
3. Prazo (se necessário)

### 5.2 Implementar
1. Revisar SPEC.md e skills relevantes
2. Implementar
3. Testar
4. Commitar com descrição clara

### 5.3 Deploy
1. Push para `main`
2. Vercel faz deploy automático
3. Verificar em produção

---

## 6. Links Úteis

- **App:** https://instaaproval.vercel.app/
- **Repo:** https://github.com/agencia-santiz/instaaproval
- **Supabase:** https://supabase.com/dashboard/project/dbrbieetsihnlzfjjrbw

---

*Última atualização: Abril 2026*