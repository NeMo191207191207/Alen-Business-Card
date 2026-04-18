/* ============================================================
   game.js — Dino Runner
   Self-contained. No dependencies. Fires after fonts load.
   ============================================================ */

(function () {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = 480;
  const H = 200;
  canvas.width  = W;
  canvas.height = H;

  /* ---- Palette ---- */
  const C = {
    bg:       '#0a0a0a',
    white:    '#ffffff',
    red:      '#e70000',
    redDark:  '#a80000',
    gray:     '#333333',
    grayMid:  '#555555',
    grayTxt:  '#666666',
    purple:   '#ae4cf7',
    blue:     '#8c9ffc',
  };

  /* ---- Ground ---- */
  const GROUND_Y = H - 32;

  /* ---- Dino geometry ---- */
  const DINO = {
    x: 52,
    y: GROUND_Y,
    w: 22,
    h: 28,
    legH: 6,
    vy: 0,
    jumpCount: 0,
    maxJumps: 2,
    JUMP_V: -10.5,
    GRAVITY: 0.55,
    frameTimer: 0,
    frame: 0,          // 0 or 1 (leg animation)
    dustTimer: 0,
  };

  /* ---- State ---- */
  let state    = 'idle';  // 'idle' | 'playing' | 'gameover'
  let score    = 0;
  let hiScore  = 0;
  let speed    = 4.5;
  let frameIdx = 0;
  let rafId    = null;

  /* ---- Obstacles ---- */
  let obstacles = [];
  let obstTimer = 0;
  let obstInterval = 90; // frames between spawns

  /* ---- Clouds ---- */
  let clouds = [
    { x: 200, y: 28, w: 40, speed: 0.4 },
    { x: 380, y: 18, w: 28, speed: 0.3 },
  ];

  /* ---- Dust particles ---- */
  let dustParticles = [];

  /* ---- Score flash ---- */
  let scoreFlash = 0;

  /* ---- Input ---- */
  let jumpPressed = false;

  function handleJump() {
    if (state === 'idle' || state === 'gameover') {
      reset();
      state = 'playing';
      return;
    }
    if (state === 'playing' && DINO.jumpCount < DINO.maxJumps) {
      DINO.vy = DINO.JUMP_V;
      DINO.jumpCount++;
      spawnDust();
    }
  }

  canvas.addEventListener('click', handleJump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleJump(); }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && canvas.matches(':hover, :focus')) {
      e.preventDefault();
      if (!jumpPressed) { jumpPressed = true; handleJump(); }
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jumpPressed = false;
  });

  /* ---- Obstacle factory ---- */
  function spawnObstacle() {
    const types = [
      { w: 14, h: 30, color: C.red },
      { w: 10, h: 40, color: C.redDark },
      { w: 20, h: 22, color: C.red },
      { w: 28, h: 28, color: C.purple },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: W + 10,
      y: GROUND_Y - t.h + DINO.h,
      w: t.w,
      h: t.h,
      color: t.color,
    });
  }

  function spawnDust() {
    for (let i = 0; i < 5; i++) {
      dustParticles.push({
        x: DINO.x + DINO.w / 2,
        y: GROUND_Y + DINO.h,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 2,
        life: 1,
        r: 2 + Math.random() * 3,
      });
    }
  }

  /* ---- Reset ---- */
  function reset() {
    DINO.y = GROUND_Y;
    DINO.vy = 0;
    DINO.jumpCount = 0;
    DINO.frame = 0;
    DINO.frameTimer = 0;
    obstacles = [];
    dustParticles = [];
    obstTimer = 0;
    obstInterval = 90;
    score = 0;
    speed = 4.5;
    frameIdx = 0;
    scoreFlash = 0;
  }

  /* ---- Collision (AABB with small inset) ---- */
  function collides(ob) {
    const inset = 4;
    return (
      DINO.x + inset         < ob.x + ob.w &&
      DINO.x + DINO.w - inset > ob.x &&
      DINO.y + inset         < ob.y + ob.h &&
      DINO.y + DINO.h - inset > ob.y
    );
  }

  /* ---- Update ---- */
  function update() {
    frameIdx++;

    // Dino physics
    DINO.vy += DINO.GRAVITY;
    DINO.y  += DINO.vy;

    if (DINO.y >= GROUND_Y) {
      DINO.y = GROUND_Y;
      DINO.vy = 0;
      DINO.jumpCount = 0;
    }

    // Leg animation (only on ground)
    if (DINO.y === GROUND_Y) {
      DINO.frameTimer++;
      if (DINO.frameTimer > 8) {
        DINO.frame = 1 - DINO.frame;
        DINO.frameTimer = 0;
      }
    }

    // Obstacles
    obstTimer++;
    if (obstTimer >= obstInterval) {
      spawnObstacle();
      obstTimer = 0;
      obstInterval = Math.max(45, obstInterval - 1.5);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < 0) {
        obstacles.splice(i, 1);
        continue;
      }
      if (collides(obstacles[i])) {
        state = 'gameover';
        if (score > hiScore) hiScore = score;
        return;
      }
    }

    // Score
    score = Math.floor(frameIdx / 6);
    if (score % 100 === 0 && score > 0 && scoreFlash === 0) {
      scoreFlash = 30;
    }
    if (scoreFlash > 0) scoreFlash--;

    // Speed ramp
    speed = 4.5 + score * 0.007;

    // Clouds
    clouds.forEach(c => {
      c.x -= c.speed * (speed / 4.5);
      if (c.x + c.w < 0) {
        c.x = W + 10;
        c.y = 12 + Math.random() * 28;
        c.w = 20 + Math.random() * 35;
      }
    });

    // Dust
    dustParticles.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.1;
      p.life -= 0.08;
    });
    dustParticles = dustParticles.filter(p => p.life > 0);
  }

  /* ---- Draw helpers ---- */
  function drawDino() {
    const x = DINO.x;
    const y = DINO.y;
    const w = DINO.w;
    const h = DINO.h;

    ctx.fillStyle = C.white;

    // Body
    ctx.fillRect(x, y, w, h - DINO.legH);

    // Head (small rectangle on top-right)
    ctx.fillRect(x + w - 10, y - 10, 10, 10);

    // Eye
    ctx.fillStyle = C.red;
    ctx.fillRect(x + w - 4, y - 8, 3, 3);

    // Mouth flash
    if (state === 'gameover') {
      ctx.fillStyle = C.red;
      ctx.fillRect(x + w - 7, y - 3, 5, 2);
    }

    // Legs — animated
    ctx.fillStyle = C.white;
    if (DINO.y < GROUND_Y) {
      // airborne: legs together
      ctx.fillRect(x + 3,  y + h - DINO.legH, 6, DINO.legH);
      ctx.fillRect(x + 12, y + h - DINO.legH, 6, DINO.legH);
    } else {
      // running: alternating
      if (DINO.frame === 0) {
        ctx.fillRect(x + 3, y + h - DINO.legH,      6, DINO.legH);
        ctx.fillRect(x + 12, y + h - DINO.legH - 4, 6, DINO.legH);
      } else {
        ctx.fillRect(x + 3, y + h - DINO.legH - 4, 6, DINO.legH);
        ctx.fillRect(x + 12, y + h - DINO.legH,    6, DINO.legH);
      }
    }

    // Double-jump indicator: blue glow if one jump used
    if (DINO.jumpCount === 1) {
      ctx.shadowColor = C.blue;
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = 'transparent';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth   = 1;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.shadowBlur  = 0;
      ctx.lineWidth   = 1;
    }
  }

  function drawObstacle(ob) {
    ctx.fillStyle = ob.color;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    // Glow
    ctx.shadowColor = ob.color;
    ctx.shadowBlur  = 8;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.shadowBlur  = 0;
  }

  function drawGround() {
    ctx.fillStyle = C.white;
    ctx.fillRect(0, GROUND_Y + DINO.h, W, 1);

    // Moving dashes
    ctx.fillStyle = C.gray;
    for (let i = 0; i < 8; i++) {
      const bx = ((frameIdx * (speed * 0.5) * (state === 'playing' ? 1 : 0)) + i * 70) % W;
      ctx.fillRect(bx, GROUND_Y + DINO.h + 5, 30, 1);
    }
  }

  function drawClouds() {
    ctx.fillStyle = C.gray;
    clouds.forEach(c => {
      ctx.fillRect(c.x, c.y, c.w, 5);
      ctx.fillRect(c.x + 6, c.y - 5, c.w - 10, 5);
    });
  }

  function drawDust() {
    dustParticles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = C.white;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    ctx.font = `400 11px 'Roboto Mono', monospace`;
    ctx.textAlign = 'right';

    // Score flash (white → red on milestone)
    ctx.fillStyle = scoreFlash > 0 ? C.red : C.grayTxt;
    ctx.fillText(`${String(score).padStart(5, '0')}`, W - 12, 18);

    if (hiScore > 0) {
      ctx.fillStyle = C.grayTxt;
      ctx.fillText(`HI ${String(hiScore).padStart(5, '0')}`, W - 80, 18);
    }

    ctx.textAlign = 'left';
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.red;
    ctx.font      = `700 24px 'Roboto Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, H / 2 - 14);

    ctx.fillStyle = C.grayTxt;
    ctx.font      = `300 9px 'Roboto Mono', monospace`;
    ctx.fillText(sub, W / 2, H / 2 + 8);

    // Blink caret
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = C.white;
      ctx.fillRect(W / 2 - 3, H / 2 + 20, 6, 2);
    }

    ctx.textAlign = 'left';
  }

  /* ---- Main loop ---- */
  function draw() {
    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    drawClouds();
    drawGround();

    if (state === 'playing' || state === 'gameover') {
      drawDust();
      obstacles.forEach(drawObstacle);
      drawDino();
      drawHUD();
    }

    if (state === 'idle') {
      drawDino();
      drawOverlay('DINO RUNNER', 'CLICK / SPACE TO START');
    }

    if (state === 'gameover') {
      drawOverlay('GAME OVER', `SCORE ${score}  —  CLICK / SPACE TO RETRY`);
    }
  }

  function loop() {
    if (state === 'playing') update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ---- Boot: wait for font, then start ---- */
  document.fonts.ready.then(() => {
    reset();
    loop();
  });

})();
