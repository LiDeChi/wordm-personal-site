/** Elementary Cellular Automaton (Rule 30 / 110) */
export function createECA(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const W = 180;
  let rule = 110;
  let row = new Uint8Array(W);
  let y = 0;
  let running = true;
  let raf = 0;
  let cellH = 0;

  function reset(r = rule) {
    rule = r;
    row = new Uint8Array(W);
    row[W >> 1] = 1;
    y = 0;
    cellH = canvas.height / Math.ceil(canvas.height / (canvas.width / W));
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function nextRow() {
    const n = new Uint8Array(W);
    for (let i = 0; i < W; i++) {
      const left = row[(i - 1 + W) % W];
      const mid = row[i];
      const right = row[(i + 1) % W];
      const code = (left << 2) | (mid << 1) | right;
      n[i] = (rule >> code) & 1;
    }
    row = n;
  }
  function drawRow() {
    const cw = canvas.width / W;
    const ch = Math.max(1, canvas.height / 120);
    if (y * ch > canvas.height) {
      // scroll up
      const img = ctx.getImageData(0, ch, canvas.width, canvas.height - ch);
      ctx.putImageData(img, 0, 0);
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, canvas.height - ch, canvas.width, ch);
      y = Math.floor((canvas.height - ch) / ch);
    }
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < W; i++) {
      if (row[i]) ctx.fillRect(i * cw, y * ch, cw, ch);
    }
    y++;
  }
  function loop() {
    if (running) {
      drawRow();
      nextRow();
    }
    raf = requestAnimationFrame(loop);
  }

  toolbar.innerHTML = '';
  const sel = document.createElement('select');
  [[30, 'Rule 30'], [110, 'Rule 110'], [90, 'Rule 90'], [184, 'Rule 184']].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    if (v === 110) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => reset(+sel.value));
  toolbar.appendChild(sel);
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
  mk('重置', () => reset(rule));

  reset(110);
  raf = requestAnimationFrame(loop);
  return {
    destroy() { cancelAnimationFrame(raf); toolbar.innerHTML = ''; },
    note: '初等 CA · Rule 110 图灵完备；Rule 30 混沌伪随机',
  };
}
