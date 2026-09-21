/** Craig Reynolds Boids */
export function createBoids(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const N = 80;
  let running = true;
  let raf = 0;
  let attract = null;

  const boids = Array.from({ length: N }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  }));

  const params = { sep: 22, align: 50, coh: 50, maxSpeed: 2.4, maxForce: 0.05 };

  function limit(vx, vy, max) {
    const m = Math.hypot(vx, vy);
    if (m > max) return [vx / m * max, vy / m * max];
    return [vx, vy];
  }

  function step() {
    const w = canvas.width, h = canvas.height;
    for (const b of boids) {
      let sx = 0, sy = 0, sc = 0;
      let ax = 0, ay = 0, ac = 0;
      let cx = 0, cy = 0, cc = 0;
      for (const o of boids) {
        if (o === b) continue;
        const dx = o.x - b.x, dy = o.y - b.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d < params.sep) { sx -= dx / d; sy -= dy / d; sc++; }
        if (d < params.align) { ax += o.vx; ay += o.vy; ac++; }
        if (d < params.coh) { cx += o.x; cy += o.y; cc++; }
      }
      let fx = 0, fy = 0;
      if (sc) { const [u,v] = limit(sx/sc, sy/sc, params.maxForce); fx += u * 1.5; fy += v * 1.5; }
      if (ac) { let [u,v] = limit(ax/ac - b.vx, ay/ac - b.vy, params.maxForce); fx += u; fy += v; }
      if (cc) {
        cx = cx/cc - b.x; cy = cy/cc - b.y;
        let [u,v] = limit(cx, cy, params.maxForce); fx += u; fy += v;
      }
      if (attract) {
        const dx = attract.x - b.x, dy = attract.y - b.y;
        const [u,v] = limit(dx * 0.002, dy * 0.002, params.maxForce * 2);
        fx += u; fy += v;
      }
      b.vx += fx; b.vy += fy;
      [b.vx, b.vy] = limit(b.vx, b.vy, params.maxSpeed);
      b.x = (b.x + b.vx + w) % w;
      b.y = (b.y + b.vy + h) % h;
    }
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(5,7,10,0.35)';
    ctx.fillRect(0, 0, w, h);
    for (const b of boids) {
      const a = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3.5); ctx.lineTo(-4, -3.5);
      ctx.closePath();
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
      ctx.restore();
    }
    if (attract) {
      ctx.beginPath();
      ctx.arc(attract.x, attract.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }
  }

  function loop() {
    if (running) step();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onPointer(e) {
    const rect = canvas.getBoundingClientRect();
    attract = {
      x: (e.clientX - rect.left) / rect.width * canvas.width,
      y: (e.clientY - rect.top) / rect.height * canvas.height,
    };
  }
  function clearAttract() { attract = null; }

  toolbar.innerHTML = '';
  const mk = (label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', fn);
    toolbar.appendChild(b);
    return b;
  };
  const playBtn = mk('暂停', () => {
    running = !running;
    playBtn.textContent = running ? '暂停' : '播放';
  });
  mk('重置', () => {
    boids.forEach(b => {
      b.x = Math.random() * canvas.width;
      b.y = Math.random() * canvas.height;
      b.vx = (Math.random() - 0.5) * 2;
      b.vy = (Math.random() - 0.5) * 2;
    });
  });

  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('pointermove', (e) => { if (e.buttons) onPointer(e); });
  canvas.addEventListener('pointerup', clearAttract);
  canvas.addEventListener('pointerleave', clearAttract);
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointer);
      toolbar.innerHTML = '';
    },
    note: '分离 / 对齐 / 聚合 · 按住拖动吸引点',
  };
}
