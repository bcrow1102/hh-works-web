/* ============================================================
   HH-WORKS — scripts.js
   Vanilla ES6+ | No dependencies
   ============================================================ */

'use strict';

/* =============================================
   1. UTILITY HELPERS
   ============================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =============================================
   2. ANNOUNCE BAR
   ============================================= */
(function initAnnounceBar() {
  const bar = $('#announceBar');
  const btn = $('#announceClose');
  if (!bar || !btn) return;

  // Persist close state
  if (sessionStorage.getItem('hhworks-announce-closed') === '1') {
    bar.style.display = 'none';
    return;
  }

  btn.addEventListener('click', () => {
    bar.style.maxHeight = bar.offsetHeight + 'px';
    requestAnimationFrame(() => {
      bar.style.transition = 'max-height 0.35s ease, opacity 0.35s ease';
      bar.style.maxHeight = '0';
      bar.style.opacity = '0';
      bar.style.overflow = 'hidden';
    });
    bar.addEventListener('transitionend', () => bar.remove(), { once: true });
    sessionStorage.setItem('hhworks-announce-closed', '1');
  });
})();

/* =============================================
   3. STICKY HEADER
   ============================================= */
(function initHeader() {
  const header = $('#header');
  if (!header) return;

  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', y > 40);
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* =============================================
   4. MOBILE MENU
   ============================================= */
(function initMobileMenu() {
  const hamburger = $('#hamburger');
  const menu = $('#mobileMenu');
  const overlay = $('#mobileOverlay');
  const closeBtn = $('#mobileMenuClose');
  if (!hamburger || !menu) return;

  const open = () => {
    menu.classList.add('open');
    overlay.classList.add('active');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  $$('.mobile-nav-link').forEach(link => link.addEventListener('click', close));
})();

/* =============================================
   5. SCROLL REVEAL
   ============================================= */
(function initScrollReveal() {
  const items = $$('[data-reveal]');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  items.forEach(el => observer.observe(el));
})();

/* =============================================
   6. HERO PARTICLE CANVAS
   ============================================= */
(function initParticles() {
  const container = $('#heroParticles');
  if (!container) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  container.appendChild(canvas);

  const resize = () => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PARTICLE_COUNT = 70;
  const particles = [];

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : canvas.height + 10;
      this.r = Math.random() * 1.8 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.a = 0;
      this.aMax = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset();
      if (this.a < this.aMax) this.a += 0.005;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,197,218,${this.a})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  };
  animate();
})();

/* =============================================
   7. COUNTER ANIMATION
   ============================================= */
(function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(easeOut(progress) * target);

      // 2025(연도)만 콤마 없이
      if (target === 2025) {
        el.textContent = String(value);
      } else {
        el.textContent = value.toLocaleString('en-US');
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* =============================================
   8. REVIEW CAROUSEL
   ============================================= */
(function initCarousel() {
  const track = $('#reviewTrack');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const dotsWrap = $('#carouselDots');
  if (!track) return;

  const cards = $$('.review-card', track);
  const total = cards.length;
  let current = 0;
  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;

  // Determine visible count
  const getVisible = () => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  // Build dots
  const buildDots = () => {
    dotsWrap.innerHTML = '';
    const vis = getVisible();
    const pages = Math.ceil(total / vis);
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `페이지 ${i + 1}`);
      dot.addEventListener('click', () => goTo(i * vis));
      dotsWrap.appendChild(dot);
    }
  };

  const updateDots = () => {
    const vis = getVisible();
    const activePage = Math.round(current / vis);
    $$('.carousel-dot', dotsWrap).forEach((d, i) => {
      d.classList.toggle('active', i === activePage);
    });
  };

  const getOffset = () => {
    const vis = getVisible();
    const cardEl = cards[0];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    const cardW = cardEl.offsetWidth + gap;
    return -(current * cardW);
  };

  const render = () => {
    track.style.transform = `translateX(${getOffset()}px)`;
    updateDots();
  };

  const goTo = (idx) => {
    const vis = getVisible();
    current = Math.max(0, Math.min(idx, total - vis));
    render();
  };

  prevBtn.addEventListener('click', () => goTo(current - getVisible()));
  nextBtn.addEventListener('click', () => goTo(current + getVisible()));

  // Drag support
  const onDragStart = (x) => {
    isDragging = true;
    startX = x;
    scrollStart = current;
  };
  const onDragMove = (x) => {
    if (!isDragging) return;
    const delta = startX - x;
    if (Math.abs(delta) > 60) {
      goTo(scrollStart + (delta > 0 ? 1 : -1));
      isDragging = false;
    }
  };
  const onDragEnd = () => { isDragging = false; };

  track.addEventListener('mousedown', e => onDragStart(e.clientX));
  track.addEventListener('mousemove', e => onDragMove(e.clientX));
  track.addEventListener('mouseup', onDragEnd);
  track.addEventListener('mouseleave', onDragEnd);
  track.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove', e => onDragMove(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', onDragEnd);

  // Auto-play
  let autoInterval = setInterval(() => goTo(current + getVisible()), 5000);
  const resetAuto = () => {
    clearInterval(autoInterval);
    autoInterval = setInterval(() => goTo(current + getVisible()), 5000);
  };
  prevBtn.addEventListener('click', resetAuto);
  nextBtn.addEventListener('click', resetAuto);

  window.addEventListener('resize', () => {
    current = 0;
    buildDots();
    render();
  }, { passive: true });

  buildDots();
  render();
})();

