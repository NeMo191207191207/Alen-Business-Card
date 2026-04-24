/* ============================================================
   main.js — Alen Troyan Business Card
   Requires: GSAP 3 + ScrollTrigger + ScrollToPlugin (CDN, deferred)
   ============================================================ */

const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  initThemeToggle();   // first — sets data-theme before animations read it
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
  initDinoFix();
});

/* ============================================================
   HERO SVG AUTO-SIZER
   Binary-searches font-size on the SVG <text> element so that
   "ALEN TROYAN" fills the viewport edge-to-edge (minus MARGIN).
   Uses getBBox() instead of scrollWidth so it works on SVG text.
   ============================================================ */
function fitHeroDisplay() {
  const svgEl  = document.getElementById('hero-svg');
  const textEl = document.getElementById('hero-text');
  const navEl  = document.querySelector('.hero-nav');
  if (!svgEl || !textEl) return;

  function fit() {
    const MARGIN   = window.innerWidth < 480 ? 14 : 28;
    const parentW  = svgEl.parentElement.offsetWidth || window.innerWidth;
    const availW   = parentW - MARGIN * 2;

    if (navEl) {
      navEl.style.paddingLeft  = MARGIN + 'px';
      navEl.style.paddingRight = MARGIN + 'px';
    }

    // Binary search for largest font-size where text width ≤ availW
    let lo = 12, hi = 800;
    textEl.setAttribute('font-size', hi);
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      textEl.setAttribute('font-size', mid);
      try {
        if (textEl.getBBox().width <= availW) lo = mid;
        else hi = mid;
      } catch (e) { break; }
    }
    textEl.setAttribute('font-size', lo);

    // Resize SVG to tightly wrap the text + small vertical padding
    try {
      const bbox = textEl.getBBox();
      const svgH = Math.ceil(bbox.height * 1.12);
      svgEl.setAttribute('height', svgH);
      svgEl.setAttribute('viewBox', `0 0 ${parentW} ${svgH}`);
      textEl.setAttribute('x', MARGIN);
      textEl.setAttribute('y', Math.ceil(bbox.height * 0.90));
    } catch (e) {}
  }

  fit();
  document.fonts.ready.then(fit); // re-run once Syne font is loaded for pixel-perfect width

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

  // Wrap slides in a track
  const track = document.createElement('div');
  track.className = 'carousel-track';
  slides.forEach(s => track.appendChild(s));
  container.appendChild(track);

  // Dots
  const dotsEl = document.createElement('div');
  dotsEl.className = 'carousel-dots';
  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', 'Фото ' + (i + 1));
    btn.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsEl.appendChild(btn);
    return btn;
  });
  container.appendChild(dotsEl);

  // Counter "01 / 04"
  const counter = document.createElement('span');
  counter.className = 'carousel-counter';
  container.appendChild(counter);

  let current = 0;
  const count = slides.length;

  function pad(n) { return String(n).padStart(2, '0'); }

  function goTo(index, instant) {
    current = ((index % count) + count) % count;
    track.style.transition = instant
      ? 'none'
      : 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform  = `translateX(-${current * 100}%)`;
    dots.forEach((d, i)   => d.classList.toggle('active', i === current));
    counter.textContent    = pad(current + 1) + ' / ' + pad(count);
  }

  goTo(0, true);

  // ── Auto-advance every 15 s ──────────────────────────────
  let autoTimer = setInterval(() => goTo(current + 1), 15000);
  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 15000);
  }

  // ── Touch swipe — only touch events (pointer events fire twice on mobile) ──
  let t0x = 0, t0y = 0, tCurX = 0;
  let dragging = false;
  let horiz    = null; // null=undecided · true=horizontal · false=vertical

  container.addEventListener('touchstart', e => {
    t0x      = e.touches[0].clientX;
    t0y      = e.touches[0].clientY;
    tCurX    = t0x;
    dragging = true;
    horiz    = null;
    track.style.transition = 'none'; // instant follow while dragging
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - t0x;
    const dy = e.touches[0].clientY - t0y;
    tCurX = e.touches[0].clientX;

    // Decide direction on first meaningful movement
    if (horiz === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      horiz = Math.abs(dx) >= Math.abs(dy);
    }

    if (horiz) {
      // Live-follow finger: offset relative to current slide
      const pct = -(current * 100) + (dx / container.offsetWidth * 100);
      track.style.transform = `translateX(${pct}%)`;
    }
    // vertical → page scrolls normally, carousel untouched
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;

    if (!horiz) { goTo(current); return; } // vertical flick — snap back

    const dx = e.changedTouches[0].clientX - t0x;
    // Advance if dragged > 25 % of container width
    if (Math.abs(dx) > container.offsetWidth * 0.25) {
      goTo(dx < 0 ? current + 1 : current - 1);
    } else {
      goTo(current); // snap back to current
    }
    resetAuto();
  }, { passive: true });

  container.addEventListener('touchcancel', () => {
    if (dragging) { dragging = false; goTo(current); }
  }, { passive: true });
}

/* ============================================================
   HERO ENTRANCE ANIMATION
   True per-letter stroke-draw with GSAP stagger.
   Each <tspan> gets stroke-dasharray/dashoffset animated
   independently — same technique as GSAP DrawSVG under the hood.
   Final fill: white (no green).
   ============================================================ */
