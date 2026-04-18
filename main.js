/* ============================================================
   main.js — Alen Troyan Business Card
   Requires: GSAP 3 + ScrollTrigger + ScrollToPlugin (CDN, deferred)
   ============================================================ */

const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  fitHeroDisplay();
  if (!isTouchDevice) initCursor();
  initNav();
  initMobileMenu();
  initHeroAnimation();
  initIntroPhotos();
  initCarousel();
  initScrollReveal();
  if (!isTouchDevice) initMagneticElements();
  initProjectHover();
  initMusicPlayer();
});

/* ============================================================
   HERO TEXT AUTO-SIZER
   Bug fix: measure .line (inner span) not .hero-display,
   because .line-wrap has overflow:hidden which hides text
   overflow from the parent's scrollWidth.
   ============================================================ */
function fitHeroDisplay() {
  const el   = document.querySelector('.hero-display');
  const line = document.querySelector('.hero-display .line');
  const nav  = document.querySelector('.hero-nav');
  if (!el || !line) return;

  function fit() {
    const MARGIN = window.innerWidth < 480 ? 14 : 28; // narrower margin on phones

    // Apply side margins to title
    el.style.paddingLeft  = MARGIN + 'px';
    el.style.paddingRight = MARGIN + 'px';

    // Sync nav horizontal padding to match title
    if (nav) {
      nav.style.paddingLeft  = MARGIN + 'px';
      nav.style.paddingRight = MARGIN + 'px';
    }

    // Binary search: find largest font-size where text fits the padded width.
    // We measure line.scrollWidth (actual text width) vs line.clientWidth
    // (available width = 100% of el's content area after padding).
    let lo = 12, hi = 800;
    el.style.fontSize = hi + 'px';

    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1; // fast floor division by 2
      el.style.fontSize = mid + 'px';
      if (line.scrollWidth <= line.clientWidth) lo = mid;
      else hi = mid;
    }

    el.style.fontSize = lo + 'px';
  }

  // Run twice: once immediately (approximate), once after fonts fully load (exact)
  fit();
  document.fonts.ready.then(fit);

  // Re-fit on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 80);
  }, { passive: true });
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function open()  {
    toggle.classList.add('open');
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    gsap.fromTo('.mobile-nav-links a',
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out', delay: 0.2 }
    );
  }
  function close() {
    toggle.classList.remove('open');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () =>
    toggle.classList.contains('open') ? close() : open()
  );

  const closeBtn = document.getElementById('mobile-menu-close');
  if (closeBtn) closeBtn.addEventListener('click', close);

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      close();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        setTimeout(() => {
          gsap.to(window, { duration: 1, scrollTo: { y: target, offsetY: 60 }, ease: 'power3.inOut' });
        }, 350);
      }
    });
  });
}

/* ============================================================
   CURSOR
   ============================================================ */
