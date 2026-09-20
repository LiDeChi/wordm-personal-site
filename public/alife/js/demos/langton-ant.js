/** Langton's Ant */
export function createLangtonAnt(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const SIZE = 120;
  let grid = new Uint8Array(SIZE * SIZE);
  let x = SIZE >> 1, y = SIZE >> 1;
  let dir = 0; // 0N 1E 2S 3W
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  let running = true;
  let raf = 0;
  let stepsPerFrame = 40;
  let stepCount = 0;

  function reset() {
    grid.fill(0);
    x = SIZE >> 1; y = SIZE >> 1; dir = 0;
    stepCount = 0;
  }
  function stepOnce() {
    const i = y * SIZE + x;
    if (grid[i]) { dir = (dir + 3) % 4; grid[i] = 0; }
    else { dir = (dir + 1) % 4; grid[i] = 1; }
    x = (x + DX[dir] + SIZE) % SIZE;
    y = (y + DY[dir] + SIZE) % SIZE;
    stepCount++;
  }
  function draw() {
    const w = canvas.width, h = canvas.height;
    const cw = w / SIZE, ch = h / SIZE;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e5e7eb';
    for (let yy = 0; yy < SIZE; yy++) for (let xx = 0; xx < SIZE; xx++) {
      if (grid[yy * SIZE + xx]) ctx.fillRect(xx * cw, yy * ch, cw, ch);
    }
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x * cw, y * ch, cw, ch);
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
  mk('重置', () => reset());
  mk('加速', () => { stepsPerFrame = Math.min(400, stepsPerFrame + 40); });
  mk('减速', () => { stepsPerFrame = Math.max(1, stepsPerFrame - 40); });
  const info = document.createElement('button');
  info.disabled = true;
  info.textContent = '步数';
  toolbar.appendChild(info);

  function tick(ts) {
    if (running) for (let i = 0; i < stepsPerFrame; i++) stepOnce();
    draw();
    info.textContent = `步 ${stepCount}`;
    raf = requestAnimationFrame(tick);
  }

  reset();
  raf = requestAnimationFrame(tick);
  return {
    destroy() { cancelAnimationFrame(raf); toolbar.innerHTML = ''; },
    note: '白→右转并变黑；黑→左转并变白 · 晚期可出现「高速公路」',
  };
}
