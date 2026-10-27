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
  const hudBeamsValue = document.getElementById("hud-beams-value");

  const menuScreen = document.getElementById("menu-screen");
  const shipScreen = document.getElementById("ship-screen");
  const resultScreen = document.getElementById("result-screen");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const resultBeams = document.getElementById("result-beams");

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
    easy: { label: "Лёгкий", fallSpeed: 180, drainPerSec: 3.5, beamHealAmount: 12, beamSpawnInterval: 1300, asteroidSpawnInterval: 1700, asteroidMinSize: 24, asteroidMaxSize: 38, tripDuration: 45 },
    medium: { label: "Средний", fallSpeed: 260, drainPerSec: 5, beamHealAmount: 9, beamSpawnInterval: 1000, asteroidSpawnInterval: 1150, asteroidMinSize: 22, asteroidMaxSize: 44, tripDuration: 60 },
    hard: { label: "Сложный", fallSpeed: 360, drainPerSec: 7, beamHealAmount: 6, beamSpawnInterval: 820, asteroidSpawnInterval: 800, asteroidMinSize: 20, asteroidMaxSize: 50, tripDuration: 75 }
  };

  // ---------- Паруса ----------
  const SHIPS = {
    small:  { label: "Малый",    sizeModifier: 0.75, drainMultiplier: 0.7,  tripTimeMultiplier: 1.3,  maneuverability: 0.40 },
    medium: { label: "Стандарт", sizeModifier: 1.0,  drainMultiplier: 1.0,  tripTimeMultiplier: 1.0,  maneuverability: 0.25 },
    large:  { label: "Крупный",  sizeModifier: 1.35, drainMultiplier: 1.25, tripTimeMultiplier: 0.75, maneuverability: 0.15 }
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
    rafId: null,

    // --- новое ---
    beamsCollected: 0,          // всего собрано лучей за полёт
    wormholeSpawnedThisTrip: false,
    wormhole: null,             // текущая воронка или null
    jumpFlash: 0                // вспышка после прыжка
  };

  // ---------- Утилиты ----------
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const randRange = (a, b) => a + Math.random() * (b - a);

  // Требуемое число лучей для активации воронки в зависимости от прогресса (0..1)
  function requiredBeamsForWormhole(progress) {
    // Ближе к Марсу — дороже. От 3 до 12 лучей.
    const base = 3;
    const span = 9;
    return Math.round(base + span * clamp(progress, 0, 1));
  }

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
    state.objects.push({ type: "beam", x: randRange(r + 10, W - r - 10), y: -r - 20, r, vy: state.config.fallSpeed * randRange(0.95, 1.1), rot: 0 });
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

  // Воронка: появляется один раз за полёт в случайной части пути
  function maybeSpawnWormhole() {
    if (state.wormholeSpawnedThisTrip || state.wormhole) return;

    // Случайная точка маршрута: от 20% до 80%
    const trigger = randRange(0.2, 0.8);
    if (state.progress < trigger) return;

    state.wormholeSpawnedThisTrip = true;

    const r = clamp(Math.min(W, H) * 0.09, 34, 56);
    state.wormhole = {
      type: "wormhole",
      x: randRange(r + 10, W - r - 10),
      y: -r - 40,
      r,
      vy: state.config.fallSpeed * 0.55,
      rot: 0,
      spin: randRange(0.5, 1.4),
      requiredBeams: requiredBeamsForWormhole(state.progress),
      activated: false
    };
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
          state.beamsCollected += 1;
          hudBeamsValue.textContent = state.beamsCollected;
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

    updateWormhole(dt);
  }

  function updateWormhole(dt) {
    const wh = state.wormhole;
    if (!wh) return;

    wh.y += wh.vy * dt;
    wh.rot += wh.spin * dt;

    if (circleVsSail(wh)) {
      if (!wh.activated) {
        const required = requiredBeamsForWormhole(state.progress);
        wh.requiredBeams = required;

        if (state.beamsCollected >= required) {
          // Активируем гравитационный прыжок
          wh.activated = true;
          state.beamsCollected -= required;
          hudBeamsValue.textContent = state.beamsCollected;

          // Ускоряем прогресс на 25%
          state.progress = clamp(state.progress + 0.25, 0, 0.999);
          state.elapsed = state.progress * getActualTripDuration();

          state.jumpFlash = 1;
        }
        // Если лучей не хватило — пролетаем насквозь, воронка исчезает ниже
      }
    }

    if (wh.y - wh.r > H + 60) {
      state.wormhole = null;
    }
  }

  function getActualTripDuration() {
    return state.config.tripDuration * state.shipConfig.tripTimeMultiplier;
  }

  function updateProgressAndBattery(dt) {
    const cfg = state.config;
    const ship = state.shipConfig;

    state.elapsed += dt;

    const actualTripDuration = getActualTripDuration();
    state.progress = clamp(state.elapsed / actualTripDuration, 0, 1);
    state.battery -= cfg.drainPerSec * ship.drainMultiplier * dt;

    maybeSpawnWormhole();

    if (state.jumpFlash > 0) {
      state.jumpFlash = Math.max(0, state.jumpFlash - dt * 1.6);
    }

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

    if (state.jumpFlash > 0) {
      ctx.fillStyle = "rgba(140, 220, 255, " + (state.jumpFlash * 0.35) + ")";
      ctx.fillRect(0, 0, W, H);
    }
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

  function drawWormhole(wh) {
    const required = requiredBeamsForWormhole(state.progress);
    const canActivate = state.beamsCollected >= required;
    const baseColor = wh.activated ? [120, 255, 200] : (canActivate ? [140, 220, 255] : [160, 150, 220]);

    ctx.save();
    ctx.translate(wh.x, wh.y);

    // Внешнее свечение
    const glow = ctx.createRadialGradient(0, 0, wh.r * 0.3, 0, 0, wh.r * 2.2);
    glow.addColorStop(0, "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ",0.55)");
    glow.addColorStop(0.6, "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ",0.18)");
    glow.addColorStop(1, "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ",0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, wh.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Спиральные рукава
    ctx.rotate(wh.rot);
    const arms = 3;
    for (let a = 0; a < arms; a++) {
      const start = (a / arms) * Math.PI * 2;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.04) {
        const ang = start + t * Math.PI * 2.2;
        const rad = wh.r * (0.25 + t * 0.9);
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ",0.65)";
      ctx.lineWidth = Math.max(2, wh.r * 0.08);
      ctx.stroke();
    }

    // Тёмный центр
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, wh.r * 0.7);
    core.addColorStop(0, "rgba(5, 8, 18, 0.95)");
    core.addColorStop(0.7, "rgba(20, 30, 55, 0.6)");
    core.addColorStop(1, "rgba(40, 60, 100, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, wh.r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(-wh.rot);

    // Индикатор требования
    ctx.font = "bold " + Math.max(12, wh.r * 0.34) + "px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = canActivate ? "#aef7c8" : "#ffd7d7";
    ctx.fillText(required + " ✦", 0, 0);

    // Подпись
    ctx.font = "600 " + Math.max(9, wh.r * 0.22) + "px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = canActivate ? "rgba(174,247,200,0.9)" : "rgba(200,200,220,0.7)";
    ctx.fillText(canActivate ? "ПРЫЖОК" : "нужно лучей", 0, wh.r * 0.95);

    ctx.restore();
  }

  // Вспомогательная функция — рисует одно ромбовидное полотно паруса
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
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 240, 180, 0.85)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = "rgba(80, 70, 40, 0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, h / 2);
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();

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

  function render() {
    drawBackground();
    for (const o of state.objects) {
      if (o.type === "beam") drawBeam(o);
      else drawAsteroid(o);
    }
    if (state.wormhole) drawWormhole(state.wormhole);
    drawSail();
  }

  // ---------- Игровой цикл ----------
  function loop(now) {
    if (!state.running) return;

    if (state.lastFrameTime === 0) state.lastFrameTime = now;
    let dt = (now - state.lastFrameTime) / 1000;
    state.lastFrameTime = now;
    if (dt > 0.05) dt = 0.05;

    if (now - state.lastSpawnBeam >= state.config.beamSpawnInterval) {
      state.lastSpawnBeam = now;
      spawnBeam();
    }
    if (now - state.lastSpawnAsteroid >= state.config.asteroidSpawnInterval) {
      state.lastSpawnAsteroid = now;
      spawnAsteroid();
    }

    updateSail(dt);
    updateObjects(dt);
    if (!state.running) return;
    updateProgressAndBattery(dt);
    if (!state.running) return;

    render();
    state.rafId = requestAnimationFrame(loop);
  }

  // ---------- Управление игрой ----------
  function startGame() {
    state.running = true;
    state.objects = [];
    state.battery = 100;
    state.progress = 0;
    state.elapsed = 0;
    state.lastFrameTime = 0;

    // сброс нового
    state.beamsCollected = 0;
    state.wormhole = null;
    state.wormholeSpawnedThisTrip = false;
    state.jumpFlash = 0;

    const baseR = clamp(Math.min(W, H) * 0.05, 20, 32);
    state.sail.r = baseR * state.shipConfig.sizeModifier;

    state.sail.x = W / 2;
    state.sail.y = H - 70;
    state.sail.angle = 0;

    state.pointer.x = W / 2;
    state.pointer.active = false;

    const t = performance.now();
    state.lastSpawnBeam = t + 700;
    state.lastSpawnAsteroid = t + 1300;

    batteryFill.style.width = "100%";
    batteryValue.textContent = "100%";
    progressFill.style.width = "0%";
    progressValue.textContent = "100%";
    hudSailName.textContent = state.shipConfig.label;
    hudBeamsValue.textContent = "0";

    menuScreen.classList.add("hidden");
    shipScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);
  }

  function endGame(reason) {
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    if (reason === "win") {
      resultTitle.textContent = "Марс достигнут!";
      resultText.textContent = "Сложность: " + state.config.label + " (Парус: " + state.shipConfig.label + "). Остаток заряда: " + Math.round(state.battery) + "%.";
    } else if (reason === "battery") {
      resultTitle.textContent = "Заряд исчерпан";
      resultText.textContent = "Парус остался в дрейфе на " + Math.round(state.progress * 100) + "% пути к Марсу.";
    } else if (reason === "asteroid") {
      resultTitle.textContent = "Столкновение!";
      resultText.textContent = "Астероид разрушил парус на " + Math.round(state.progress * 100) + "% пути к Марсу.";
    }
    if (resultBeams) {
      resultBeams.textContent = "Собрано лучей света: " + state.beamsCollected;
    }

    resultScreen.classList.remove("hidden");
  }

  function goToMenu() {
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    resultScreen.classList.add("hidden");
    shipScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  }

  // ---------- Кнопки ----------
  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.difficulty;
      state.config = DIFFICULTY[state.difficulty];
      menuScreen.classList.add("hidden");
      shipScreen.classList.remove("hidden");
    });
  });

  shipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      shipBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.shipType = btn.dataset.ship;
      state.shipConfig = SHIPS[state.shipType];
    });
  });

  startGameBtn.addEventListener("click", startGame);
  backToDiffBtn.addEventListener("click", () => {
    shipScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  restartBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", goToMenu);

  // ---------- Init ----------
  resize();
})();