function initCursor() {
  const meeple = document.getElementById('cursor-meeple');
  const svg    = document.getElementById('cursor-svg');
  const ring   = document.getElementById('cursor-ring');

  let mouseX = -100, mouseY = -100;
  let meepleX = -100, meepleY = -100;
  let ringX   = -100, ringY   = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  gsap.ticker.add(() => {
    meepleX += (mouseX - meepleX) * 0.22;
    meepleY += (mouseY - meepleY) * 0.22;
    gsap.set(meeple, { x: meepleX, y: meepleY });

    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    gsap.set(ring, { x: ringX, y: ringY });
  });

  document.addEventListener('mouseleave', () => gsap.to([meeple, ring], { opacity: 0, duration: 0.3 }));
  document.addEventListener('mouseenter', () => gsap.to([meeple, ring], { opacity: 1, duration: 0.3 }));

  // Idle sway
  const swayTween = gsap.to(svg, {
    rotation: 4, duration: 1.8, ease: 'sine.inOut',
    yoyo: true, repeat: -1, transformOrigin: '50% 100%'
  });

  // Hover
  document.querySelectorAll('a, button, .skill-card, .project-item, [data-magnetic], #game-canvas')
    .forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor--hovering');
        swayTween.pause();
        gsap.to(svg, { scale: 1.4, rotation: -10, duration: 0.22, ease: 'power3.out', overwrite: true, transformOrigin: '50% 50%' });
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor--hovering');
        gsap.to(svg, { scale: 1, rotation: 0, duration: 0.3, ease: 'power3.out', overwrite: true, transformOrigin: '50% 50%', onComplete: () => swayTween.restart() });
      });
    });

  // Click squash
  window.addEventListener('mousedown', () => {
    document.body.classList.add('cursor--clicking');
    gsap.to(svg, { scaleY: 0.72, scaleX: 1.2, duration: 0.07, ease: 'power2.in', overwrite: 'auto', transformOrigin: '50% 100%' });
  });
  window.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor--clicking');
    gsap.to(svg, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1.1, 0.5)', overwrite: 'auto', transformOrigin: '50% 100%' });
  });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNav() {
  const nav = document.getElementById('nav');

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom top',
    onEnter()     { nav.classList.add('visible'); },
    onLeaveBack() { nav.classList.remove('visible'); }
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      gsap.to(window, { duration: 1.2, scrollTo: { y: target, offsetY: 60 }, ease: 'power3.inOut' });
    });
  });
}

/* ============================================================
   INTRO PHOTOS
   ============================================================ */
function initIntroPhotos() {
  document.querySelectorAll('.intro-photo img').forEach(img => {
    const placeholder = img.nextElementSibling;
    if (img.complete && img.naturalWidth > 0) {
      if (placeholder) placeholder.style.display = 'none';
    } else {
      img.addEventListener('load', () => {
        if (placeholder) placeholder.style.display = 'none';
      });
      img.addEventListener('error', () => {
        img.style.display = 'none';
        // Show number placeholder as fallback when image fails to load
        if (placeholder) placeholder.style.display = 'flex';
      });
    }
  });

  if (!isTouchDevice) {
    document.querySelectorAll('.intro-photo').forEach((photo, i) => {
      gsap.fromTo(photo,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: {
            trigger: photo,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
            onEnter: () => gsap.to(photo, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
          }
        }
      );
    });

    gsap.fromTo('.intro-panel',
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '#intro', start: 'top 85%', toggleActions: 'play none none none', once: true }
      }
    );

    // Recalculate trigger positions after fonts/images finish loading
    setTimeout(() => ScrollTrigger.refresh(), 600);
  }
}

/* ============================================================
   INTRO CAROUSEL — mobile only (< 900px)
   ============================================================ */
function initCarousel() {
  if (window.innerWidth >= 900) return;

  const container = document.querySelector('.intro-photos');
  if (!container) return;

  const slides = Array.from(container.querySelectorAll('.intro-photo'));
  if (slides.length < 2) return;

  // Wrap all slides in a track div
  const track = document.createElement('div');
  track.className = 'carousel-track';
  slides.forEach(s => track.appendChild(s));
  container.appendChild(track);

  // Build dot buttons
  const dotsEl = document.createElement('div');
  dotsEl.className = 'carousel-dots';
  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', 'Фото ' + (i + 1));
    btn.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(btn);
    return btn;
  });
  container.appendChild(dotsEl);

  // Slide counter "01 / 04"
  const counter = document.createElement('span');
  counter.className = 'carousel-counter';
  container.appendChild(counter);

  let current = 0;

  function pad(n) { return String(n).padStart(2, '0'); }

  function goTo(index) {
    current = ((index % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    counter.textContent = pad(current + 1) + ' / ' + pad(slides.length);
  }

  goTo(0); // set initial state

  // Touch swipe
  let startX = 0;
  let startTime = 0;

  container.addEventListener('touchstart', e => {
    startX    = e.touches[0].clientX;
    startTime = Date.now();
  }, { passive: true });

  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dt = Date.now() - startTime;
    if (Math.abs(dx) > 45 && dt < 450) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }
  }, { passive: true });

  // Pointer drag (mouse / stylus on tablets)
  let pointerStartX = 0;
  let pointerDown   = false;

  container.addEventListener('pointerdown', e => {
    pointerStartX = e.clientX;
    pointerDown   = true;
    startTime     = Date.now();
  }, { passive: true });

  container.addEventListener('pointerup', e => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - pointerStartX;
    const dt = Date.now() - startTime;
    if (Math.abs(dx) > 45 && dt < 450) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }
  }, { passive: true });
}

