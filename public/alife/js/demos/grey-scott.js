/** Simplified Grey-Scott reaction-diffusion (CPU, low-res) */
export function createGreyScott(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const N = 96;
  let U = new Float32Array(N * N);
  let V = new Float32Array(N * N);
  let Un = new Float32Array(N * N);
  let Vn = new Float32Array(N * N);
  let running = true;
  let raf = 0;
  // Classic "mitosis" / spots-ish params
  let F = 0.037, k = 0.06;
  const Du = 0.16, Dv = 0.08, dt = 1.0;

  function idx(x, y) { return ((y + N) % N) * N + ((x + N) % N); }
  function seed() {
    U.fill(1); V.fill(0);
    const cx = N >> 1, cy = N >> 1;
    for (let y = cy - 8; y < cy + 8; y++)
      for (let x = cx - 8; x < cx + 8; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 < 50) {
          U[idx(x, y)] = 0.5 + Math.random() * 0.1;
          V[idx(x, y)] = 0.25 + Math.random() * 0.1;
        }
      }
  }
  function lap(arr, x, y) {
    return arr[idx(x+1,y)] + arr[idx(x-1,y)] + arr[idx(x,y+1)] + arr[idx(x,y-1)]
      - 4 * arr[idx(x,y)];
  }
  function step() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y);
      const u = U[i], v = V[i];
      const uvv = u * v * v;
      Un[i] = u + (Du * lap(U, x, y) - uvv + F * (1 - u)) * dt;
      Vn[i] = v + (Dv * lap(V, x, y) + uvv - (F + k) * v) * dt;
    }
    let t = U; U = Un; Un = t;
    t = V; V = Vn; Vn = t;
  }
  const img = ctx.createImageData(N, N);
  function draw() {
    const d = img.data;
    for (let i = 0; i < N * N; i++) {
      const v = Math.min(1, Math.max(0, V[i] * 3));
      const u = Math.min(1, Math.max(0, U[i]));
      const o = i * 4;
      d[o] = (20 + v * 180) | 0;
      d[o+1] = (40 + u * 120 + v * 80) | 0;
      d[o+2] = (80 + (1 - v) * 140) | 0;
      d[o+3] = 255;
    }
    // scale to canvas
    const off = document.createElement('canvas');
    off.width = N; off.height = N;
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }
  function loop() {
    if (running) { for (let i = 0; i < 8; i++) step(); }
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
  mk('重置', () => seed());
  mk('斑点', () => { F = 0.037; k = 0.06; seed(); });
  mk('蠕动', () => { F = 0.03; k = 0.057; seed(); });
  mk('珊瑚', () => { F = 0.0545; k = 0.062; seed(); });

  function paint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * N);
    const y = Math.floor((e.clientY - rect.top) / rect.height * N);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      if (dx*dx + dy*dy <= 9) {
        V[idx(x+dx, y+dy)] = 0.9;
        U[idx(x+dx, y+dy)] = 0.3;
      }
    }
  }
  canvas.addEventListener('pointerdown', paint);
  canvas.addEventListener('pointermove', (e) => { if (e.buttons) paint(e); });

  seed();
  raf = requestAnimationFrame(loop);
  return {
    destroy() { cancelAnimationFrame(raf); toolbar.innerHTML = ''; },
    note: '简化 CPU Grey-Scott · 点击/拖动注入 V · 参数预设近似斑图',
  };
}