/* =============================================
   9. PRODUCT MODAL
   ============================================= */
(function initModal() {
  const overlay = $('#modalOverlay');
  const modal = $('#productModal');
  const closeBtn = $('#modalClose');
  const content = $('#modalContent');
  if (!overlay || !modal) return;

  const products = {
    'huty-pro': {
      name: 'Huty Pro Series',
      tag: 'BEST SELLER',
      desc: '체계적인 웰니스 관리를 위한 프리미엄 라인. 과학적 연구와 천연 원료의 완벽한 결합.',
      features: ['임상 실험 검증 효능', '천연 고품질 원료', '지속 가능한 패키징', '글로벌 품질 인증'],
      price: '₩ 89,000',
    },
    'daily-care': {
      name: 'Daily Care',
      tag: 'NEW',
      desc: '매일의 루틴을 완성하는 일상 케어 라인. 자극 없이 순하고 효과적인 케어.',
      features: ['무자극 순한 성분', '365일 데일리 케어', '피부 타입별 맞춤', '편리한 사용감'],
      price: '₩ 45,000',
    },
    'signature': {
      name: 'Signature Edition',
      tag: 'LIMITED',
      desc: '한정판 시그니처 에디션. 최고급 성분으로 선물로도 완벽한 특별한 컬렉션.',
      features: ['한정 수량 생산', '프리미엄 패키징', '시그니처 향', '선물 포장 포함'],
      price: '₩ 135,000',
    },
  };

  const openModal = (productKey) => {
    const p = products[productKey];
    if (!p) return;

    content.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <div style="display:inline-block;background:var(--c-accent);color:var(--c-black);font-size:0.62rem;font-weight:700;letter-spacing:0.15em;padding:0.2rem 0.6rem;border-radius:2px;text-transform:uppercase;margin-bottom:1rem">${p.tag}</div>
        <h3 style="font-family:var(--f-display);font-size:1.8rem;font-weight:800;letter-spacing:-0.02em;color:var(--c-white);margin-bottom:0.75rem">${p.name}</h3>
        <p style="font-size:0.95rem;color:var(--c-grey);line-height:1.7;margin-bottom:1.5rem">${p.desc}</p>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:0.5rem;margin-bottom:2rem">
          ${p.features.map(f => `<li style="display:flex;align-items:center;gap:0.6rem;font-size:0.875rem;color:rgba(255,255,255,0.7)"><span style="color:var(--c-accent);font-size:0.5rem">◆</span>${f}</li>`).join('')}
        </ul>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <span style="font-family:var(--f-display);font-size:1.5rem;font-weight:800;color:var(--c-white)">${p.price}</span>
          <div style="display:flex;gap:0.75rem">
            <button class="btn btn-ghost btn-sm" id="modalWishlist">찜하기</button>
            <button class="btn btn-primary" id="modalAddCart">장바구니 담기</button>
          </div>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

    // Hook modal buttons
    $('#modalAddCart')?.addEventListener('click', () => {
      updateCart();
      closeModal();
    });
    $('#modalWishlist')?.addEventListener('click', () => {
      closeModal();
    });
  };

  const closeModal = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Open via card CTAs
  $$('.js-card-cta').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.product));
  });

  // Close
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // Expose for external use
  window.hhOpenModal = openModal;
  window.hhCloseModal = closeModal;
})();