/* ============================================================
   HERO ENTRANCE ANIMATION
   ============================================================ */
function initHeroAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl
    .to('.hero-display .line', { y: 0, duration: 1.0 }, 0.05)
    .to('.hero-nav',           { opacity: 1, duration: 0.5 }, 0.6);
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  if (!isTouchDevice) {
    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        }
      );
    });
  }

  ScrollTrigger.create({
    trigger: '#skills', start: 'top 75%', once: true,
    onEnter() {
      gsap.from('.skill-card', { opacity: 0, scale: 0.88, duration: 0.5, stagger: 0.035, ease: 'power2.out' });
    }
  });

  ScrollTrigger.create({
    trigger: '#work', start: 'top 80%', once: true,
    onEnter() {
      gsap.from('.project-item', { opacity: 0, x: -40, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
    }
  });

  ScrollTrigger.create({
    trigger: '#contact', start: 'top 75%', once: true,
    onEnter() {
      gsap.from('.contact-item', { opacity: 0, y: 40, duration: 0.7, stagger: 0.1, delay: 0.2, ease: 'power3.out' });
    }
  });
}

/* ============================================================
   MAGNETIC ELEMENTS
   ============================================================ */
function initMagneticElements() {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width  / 2) * 0.28;
      const dy = (e.clientY - rect.top  - rect.height / 2) * 0.28;
      gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ============================================================
   PROJECT HOVER
   ============================================================ */
function initProjectHover() {
  document.querySelectorAll('.project-item').forEach(item => {
    const title = item.querySelector('.project-title');
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
      const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
      gsap.to(title, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(title, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)' });
    });
  });
}

/* ============================================================
   MUSIC PLAYER
   ============================================================ */
function initMusicPlayer() {
  const audio = new Audio('audio/ES_I Got You (Instrumental Version) - SRA.mp3');
  audio.loop    = true;
  audio.preload = 'metadata';
  audio.volume  = 0.7;

  const playBtn      = document.getElementById('player-play');
  const progressFill = document.getElementById('player-progress-fill');
  const progressBar  = document.getElementById('player-progress-wrapper');
  const currentEl    = document.getElementById('player-current');
  const totalEl      = document.getElementById('player-total');
  const volumeSlider = document.getElementById('player-volume');
  const trackName    = document.getElementById('player-track-name');

  let isPlaying = false, rafId = null;

  audio.addEventListener('error', () => {
    trackName.textContent = 'Drop track.mp3 into /audio/';
    playBtn.disabled = true;
    playBtn.style.opacity = '0.3';
  });
  audio.addEventListener('loadedmetadata', () => {
    totalEl.textContent = fmt(audio.duration);
    trackName.textContent = 'I Got You — SRA';
  });

  function tick() {
    if (!audio.duration) return;
    progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    currentEl.textContent = fmt(audio.currentTime);
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    audio.play().then(() => {
      isPlaying = true;
      playBtn.innerHTML = '&#9646;&#9646;';
      rafId = requestAnimationFrame(tick);
    }).catch(() => {});
  }
  function pause() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '&#9654;';
    if (rafId) cancelAnimationFrame(rafId);
  }

  playBtn.addEventListener('click', () => isPlaying ? pause() : play());
  audio.addEventListener('ended', pause);

  function seekFromEvent(e) {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    audio.currentTime = ((clientX - rect.left) / rect.width) * audio.duration;
  }
  progressBar.addEventListener('click', seekFromEvent);
  progressBar.addEventListener('touchstart', seekFromEvent, { passive: false });
  volumeSlider.addEventListener('input', (e) => { audio.volume = +e.target.value; });

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }
}
