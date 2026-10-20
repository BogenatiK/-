* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #05070f;
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
  color: #eaf2ff;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

#game-wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  touch-action: none;
}

#game-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  background: #05070f;
}

/* ---------- HUD ---------- */
#hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: calc(10px + env(safe-area-inset-top)) 14px 10px;
  pointer-events: none;
  z-index: 5;
}

.hud-item {
  display: flex;
  flex-direction: column;
  background: rgba(10, 20, 40, 0.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(120, 190, 255, 0.35);
  border-radius: 10px;
  padding: 6px 12px;
  min-width: 100px;
  text-align: center;
}

.hud-label {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8fb8e8;
}

.hud-value {
  font-size: 16px;
  font-weight: 700;
  color: #ffe27a;
  font-variant-numeric: tabular-nums;
}

/* Полоска батареи */
.battery {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  margin: 5px 0 3px;
}

.battery-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #ff5f5f, #ffd76a, #8affa1);
  background-size: 300% 100%;
  background-position: 50% 0;
  transition: width 0.15s linear;
}

/* ---------- Прогресс-бар полёта ---------- */
#progress-bar {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: calc(14px + env(safe-area-inset-bottom));
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: visible;
  z-index: 5;
  pointer-events: none;
}

#progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 3px;
  background: linear-gradient(90deg, #6ab7ff, #ffe27a);
  box-shadow: 0 0 12px rgba(255, 210, 90, 0.6);
  transition: width 0.2s linear;
}

.progress-label {
  position: absolute;
  top: -18px;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8fb8e8;
}

.progress-label-start { left: 0; }
.progress-label-end   { right: 0; color: #ffb27a; }

/* ---------- Оверлеи ---------- */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 40%, rgba(30, 60, 120, 0.85), rgba(3, 6, 15, 0.95));
  z-index: 10;
  text-align: center;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.overlay.hidden {
  display: flex;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0s 0.25s;
}

.title {
  font-size: clamp(28px, 7vw, 48px);
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffe27a;
  text-shadow: 0 0 24px rgba(255, 210, 90, 0.6);
  margin-bottom: 10px;
}

.subtitle {
  font-size: clamp(14px, 3.6vw, 18px);
  color: #cfe1ff;
  max-width: 480px;
  margin-bottom: 22px;
  line-height: 1.45;
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(320px, 90vw);
}

