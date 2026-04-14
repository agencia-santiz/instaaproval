# ⚡ Skill: Advanced CSS & Animation Techniques

## 1. Scroll-Driven Animations (CSS Native)

### CSS Scroll Timeline API (2025+)
```css
/* Animação vinculada ao scroll sem JavaScript */
@keyframes reveal {
  from { opacity: 0; transform: translateY(60px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* Parallax nativo com CSS */
.parallax-hero {
  animation: parallax-move linear both;
  animation-timeline: scroll();
}
@keyframes parallax-move {
  from { transform: translateY(0); }
  to   { transform: translateY(-30%); }
}

/* Progress bar vinculado ao scroll */
.scroll-progress {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--primary-500);
  transform-origin: left;
  animation: scale-x linear both;
  animation-timeline: scroll();
}
@keyframes scale-x {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

---

## 2. View Transitions API

```css
/* Transições de página estilo app nativa */
::view-transition-old(root) {
  animation: fade-out 0.3s ease-out;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}

/* Transição personalizada por elemento */
.hero-image {
  view-transition-name: hero-image;
}
::view-transition-old(hero-image) {
  animation: scale-down 0.4s ease-in-out;
}
::view-transition-new(hero-image) {
  animation: scale-up 0.4s ease-in-out;
}
```

---

## 3. Intersection Observer + CSS Classes

### JavaScript Controller
```javascript
class ScrollAnimator {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.15;
    this.rootMargin = options.rootMargin || '0px 0px -50px 0px';
    this.staggerDelay = options.staggerDelay || 100;
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: this.threshold, rootMargin: this.rootMargin }
    );
    
    this.init();
  }
  
  init() {
    document.querySelectorAll('[data-animate]').forEach((el, index) => {
      el.style.setProperty('--animation-order', index);
      this.observer.observe(el);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.animateDelay || 0;
        const staggerIndex = el.dataset.staggerIndex || 0;
        
        setTimeout(() => {
          el.classList.add('is-visible');
        }, delay + (staggerIndex * this.staggerDelay));
        
        this.observer.unobserve(el);
      }
    });
  }
}

// Auto-initialize
new ScrollAnimator();
```

### CSS Animation Classes
```css
/* Base state for all animated elements */
[data-animate] {
  opacity: 0;
  will-change: transform, opacity;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-animate].is-visible {
  opacity: 1;
}

/* Slide Up */
[data-animate="slide-up"] {
  transform: translateY(60px);
}
[data-animate="slide-up"].is-visible {
  transform: translateY(0);
}

/* Slide from Left */
[data-animate="slide-left"] {
  transform: translateX(-80px);
}
[data-animate="slide-left"].is-visible {
  transform: translateX(0);
}

/* Scale In */
[data-animate="scale-in"] {
  transform: scale(0.85);
}
[data-animate="scale-in"].is-visible {
  transform: scale(1);
}

/* Blur In */
[data-animate="blur-in"] {
  filter: blur(10px);
  transform: translateY(20px);
}
[data-animate="blur-in"].is-visible {
  filter: blur(0);
  transform: translateY(0);
}

