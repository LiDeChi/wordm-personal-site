/** Lenia-lite — honest simplified continuous CA (not full Lenia) */
export function createLeniaLite(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const N = 64;
  let A = new Float32Array(N * N);
  let B = new Float32Array(N * N);
  let running = true;
  let raf = 0;
  // Ring kernel radius & growth (Orbium-ish toy)
  const R = 8;
  const mu = 0.15, sigma = 0.015;
  const dt = 0.1;

  function idx(x, y) { return ((y + N) % N) * N + ((x + N) % N); }
  function kernel(dx, dy) {
    const d = Math.hypot(dx, dy) / R;
    if (d >= 1) return 0;
    // smooth ring peak near 0.5
    const t = d - 0.5;
    return Math.exp(-(t * t) / (2 * 0.05 * 0.05));
  }
  // Precompute kernel
  const K = [];
  let ksum = 0;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const w = kernel(dx, dy);
    if (w > 0) { K.push({ dx, dy, w }); ksum += w; }
  }
  K.forEach(k => { k.w /= ksum; });

  function growth(u) {
    return 2 * Math.exp(-((u - mu) ** 2) / (2 * sigma * sigma)) - 1;
  }
  function seedOrbium() {
    A.fill(0);
    const cx = N / 2, cy = N / 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < 10) A[idx(x, y)] = Math.max(0, 1 - d / 12) * (0.7 + 0.3 * Math.sin(x * 0.8));
    }
  }
  function step() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let u = 0;
      for (const k of K) u += A[idx(x + k.dx, y + k.dy)] * k.w;
      const a = A[idx(x, y)] + dt * growth(u);
      B[idx(x, y)] = Math.min(1, Math.max(0, a));
    }
    const t = A; A = B; B = t;
  }
  const img = ctx.createImageData(N, N);
  function draw() {
    const d = img.data;
    for (let i = 0; i < N * N; i++) {
      const v = A[i];
      const o = i * 4;
      d[o] = (v * 40) | 0;
      d[o+1] = (v * 220) | 0;
      d[o+2] = (80 + v * 160) | 0;
      d[o+3] = 255;
    }
    const off = document.createElement('canvas');
    off.width = N; off.height = N;
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }
  function loop() {
    if (running) step();
    draw();
    raf = requestAnimationFrame(loop);
  }

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
  mk('重置种子', () => seedOrbium());
  mk('噪声', () => {
    for (let i = 0; i < A.length; i++) A[i] = Math.random() < 0.08 ? Math.random() : 0;
  });

  seedOrbium();
  raf = requestAnimationFrame(loop);
  return {
    destroy() { cancelAnimationFrame(raf); toolbar.innerHTML = ''; },
    note: 'Lenia-lite（诚实简化）：连续核 + 生长映射玩具版，非完整 Lenia/Orbium 参数复现',
  };
}
