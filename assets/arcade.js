(() => {
  'use strict';

  // Fluent spotlight cursor tracking on interactive cards
  document.querySelectorAll('.fluent-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    });
  });

  // Load and inline GitHub Snake SVG with gradient-orange CSS variable theme
  const snakeMount = document.getElementById('snake-mount');
  if (snakeMount) {
    fetch('assets/github-snake.svg')
      .then((res) => {
        if (!res.ok) throw new Error('Snake SVG unavailable');
        return res.text();
      })
      .then((svgMarkup) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (svgEl) {
          svgEl.setAttribute('aria-label', 'Animated GitHub contribution snake in orange gradient');
          snakeMount.replaceChildren(document.importNode(svgEl, true));
        }
      })
      .catch(() => {});
  }

  // Solar Drift — Accessible Fluent 2D Arcade Game
  const canvas = document.getElementById('solar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const LOGICAL_WIDTH = 880;
  const LOGICAL_HEIGHT = 460;

  const ui = {
    score: document.getElementById('hud-score'),
    combo: document.getElementById('hud-combo'),
    best: document.getElementById('hud-best'),
    shields: document.getElementById('hud-shields'),
    status: document.getElementById('game-status'),
    pauseBtn: document.getElementById('btn-pause'),
    soundBtn: document.getElementById('btn-sound'),
    leftBtn: document.getElementById('btn-left'),
    rightBtn: document.getElementById('btn-right'),
    menuOverlay: document.getElementById('overlay-menu'),
    pauseOverlay: document.getElementById('overlay-pause'),
    overOverlay: document.getElementById('overlay-gameover'),
    finalScore: document.getElementById('over-score'),
    finalBest: document.getElementById('over-best'),
    finalCombo: document.getElementById('over-combo'),
    startBtn: document.getElementById('btn-start'),
    resumeBtn: document.getElementById('btn-resume'),
    restartPauseBtn: document.getElementById('btn-restart-pause'),
    playAgainBtn: document.getElementById('btn-play-again'),
    navPlayBtn: document.getElementById('nav-play-btn'),
    badgePlayLink: document.getElementById('badge-play-link'),
    diffButtons: document.querySelectorAll('[data-difficulty]')
  };

  const DIFFICULTY = {
    chill: { label: 'Chill', baseSpeed: 185, spawnMs: 820, hazardChance: 0.16, paddleW: 136 },
    fluent: { label: 'Fluent', baseSpeed: 235, spawnMs: 650, hazardChance: 0.24, paddleW: 120 },
    turbo: { label: 'Turbo', baseSpeed: 300, spawnMs: 500, hazardChance: 0.32, paddleW: 106 }
  };

  const STORAGE_KEY = 'ryokr_solar_drift_best';

  let state = 'TITLE_MENU';
  let difficultyKey = 'fluent';
  let soundEnabled = true;
  let audioCtx = null;

  let score = 0;
  let combo = 1;
  let maxCombo = 1;
  let shields = 3;
  let level = 1;
  let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);

  const paddle = {
    x: LOGICAL_WIDTH / 2,
    targetX: LOGICAL_WIDTH / 2,
    y: LOGICAL_HEIGHT - 38,
    width: DIFFICULTY.fluent.paddleW,
    height: 16,
    speed: 640
  };

  let items = [];
  let particles = [];
  let ripples = [];
  let keys = { left: false, right: false };
  let spawnTimer = 0;
  let shakeTime = 0;
  let lastTs = 0;
  let rafId = null;

  function announce(message) {
    if (ui.status) ui.status.textContent = message;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function ensureAudio() {
    if (!soundEnabled) return null;
    if (!audioCtx) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        audioCtx = new AudioContextCtor();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(type, step = 0) {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;

    if (type === 'orb') {
      const scale = [392, 440, 493.88, 587.33, 659.25, 783.99, 880];
      const freq = scale[Math.min(step, scale.length - 1)];
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'prism') {
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.07, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.24);
        osc.connect(gain).connect(ac.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    } else if (type === 'shard') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.22);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  function updateHud() {
    if (ui.score) ui.score.textContent = score.toLocaleString();
    if (ui.combo) ui.combo.textContent = `x${combo}`;
    if (ui.best) ui.best.textContent = bestScore.toLocaleString();
    if (ui.shields) ui.shields.textContent = `${shields} / 3`;
    if (ui.pauseBtn) {
      ui.pauseBtn.textContent = state === 'PAUSED' ? 'Resume' : 'Pause';
      ui.pauseBtn.disabled = state === 'TITLE_MENU' || state === 'GAME_OVER';
    }
  }

  function syncOverlays() {
    ui.menuOverlay.classList.toggle('hidden', state !== 'TITLE_MENU');
    ui.pauseOverlay.classList.toggle('hidden', state !== 'PAUSED');
    ui.overOverlay.classList.toggle('hidden', state !== 'GAME_OVER');
  }

  function setDifficulty(nextKey) {
    if (!DIFFICULTY[nextKey]) return;
    difficultyKey = nextKey;
    paddle.width = DIFFICULTY[nextKey].paddleW;
    ui.diffButtons.forEach((btn) => {
      const active = btn.dataset.difficulty === nextKey;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        btn.className = 'min-h-[48px] px-5 py-2.5 text-base font-bold rounded-xl orange-gradient-bg text-zinc-950 whitespace-nowrap shrink-0 cursor-pointer';
      } else {
        btn.className = 'min-h-[48px] px-5 py-2.5 text-base font-semibold rounded-xl bg-zinc-900 text-zinc-100 border border-white/20 hover:border-orange-300 whitespace-nowrap shrink-0 cursor-pointer';
      }
    });
  }

  function startGame() {
    ensureAudio();
    const cfg = DIFFICULTY[difficultyKey];
    score = 0;
    combo = 1;
    maxCombo = 1;
    shields = 3;
    level = 1;
    items = [];
    particles = [];
    ripples = [];
    spawnTimer = 0;
    shakeTime = 0;
    paddle.width = cfg.paddleW;
    paddle.x = LOGICAL_WIDTH / 2;
    paddle.targetX = LOGICAL_WIDTH / 2;
    state = 'PLAYING';
    syncOverlays();
    updateHud();
    announce(`Game started on ${cfg.label} mode.`);
  }

  function togglePause() {
    if (state === 'PLAYING') {
      state = 'PAUSED';
      announce('Game paused.');
    } else if (state === 'PAUSED') {
      state = 'PLAYING';
      lastTs = performance.now();
      announce('Game resumed.');
    }
    syncOverlays();
    updateHud();
  }

  function endGame() {
    state = 'GAME_OVER';
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(STORAGE_KEY, String(bestScore));
    }
    if (ui.finalScore) ui.finalScore.textContent = score.toLocaleString();
    if (ui.finalBest) ui.finalBest.textContent = bestScore.toLocaleString();
    if (ui.finalCombo) ui.finalCombo.textContent = `x${maxCombo}`;
    syncOverlays();
    updateHud();
    announce(`Game over. Final score ${score}. Best score ${bestScore}.`);
  }

  function spawnItem() {
    const cfg = DIFFICULTY[difficultyKey];
    const roll = Math.random();
    const speedScale = 1 + (level - 1) * 0.14;
    let kind = 'orb';
    if (roll < cfg.hazardChance) {
      kind = 'shard';
    } else if (roll > 0.91) {
      kind = 'prism';
    }

    const radius = kind === 'prism' ? 15 : kind === 'shard' ? 14 : 12;
    items.push({
      kind,
      x: 36 + Math.random() * (LOGICAL_WIDTH - 72),
      y: -24,
      vy: (cfg.baseSpeed + Math.random() * 75) * speedScale,
      vx: (Math.random() - 0.5) * 32,
      radius,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3.5
    });
  }

  function burst(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 70 + Math.random() * 170;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        size: 2.5 + Math.random() * 3.2,
        color
      });
    }
    ripples.push({ x, y, r: 8, maxR: 46, alpha: 0.75, color });
  }

  function update(dt) {
    if (state !== 'PLAYING') return;

    const cfg = DIFFICULTY[difficultyKey];
    level = 1 + Math.floor(score / 300);

    if (keys.left) paddle.targetX -= paddle.speed * dt;
    if (keys.right) paddle.targetX += paddle.speed * dt;

    const halfW = paddle.width / 2 + 12;
    paddle.targetX = Math.max(halfW, Math.min(LOGICAL_WIDTH - halfW, paddle.targetX));
    paddle.x += (paddle.targetX - paddle.x) * Math.min(1, dt * 18);

    spawnTimer += dt * 1000;
    const dynamicSpawn = Math.max(290, cfg.spawnMs - (level - 1) * 32);
    if (spawnTimer >= dynamicSpawn) {
      spawnTimer = 0;
      spawnItem();
    }

    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const it = items[i];
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.rot += it.vRot * dt;

      if (it.x < 24 || it.x > LOGICAL_WIDTH - 24) {
        it.vx *= -1;
        it.x = Math.max(24, Math.min(LOGICAL_WIDTH - 24, it.x));
      }

      const paddleTop = paddle.y - paddle.height / 2;
      const paddleBottom = paddle.y + paddle.height / 2;
      const hitX = Math.abs(it.x - paddle.x) <= paddle.width / 2 + it.radius * 0.8;
      const hitY = it.y + it.radius >= paddleTop && it.y - it.radius <= paddleBottom;

      if (hitX && hitY) {
        items.splice(i, 1);
        if (it.kind === 'orb') {
          score += 10 * combo;
          combo = Math.min(8, combo + 1);
          maxCombo = Math.max(maxCombo, combo);
          playTone('orb', combo - 1);
          burst(it.x, paddleTop, '#FF9436', 10);
        } else if (it.kind === 'prism') {
          score += 50 * combo;
          combo = Math.min(8, combo + 1);
          maxCombo = Math.max(maxCombo, combo);
          if (shields < 3) shields += 1;
          playTone('prism');
          burst(it.x, paddleTop, '#FFD07B', 18);
          announce(`Solar prism caught. Score ${score}, shields ${shields} of 3.`);
        } else {
          shields -= 1;
          combo = 1;
          shakeTime = 0.24;
          playTone('shard');
          burst(it.x, paddleTop, '#FB7185', 16);
          announce(`Shield hit. ${shields} shields remaining.`);
          if (shields <= 0) {
            updateHud();
            endGame();
            return;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem(STORAGE_KEY, String(bestScore));
        }
        updateHud();
        continue;
      }

      if (it.y > LOGICAL_HEIGHT + 28) {
        items.splice(i, 1);
        if (it.kind === 'orb' && combo > 1) {
          combo = 1;
          updateHud();
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const r = ripples[i];
      r.r += 110 * dt;
      r.alpha -= 1.8 * dt;
      if (r.alpha <= 0) ripples.splice(i, 1);
    }
  }

  function drawBackground(timeSec) {
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const ambient = ctx.createRadialGradient(
      LOGICAL_WIDTH * 0.5,
      LOGICAL_HEIGHT * 0.95,
      20,
      LOGICAL_WIDTH * 0.5,
      LOGICAL_HEIGHT * 0.95,
      440
    );
    ambient.addColorStop(0, 'rgba(255, 110, 26, 0.18)');
    ambient.addColorStop(0.55, 'rgba(255, 148, 54, 0.05)');
    ambient.addColorStop(1, 'rgba(12, 12, 16, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const step = 44;
    const offset = (timeSec * 14) % step;
    for (let x = 22; x < LOGICAL_WIDTH; x += step) {
      for (let y = offset; y < LOGICAL_HEIGHT; y += step) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
  }

  function drawItem(it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);

    if (it.kind === 'orb') {
      const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, it.radius + 6);
      g.addColorStop(0, '#FFE2A8');
      g.addColorStop(0.45, '#FF881A');
      g.addColorStop(1, 'rgba(255, 77, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, it.radius + 6, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createLinearGradient(-it.radius, -it.radius, it.radius, it.radius);
      core.addColorStop(0, '#FFC466');
      core.addColorStop(1, '#FF5500');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (it.kind === 'prism') {
      ctx.shadowColor = 'rgba(255, 184, 77, 0.75)';
      ctx.shadowBlur = 16;
      const g = ctx.createLinearGradient(-12, -12, 12, 12);
      g.addColorStop(0, '#FFF6DC');
      g.addColorStop(0.5, '#FFB84D');
      g.addColorStop(1, '#FF5500');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -it.radius - 2);
      ctx.lineTo(it.radius, 0);
      ctx.lineTo(0, it.radius + 2);
      ctx.lineTo(-it.radius, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.shadowColor = 'rgba(251, 113, 133, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#272026';
      ctx.strokeStyle = '#FDA4AF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k < 3; k += 1) {
        const a = (k * Math.PI * 2) / 3 - Math.PI / 2;
        const px = Math.cos(a) * (it.radius + 1);
        const py = Math.sin(a) * (it.radius + 1);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPaddle() {
    ctx.save();
    const x = paddle.x - paddle.width / 2;
    const y = paddle.y - paddle.height / 2;

    ctx.shadowColor = 'rgba(255, 136, 26, 0.6)';
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(x, y, x + paddle.width, y);
    grad.addColorStop(0, '#FF5500');
    grad.addColorStop(0.5, '#FF881A');
    grad.addColorStop(1, '#FFB84D');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, paddle.width, paddle.height, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 3, paddle.width - 16, 3, 2);
    ctx.fill();
    ctx.restore();
  }

  function render(now) {
    const dt = Math.min(0.05, (now - (lastTs || now)) / 1000);
    lastTs = now;

    update(dt);

    ctx.save();
    if (shakeTime > 0) {
      const mag = shakeTime * 22;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    drawBackground(now / 1000);

    ripples.forEach((r) => {
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    items.forEach(drawItem);

    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    drawPaddle();
    ctx.restore();

    rafId = requestAnimationFrame(render);
  }

  function moveToPointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    const normX = ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    paddle.targetX = normX;
  }

  canvas.addEventListener('pointermove', (e) => {
    if (state === 'PLAYING') moveToPointer(e.clientX);
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (state === 'PLAYING') moveToPointer(e.clientX);
  });

  function bindHoldButton(btn, keyName) {
    if (!btn) return;
    const setDown = (e) => {
      e.preventDefault();
      keys[keyName] = true;
    };
    const setUp = () => {
      keys[keyName] = false;
    };
    btn.addEventListener('pointerdown', setDown);
    btn.addEventListener('pointerup', setUp);
    btn.addEventListener('pointerleave', setUp);
    btn.addEventListener('pointercancel', setUp);
  }

  bindHoldButton(ui.leftBtn, 'left');
  bindHoldButton(ui.rightBtn, 'right');

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ' && (state === 'PLAYING' || state === 'PAUSED')) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag !== 'BUTTON' && activeTag !== 'A') {
        e.preventDefault();
        togglePause();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  ui.diffButtons.forEach((btn) => {
    btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
  });

  ui.startBtn?.addEventListener('click', startGame);
  ui.resumeBtn?.addEventListener('click', togglePause);
  ui.restartPauseBtn?.addEventListener('click', startGame);
  ui.playAgainBtn?.addEventListener('click', startGame);
  ui.pauseBtn?.addEventListener('click', togglePause);

  ui.soundBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    ui.soundBtn.textContent = soundEnabled ? 'Sound On' : 'Muted';
    ui.soundBtn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    if (soundEnabled) ensureAudio();
  });

  ui.navPlayBtn?.addEventListener('click', () => {
    document.getElementById('arcade')?.scrollIntoView({ behavior: 'smooth' });
    if (state === 'TITLE_MENU' || state === 'GAME_OVER') {
      startGame();
    }
  });

  ui.badgePlayLink?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('arcade')?.scrollIntoView({ behavior: 'smooth' });
    if (state === 'TITLE_MENU' || state === 'GAME_OVER') {
      startGame();
    }
  });

  setDifficulty('fluent');
  syncOverlays();
  updateHud();
  if (!rafId) rafId = requestAnimationFrame(render);
})();
