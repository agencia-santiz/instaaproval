# InstaAproval

Plataforma de aprovação de posts Instagram para agências de marketing.

## Quick Start local

```bash
# Clone e abra no browser
# ou usa um simple server:
npx serve .
```

## Deploy Steps

### 1. Supabase Setup

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o código em `supabase/schema.sql`
3. Em **Settings > API**, copie:
   - Project URL
   - `service_role` key (para server-side) ou `anon` key (para public)

### 2. Configurar Variáveis de Ambiente

No seu projeto Vercel, adicione:
- `SUPABASE_URL` = sua URL do projeto
- `SUPABASE_ANON_KEY` = sua anon key

### 3. Deploy na Vercel

1. Conecte este repositório à Vercel
2. Adicione as variáveis de ambiente acima
3. Deploy automático!

## Tech Stack

- Vanilla JavaScript
- CSS Variables (Modern CSS)
- Supabase (PostgreSQL)
- Vercel (Hosting + Serverless API)
- Lucide Icons

## Features

- Feed de aprovações por cliente
- Simulador de card Instagram
- Sistema de comentários
- Calendário mensal
- Filtros por status
- Glassmorphism UI
- Grain overlay texture

## Estrutura

```
/api           - Serverless API routes
/css           - Estilos
/js            - JavaScript
/supabase      - Database schema
```

---

Desenvolvido para **Santiz Agência Digital**