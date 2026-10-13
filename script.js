function drawSail() {
  const sail = state.sail;
  ctx.save();
  ctx.translate(sail.x, sail.y);

  // Свечение
  const glow = ctx.createRadialGradient(0, 0, sail.r * 0.4, 0, 0, sail.r * 2.4);
  glow.addColorStop(0, "rgba(255, 220, 120, 0.55)");
  glow.addColorStop(1, "rgba(255, 220, 120, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, sail.r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(sail.angle);

  // Корпус
  ctx.beginPath();
  ctx.arc(0, 0, sail.r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(30, 60, 110, 0.95)";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#ffe27a";
  ctx.stroke();

  // Парус
  ctx.beginPath();
  ctx.moveTo(-sail.r * 0.15, -sail.r * 0.75);
  ctx.lineTo(sail.r * 0.85, 0);
  ctx.lineTo(-sail.r * 0.15, sail.r * 0.75);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 226, 122, 0.9)";
  ctx.fill();

  ctx.restore();
}