/* Clip Reveal */
[data-animate="clip-reveal"] {
  clip-path: inset(100% 0 0 0);
}
[data-animate="clip-reveal"].is-visible {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Stagger children */
[data-animate-stagger] > * {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
[data-animate-stagger].is-visible > * {
  opacity: 1;
  transform: translateY(0);
}
[data-animate-stagger].is-visible > *:nth-child(1) { transition-delay: 0ms; }
[data-animate-stagger].is-visible > *:nth-child(2) { transition-delay: 100ms; }
[data-animate-stagger].is-visible > *:nth-child(3) { transition-delay: 200ms; }
[data-animate-stagger].is-visible > *:nth-child(4) { transition-delay: 300ms; }
[data-animate-stagger].is-visible > *:nth-child(5) { transition-delay: 400ms; }
[data-animate-stagger].is-visible > *:nth-child(6) { transition-delay: 500ms; }
```

---

## 4. Smooth Scroll & Locomotive Scroll Pattern

```javascript
class SmoothScroller {
  constructor() {
    this.current = 0;
    this.target = 0;
    this.ease = 0.075;
    this.wrapper = document.querySelector('[data-scroll-wrapper]');
    this.content = document.querySelector('[data-scroll-content]');
    
    this.init();
  }
  
  init() {
    document.body.style.height = `${this.content.scrollHeight}px`;
    this.wrapper.style.position = 'fixed';
    this.wrapper.style.top = '0';
    this.wrapper.style.left = '0';
    this.wrapper.style.width = '100%';
    
    window.addEventListener('scroll', () => {
      this.target = window.scrollY;
    });
    
    this.animate();
  }
  
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }
  
  animate() {
    this.current = this.lerp(this.current, this.target, this.ease);
    this.content.style.transform = `translateY(${-this.current}px)`;
    
    // Update parallax elements
    document.querySelectorAll('[data-scroll-speed]').forEach(el => {
      const speed = parseFloat(el.dataset.scrollSpeed) || 0.5;
      const offset = this.current * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
    
    requestAnimationFrame(this.animate.bind(this));
  }
}
```

---

## 5. Magnetic Button Effect

```javascript
class MagneticButton {
  constructor(el) {
    this.el = el;
    this.strength = 40;
    this.area = 200;
    
    this.el.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
  }
  
  onMouseMove(e) {
    const rect = this.el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const distance = Math.sqrt(x * x + y * y);
    
    if (distance < this.area) {
      const factor = 1 - distance / this.area;
      this.el.style.transform = `translate(${x * factor * 0.3}px, ${y * factor * 0.3}px)`;
      this.el.querySelector('.btn-text')?.style.setProperty('transform', 
        `translate(${x * factor * 0.15}px, ${y * factor * 0.15}px)`);
    }
  }
  
  onMouseLeave() {
    this.el.style.transform = 'translate(0, 0)';
    this.el.querySelector('.btn-text')?.style.setProperty('transform', 'translate(0, 0)');
  }
}

// Initialize
document.querySelectorAll('[data-magnetic]').forEach(el => new MagneticButton(el));
```

---

## 6. Custom Cursor

```javascript
class CustomCursor {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursorInner = document.createElement('div');
    this.cursor.className = 'cursor';
    this.cursorInner.className = 'cursor-inner';
    document.body.append(this.cursor, this.cursorInner);
    
    this.pos = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };
    
    document.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    // Interactive elements
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('cursor--active');
        const cursorType = el.dataset.cursor;
        if (cursorType) this.cursor.classList.add(`cursor--${cursorType}`);
      });
      el.addEventListener('mouseleave', () => {
        this.cursor.className = 'cursor';
      });
    });
    
    this.animate();
  }
  
  animate() {
    this.pos.x += (this.mouse.x - this.pos.x) * 0.1;
    this.pos.y += (this.mouse.y - this.pos.y) * 0.1;
    
    this.cursor.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    this.cursorInner.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;
    
    requestAnimationFrame(this.animate.bind(this));
  }
}
```

---

## 7. Text Splitting & Animation

```javascript
class TextSplitter {
  static splitByChars(element) {
    const text = element.textContent;
    element.innerHTML = '';
    element.setAttribute('aria-label', text);
    
    return [...text].map((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--char-index', i);
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.setAttribute('aria-hidden', 'true');
      element.appendChild(span);
      return span;
    });
  }
  
  static splitByWords(element) {
    const words = element.textContent.split(' ');
    element.innerHTML = '';
    
    return words.map((word, i) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'word-wrapper';
      wrapper.style.setProperty('--word-index', i);
      
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      
      wrapper.appendChild(span);
      element.appendChild(wrapper);
      
      if (i < words.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
      
      return span;
    });
  }
  