/* =============================================
   10. CART COUNTER
   ============================================= */
let cartCount = 0;
function updateCart() {
  cartCount++;
  const badge = $('.cart-badge');
  if (badge) {
    badge.textContent = cartCount;
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => badge.style.transform = '', 300);
  }
}

/* =============================================
   11. NEWSLETTER FORM
   ============================================= */
(function initNewsletter() {
  const form = $('#newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');

    const email = input.value.trim();
    if (!email) return;

    // Simulate submission
    btn.textContent = '처리 중...';
    btn.disabled = true;

    setTimeout(() => {
      form.innerHTML = `
        <div style="text-align:center;padding:1rem 0">
          <div style="font-size:1.5rem;margin-bottom:0.5rem;color:var(--c-accent)">✓</div>
          <p style="color:var(--c-white);font-weight:600;margin-bottom:0.3rem">구독 완료!</p>
          <p style="color:var(--c-grey);font-size:0.85rem">곧 최신 소식을 받아보실 수 있습니다.</p>
        </div>
      `;
    }, 1200);
  });
})();

/* =============================================
   12. BACK TO TOP
   ============================================= */
(function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  const toggle = () => btn.classList.toggle('visible', window.scrollY > 500);
  window.addEventListener('scroll', toggle, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* =============================================
   13. CTA BUTTONS HOOKS
   ============================================= */
(function initCTAHooks() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  $('#heroCTAPrimary')?.addEventListener('click', () => scrollTo('collection'));
  $('#heroCTASecondary')?.addEventListener('click', () => scrollTo('story'));
  $('#editorialCTA')?.addEventListener('click', () => scrollTo('brand'));
  $('#hutyCTA')?.addEventListener('click', () => scrollTo('categories'));
  $('#ctaJoin')?.addEventListener('click', () => scrollTo('newsletter'));
  $('#ctaLearn')?.addEventListener('click', () => scrollTo('brand'));
})();

/* =============================================
   14. SMOOTH ANCHOR LINKS
   ============================================= */
(function initAnchorLinks() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
/* =============================================
   6.5 HERO MARQUEE TEXT (복구)
   ============================================= */
(function initHeroMarquee() {
  const container = $('#heroParticles');
  if (!container) return;

  // 중복 생성 방지
  if (container.querySelector('.hero-marquee')) return;

  // 레이어링을 위해 컨테이너 포지션 보정
  container.style.position = 'absolute';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';

  const marquee = document.createElement('div');
  marquee.className = 'hero-marquee';
  marquee.innerHTML = `
    <div class="hero-marquee-row hero-marquee-row--a">
      <div class="hero-marquee-track">
        <span>HH-WORKS · Wellness × Technology · Human-centered · </span>
        <span>HH-WORKS · Wellness × Technology · Human-centered · </span>
        <span>HH-WORKS · Wellness × Technology · Human-centered · </span>
      </div>
    </div>
    <div class="hero-marquee-row hero-marquee-row--b">
      <div class="hero-marquee-track">
        <span>NEW COLLECTION 2026 · Designed for Human · </span>
        <span>NEW COLLECTION 2026 · Designed for Human · </span>
        <span>NEW COLLECTION 2026 · Designed for Human · </span>
      </div>
    </div>
  `;
  // container.appendChild(marquee);
})();
