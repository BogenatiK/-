(function () {
  "use strict";

  // ---------- DOM ----------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const batteryFill = document.getElementById("battery-fill");
  const batteryValue = document.getElementById("battery-value");
  const progressValue = document.getElementById("progress-value");
  const progressFill = document.getElementById("progress-fill");

  const menuScreen = document.getElementById("menu-screen");
  const resultScreen = document.getElementById("result-screen");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const restartBtn = document.getElementById("restart-btn");
  const menuBtn = document.getElementById("menu-btn");
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");

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

    // Пересчёт позиции паруса
    if (state.sail) {
      state.sail.y = H - 70;
      state.sail.x = clamp(state.sail.x || W / 2, state.sail.r, W - state.sail.r);
      state.sail.r = clamp(Math.min(W, H) * 0.05, 20, 32);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // ---------- Сложность ----------
  const DIFFICULTY = {
    easy: {
      label: "Лёгкий",
      fallSpeed: 180,           // px/сек — базовая скорость падения
      drainPerSec: 3.5,         // % заряда в секунду
      beamHealAmount: 12,       // % за пойманный луч
      beamSpawnInterval: 1300,  // мс
      asteroidSpawnInterval: 1700,
      asteroidMinSize: 24,
      asteroidMaxSize: 38,
      tripDuration: 45          // сек до Марса
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

  // ---------- Состояние ----------
  const state = {
    running: false,
    difficulty: "easy",
    config: DIFFICULTY.easy,
    sail: { x: 0, y: 0, r: 26, angle: 0 },
    pointer: { x: 0, active: false },
    objects: [],       // {type, x, y, r, vy, ...}
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

  // ---------- Спавн объектов ----------
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

    sail.x += (targetX - sail.x) * 0.25;
    sail.x = clamp(sail.x, sail.r, W - sail.r);

    // Наклон в сторону движения
    const desiredTilt = clamp((targetX - sail.x) * 0.01, -0.5, 0.5);
    sail.angle += (desiredTilt - sail.angle) * 0.2;

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

      // Столкновение
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

      // Улетел вниз
      if (o.y - o.r > H + 40) {
        state.objects.splice(i, 1);
      }
    }
  }

  function updateProgressAndBattery(dt) {
    const cfg = state.config;

    state.elapsed += dt;
    state.progress = clamp(state.elapsed / cfg.tripDuration, 0, 1);

    state.battery -= cfg.drainPerSec * dt;

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

    // Звёзды, летящие вниз — эффект движения
    const t = state.elapsed * state.config.fallSpeed;
    for (let i = 0; i < 100; i++) {
      const baseY = (i * 61.37) % H;
      const sy = ((baseY + t * 0.5) % H + H) % H;
      const sx = ((i * 97.31) % W);
      const size = (i % 3 === 0) ? 1.6 : 1;
      ctx.fillStyle = "rgba(180, 210, 255, 0.55)";
      ctx.fillRect(sx, sy, size, size);
    }

    // Марс вдалеке сверху
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
    // Свечение
    const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
    glow.addColorStop(0, "rgba(255, 240, 160, 0.95)");
    glow.addColorStop(0.4, "rgba(255, 210, 100, 0.5)");
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2);
    ctx.fill();

    // Хвост сверху (луч летит вниз — хвост тянется вверх)
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

    // Ядро
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

    // Кратеры
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

  // Мягкое свечение вокруг всего корабля
  const glow = ctx.createRadialGradient(0, 0, sail.r * 0.5, 0, 0, sail.r * 3);
  glow.addColorStop(0, "rgba(255, 220, 120, 0.35)");
  glow.addColorStop(1, "rgba(255, 220, 120, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, sail.r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Базовый поворот корпуса: нос смотрит вправо
  ctx.rotate(Math.PI / 2);

  // Лёгкий наклон в сторону движения (теперь он тоже работает «вправо-вниз»)
  ctx.rotate(sail.angle);

  const R = sail.r;

  // ---------- Солнечные паруса (4 полотна) ----------
  // Каждое — ромбовидное полотно на лёгкой штанге.
  // Верхние и нижние пары слегка наклонены назад, чтобы читался объём.

  // Верхний парус (вперёд-вверх)
  drawSolarPanel(-R * 1.55, -R * 1.55, -R * 0.4, -R * 0.4, R * 0.55, -R * 0.15, -Math.PI / 4);
  // Нижний парус (вперёд-вниз)
  drawSolarPanel(-R * 1.55,  R * 1.55, -R * 0.4,  R * 0.4, R * 0.55,  R * 0.15,  Math.PI / 4);

  // Задние (короткие) паруса — симметрично сзади
  drawSolarPanel( R * 1.5,  -R * 0.7,  R * 0.35, -R * 0.25, R * 0.45, -R * 0.1, -Math.PI / 6);
  drawSolarPanel( R * 1.5,   R * 0.7,  R * 0.35,  R * 0.25, R * 0.45,  R * 0.1,  Math.PI / 6);

  // ---------- Штанги, соединяющие паруса с корпусом ----------
  ctx.strokeStyle = "rgba(200, 220, 255, 0.7)";
  ctx.lineWidth = Math.max(1, R * 0.06);
  ctx.beginPath();
  // Верхняя передняя
  ctx.moveTo(0, -R * 0.55);
  ctx.lineTo(-R * 0.55, -R * 0.85);
  // Нижняя передняя
  ctx.moveTo(0,  R * 0.55);
  ctx.lineTo(-R * 0.55,  R * 0.85);
  // Верхняя задняя
  ctx.moveTo(0, -R * 0.55);
  ctx.lineTo( R * 0.6, -R * 0.45);
  // Нижняя задняя
  ctx.moveTo(0,  R * 0.55);
  ctx.lineTo( R * 0.6,  R * 0.45);
  ctx.stroke();

  // ---------- Корпус-капсула ----------
  // Основной сигарообразный корпус, ориентированный «вперёд» = влево (к Марсу)
  const hullGrad = ctx.createLinearGradient(-R * 1.3, 0, R * 1.1, 0);
  hullGrad.addColorStop(0, "#cfe1ff");
  hullGrad.addColorStop(0.5, "#7fa3d1");
  hullGrad.addColorStop(1, "#2a3b5c");

  ctx.beginPath();
  ctx.moveTo(-R * 1.35, 0);                       // нос
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

  // Блик сверху корпуса
  ctx.beginPath();
  ctx.moveTo(-R * 1.0, -R * 0.15);
  ctx.quadraticCurveTo(-R * 0.3, -R * 0.42,  R * 0.7, -R * 0.32);
  ctx.lineTo( R * 0.7, -R * 0.2);
  ctx.quadraticCurveTo(-R * 0.3, -R * 0.28, -R * 1.0, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fill();

  // Иллюминатор
  ctx.beginPath();
  ctx.arc(-R * 0.55, 0, R * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(120, 200, 255, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = Math.max(1, R * 0.04);
  ctx.stroke();

  // Двигатель сзади — лёгкое свечение пламени
  const engine = ctx.createRadialGradient(R * 1.0, 0, 0, R * 1.0, 0, R * 0.9);
  engine.addColorStop(0, "rgba(255, 200, 100, 0.9)");
  engine.addColorStop(1, "rgba(255, 120, 40, 0)");
  ctx.fillStyle = engine;
  ctx.beginPath();
  ctx.arc(R * 1.0, 0, R * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Ядро пламени
  ctx.beginPath();
  ctx.ellipse(R * 1.05, 0, R * 0.25, R * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff4c2";
  ctx.fill();

  ctx.restore();
}

// Вспомогательная функция — рисует одно ромбовидное полотно паруса
function drawSolarPanel(cx, cy, dx1, dy1, dx2, dy2, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const w = Math.hypot(dx1 - dx2, dy1 - dy2) * 1.6; // ширина полотна
  const h = Math.hypot(dx1 + dx2, dy1 + dy2) * 0.6 + w * 0.35; // высота полотна

  // Полотно — ромб
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(0, h / 2);
  ctx.lineTo(-w / 2, 0);
  ctx.closePath();

  // Градиент — «солнечная» сторона светлее, обратная темнее
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, "rgba(255, 226, 122, 0.95)");
  g.addColorStop(0.5, "rgba(200, 170, 90, 0.85)");
  g.addColorStop(1, "rgba(120, 100, 60, 0.75)");
  ctx.fillStyle = g;
  ctx.fill();

  // Тонкая обводка
  ctx.strokeStyle = "rgba(255, 240, 180, 0.85)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Сетка на полотне — тонкие линии, имитирующие ячейки
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
  function render() {
    drawBackground();
    for (const o of state.objects) {
      if (o.type === "beam") drawBeam(o);
      else drawAsteroid(o);
    }
    drawSail();
  }

  // ---------- Игровой цикл ----------
  function loop(now) {
    if (!state.running) return;

    if (state.lastFrameTime === 0) state.lastFrameTime = now;
    let dt = (now - state.lastFrameTime) / 1000;
    state.lastFrameTime = now;
    if (dt > 0.05) dt = 0.05;

    // Спавн
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
  function startGame(key) {
    state.difficulty = key;
    state.config = DIFFICULTY[key];

    state.running = true;
    state.objects = [];
    state.battery = 100;
    state.progress = 0;
    state.elapsed = 0;
    state.lastFrameTime = 0;

    state.sail.r = clamp(Math.min(W, H) * 0.05, 20, 32);
    state.sail.x = W / 2;
    state.sail.y = H - 70;
    state.sail.angle = 0;

    state.pointer.x = W / 2;
    state.pointer.active = false;

    const t = performance.now();
    state.lastSpawnBeam = t + 700;       // первый луч с задержкой
    state.lastSpawnAsteroid = t + 1300;  // первый астероид чуть позже

    batteryFill.style.width = "100%";
    batteryValue.textContent = "100%";
    progressFill.style.width = "0%";
    progressValue.textContent = "100%";

    menuScreen.classList.add("hidden");
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
      resultText.textContent =
        "Сложность: " + state.config.label +
        ". Остаток заряда: " + Math.round(state.battery) + "%.";
    } else if (reason === "battery") {
      resultTitle.textContent = "Заряд исчерпан";
      resultText.textContent =
        "Парус остался в дрейфе на " +
        Math.round(state.progress * 100) + "% пути к Марсу.";
    } else if (reason === "asteroid") {
      resultTitle.textContent = "Столкновение!";
      resultText.textContent =
        "Астероид разрушил парус на " +
        Math.round(state.progress * 100) + "% пути к Марсу.";
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
    menuScreen.classList.remove("hidden");
  }

  // ---------- Кнопки ----------
  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.difficulty));
  });
  restartBtn.addEventListener("click", () => startGame(state.difficulty));
  menuBtn.addEventListener("click", goToMenu);

  // ---------- Init ----------
  resize();
})();
