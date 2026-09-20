/** Tierra-lite — schematic timeslice competition visualization */
export function createTierraLite(canvas, toolbar) {
  const ctx = canvas.getContext('2d');
  const SLOTS = 48;
  // Each organism: genome length proxy, energy, color, kind (host/parasite)
  let orgs = [];
  let tick = 0;
  let running = true;
  let raf = 0;
  let log = [];

  function spawn(kind = 'host') {
    const len = kind === 'parasite' ? 4 + (Math.random() * 4 | 0) : 10 + (Math.random() * 10 | 0);
    return {
      id: Math.random().toString(36).slice(2, 7),
      kind,
      len,
      energy: 20 + Math.random() * 30,
      age: 0,
      hue: kind === 'parasite' ? 330 : 160 + Math.random() * 60,
    };
  }
  function reset() {
    orgs = Array.from({ length: 12 }, () => spawn('host'));
    tick = 0;
    log = ['播种宿主程序'];
  }
  function step() {
    tick++;
    // Timeslice: CPU proportional to 1/len (shorter gets more slices) — Tierra-ish
    const order = [...orgs.keys()].sort((a, b) => orgs[a].len - orgs[b].len);
    for (const i of order) {
      const o = orgs[i];
      if (!o) continue;
      const slices = Math.max(1, Math.round(16 / o.len));
      o.energy += slices * 0.4;
      o.age++;
      // replication cost
      if (o.energy > o.len * 3 && orgs.length < SLOTS) {
        o.energy -= o.len * 2;
        let child = { ...o, id: Math.random().toString(36).slice(2, 7), energy: o.len, age: 0 };
        // mutation / parasite emergence
        if (Math.random() < 0.08) {
          child.kind = 'parasite';
          child.len = Math.max(3, (o.len / 2) | 0);
          child.hue = 330;
          log.push(`t${tick}: 寄生突变 ${child.id}`);
        } else if (Math.random() < 0.12) {
          child.len = Math.max(3, child.len + (Math.random() < 0.5 ? -1 : 1));
        }
        // parasites steal from hosts
        if (child.kind === 'parasite') {
          const host = orgs.find(x => x.kind === 'host');
          if (host) host.energy -= 5;
        }
        orgs.push(child);
      }
      o.energy -= 0.35 + o.len * 0.02;
    }
    // death
    orgs = orgs.filter(o => o.energy > 0);
    if (orgs.length === 0) {
      log.push(`t${tick}: 灭绝 → 重新播种`);
      orgs = Array.from({ length: 8 }, () => spawn('host'));
    }
    if (orgs.filter(o => o.kind === 'host').length === 0) {
      orgs.push(spawn('host'));
      log.push(`t${tick}: 宿主回补`);
    }
    if (log.length > 6) log.shift();
  }
  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);
    // memory tape
    const cellW = w / SLOTS;
    const tapeY = h * 0.35;
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(0, tapeY - 20, w, 50);
    orgs.slice(0, SLOTS).forEach((o, i) => {
      const x = i * cellW;
      const hh = 10 + Math.min(40, o.len * 2);
      ctx.fillStyle = `hsl(${o.hue} 70% 55%)`;
      ctx.fillRect(x + 1, tapeY + 25 - hh, cellW - 2, hh);
      if (o.kind === 'parasite') {
        ctx.strokeStyle = '#f472b6';
        ctx.strokeRect(x + 1, tapeY + 25 - hh, cellW - 2, hh);
      }
    });
    // stats bars
    const hosts = orgs.filter(o => o.kind === 'host').length;
    const paras = orgs.filter(o => o.kind === 'parasite').length;
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(20, 20, hosts * 6, 10);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(20, 36, paras * 6, 10);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText(`t=${tick}  宿主 ${hosts}  寄生 ${paras}  种群 ${orgs.length}`, 20, 64);
    ctx.fillText('条带 = 内存槽；高度 ≈ 基因组长度；短基因组获更多时间片', 20, h - 48);
    log.forEach((line, i) => {
      ctx.fillText(line, 20, h - 30 + i * 0); // only show last via join
    });
    ctx.fillText(log[log.length - 1] || '', 20, h - 24);
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
  mk('重置', () => reset());
  mk('注入寄生', () => {
    if (orgs.length < SLOTS) orgs.push(spawn('parasite'));
  });

  reset();
  raf = requestAnimationFrame(loop);
  return {
    destroy() { cancelAnimationFrame(raf); toolbar.innerHTML = ''; },
    note: 'Tierra-lite 示意：时间片竞争 + 复制 + 偶发寄生；非真实 Tierra 虚拟机',
  };
}
