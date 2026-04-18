/* ============================================================
   main.js — Alen Troyan Business Card
   Requires: GSAP 3 + ScrollTrigger + ScrollToPlugin (CDN, deferred)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  fitHeroDisplay();     // must run BEFORE animation (sets font-size)
  initCursor();
  initNav();
  initHeroAnimation();
  initIntroPhotos();
  initScrollReveal();
  initMagneticElements();
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

  const MARGIN = 28; // px — gap from each screen edge

  function fit() {
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
  // Hide placeholder when real image loads
  document.querySelectorAll('.intro-photo img').forEach(img => {
    const placeholder = img.nextElementSibling;
    if (img.complete && img.naturalWidth > 0) {
      placeholder.style.display = 'none';
    } else {
      img.addEventListener('load', () => { placeholder.style.display = 'none'; });
      img.addEventListener('error', () => { img.style.display = 'none'; });
    }
  });

  // Subtle scroll-in for each photo
  document.querySelectorAll('.intro-photo').forEach((photo, i) => {
    gsap.fromTo(photo,
      { opacity: 0, y: 60 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: photo, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  // Intro panel text reveal
  gsap.fromTo('.intro-panel',
    { opacity: 0, x: -40 },
    { opacity: 1, x: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#intro', start: 'top 85%', toggleActions: 'play none none none' }
    }
  );
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
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

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

  progressBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
  volumeSlider.addEventListener('input', (e) => { audio.volume = +e.target.value; });

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }
}
