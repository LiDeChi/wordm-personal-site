/** Conway's Game of Life */
export function createLife(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const COLS = 60, ROWS = 40;
  let grid = new Uint8Array(COLS * ROWS);
  let next = new Uint8Array(COLS * ROWS);
  let running = true;
  let raf = 0;
  let acc = 0;
  let last = 0;
  const SPEED = 8; // steps/sec

  function idx(x, y) { return y * COLS + x; }
  function clear() { grid.fill(0); }
  function randomize(p = 0.28) {
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < p ? 1 : 0;
  }
  function seedGlider(x = 2, y = 2) {
    clear();
    [[1,0],[2,1],[0,2],[1,2],[2,2]].forEach(([dx,dy]) => { grid[idx(x+dx,y+dy)] = 1; });
  }
  function seedGun() {
    clear();
    // Gosper glider gun (simplified placement)
    const cells = [
      [1,5],[1,6],[2,5],[2,6],
      [11,5],[11,6],[11,7],[12,4],[12,8],[13,3],[13,9],[14,3],[14,9],
      [15,6],[16,4],[16,8],[17,5],[17,6],[17,7],[18,6],
      [21,3],[21,4],[21,5],[22,3],[22,4],[22,5],[23,2],[23,6],
      [25,1],[25,2],[25,6],[25,7],
      [35,3],[35,4],[36,3],[36,4],
    ];
    cells.forEach(([x,y]) => { if (x<COLS&&y<ROWS) grid[idx(x,y)] = 1; });
  }
  function step() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = (x + dx + COLS) % COLS;
          const yy = (y + dy + ROWS) % ROWS;
          n += grid[idx(xx, yy)];
        }
        const alive = grid[idx(x,y)];
        next[idx(x,y)] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
      }
    }
    const t = grid; grid = next; next = t;
  }
  function draw() {
    const w = canvas.width, h = canvas.height;
    const cw = w / COLS, ch = h / ROWS;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6ee7b7';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[idx(x,y)]) ctx.fillRect(x * cw, y * ch, cw - 0.5, ch - 0.5);
    }
  }
  function loop(ts) {
    if (!last) last = ts;
    const dt = (ts - last) / 1000;
    last = ts;
    if (running) {
      acc += dt * SPEED;
      while (acc >= 1) { step(); acc -= 1; }
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * COLS);
    const y = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      grid[idx(x,y)] ^= 1;
      draw();
    }
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
  mk('随机', () => randomize());
  mk('滑翔机', () => seedGlider());
  mk('滑翔机枪', () => seedGun());
  mk('清空', () => clear());
  mk('单步', () => { step(); draw(); });

  canvas.addEventListener('click', onClick);
  randomize();
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('click', onClick);
      toolbar.innerHTML = '';
    },
    note: '点击格子切换生死 · B3/S23',
  };
}
