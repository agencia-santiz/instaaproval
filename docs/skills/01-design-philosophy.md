# 🎨 Skill: Contemporary Design Philosophy & Visual Language

## Core Principle: "Experience-First Design"

Sites contemporâneos não são páginas — são **experiências imersivas**. Cada pixel, cada transição, cada interação deve comunicar a personalidade da marca.

---

## 1. Tendências de Design 2025-2026

### 1.1 Anti-Design & Brutalismo Refinado
- Tipografia oversized que quebra o grid
- Mistura intencional de serif + sans-serif + monospace
- Grids assimétricos com "tensão visual"
- Espaço negativo generoso (whitespace como elemento de design)

### 1.2 Cinematic Web
- **Full-viewport video backgrounds** com grading cinematográfico
- **Parallax multicamada** (mínimo 3 layers: background, midground, foreground)
- **Scroll-driven storytelling** — o conteúdo se revela como um filme
- Transições de página estilo "corte de cinema"
- Aspect ratios cinematográficos (21:9 para hero sections)

### 1.3 Glassmorphism 2.0
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### 1.4 Grain & Texture
- Film grain overlay sutil (noise texture via SVG filter)
- Texturas orgânicas que quebram a "perfeição digital"
- Gradientes com noise para profundidade

```css
.grain-overlay::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: overlay;
}
```

### 1.5 Kinetic Typography
- Texto que reage ao scroll, hover, cursor
- Letras que se montam/desmontam com animação
- Masking de texto com vídeo/imagens
- Split-text animations (letra por letra, palavra por palavra)

### 1.6 Cursor Personalizado
- Cursor customizado que muda de forma por contexto
- Trail effects, magnetic effects em botões
- Cursor blend-mode para interação com conteúdo

### 1.7 Scroll-Driven Narratives
- Horizontal scroll sections
- Scroll-snap sections com transições
- Progress indicators vinculados ao scroll
- Pin sections (sticky scroll animations)

---

## 2. Paleta de Cores Avançada

### Regra: Nunca use cores flat puras

```css
:root {
  /* Sistema HSL para controle granular */
  --hue-primary: 38;
  --sat-primary: 55%;
  
  /* Variações automáticas */
  --primary-50:  hsl(var(--hue-primary), var(--sat-primary), 95%);
  --primary-100: hsl(var(--hue-primary), var(--sat-primary), 90%);
  --primary-200: hsl(var(--hue-primary), var(--sat-primary), 80%);
  --primary-300: hsl(var(--hue-primary), var(--sat-primary), 70%);
  --primary-400: hsl(var(--hue-primary), var(--sat-primary), 60%);
  --primary-500: hsl(var(--hue-primary), var(--sat-primary), 50%);
  --primary-600: hsl(var(--hue-primary), var(--sat-primary), 40%);
  --primary-700: hsl(var(--hue-primary), var(--sat-primary), 30%);
  --primary-800: hsl(var(--hue-primary), var(--sat-primary), 20%);
  --primary-900: hsl(var(--hue-primary), var(--sat-primary), 10%);
  
  /* Gradientes premium */
  --gradient-warm: linear-gradient(135deg, 
    hsl(38, 60%, 52%) 0%, 
    hsl(15, 70%, 42%) 100%);
  --gradient-hero: linear-gradient(180deg, 
    rgba(13,13,13,0) 0%, 
    rgba(13,13,13,0.4) 40%, 
    rgba(13,13,13,0.95) 100%);
}
```

### Gradientes com Noise (Anti-banding)
```css
.premium-gradient {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
}
.premium-gradient::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('noise.svg');
  opacity: 0.03;
  mix-blend-mode: overlay;
}
```

---

## 3. Tipografia Contemporânea

### Hierarquia com Contraste Dramático
- **Display**: Fontes com personalidade forte (Playfair Display, Fraunces, Instrument Serif)
- **Body**: Ultra-legível e neutra (Inter, Geist, Plus Jakarta Sans)
- **Accent**: Monospace ou condensada para detalhes (JetBrains Mono, Space Grotesk)

### Técnicas Avançadas
```css
/* Fluid Typography com clamp() */
h1 {
  font-size: clamp(2.5rem, 5vw + 1rem, 6rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1;
}

/* Texto com gradiente */
.gradient-text {
  background: linear-gradient(135deg, #c9a962, #e8d5d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Texto com video mask */
.video-text {
  background: url('video-texture.mp4');
  -webkit-background-clip: text;
  color: transparent;
}

/* Variable Fonts para animação */
@font-face {
  font-family: 'VariableFont';
  src: url('font.woff2') format('woff2');
  font-weight: 100 900;
}
.animate-weight {
  transition: font-weight 0.3s ease;
}
.animate-weight:hover {
  font-weight: 900;
}
```

---

## 4. Spacing & Layout

### Sistema de Espaçamento Modular
```css
:root {
  --space-unit: 0.25rem; /* 4px base */
  --space-1: calc(var(--space-unit) * 1);    /* 4px */
  --space-2: calc(var(--space-unit) * 2);    /* 8px */
  --space-3: calc(var(--space-unit) * 3);    /* 12px */
  --space-4: calc(var(--space-unit) * 4);    /* 16px */
  --space-6: calc(var(--space-unit) * 6);    /* 24px */
  --space-8: calc(var(--space-unit) * 8);    /* 32px */
  --space-12: calc(var(--space-unit) * 12);  /* 48px */
  --space-16: calc(var(--space-unit) * 16);  /* 64px */
  --space-24: calc(var(--space-unit) * 24);  /* 96px */
  --space-32: calc(var(--space-unit) * 32);  /* 128px */
  --space-section: clamp(5rem, 12vh, 10rem);
}
```

### Layout Contemporâneo
- **Overlapping elements** — elementos que se sobrepõem intencionalmente
- **Broken grid** — conteúdo que "vaza" do container
- **Full-bleed sections** alternando com contained
- **CSS Grid com áreas nomeadas** para layouts complexos

```css
.hero-grid {
  display: grid;
  grid-template-columns: 1fr min(65ch, 100%) 1fr;
  grid-template-rows: auto 1fr auto;
}
.hero-grid > * {
  grid-column: 2;
}
.hero-grid > .full-bleed {
  grid-column: 1 / -1;
}
```

---

## 5. Key Design Decisions Checklist

Antes de iniciar qualquer projeto contemporâneo:

- [ ] **Mood board definido** — 5-10 referências visuais
- [ ] **Tipo de experiência** — Scroll-driven? Interativo? Cinematográfico?
- [ ] **Paleta HSL** com variações automáticas
- [ ] **Font pairing** testado (máx 3 fontes)
- [ ] **Grid system** definido (12-col, asymmetric, ou custom)
- [ ] **Animação philosophy** — sutil & purposeful vs. bold & expressive
- [ ] **Dark/Light mode** — qual é o default?
- [ ] **Cursor customizado** — sim/não?
- [ ] **Sound design** — interações sonoras sutis?
- [ ] **Loading experience** — preloader customizado?