.btn {
  appearance: none;
  border: 1px solid rgba(140, 200, 255, 0.5);
  background: linear-gradient(180deg, #2a4a80, #16283f);
  color: #eaf2ff;
  font-size: clamp(15px, 4vw, 18px);
  font-weight: 600;
  padding: 14px 22px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.15s ease;
  touch-action: manipulation;
}

@media (hover: hover) {
  .btn:hover {
    background: linear-gradient(180deg, #35619f, #1c3450);
    box-shadow: 0 0 18px rgba(120, 190, 255, 0.45);
  }
}

.btn:focus-visible {
  outline: 2px solid #ffe27a;
  outline-offset: 3px;
}

.btn:active {
  transform: scale(0.97);
}

.btn-secondary {
  background: linear-gradient(180deg, #3a3a4a, #1e1e2a);
  border-color: rgba(180, 180, 200, 0.4);
  margin-top: 10px;
}

@media (hover: hover) {
  .btn-secondary:hover {
    background: linear-gradient(180deg, #4a4a60, #262634);
    box-shadow: 0 0 14px rgba(180, 180, 200, 0.35);
  }
}

.hint {
  margin-top: 24px;
  font-size: clamp(12px, 3vw, 14px);
  color: #7fa3d1;
}

/* ---------- Выбор паруса ---------- */
.ships-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(400px, 90vw);
  margin-top: 10px;
}

.ship-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: linear-gradient(180deg, #1f2e45, #101822);
  border: 1px solid rgba(140, 200, 255, 0.3);
  color: #aecbfa;
}

.ship-btn.active {
  background: linear-gradient(180deg, #2a4a80, #16283f);
  border-color: #ffe27a;
  color: #fff;
  box-shadow: 0 0 15px rgba(255, 226, 122, 0.3);
}

.ship-name {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: 700;
  color: #ffe27a;
  margin-bottom: 4px;
}

.ship-desc {
  font-size: clamp(11px, 2.5vw, 13px);
  line-height: 1.4;
  color: #8fb8e8;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .btn, .overlay, #progress-fill, .battery-fill { transition: none; }
}
3. script.js
javascript
(function () {
  "use strict";

  // ---------- DOM ----------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const batteryFill = document.getElementById("battery-fill");
  const batteryValue = document.getElementById("battery-value");
  const progressValue = document.getElementById("progress-value");
  const progressFill = document.getElementById("progress-fill");
  const hudSailName = document.getElementById("hud-sail-name");

  const menuScreen = document.getElementById("menu-screen");
  const shipScreen = document.getElementById("ship-screen");
  const resultScreen = document.getElementById("result-screen");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  
  const restartBtn = document.getElementById("restart-btn");
  const menuBtn = document.getElementById("menu-btn");
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");
  const shipBtns = document.querySelectorAll(".ship-btn");
  const startGameBtn = document.getElementById("start-game-btn");
  const backToDiffBtn = document.getElementById("back-to-diff-btn");

  // ---------- Размеры ----------
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (state.sail) {
      state.sail.y = H - 70;
      state.sail.x = clamp(state.sail.x || W / 2, state.sail.r, W - state.sail.r);
      const baseR = clamp(Math.min(W, H) * 0.05, 20, 32);
      state.sail.r = baseR * state.shipConfig.sizeModifier;
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // ---------- Сложность ----------
  const DIFFICULTY = {
    easy: {
      label: "Лёгкий",
      fallSpeed: 180,
      drainPerSec: 3.5,
      beamHealAmount: 12,
      beamSpawnInterval: 1300,
      asteroidSpawnInterval: 1700,
      asteroidMinSize: 24,
      asteroidMaxSize: 38,
      tripDuration: 45
    },
    medium: {
      label: "Средний",
      fallSpeed: 260,
      drainPerSec: 5,
      beamHealAmount: 9,
      beamSpawnInterval: 1000,
      asteroidSpawnInterval: 1150,
      asteroidMinSize: 22,
      asteroidMaxSize: 44,
      tripDuration: 60
    },
    hard: {
      label: "Сложный",
      fallSpeed: 360,
      drainPerSec: 7,
      beamHealAmount: 6,
      beamSpawnInterval: 820,
      asteroidSpawnInterval: 800,
      asteroidMinSize: 20,
      asteroidMaxSize: 50,
      tripDuration: 75
    }
  };

  // ---------- Паруса ----------
  const SHIPS = {
    small: {
      label: "Малый",
      sizeModifier: 0.75,
      drainMultiplier: 0.7,
      tripTimeMultiplier: 1.3,
      maneuverability: 0.40
    },
    medium: {
      label: "Стандарт",
      sizeModifier: 1.0,
      drainMultiplier: 1.0,
      tripTimeMultiplier: 1.0,
      maneuverability: 0.25
    },
    large: {
      label: "Крупный",
      sizeModifier: 1.35,
      drainMultiplier: 1.25,
      tripTimeMultiplier: 0.75,
      maneuverability: 0.15
    }
  };

  // ---------- Состояние ----------
  const state = {
    running: false,
    difficulty: "easy",
    config: DIFFICULTY.easy,
    shipType: "medium",
    shipConfig: SHIPS.medium,
    sail: { x: 0, y: 0, r: 26, angle: 0 },
    pointer: { x: 0, active: false },
    objects: [],
    battery: 100,
    progress: 0,
    elapsed: 0,
    lastSpawnBeam: 0,
    lastSpawnAsteroid: 0,
    lastFrameTime: 0,
    rafId: null
  };

  // ---------- Утилиты ----------
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const randRange = (a, b) => a + Math.random() * (b - a);

  // ---------- Управление ----------
  function setPointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = clientX - rect.left;
    state.pointer.active = true;
  }

  canvas.addEventListener("mousemove", (e) => setPointer(e.clientX));
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length) setPointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length) setPointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  // ---------- Спавн ----------
  function spawnBeam() {
    const r = 12;
    state.objects.push({
      type: "beam",
      x: randRange(r + 10, W - r - 10),
      y: -r - 20,
      r,
      vy: state.config.fallSpeed * randRange(0.95, 1.1),
      rot: 0
    });
  }

  function makeAsteroidShape(r) {
    const points = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * randRange(0.78, 1.12);
      points.push({ a, r: rr });
    }
    return points;
  }

  function spawnAsteroid() {
    const cfg = state.config;
    const r = randRange(cfg.asteroidMinSize, cfg.asteroidMaxSize);
    state.objects.push({
      type: "asteroid",
      x: randRange(r + 10, W - r - 10),
      y: -r - 30,
      r,
      vy: cfg.fallSpeed * randRange(0.9, 1.2),
      rot: randRange(0, Math.PI * 2),
      spin: randRange(-1.4, 1.4),
      points: makeAsteroidShape(r)
    });
  }

  // ---------- Обновление ----------
  function updateSail(dt) {
    const sail = state.sail;
    const targetX = state.pointer.active ? state.pointer.x : W / 2;
    const smoothFactor = state.shipConfig.maneuverability;

    sail.x += (targetX - sail.x) * smoothFactor;
    sail.x = clamp(sail.x, sail.r, W - sail.r);

    const desiredTilt = clamp((targetX - sail.x) * 0.01, -0.5, 0.5);
    sail.angle += (desiredTilt - sail.angle) * smoothFactor;

    sail.y = H - 70;
  }

  function circleVsSail(obj) {
    const dx = obj.x - state.sail.x;
    const dy = obj.y - state.sail.y;
    const dist = Math.hypot(dx, dy);
    return dist < obj.r + state.sail.r * 0.9;
  }

  function updateObjects(dt) {
    const cfg = state.config;

    for (let i = state.objects.length - 1; i >= 0; i--) {
      const o = state.objects[i];
      o.y += o.vy * dt;

      if (o.type === "asteroid") o.rot += o.spin * dt;

      if (circleVsSail(o)) {
        if (o.type === "beam") {
          state.battery = Math.min(100, state.battery + cfg.beamHealAmount);
          state.objects.splice(i, 1);
          continue;
        } else {
          endGame("asteroid");
          return;
        }
      }

      if (o.y - o.r > H + 40) {
        state.objects.splice(i, 1);
      }
    }
  }

  function updateProgressAndBattery(dt) {
    const cfg = state.config;
    const ship = state.shipConfig;

    state.elapsed += dt;
    
    const actualTripDuration = cfg.tripDuration * ship.tripTimeMultiplier;
    state.progress = clamp(state.elapsed / actualTripDuration, 0, 1);
    state.battery -= cfg.drainPerSec * ship.drainMultiplier * dt;

    batteryFill.style.width = Math.max(0, state.battery) + "%";
    batteryValue.textContent = Math.max(0, Math.round(state.battery)) + "%";
    progressFill.style.width = (state.progress * 100) + "%";
    progressValue.textContent = Math.round((1 - state.progress) * 100) + "%";

    if (state.battery <= 0) {
      endGame("battery");
      return;
    }
    if (state.progress >= 1) {
      endGame("win");
    }
  }

  // ---------- Отрисовка ----------
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050a1c");
    g.addColorStop(0.5, "#081226");
    g.addColorStop(1, "#05070f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const t = state.elapsed * state.config.fallSpeed;
    for (let i = 0; i < 100; i++) {
      const baseY = (i * 61.37) % H;
      const sy = ((baseY + t * 0.5) % H + H) % H;
      const sx = ((i * 97.31) % W);
      const size = (i % 3 === 0) ? 1.6 : 1;
      ctx.fillStyle = "rgba(180, 210, 255, 0.55)";
      ctx.fillRect(sx, sy, size, size);
    }

    const mx = W / 2;
    const my = 60;
    const mr = 22;
    const grad = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.2, mx, my, mr);
    grad.addColorStop(0, "#ffb27a");
    grad.addColorStop(0.7, "#c85a3a");
    grad.addColorStop(1, "#5a2418");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeam(o) {
    const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
    glow.addColorStop(0, "rgba(255, 240, 160, 0.95)");
    glow.addColorStop(0.4, "rgba(255, 210, 100, 0.5)");
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2);
    ctx.fill();

    const tail = ctx.createLinearGradient(o.x, o.y - o.r * 3, o.x, o.y + o.r);
    tail.addColorStop(0, "rgba(255, 230, 140, 0)");
    tail.addColorStop(1, "rgba(255, 230, 140, 0.65)");
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.7, o.y);
    ctx.lineTo(o.x, o.y - o.r * 4);
    ctx.lineTo(o.x + o.r * 0.7, o.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();
  }

  function drawAsteroid(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);

    ctx.beginPath();
    const pts = o.points;
    ctx.moveTo(Math.cos(pts[0].a) * pts[0].r, Math.sin(pts[0].a) * pts[0].r);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(Math.cos(pts[i].a) * pts[i].r, Math.sin(pts[i].a) * pts[i].r);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(-o.r * 0.3, -o.r * 0.3, o.r * 0.1, 0, 0, o.r);
    grad.addColorStop(0, "#8a8f99");
    grad.addColorStop(0.6, "#5a5f6b");
    grad.addColorStop(1, "#2c3038");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let i = 0; i < 3; i++) {
      const a = (i * 2.1) % (Math.PI * 2);
      const rr = o.r * 0.45;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, o.r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSail() {
    const sail = state.sail;
    ctx.save();
    ctx.translate(sail.x, sail.y);

    const glow = ctx.createRadialGradient(0, 0, sail.r * 0.5, 0, 0, sail.r * 3);
    glow.addColorStop(0, "rgba(255, 220, 120, 0.35)");
    glow.addColorStop(1, "rgba(255, 220, 120, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, sail.r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(Math.PI / 2);
    ctx.rotate(sail.angle);

    const R = sail.r;

    drawSolarPanel(-R * 1.55, -R * 1.55, -R * 0.4, -R * 0.4, R * 0.55, -R * 0.15, -Math.PI / 4);
    drawSolarPanel(-R * 1.55,  R * 1.55, -R * 0.4,  R * 0.4, R * 0.55,  R * 0.15,  Math.PI / 4);
    drawSolarPanel( R * 1.5,  -R * 0.7,  R * 0.35, -R * 0.25, R * 0.45, -R * 0.1, -Math.PI / 6);
    drawSolarPanel( R * 1.5,   R * 0.7,  R * 0.35,  R * 0.25, R * 0.45,  R * 0.1,  Math.PI / 6);

    ctx.strokeStyle = "rgba(200, 220, 255, 0.7)";
    ctx.lineWidth = Math.max(1, R * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.55);
    ctx.lineTo(-R * 0.55, -R * 0.85);
    ctx.moveTo(0,  R * 0.55);
    ctx.lineTo(-R * 0.55,  R * 0.85);
    ctx.moveTo(0, -R * 0.55);
    ctx.lineTo( R * 0.6, -R * 0.45);
    ctx.moveTo(0,  R * 0.55);
    ctx.lineTo( R * 0.6,  R * 0.45);
    ctx.stroke();

    const hullGrad = ctx.createLinearGradient(-R * 1.3, 0, R * 1.1, 0);
    hullGrad.addColorStop(0, "#cfe1ff");
    hullGrad.addColorStop(0.5, "#7fa3d1");
    hullGrad.addColorStop(1, "#2a3b5c");

    ctx.beginPath();
    ctx.moveTo(-R * 1.35, 0);
    ctx.quadraticCurveTo(-R * 0.7, -R * 0.55, 0, -R * 0.55);
    ctx.lineTo( R * 0.9, -R * 0.5);
    ctx.quadraticCurveTo( R * 1.15, 0,  R * 0.9,  R * 0.5);
    ctx.lineTo(0,  R * 0.55);
    ctx.quadraticCurveTo(-R * 0.7, R * 0.55, -R * 1.35, 0);
    ctx.closePath();
    ctx.fillStyle = hullGrad;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, R * 0.07);
    ctx.strokeStyle = "#ffe27a";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-R * 1.0, -R * 0.15);
    ctx.quadraticCurveTo(-R * 0.3, -R * 0.42,  R * 0.7, -R * 0.32);
    ctx.lineTo( R * 0.7, -R * 0.2);
    ctx.quadraticCurveTo(-R * 0.3, -R * 0.28, -R * 1.0, 0);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-R * 0.55, 0, R * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120, 200, 255, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = Math.max(1, R * 0.04);
    ctx.stroke();

    const engine = ctx.createRadialGradient(R * 1.0, 0, 0, R * 1.0, 0, R * 0.9);
    engine.addColorStop(0, "rgba(255, 200, 100, 0.9)");
    engine.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = engine;
    ctx.beginPath();
    ctx.arc(R * 1.0, 0, R * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(R * 1.05, 0, R * 0.25, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();

    ctx.restore();
  }

  function drawSolarPanel(cx, cy, dx1, dy1, dx2, dy2, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    const w = Math.hypot(dx1 - dx2, dy1 - dy2) * 1.6;
    const h = Math.hypot(dx1 + dx2, dy1 + dy2) * 0.6 + w * 0.35;

    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(0, h / 2);
    ctx.lineTo(-w / 2, 0);
    ctx.closePath();

    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, "rgba(255, 226, 122, 0.95)");
    g.addColorStop(0.5, "rgba(200, 170, 90, 0.85)");
    g.addColorStop(1, "rgba(120, 100, 60, 0.75)");
    ctx.fill
