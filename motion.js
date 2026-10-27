/* Neurolab Plus — анимации и интерактив.
   Работает поверх app.js. Без JS и при «уменьшении движения» весь контент виден сразу. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const A = window.anime;
  window.__motionReady = true;
  if (reduced || !A) { root.classList.remove('js-motion'); initHeader(false); return; }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = 'cubicBezier(.22,.8,.26,1)';

  /* ---------- 1. Первый экран: одна собранная анимация при загрузке ---------- */
  function splitWords(el) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(w => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    return $$('.w > span', el);
  }
  const heroTitle = $('.hero-content h1, .services-hero-copy h1, .neuro-copy h1');
  if (heroTitle) {
    const words = splitWords(heroTitle);
    const tl = A.timeline({ easing: ease });
    tl.add({ targets: words, translateY: ['105%', '0%'], duration: 1000, delay: A.stagger(55) })
      .add({ targets: $$('[data-intro]'), opacity: [0, 1], translateY: [24, 0], duration: 800, delay: A.stagger(90) }, '-=650')
      .add({ targets: $$('[data-intro-side]'), opacity: [0, 1], translateX: [40, 0], duration: 900, easing: 'spring(1, 90, 14, 0)' }, '-=700');
  }

  /* ---------- 2. Появление блоков при прокрутке ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const group = entry.target;
      revealIO.unobserve(group);
      const kids = group.hasAttribute('data-reveal-self') ? [group] : [...group.children].filter(k => !k.hidden);
      A({
        targets: kids,
        opacity: [0, 1],
        translateY: [36, 0],
        scale: group.dataset.reveal === 'tiles' ? [.97, 1] : 1,
        duration: 1000,
        delay: A.stagger(group.dataset.reveal === 'tiles' ? 110 : 80),
        easing: ease,
        complete: () => group.classList.add('is-revealed')
      });
      group.querySelectorAll('[data-count]').forEach(countUp);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], [data-reveal-self]').forEach(el => revealIO.observe(el));

  /* Цена «набегает» до нужного числа */
  function countUp(el) {
    const end = Number(el.dataset.count);
    const obj = { v: Math.round(end * 0.6) };
    const fmt = n => String(Math.round(n / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    A({ targets: obj, v: end, duration: 1400, easing: 'easeOutExpo', update: () => { el.textContent = fmt(obj.v); } });
  }

  /* ---------- 3. Эффекты, привязанные к прокрутке ---------- */
  const hero = $('.hero');
  const heroMedia = $('.hero-media');
  const heroInner = $('.hero-inner');
  const parallax = $$('[data-parallax]');
  const steps = $$('.visit-steps-list, .steps-track');
  const orbs = $$('.orb');
  let ticking = false;

  function onScroll() {
    const vh = innerHeight;
    if (hero && innerWidth > 650) {
      const p = clamp(scrollY / (hero.offsetHeight * 0.9));
      hero.style.setProperty('--hero-p', p.toFixed(3));
      heroMedia.style.transform = `scale(${1 + p * 0.12}) translateY(${p * 6}%)`;
      heroInner.style.transform = `translateY(${-p * 70}px)`;
      heroInner.style.opacity = String(1 - p * 0.85);
    }
    parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh - r.top) / (vh + r.height));
      img.style.transform = `translateY(${(p - .5) * -10}%) scale(1.14)`;
    });
    steps.forEach(list => {
      const r = list.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.25));
      const items = [...list.children];
      items.forEach((li, i) => {
        const fill = clamp(p * items.length - i);
        li.style.setProperty('--fill', fill.toFixed(3));
        li.classList.toggle('is-active', p * items.length > i + 0.05);
      });
    });
    orbs.forEach((orb, i) => {
      const r = orb.parentElement.getBoundingClientRect();
      orb.style.transform = `translate3d(0, ${r.top * (i ? -0.12 : 0.08)}px, 0)`;
    });
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 4. Шапка: появляется при прокрутке вверх ---------- */
  initHeader(true);

  /* ---------- 5. Карточки: мягкий свет за курсором ---------- */
  if (fine) {
    $$('.tile, .catalog-card, .document-index button, .partners-panel article, .profile-copy').forEach(card => {
      card.classList.add('has-glow');
      const glow = document.createElement('span'); glow.className = 'glow'; glow.setAttribute('aria-hidden', 'true'); card.append(glow);
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    /* Кнопки чуть тянутся к курсору */
    $$('.btn-primary, .btn-lilac, .hero-offer, .tile-more-link').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${x * 6}px, ${y * 5}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        A({ targets: btn, translateX: 0, translateY: 0, duration: 600, easing: 'spring(1, 120, 12, 0)', complete: () => btn.style.removeProperty('transform') });
      });
    });
  }

  /* ---------- 6. Переключение вкладок ---------- */
  $$('[role="tab"]').forEach(tab => tab.addEventListener('click', () => setTimeout(() => {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (!panel || panel.hidden) return;
    A.remove(panel);
    A({ targets: panel, opacity: [0, 1], translateY: [18, 0], duration: 650, easing: ease });
    const kids = panel.matches('.partners-panel') ? [...panel.children] : panel.querySelectorAll('.profile-facts > div, dl > div');
    A({ targets: kids, opacity: [0, 1], translateY: [14, 0], duration: 600, delay: A.stagger(60, { start: 120 }), easing: ease });
  })));

  /* ---------- 7. Каталог: карточки перестраиваются плавно ---------- */
  const grid = $('.catalog-grid');
  if (grid) {
    let t;
    const animateGrid = () => {
      const cards = $$('.catalog-card:not([hidden])', grid);
      A.remove(cards);
      A({ targets: cards, opacity: [0, 1], scale: [.96, 1], translateY: [16, 0], duration: 600, delay: A.stagger(55), easing: ease });
    };
    $$('[data-filter], [data-reset], #reset-filters').forEach(b => b.addEventListener('click', () => setTimeout(animateGrid, 0)));
    $('#service-search')?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(animateGrid, 160); });
  }

  /* ---------- Шапка ---------- */
  function initHeader(animate) {
    const header = document.querySelector('.header');
    if (!header) return;
    const home = document.body.classList.contains('home-page');
    let last = scrollY, raf = false;
    const update = () => {
      const y = scrollY;
      const threshold = home ? 140 : 80;
      header.classList.toggle('is-floating', y > threshold);
      const goingDown = y > last + 4, goingUp = y < last - 4;
      if (y > threshold * 2 && goingDown && !document.querySelector('#mobile-nav:not([hidden])')) header.classList.add('is-hidden');
      if (goingUp || y <= threshold) header.classList.remove('is-hidden');
      if (goingDown || goingUp) last = y;
      raf = false;
    };
    addEventListener('scroll', () => { if (!raf) { raf = true; requestAnimationFrame(update); } }, { passive: true });
    if (!animate) header.classList.add('no-anim');
    update();
  }
})();
