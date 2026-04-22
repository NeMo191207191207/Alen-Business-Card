// Self-contained Chrome-style Dino game — no external images, no CDN.
// API: new Runner('.interstitial-wrapper')
(function () {
  'use strict';

  // ── Public constructor (keeps original Runner API) ───────────────────────
  function Runner(selector) {
    if (Runner.instance_) return Runner.instance_;
    Runner.instance_ = this;

    this.el = document.querySelector(selector);
    if (!this.el) return;

    var icon = document.querySelector('.icon-offline');
    if (icon) icon.style.visibility = 'hidden';

    this._init();
  }
  Runner.instance_ = null;
  window.Runner = Runner;

  // ── Constants ─────────────────────────────────────────────────────────────
  var H          = 150;
  var GROUND_Y   = 112;   // y of the ground line
  var GRAVITY    = 0.72;
  var JUMP_VY    = -13.5;
  var BASE_SPEED = 6;
  var MAX_SPEED  = 13;
  var ACCEL      = 0.0008;

  var C_BG    = '#f7f7f7';
  var C_DARK  = '#535353';
  var C_MID   = '#aaaaaa';
  var C_LIGHT = '#dddddd';
  var C_WHITE = '#ffffff';

  // ── Init ─────────────────────────────────────────────────────────────────
  Runner.prototype._init = function () {
    var self = this;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'runner-canvas';
    this.ctx    = this.canvas.getContext('2d');
    this.el.appendChild(this.canvas);

    this.state     = 'idle';   // idle | running | dead
    this.speed     = BASE_SPEED;
    this.score     = 0;
    this.hiScore   = 0;
    this.frames    = 0;
    this.raf       = null;
    this.dino      = new Dino();
    this.obstacles = [];
    this.clouds    = [];
    this.gndOffset = 0;
    this.obsIn     = 100;
    this.cldIn     = 60;

    this._resize();
    this._bindEvents();
    this._render();   // draw idle screen immediately

    window.addEventListener('resize', function () { self._resize(); self._render(); });
  };

  Runner.prototype._resize = function () {
    var dpr = window.devicePixelRatio || 1;
    var w   = Math.max(this.el.offsetWidth || 0, 200);
    this.W  = w;
    this.canvas.width  = w * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // ── Events ────────────────────────────────────────────────────────────────
  Runner.prototype._bindEvents = function () {
    var self = this;

    function action() {
      if (self.state !== 'running') { self._start(); }
      else { self.dino.jump(); }
    }
    function duckOn()  { if (self.state === 'running') self.dino.duck(true);  }
    function duckOff() { self.dino.duck(false); }

    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.keyCode === 32 || e.keyCode === 38) { e.preventDefault(); action(); }
      if (e.keyCode === 40) { e.preventDefault(); duckOn(); }
    });
    window.addEventListener('keyup', function (e) {
      if (e.keyCode === 40) duckOff();
    });

    // Touch: tap = jump/start, swipe-down = duck
    var touchY0 = 0;
    this.canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touchY0 = e.touches[0].clientY;
      action();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (e.touches[0].clientY - touchY0 > 12) duckOn();
    }, { passive: false });
    this.canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      duckOff();
    }, { passive: false });

    this.canvas.addEventListener('click', function () { action(); });
  };

  // ── Game start / loop ─────────────────────────────────────────────────────
  Runner.prototype._start = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.state     = 'running';
    this.speed     = BASE_SPEED;
    this.score     = 0;
    this.frames    = 0;
    this.obstacles = [];
    this.clouds    = [];
    this.gndOffset = 0;
    this.obsIn     = 100;
    this.cldIn     = 60;
    this.dino.reset();
    this._tick();
  };

  Runner.prototype._tick = function () {
    var self = this;
    this.frames++;

    this.speed = Math.min(BASE_SPEED + this.frames * ACCEL, MAX_SPEED);
    this.score = Math.floor(this.frames / 6);

    // Ground scroll
    this.gndOffset = (this.gndOffset + this.speed) % 120;

    // Clouds
    this.cldIn--;
    if (this.cldIn <= 0) {
      this.clouds.push(new Cloud(this.W));
      this.cldIn = 70 + Math.random() * 90;
    }
    for (var c = this.clouds.length - 1; c >= 0; c--) {
      this.clouds[c].update();
      if (this.clouds[c].x + this.clouds[c].w < 0) this.clouds.splice(c, 1);
    }

    // Obstacles
    this.obsIn--;
    if (this.obsIn <= 0) {
      this.obstacles.push(new Obstacle(this.W));
      var gap = Math.max(40, 80 - (this.speed - BASE_SPEED) * 5);
      this.obsIn = gap + Math.random() * 80;
    }
    for (var o = this.obstacles.length - 1; o >= 0; o--) {
      this.obstacles[o].update(this.speed);
      if (this.obstacles[o].x + this.obstacles[o].w < 0) this.obstacles.splice(o, 1);
    }

    // Dino
    this.dino.update();

    // Collision
    for (var i = 0; i < this.obstacles.length; i++) {
      if (this._hit(this.dino, this.obstacles[i])) {
        this.state = 'dead';
        if (this.score > this.hiScore) this.hiScore = this.score;
        break;
      }
    }

    this._render();

    if (this.state === 'running') {
      this.raf = requestAnimationFrame(function () { self._tick(); });
    }
  };

  Runner.prototype._hit = function (d, o) {
    var pad = 6;
    return (d.x + pad)         < (o.x + o.w - pad) &&
           (d.x + d.w - pad)   > (o.x + pad)        &&
           (d.top + pad)        < (o.y + o.h - pad)  &&
           (d.top + d.h - pad)  > (o.y + pad);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  Runner.prototype._render = function () {
    var ctx = this.ctx;
    var W   = this.W;

    // Background
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    for (var c = 0; c < this.clouds.length; c++) this.clouds[c].draw(ctx);

    // Ground line
    ctx.fillStyle = C_DARK;
    ctx.fillRect(0, GROUND_Y, W, 1);
    // Ground texture dots
    ctx.fillStyle = C_MID;
    var gx = -(this.gndOffset % 120);
    while (gx < W) {
      ctx.fillRect(gx,      GROUND_Y + 4,  12, 2);
      ctx.fillRect(gx + 22, GROUND_Y + 8,   6, 1);
      ctx.fillRect(gx + 55, GROUND_Y + 5,   9, 1);
      ctx.fillRect(gx + 75, GROUND_Y + 9,   5, 2);
      gx += 120;
    }

    // Obstacles
    for (var o = 0; o < this.obstacles.length; o++) this.obstacles[o].draw(ctx);

    // Dino
    this.dino.draw(ctx);

    // HUD (score)
    this._drawHUD(ctx, W);

    // Overlays
    if (this.state === 'idle') this._drawIdle(ctx, W);
    if (this.state === 'dead') this._drawDead(ctx, W);
  };

  Runner.prototype._drawHUD = function (ctx, W) {
    ctx.font = '700 11px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'right';
    if (this.hiScore > 0) {
      ctx.fillStyle = C_MID;
      ctx.fillText('HI ' + _pad(this.hiScore), W - 72, 20);
    }
    ctx.fillStyle = C_DARK;
    ctx.fillText(_pad(this.score), W - 12, 20);
    ctx.textAlign = 'left';
  };

  Runner.prototype._drawIdle = function (ctx, W) {
    ctx.fillStyle = C_DARK;
    ctx.font = '700 9px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE / TAP TO START', W / 2, 52);
    ctx.textAlign = 'left';
  };

  Runner.prototype._drawDead = function (ctx, W) {
    ctx.fillStyle = C_DARK;
    ctx.font = '700 11px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('G A M E  O V E R', W / 2, 50);
    ctx.font = '700 8px "Press Start 2P", "Courier New", monospace';
    ctx.fillText('TAP  /  SPACE  TO  RESTART', W / 2, 72);
    ctx.textAlign = 'left';
  };

  // ── Dino ─────────────────────────────────────────────────────────────────
  function Dino() { this.reset(); }

  Dino.prototype.reset = function () {
    this.x        = 60;
    this.groundY  = GROUND_Y;   // bottom of feet
    this.w        = 44;
    this.h        = 48;
    this.vy       = 0;
    this._jumping = false;
    this._ducking = false;
    this._legF    = 0;
    this._legT    = 0;
  };

  Object.defineProperty(Dino.prototype, 'top', { get: function () { return this.groundY - this.h; } });

  Dino.prototype.jump = function () {
    if (!this._jumping) { this.vy = JUMP_VY; this._jumping = true; }
  };

  Dino.prototype.duck = function (on) { this._ducking = on; };

  Dino.prototype.update = function () {
    if (this._jumping) {
      this.vy      += GRAVITY;
      this.groundY += this.vy;
      if (this.groundY >= GROUND_Y) { this.groundY = GROUND_Y; this.vy = 0; this._jumping = false; }
    }
    if (!this._jumping) {
      this._legT++;
      if (this._legT >= 8) { this._legT = 0; this._legF ^= 1; }
    }
  };

  Dino.prototype.draw = function (ctx) {
    var x = this.x;
    var y = this.groundY - this.h;   // top-left of bounding box
    ctx.fillStyle = C_DARK;

    if (this._ducking) {
      // Duck body (shorter, wider)
      ctx.fillRect(x,       y + 22, 58, 20);   // flat body
      ctx.fillRect(x + 34,  y + 10, 24, 18);   // head
      ctx.fillStyle = C_WHITE;
      ctx.fillRect(x + 50,  y + 13,  5,  5);   // eye white
      ctx.fillStyle = C_DARK;
      ctx.fillRect(x + 52,  y + 15,  3,  3);   // pupil
      // tail
      ctx.fillRect(x,       y + 26,  8,  6);
      ctx.fillRect(x - 5,   y + 30,  8,  4);
      // duck legs
      ctx.fillRect(x + 18 + (this._legF ? 0 : 10), y + 42, 10, 8);
      ctx.fillRect(x + 18 + (this._legF ? 10 : 0), y + 42, 10, 12);
      return;
    }

    // Standing / running / jumping
    // body
    ctx.fillRect(x + 4,  y + 18, 34, 24);
    // neck
    ctx.fillRect(x + 18, y + 10, 12, 14);
    // head
    ctx.fillRect(x + 18, y,      26, 18);
    // eye white
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(x + 36, y + 4,   5,  5);
    // pupil
    ctx.fillStyle = C_DARK;
    ctx.fillRect(x + 38, y + 6,   3,  3);
    // tail
    ctx.fillRect(x,      y + 24,  8,  6);
    ctx.fillRect(x - 5,  y + 28,  8,  4);
    // arm
    ctx.fillRect(x + 22, y + 30,  8,  5);
    // legs
    if (!this._jumping) {
      ctx.fillRect(x + 16 + (this._legF ? 0 : 10), y + 42, 10, 12);
      ctx.fillRect(x + 16 + (this._legF ? 10 : 0), y + 42, 10,  8);
    } else {
      // jump pose: both legs back
      ctx.fillRect(x + 14, y + 42,  9, 10);
      ctx.fillRect(x + 26, y + 42,  9, 10);
    }
  };

  // ── Cactus obstacle ───────────────────────────────────────────────────────
  var CACTUS = [
    // small single
    { w: 17, h: 38, stems: [{ dx: -6, dy: 12, w: 6, h: 14 }, { dx: 17, dy: 16, w: 6, h: 10 }] },
    // tall single
    { w: 17, h: 52, stems: [{ dx: -6, dy: 14, w: 6, h: 18 }, { dx: 17, dy: 20, w: 6, h: 14 }] },
    // wide double
    { w: 36, h: 40, stems: [{ dx: -6, dy: 12, w: 6, h: 12 }, { dx: 36, dy: 16, w: 6, h: 10 }] },
  ];

  function Obstacle(startX) {
    var t = CACTUS[Math.floor(Math.random() * CACTUS.length)];
    this.x     = startX + 10;
    this.w     = t.w;
    this.h     = t.h;
    this.y     = GROUND_Y - t.h;
    this.stems = t.stems;
  }

  Obstacle.prototype.update = function (spd) { this.x -= spd; };

  Obstacle.prototype.draw = function (ctx) {
    ctx.fillStyle = C_DARK;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    for (var i = 0; i < this.stems.length; i++) {
      var s = this.stems[i];
      ctx.fillRect(this.x + s.dx, this.y + s.dy, s.w, s.h);
    }
    // spine tip
    ctx.fillRect(this.x + Math.floor((this.w - 4) / 2), this.y - 5, 4, 6);
  };

  // ── Cloud ─────────────────────────────────────────────────────────────────
  function Cloud(startX) {
    this.x  = startX + 10;
    this.y  = 15 + Math.random() * 40;
    this.w  = 70 + Math.random() * 50;
    this.spd = 0.6 + Math.random() * 0.5;
  }

  Cloud.prototype.update = function () { this.x -= this.spd; };

  Cloud.prototype.draw = function (ctx) {
    ctx.fillStyle = C_LIGHT;
    var x = this.x, y = this.y, w = this.w;
    ctx.fillRect(x + 10, y,      w - 20, 10);  // base
    ctx.fillRect(x + 20, y - 7,  w - 40, 10);  // middle bump
    ctx.fillRect(x + 30, y - 13, w - 60, 8);   // top bump
  };

  // ── Helper ────────────────────────────────────────────────────────────────
  function _pad(n) { return String(Math.min(n, 99999)).padStart(5, '0'); }

}());