  static splitByLines(element) {
    const words = element.textContent.split(' ');
    element.innerHTML = words.map(w => `<span class="word-measure">${w} </span>`).join('');
    
    const lines = [];
    let currentLine = [];
    let currentTop = null;
    
    element.querySelectorAll('.word-measure').forEach(word => {
      const top = word.offsetTop;
      if (currentTop !== null && top !== currentTop) {
        lines.push(currentLine.join(' ').trim());
        currentLine = [];
      }
      currentTop = top;
      currentLine.push(word.textContent.trim());
    });
    if (currentLine.length) lines.push(currentLine.join(' ').trim());
    
    element.innerHTML = '';
    return lines.map((line, i) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'line-wrapper';
      wrapper.style.setProperty('--line-index', i);
      wrapper.style.overflow = 'hidden';
      wrapper.style.display = 'block';
      
      const inner = document.createElement('span');
      inner.className = 'line';
      inner.textContent = line;
      inner.style.display = 'block';
      
      wrapper.appendChild(inner);
      element.appendChild(wrapper);
      return inner;
    });
  }
}
```

---

## 8. Horizontal Scroll Section

```css
.horizontal-scroll-section {
  height: 400vh; /* Adjust based on content width */
  position: relative;
}

.horizontal-scroll-container {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.horizontal-scroll-track {
  display: flex;
  gap: var(--space-8);
  padding: 0 10vw;
  will-change: transform;
}

.horizontal-card {
  flex-shrink: 0;
  width: 40vw;
  min-width: 350px;
}
```

```javascript
class HorizontalScroll {
  constructor(section) {
    this.section = section;
    this.track = section.querySelector('.horizontal-scroll-track');
    this.scrollWidth = this.track.scrollWidth - window.innerWidth;
    
    window.addEventListener('scroll', this.update.bind(this));
  }
  
  update() {
    const rect = this.section.getBoundingClientRect();
    const sectionHeight = this.section.offsetHeight - window.innerHeight;
    const scrollProgress = Math.max(0, Math.min(1, -rect.top / sectionHeight));
    
    this.track.style.transform = `translateX(${-scrollProgress * this.scrollWidth}px)`;
  }
}
```

---

## 9. Preloader Pattern

```javascript
class Preloader {
  constructor() {
    this.preloader = document.querySelector('.preloader');
    this.counter = document.querySelector('.preloader-counter');
    this.progress = 0;
    this.targetProgress = 0;
    
    this.loadAssets();
    this.animate();
  }
  
  loadAssets() {
    const images = [...document.querySelectorAll('img')];
    const total = images.length;
    let loaded = 0;
    
    if (total === 0) {
      this.targetProgress = 100;
      return;
    }
    
    images.forEach(img => {
      if (img.complete) {
        loaded++;
        this.targetProgress = (loaded / total) * 100;
      } else {
        img.addEventListener('load', () => {
          loaded++;
          this.targetProgress = (loaded / total) * 100;
        });
        img.addEventListener('error', () => {
          loaded++;
          this.targetProgress = (loaded / total) * 100;
        });
      }
    });
  }
  
  animate() {
    this.progress += (this.targetProgress - this.progress) * 0.05;
    this.counter.textContent = Math.round(this.progress) + '%';
    
    if (this.progress >= 99) {
      this.hide();
      return;
    }
    
    requestAnimationFrame(this.animate.bind(this));
  }
  
  hide() {
    this.preloader.classList.add('preloader--hide');
    document.body.classList.add('loaded');
    
    setTimeout(() => {
      this.preloader.remove();
      // Trigger entrance animations
      document.querySelectorAll('[data-animate-entrance]').forEach((el, i) => {
        setTimeout(() => el.classList.add('is-visible'), i * 150);
      });
    }, 800);
  }
}
```

---

## 10. Performance-Critical Animation Rules

1. **Apenas animar `transform` e `opacity`** — são as únicas propriedades composited
2. **`will-change` com parcimônia** — máximo 5-10 elementos simultâneos
3. **`contain: layout paint`** em seções pesadas
4. **Desabilitar animações em `prefers-reduced-motion`**
5. **`requestAnimationFrame` para animações JS** — nunca `setInterval`
6. **Debounce scroll listeners** ou usar Intersection Observer

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
