# InstaAproval - Specification Document

## 1. Overview

**Name:** InstaAproval  
**Type:** Web Application (Workflow Tool)  
**Purpose:** Plataforma de aprovação de posts Instagram para agências de marketing  
**Target Users:** Agências de marketing digital, social media managers, clientes

---

## 2. Core Features (MVP)

### 2.1 Feed de Aprovações
- Listagem de posts por cliente
- Visualização de card Instagram simulado
- Carrossel com múltiplas imagens
- Status: Pendente, Aprovado, Solicitar Alteracao, Rejeitado
- Caption renderizada com hashtags destacadas

### 2.2 Sistema de Comentários
- Comentários internos (equipe)
- Comentários de cliente
- Input para adicionar novos feedbacks
- Data e autor automáticamente
- Historico de mudancas de status (quem alterou, de/para e quando)

### 2.3 Calendário
- Grid mensal funcional
- Mapeamento de posts por dia
- Navegação entre meses
- Indicador de status por cor

### 2.4 Gestão de Clientes
- Lista lateral de clientes
- Seleção de cliente ativo
- Cor distintiva por cliente

### 2.5 Filtros
- Filtrar por status (Pendente/Aprovado/Solicitar Alteracao/Rejeitado)
- Toggle na interface

---

## 3. Technical Architecture

### 3.1 Tech Stack
- **Frontend:** Vanilla JavaScript (ES6+)
- **Styling:** CSS Variables + Modern CSS
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Icons:** Lucide Icons

### 3.2 Supabase Schema

```sql
-- clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT DEFAULT '#BA0C2F',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  type TEXT DEFAULT 'image',
  status TEXT DEFAULT 'pending',
  date DATE NOT NULL,
  username TEXT,
  user_avatar TEXT,
  media JSONB DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  caption TEXT,
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'internal',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 API Routes (Vercel Serverless)

```
GET  /api/clients          - List all clients
GET  /api/posts            - List posts (filter by client_id, status)
POST /api/posts            - Create new post
PUT  /api/posts/[id]       - Update post status
POST /api/comments        - Add comment to post
GET  /api/comments/[post_id] - Get comments for post
```

---

## 4. UI/UX Design

### 4.1 Color Palette
- **Primary:** #BA0C2F (Santiz Red)
- **Secondary:** #1E1E1E (Dark Background)
- **Surface:** #27272A (Card Background)
- **Text Primary:** #FAFAFA
- **Text Secondary:** #A1A1AA
- **Status Colors:**
  - Pending: #F59E0B (Amber)
  - Approved: #10B981 (Green)
  - Changes Requested: #F97316 (Orange)
  - Rejected: #EF4444 (Red)

### 4.2 Design System

#### Typography
- **Display:** Inter (700)
- **Body:** Inter (400, 500, 600)
- **Monospace:** JetBrains Mono

#### Spacing Scale
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px

#### Components
- Glassmorphism cards
- Grain overlay texture
- Smooth hover transitions
- Status badges
- Custom scrollbar

### 4.3 Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 5. File Structure

```
/INSTAGRAM-APROVAL/
├── index.html
├── SPEC.md
├── vercel.json
├── api/
│   ├── clients.js
│   ├── posts.js
│   └── comments.js
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   └── instagram.css
├── js/
│   ├── supabase.js
│   ├── api.js
│   ├── app.js
│   └── mockData.js
└── docs/
    └── skills/
        ├── 01-design-philosophy.md
        ├── 02-advanced-css-animations.md
        ├── 03-implementation-workflow.md
        └── 04-performance-seo.md
```

---

## 6. Implementation Roadmap

### Phase 1: Core Features ✅
- [x] Feed de aprovações
- [x] Simulador Instagram
- [x] Sistema de comentários
- [x] Calendário completo
- [x] Filtros por status

### Phase 2: Backend Integration ✅
- [x] Supabase setup (schema.sql)
- [x] API routes
- [x] CRUD operations

### Phase 3: Polish & Deploy
- [x] UI improvements (glassmorphism, grain overlay)
- [ ] Performance optimization
- [ ] Vercel deployment

---

## 7. Non-Functional Requirements

- **Performance:** Lighthouse score > 90
- **Accessibility:** WCAG Level A
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile:** Responsive down to 375px width

---

## 8. Open Questions

1. Autenticação de usuários? (MVP sem auth)
2. Upload real de imagens? (usar Supabase Storage)
3. Notificações em tempo real? (deferred to Phase 2)
4. Multi-usuário/equipe? (deferred to Phase 2)