function initHeroAnimation() {
  const svgEl  = document.getElementById('hero-svg');
  const tspans = Array.from(document.querySelectorAll('#hero-text tspan'));
  if (!tspans.length) return;

  const DASH = 3000;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const FILL    = isLight ? '#1c0f06' : '#ffffff';

  gsap.set(tspans, { attr: { 'stroke-dasharray': DASH, 'stroke-dashoffset': DASH } });
  gsap.set(svgEl, { y: '115%' });

  const tl = gsap.timeline();
  tl
    .to(svgEl,   { y: 0, duration: 0.5, ease: 'power4.out' }, 0.05)
    .to(tspans,  { attr: { 'stroke-dashoffset': 0 }, duration: 1.1, stagger: 0.09, ease: 'power2.inOut' }, 0.2)
    .to(tspans,  { attr: { fill: FILL }, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, '-=0.35')
    .to('.hero-nav', { opacity: 1, duration: 0.5 }, 0.6);
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
  const playlist = [
    { file: 'audio/Timeless-The_Weeknd  Playboi_Carti.mp3',                   label: 'Timeless \u2014 The_Weeknd  Playboi_Carti' },
    { file: 'audio/HoodTrapJerk \u2014 Billie Jean (www.lightaudio.ru).mp3',  label: 'Billie Jean \u2014 HoodTrapJerk' },
    { file: 'audio/Childish Gambino - LES (hitmos.fm).mp3',                   label: 'LES \u2014 Childish Gambino' },
    { file: 'audio/Eslabon Armado \u2014 Jugaste y Sufri (www.lightaudio.ru).mp3', label: 'Jugaste y Sufri \u2014 Eslabon Armado' },
    { file: 'audio/JMSN_-_Love_Me_76807738.mp3',                              label: 'Love Me \u2014 JMSN' },
    { file: 'audio/Kanye_West_-_Flashing_Lights_48025583.mp3',                label: 'Flashing Lights \u2014 Kanye West' },
    { file: 'audio/Pantera.MP3',                                               label: 'Pantera' },
  ];

  let currentIdx = 0;
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume  = 0.7;

  const playBtn      = document.getElementById('player-play');
  const prevBtn      = document.getElementById('player-prev');
  const nextBtn      = document.getElementById('player-next');
  const progressFill = document.getElementById('player-progress-fill');
  const progressBar  = document.getElementById('player-progress-wrapper');
  const currentEl    = document.getElementById('player-current');
  const totalEl      = document.getElementById('player-total');
  const volumeSlider = document.getElementById('player-volume');
  const trackName    = document.getElementById('player-track-name');

  let isPlaying = false, rafId = null;

  function loadTrack(idx, autoPlay) {
    currentIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[currentIdx];
    audio.src = track.file;
    trackName.textContent = track.label;
    totalEl.textContent = '0:00';
    currentEl.textContent = '0:00';
    progressFill.style.width = '0%';
    playBtn.disabled = false;
    playBtn.style.opacity = '';
    if (autoPlay) { audio.load(); play(); }
    else audio.load();
  }

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

  audio.addEventListener('loadedmetadata', () => { totalEl.textContent = fmt(audio.duration); });
  audio.addEventListener('ended', () => loadTrack(currentIdx + 1, true));
  audio.addEventListener('error', () => {
    trackName.textContent = playlist[currentIdx].label + ' (не найден)';
  });

  playBtn.addEventListener('click', () => isPlaying ? pause() : play());
  prevBtn.addEventListener('click', () => loadTrack(currentIdx - 1, isPlaying));
  nextBtn.addEventListener('click', () => loadTrack(currentIdx + 1, isPlaying));

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

  loadTrack(0, false);
}

/* ============================================================
   THEME TOGGLE
   Saves to localStorage, updates data-theme on <html>,
   syncs hero SVG fill color if animation has already run.
   ============================================================ */
function initThemeToggle() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Sync hero SVG fill if letters are already filled (animation done)
    const tspans = Array.from(document.querySelectorAll('#hero-text tspan'));
    if (tspans.length) {
      const fill = theme === 'light' ? '#1c0f06' : '#ffffff';
      gsap.set(tspans, { attr: { fill } });
    }

    // Sync browser chrome color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#faf5ee' : '#000000');
  }
}

/* ============================================================
   DINO FIX
   Runner only handles keydown, not mouse clicks.
   1. Click anywhere in game-container → simulate space keydown.
   2. While cursor hovers game-container, capture space keydown
      before the browser scrolls the page.
   ============================================================ */
function initDinoFix() {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;

  let gameHovered = false;
  gameContainer.addEventListener('mouseenter', () => { gameHovered = true;  });
  gameContainer.addEventListener('mouseleave', () => { gameHovered = false; });

  // Click → trigger jump/start directly on the Runner instance
  gameContainer.addEventListener('click', () => {
    gameHovered = true;
    triggerRunnerSpace();
  });

  // Prevent page scroll on space when hovering; Runner's own listener handles the rest
  document.addEventListener('keydown', (e) => {
    if (gameHovered && (e.code === 'Space' || e.keyCode === 32)) {
      e.preventDefault();
    }
  }, { capture: true });

  function triggerRunnerSpace() {
    if (typeof Runner !== 'undefined' && Runner.instance_) {
      Runner.instance_.onKeyDown({ keyCode: 32, type: 'keydown', preventDefault() {} });
    }
  }
}
