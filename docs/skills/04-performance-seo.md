# 🚀 Skill: Performance Optimization & SEO Mastery

## 1. Critical Rendering Path

### Inline Critical CSS
```html
<head>
  <style>
    /* Reset + variables + header + hero styles only */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', sans-serif;
      background: #0D0D0D;
      color: #FAFAFA;
      overflow-x: hidden;
    }
  </style>
  <link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/css/main.css"></noscript>
</head>
```

### Resource Hints and Image Optimization
* Use `<link rel="preconnect">` for critical external connections.
* Implement `Lazy Loading` using loading="lazy" for off-screen images.
* Use `<picture>` tags with `.webp` and fallback formats for high-res images.

*(Includes SEO instructions from the SEO KI)*
