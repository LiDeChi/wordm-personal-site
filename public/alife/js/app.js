import { DEMO_LABELS, isRunnableDemo, loadDemoFactory } from './demos/index.js';

const SCHOOL_COLORS = [
  '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24',
  '#2dd4bf', '#fb7185', '#818cf8', '#4ade80', '#f59e0b',
  '#22d3ee', '#e879f9', '#a3e635', '#38bdf8', '#f97316',
];

const GALLERY_BATCH = 14;

const state = {
  catalog: null,
  schoolSet: new Set(),
  mediumSet: new Set(),
  demoOnly: false,
  searchQuery: '',
  activeDemo: null,
  drawerItemId: null,
  drawerDemoId: null,
  demoLoadGen: 0,
  previewDemos: new Map(), // cardId -> { destroy }
  previewObserver: null,
  previewCap: 5,
  tipsItemId: null,
  tipsMode: null,
  hoverTimer: null,
  longPressTimer: null,
  suppressClick: false,
  galleryItems: [],
  galleryShown: 0,
  galleryObserver: null,
};

const el = {
  menuBtn: document.getElementById('menu-btn'),
  searchBtn: document.getElementById('search-btn'),
  filterFloat: document.getElementById('filter-float'),
  filterClose: document.getElementById('filter-close'),
  searchFloat: document.getElementById('search-float'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  schoolFilters: document.getElementById('school-filters'),
  mediumFilters: document.getElementById('medium-filters'),
  demoOnly: document.getElementById('demo-only'),
  reset: document.getElementById('reset-filters'),
  yearRail: document.getElementById('year-rail'),
  gallery: document.getElementById('gallery'),
  galleryScroll: document.getElementById('gallery-scroll'),
  stats: document.getElementById('stats'),
  tips: document.getElementById('tips'),
  tipsBackdrop: document.getElementById('tips-backdrop'),
  tipsPanel: document.getElementById('tips-panel'),
  tipsClose: document.getElementById('tips-close'),
  tipsMeta: document.getElementById('tips-meta'),
  tipsTitle: document.getElementById('tips-title'),
  tipsEn: document.getElementById('tips-en'),
  tipsTags: document.getElementById('tips-tags'),
  tipsLeads: document.getElementById('tips-leads'),
  tipsTeam: document.getElementById('tips-team'),
  tipsConstruction: document.getElementById('tips-construction'),
  tipsLineage: document.getElementById('tips-lineage'),
  tipsLimits: document.getElementById('tips-limits'),
  tipsLinks: document.getElementById('tips-links'),
  tipsSummary: document.getElementById('tips-summary'),
  tipsActions: document.getElementById('tips-actions'),
  drawer: document.getElementById('drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  drawerClose: document.getElementById('drawer-close'),
  drawerTitle: document.getElementById('drawer-title'),
  drawerEn: document.getElementById('drawer-en'),
  drawerMeta: document.getElementById('drawer-meta'),
  drawerTags: document.getElementById('drawer-tags'),
  drawerSummary: document.getElementById('drawer-summary'),
  drawerPeople: document.getElementById('drawer-people'),
  drawerRefs: document.getElementById('drawer-refs'),
  demoStage: document.getElementById('demo-stage'),
  demoToolbar: document.getElementById('demo-toolbar'),
  demoCanvas: document.getElementById('demo-canvas'),
  demoNote: document.getElementById('demo-note'),
  noDemo: document.getElementById('no-demo'),
};

const coarsePointer = () =>
  window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth < 720;

function itemHasRunnableDemo(item) {
  return isRunnableDemo(item.demo);
}

function schoolColor(school) {
  const order = state.catalog.schoolsOrder || [];
  const i = Math.max(0, order.indexOf(school));
  return SCHOOL_COLORS[i % SCHOOL_COLORS.length];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTeam(team) {
  if (Array.isArray(team)) return team.join(' · ');
  return team || '—';
}

function filteredItems() {
  const q = state.searchQuery.trim().toLowerCase();
  return state.catalog.items.filter((it) => {
    if (state.demoOnly && !itemHasRunnableDemo(it)) return false;
    if (state.schoolSet.size && !it.schools.some((s) => state.schoolSet.has(s))) return false;
    if (state.mediumSet.size && !it.medium.some((m) => state.mediumSet.has(m))) return false;
    if (q) {
      const hay = [
        it.name, it.nameEn, it.summary,
        ...(it.schools || []),
        ...(it.people || []),
        ...(it.team || []),
        ...((it.leads || []).map((L) => L.name)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function buildSchoolFilters() {
  el.schoolFilters.innerHTML = '';
  for (const s of state.catalog.schoolsOrder) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = s;
    btn.dataset.school = s;
    btn.style.setProperty('--pill', schoolColor(s));
    btn.addEventListener('click', () => {
      if (state.schoolSet.has(s)) state.schoolSet.delete(s);
      else state.schoolSet.add(s);
      btn.classList.toggle('active', state.schoolSet.has(s));
      render();
    });
    el.schoolFilters.appendChild(btn);
  }
}

function wireMediumFilters() {
  el.mediumFilters.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.medium;
      if (state.mediumSet.has(m)) state.mediumSet.delete(m);
      else state.mediumSet.add(m);
      btn.classList.toggle('active', state.mediumSet.has(m));
      render();
    });
  });
}

function openFilters() {
  closeSearch();
  el.filterFloat.hidden = false;
  el.menuBtn.setAttribute('aria-expanded', 'true');
}

function closeFilters() {
  el.filterFloat.hidden = true;
  el.menuBtn.setAttribute('aria-expanded', 'false');
}

function toggleFilters() {
  if (el.filterFloat.hidden) openFilters();
  else closeFilters();
}

function openSearch() {
  closeFilters();
  el.searchFloat.hidden = false;
  el.searchInput.value = state.searchQuery;
  renderSearchResults(el.searchInput.value);
  requestAnimationFrame(() => el.searchInput.focus());
}

function closeSearch() {
  el.searchFloat.hidden = true;
}

function renderSearchResults(q) {
  const query = (q || '').trim().toLowerCase();
  if (!query) {
    el.searchResults.innerHTML = '<li class="search-empty">输入关键字过滤画廊</li>';
    return;
  }
  const hits = state.catalog.items
    .filter((it) => {
      const hay = [
        it.name, it.nameEn,
        ...(it.schools || []),
        ...(it.people || []),
        ...((it.leads || []).map((L) => L.name)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    })
    .slice(0, 12);
  if (!hits.length) {
    el.searchResults.innerHTML = '<li class="search-empty">无匹配</li>';
    return;
  }
  el.searchResults.innerHTML = hits
    .map(
      (it) =>
        `<li><button type="button" data-id="${escapeHtml(it.id)}">${escapeHtml(it.name)}<span class="sr-meta">${it.year} · ${escapeHtml((it.schools || []).slice(0, 2).join(' / '))}</span></button></li>`
    )
    .join('');
  el.searchResults.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      state.searchQuery = '';
      el.searchInput.value = '';
      closeSearch();
      render();
      const card = ensureCardInDom(`[data-id="${id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showTips(id, coarsePointer() ? 'sheet' : 'hover', card);
      }
    });
  });
}

function renderYearRail(items) {
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => a - b);
  el.yearRail.innerHTML = years
    .map((y) => `<div class="year-tick" data-year="${y}">${y}</div>`)
    .join('');
  el.yearRail.querySelectorAll('.year-tick').forEach((n) => {
    n.addEventListener('click', () => {
      const card = ensureCardInDom(`[data-year="${n.dataset.year}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

function cardHTML(it) {
  const runnable = itemHasRunnableDemo(it);
  const primary = it.schools[0] || '';
  const accent = schoolColor(primary);
  const schools = it.schools
    .slice(0, 3)
    .map(
      (s) =>
        `<span class="school-pill" style="--pill:${schoolColor(s)}">${escapeHtml(s)}</span>`
    )
    .join('');
  const cls = [
    'gcard',
    runnable ? 'has-demo' : '',
    it.personal ? 'personal' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const leadPhotos = (it.leads || [])
    .filter((L) => (L.photo || '').startsWith('assets/photos/'))
    .slice(0, 3)
    .map(
      (L) =>
        `<img class="gcard-lead-photo" src="${escapeHtml(L.photo.startsWith("/") ? L.photo : "/alife/" + L.photo)}" alt="" title="${escapeHtml(L.name)}" width="36" height="44" loading="lazy" decoding="async" />`
    )
    .join('');
  return `<button type="button" class="${cls}" data-id="${escapeHtml(it.id)}" data-year="${it.year}" data-demo="${runnable ? escapeHtml(it.demo) : ''}" style="--card-accent:${accent}">
    <div class="gcard-cover" aria-hidden="true">
      ${runnable ? `<img class="gcard-thumb" src="/alife/assets/previews/${escapeHtml(it.demo)}.png" alt="" loading="lazy" decoding="async" />` : ''}
      ${runnable ? `<canvas class="gcard-preview" width="320" height="180" data-demo="${escapeHtml(it.demo)}"></canvas>` : ''}
      ${runnable ? '<span class="gcard-demo-badge">可演示 · 点击进入</span>' : ''}
      ${leadPhotos ? `<div class="gcard-leads">${leadPhotos}</div>` : ''}
    </div>
    <div class="gcard-body">
      <span class="gcard-year">${it.year}${it.yearNote ? ' · ' + escapeHtml(it.yearNote) : ''}</span>
      <h3 class="gcard-name">${escapeHtml(it.name)}</h3>
      <span class="gcard-en">${escapeHtml(it.nameEn || '')}</span>
      <div class="gcard-schools">${schools}${
        it.personal ? '<span class="badge personal">本人实验</span>' : ''
      }</div>
    </div>
  </button>`;
}

function decadeOf(year) {
  return Math.floor(year / 10) * 10;
}

function ensureDecadeBand(decade, totalInDecade) {
  let section = el.gallery.querySelector(`.decade-band[data-decade="${decade}"]`);
  if (section) return section.querySelector('.gallery-grid');
  section = document.createElement('section');
  section.className = 'decade-band';
  section.dataset.decade = String(decade);
  section.innerHTML = `<div class="decade-label"><h2>${decade}s</h2><span data-decade-count>${totalInDecade}</span></div>
      <div class="gallery-grid"></div>`;
  const sentinel = el.gallery.querySelector('.gallery-sentinel');
  if (sentinel) el.gallery.insertBefore(section, sentinel);
  else el.gallery.appendChild(section);
  return section.querySelector('.gallery-grid');
}

function appendGalleryBatch(count = GALLERY_BATCH) {
  if (!state.galleryItems.length) return;
  const end = Math.min(state.galleryShown + count, state.galleryItems.length);
  if (state.galleryShown >= end) return;

  const decadeTotals = new Map();
  for (const it of state.galleryItems) {
    const d = decadeOf(it.year);
    decadeTotals.set(d, (decadeTotals.get(d) || 0) + 1);
  }

  const fragCards = [];
  for (let i = state.galleryShown; i < end; i++) {
    const it = state.galleryItems[i];
    const decade = decadeOf(it.year);
    const grid = ensureDecadeBand(decade, decadeTotals.get(decade));
    const wrap = document.createElement('div');
    wrap.innerHTML = cardHTML(it);
    const card = wrap.firstElementChild;
    grid.appendChild(card);
    fragCards.push(card);
  }
  state.galleryShown = end;
  fragCards.forEach((card) => wireCard(card));
  updateGallerySentinel();
}

function updateGallerySentinel() {
  let sentinel = el.gallery.querySelector('.gallery-sentinel');
  const more = state.galleryShown < state.galleryItems.length;
  if (more) {
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.className = 'gallery-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      el.gallery.appendChild(sentinel);
    }
    if (!state.galleryObserver) {
      state.galleryObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) appendGalleryBatch(GALLERY_BATCH);
        },
        { root: el.galleryScroll || null, rootMargin: '400px 0px', threshold: 0 }
      );
    }
    state.galleryObserver.disconnect();
    state.galleryObserver.observe(sentinel);
  } else if (sentinel) {
    if (state.galleryObserver) state.galleryObserver.unobserve(sentinel);
    sentinel.remove();
  }
}

function renderGallery(items) {
  if (state.galleryObserver) {
    state.galleryObserver.disconnect();
  }
  destroyAllPreviews();
  const sorted = [...items].sort(
    (a, b) => a.year - b.year || a.name.localeCompare(b.name, 'zh')
  );
  state.galleryItems = sorted;
  state.galleryShown = 0;
  el.gallery.innerHTML = '';
  if (!sorted.length) {
    el.gallery.innerHTML = '<p style="color:var(--muted);padding:1rem">无匹配条目</p>';
    return;
  }
  appendGalleryBatch(GALLERY_BATCH);
}

/** Expand batches until a card with id/year exists (year-rail / search jump). */
function ensureCardInDom(selector) {
  let card = el.gallery.querySelector(selector);
  if (card) return card;
  while (state.galleryShown < state.galleryItems.length) {
    appendGalleryBatch(GALLERY_BATCH);
    card = el.gallery.querySelector(selector);
    if (card) return card;
  }
  return null;
}

function wireCard(card) {
  const id = card.dataset.id;

  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || coarsePointer()) return;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => showTips(id, 'hover', card), 80);
  });
  card.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch' || coarsePointer()) return;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => {
      if (state.tipsMode === 'hover' && !el.tipsPanel.matches(':hover') && !card.matches(':hover')) {
        hideTips();
      }
    }, 160);
  });

  card.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' && !coarsePointer()) return;
    clearTimeout(state.longPressTimer);
    state.longPressTimer = setTimeout(() => {
      state.suppressClick = true;
      showTips(id, 'sheet', card);
    }, 420);
  });
  const cancelLong = () => clearTimeout(state.longPressTimer);
  card.addEventListener('pointerup', cancelLong);
  card.addEventListener('pointercancel', cancelLong);
  card.addEventListener('pointerleave', cancelLong);

  card.addEventListener('click', () => {
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const it = state.catalog.items.find((x) => x.id === id);
    if (it && itemHasRunnableDemo(it)) {
      openDrawer(id);
      return;
    }
    if (coarsePointer()) {
      showTips(id, 'sheet', card);
    } else {
      showTips(id, 'hover', card);
    }
  });

  observeCardPreview(card);
}

/* —— Lightweight in-card demo previews (viewport + cap) —— */
function ensurePreviewObserver() {
  if (state.previewObserver) return state.previewObserver;
  state.previewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const card = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
          startCardPreview(card);
        } else {
          stopCardPreview(card);
        }
      }
    },
    { root: el.galleryScroll || null, rootMargin: '80px 0px', threshold: [0, 0.15, 0.4] }
  );
  return state.previewObserver;
}

function observeCardPreview(card) {
  if (!card.classList.contains('has-demo')) return;
  ensurePreviewObserver().observe(card);
}

function stopCardPreview(card) {
  const id = card.dataset.id;
  const handle = state.previewDemos.get(id);
  if (!handle) return;
  try { handle.destroy(); } catch (_) {}
  state.previewDemos.delete(id);
  const canvas = card.querySelector('.gcard-preview');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

async function startCardPreview(card) {
  const id = card.dataset.id;
  const demoId = card.dataset.demo;
  if (!id || !demoId || state.previewDemos.has(id)) return;
  if (state.previewDemos.size >= state.previewCap) {
    // evict farthest / oldest
    const first = state.previewDemos.keys().next().value;
    const oldCard = el.gallery.querySelector(`.gcard[data-id="${CSS.escape(first)}"]`);
    if (oldCard) stopCardPreview(oldCard);
    else {
      try { state.previewDemos.get(first).destroy(); } catch (_) {}
      state.previewDemos.delete(first);
    }
  }
  const canvas = card.querySelector('.gcard-preview');
  if (!canvas) return;
  // mark pending so we don't double-start
  const placeholder = { destroy() {} };
  state.previewDemos.set(id, placeholder);
  try {
    const factory = await loadDemoFactory(demoId);
    if (!factory || !card.isConnected || !state.previewDemos.has(id)) return;
    // still intersecting?
    const rect = card.getBoundingClientRect();
    const root = el.galleryScroll?.getBoundingClientRect();
    if (root && (rect.bottom < root.top - 40 || rect.top > root.bottom + 40)) {
      state.previewDemos.delete(id);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(160, Math.round(canvas.clientWidth || 240));
    const h = Math.max(90, Math.round(canvas.clientHeight || 140));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ghostToolbar = document.createElement('div');
    ghostToolbar.hidden = true;
    const demo = factory(canvas, ghostToolbar);
    canvas.classList.add('is-live');
    state.previewDemos.set(id, {
      destroy() {
        try { demo.destroy(); } catch (_) {}
        canvas.classList.remove('is-live');
        ghostToolbar.remove();
      },
    });
  } catch (err) {
    console.warn('preview failed', demoId, err);
    state.previewDemos.delete(id);
  }
}

function destroyAllPreviews() {
  for (const id of [...state.previewDemos.keys()]) {
    const card = el.gallery.querySelector(`.gcard[data-id="${CSS.escape(id)}"]`);
    if (card) stopCardPreview(card);
    else {
      try { state.previewDemos.get(id)?.destroy(); } catch (_) {}
      state.previewDemos.delete(id);
    }
  }
}

function fillTips(it) {
  el.tipsMeta.textContent = `${it.year}${it.yearNote ? '（' + it.yearNote + '）' : ''}`;
  el.tipsTitle.textContent = it.name;
  el.tipsEn.textContent = it.nameEn || '';
  el.tipsTags.innerHTML = [
    ...it.schools.map((s) => `<span class="badge" style="color:${schoolColor(s)};border-color:color-mix(in srgb, ${schoolColor(s)} 55%, var(--line))">${escapeHtml(s)}</span>`),
    ...it.medium.map((m) => `<span class="badge medium">${m}</span>`),
    it.personal ? `<span class="badge personal">本人实验</span>` : '',
    itemHasRunnableDemo(it) ? `<span class="badge demo">可演示</span>` : '',
  ].join('');

  const leads = it.leads || [];
  el.tipsLeads.innerHTML = leads
    .map((L) => {
      const note = L.photoNote
        ? `<span class="lead-note">${escapeHtml(L.photoNote)}</span>`
        : '';
      const href = L.website || L.scholar || '';
      const clickable = Boolean(href);
      const title = clickable
        ? (L.website ? '打开个人/实验室主页' : '打开谷歌学术主页')
        : '暂无已核实主页';
      const tag = clickable ? 'button' : 'div';
      const attrs = clickable
        ? `type="button" data-href="${escapeHtml(href)}" title="${escapeHtml(title)}"`
        : `title="${escapeHtml(title)}" aria-disabled="true"`;
      const photoRaw = L.photo || L.avatar || '';
      // data: 开头的是 catalog 里自带的兜底头像，加了 /alife/ 前缀反而会 404。
      const photo = photoRaw && !photoRaw.startsWith('http') && !photoRaw.startsWith('/') && !photoRaw.startsWith('data:')
        ? '/alife/' + photoRaw
        : photoRaw;
      return `<${tag} class="lead${clickable ? ' is-link' : ' is-static'}" ${attrs}>
        <img class="lead-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(L.name)}" width="80" height="100" loading="lazy" decoding="async" />
        <div class="lead-text">
          <span class="lead-name">${escapeHtml(L.name)}</span>
          <span class="lead-role">${escapeHtml(L.role || '')}</span>
          ${note}
        </div>
      </${tag}>`;
    })
    .join('');

  el.tipsLeads.querySelectorAll('.lead.is-link').forEach((node) => {
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      const href = node.getAttribute('data-href');
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    });
  });

  el.tipsTeam.textContent = formatTeam(it.team);
  el.tipsConstruction.textContent = it.construction || '—';
  el.tipsLineage.textContent = it.lineage || '—';
  el.tipsLimits.textContent = it.limits || '—';

  const links = [...(it.links || [])];
  for (const L of leads) {
    if (L.website) links.push({ label: `${L.name} · 个人/实验室`, url: L.website });
    if (L.scholar) links.push({ label: `${L.name} · 谷歌学术`, url: L.scholar });
  }
  const seen = new Set();
  const uniq = [];
  for (const lk of links) {
    if (!lk?.url || seen.has(lk.url)) continue;
    seen.add(lk.url);
    uniq.push(lk);
  }
  if (!uniq.length) {
    el.tipsLinks.innerHTML = '<li class="empty">暂无可靠公开链接</li>';
  } else {
    el.tipsLinks.innerHTML = uniq
      .map(
        (lk) =>
          `<li><a href="${escapeHtml(lk.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lk.label)}</a></li>`
      )
      .join('');
  }
  el.tipsSummary.textContent = it.summary || '';

  const runnable = itemHasRunnableDemo(it);
  el.tipsActions.innerHTML = '';
  if (runnable) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn primary';
    btn.textContent = '演示';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideTips();
      openDrawer(it.id);
    });
    el.tipsActions.appendChild(btn);
  }
}

function positionTipsNear(card) {
  const panel = el.tipsPanel;
  const margin = 12;
  const rect = card.getBoundingClientRect();
  const pw = panel.offsetWidth || 360;
  const ph = panel.offsetHeight || 320;

  let left = rect.right + 10;
  if (left + pw > window.innerWidth - margin) {
    left = rect.left - pw - 10;
  }
  if (left < margin) left = margin;

  let top = rect.top;
  if (top + ph > window.innerHeight - margin) {
    top = window.innerHeight - ph - margin;
  }
  if (top < margin) top = margin;

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function showTips(id, mode, card) {
  const it = state.catalog.items.find((x) => x.id === id);
  if (!it) return;
  state.tipsItemId = id;
  state.tipsMode = mode;
  fillTips(it);
  el.tips.hidden = false;
  el.gallery.querySelectorAll('.gcard.is-active').forEach((c) => c.classList.remove('is-active'));
  if (card) card.classList.add('is-active');

  if (mode === 'sheet' || coarsePointer()) {
    el.tips.classList.add('is-sheet');
    el.tipsBackdrop.hidden = false;
    el.tipsPanel.style.left = '';
    el.tipsPanel.style.top = '';
  } else {
    el.tips.classList.remove('is-sheet');
    el.tipsBackdrop.hidden = true;
    requestAnimationFrame(() => positionTipsNear(card));
  }
}

function hideTips() {
  state.tipsItemId = null;
  state.tipsMode = null;
  el.tips.hidden = true;
  el.tipsBackdrop.hidden = true;
  el.tips.classList.remove('is-sheet');
  el.gallery.querySelectorAll('.gcard.is-active').forEach((c) => c.classList.remove('is-active'));
}

el.tipsPanel.addEventListener('pointerenter', () => clearTimeout(state.hoverTimer));
el.tipsPanel.addEventListener('pointerleave', () => {
  if (state.tipsMode === 'hover' && !coarsePointer()) {
    state.hoverTimer = setTimeout(hideTips, 120);
  }
});
el.tipsClose.addEventListener('click', hideTips);
el.tipsBackdrop.addEventListener('click', hideTips);

function render() {
  const items = filteredItems();
  renderYearRail(items);
  renderGallery(items);
  const demoCount = items.filter(itemHasRunnableDemo).length;
  el.stats.textContent = `${items.length} / ${state.catalog.items.length} · 演示 ${demoCount}`;
  if (state.tipsItemId && !items.some((i) => i.id === state.tipsItemId)) hideTips();
}

function destroyDemo() {
  if (state.activeDemo) {
    try {
      state.activeDemo.destroy();
    } catch (_) {}
    state.activeDemo = null;
  }
  el.demoStage.classList.remove('is-loading');
}

function sizeDemoCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = el.demoStage;
  const cssW = Math.max(320, stage.clientWidth || window.innerWidth);
  const cssH = Math.max(240, stage.clientHeight || window.innerHeight - 48);
  el.demoCanvas.width = Math.round(cssW * dpr);
  el.demoCanvas.height = Math.round(cssH * dpr);
  el.demoCanvas.style.width = '100%';
  el.demoCanvas.style.height = '100%';
}

async function startDemoForItem(it, gen) {
  el.demoStage.hidden = false;
  el.noDemo.hidden = true;
  el.demoToolbar.innerHTML = '';
  el.demoNote.textContent = '加载演示…';
  el.demoStage.classList.add('is-loading');
  sizeDemoCanvas();
  try {
    const factory = await loadDemoFactory(it.demo);
    if (gen !== state.demoLoadGen || el.drawer.hidden) return;
    if (!factory) {
      el.demoStage.classList.remove('is-loading');
      el.demoNote.textContent = '演示模块不可用';
      return;
    }
    destroyDemo();
    if (gen !== state.demoLoadGen || el.drawer.hidden) return;
    sizeDemoCanvas();
    state.activeDemo = factory(el.demoCanvas, el.demoToolbar);
    state.drawerDemoId = it.demo;
    el.demoNote.textContent =
      (state.activeDemo && state.activeDemo.note) ||
      it.demoHint ||
      DEMO_LABELS[it.demo] ||
      '';
  } catch (err) {
    console.error(err);
    if (gen === state.demoLoadGen) {
      el.demoNote.textContent = '演示加载失败';
    }
  } finally {
    if (gen === state.demoLoadGen) {
      el.demoStage.classList.remove('is-loading');
    }
  }
}

async function openDrawer(id) {
  const it = state.catalog.items.find((x) => x.id === id);
  if (!it) return;
  const gen = ++state.demoLoadGen;
  destroyDemo();
  destroyAllPreviews();
  state.drawerItemId = id;
  state.drawerDemoId = null;
  hideTips();
  closeFilters();
  closeSearch();

  el.drawer.hidden = false;
  document.body.style.overflow = 'hidden';
  el.drawerTitle.textContent = it.name;
  el.drawerEn.textContent = it.nameEn || '';
  el.drawerMeta.textContent = `${it.year}${it.yearNote ? '（' + it.yearNote + '）' : ''}`;
  // Keep nodes for selfcheck / a11y but hide verbose chrome in immersive mode
  el.drawerTags.innerHTML = [
    ...it.schools.map((s) => `<span class="badge">${escapeHtml(s)}</span>`),
    ...it.medium.map((m) => `<span class="badge medium">${m}</span>`),
  ].join('');
  el.drawerSummary.textContent = it.summary || '';
  el.drawerPeople.textContent = (it.people || []).length
    ? '人物：' + it.people.join(' · ')
    : '';
  el.drawerRefs.textContent = (it.refs || []).length
    ? '参考：' + it.refs.join('；')
    : '';

  const runnable = itemHasRunnableDemo(it);
  if (runnable) {
    await startDemoForItem(it, gen);
  } else {
    el.demoStage.hidden = true;
    el.noDemo.hidden = false;
    el.demoStage.classList.remove('is-loading');
    if (it.demo && it.demo.endsWith('-link')) {
      el.noDemo.textContent =
        '本人实验：完整交互在独立项目中；本展览仅作史条目卡片。' +
        (it.demoHint ? ' ' + it.demoHint : '');
    } else {
      el.noDemo.textContent =
        '本条目无内嵌交互演示。' +
        (it.demoHint ? '（' + it.demoHint + '）' : '');
    }
  }
}

function closeDrawer() {
  state.demoLoadGen += 1;
  destroyDemo();
  state.drawerItemId = null;
  state.drawerDemoId = null;
  el.drawer.hidden = true;
  document.body.style.overflow = '';
  // resume in-view card previews
  requestAnimationFrame(() => {
    el.gallery.querySelectorAll('.gcard.has-demo').forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) startCardPreview(card);
    });
  });
}

/** Page Visibility: stop rAF when tab hidden; recreate when visible again. */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    destroyDemo();
    destroyAllPreviews();
    return;
  }
  if (el.drawer.hidden || !state.drawerItemId) return;
  const it = state.catalog?.items?.find((x) => x.id === state.drawerItemId);
  if (!it || !itemHasRunnableDemo(it)) return;
  const gen = ++state.demoLoadGen;
  startDemoForItem(it, gen);
});

el.drawerBackdrop.addEventListener('click', closeDrawer);
el.drawerClose.addEventListener('click', closeDrawer);

el.menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFilters();
});
el.filterClose.addEventListener('click', closeFilters);
el.filterFloat.addEventListener('click', (e) => {
  if (e.target === el.filterFloat) closeFilters();
});

el.searchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (el.searchFloat.hidden) openSearch();
  else closeSearch();
});
el.searchFloat.addEventListener('click', (e) => {
  if (e.target === el.searchFloat) closeSearch();
});
el.searchInput.addEventListener('input', () => {
  state.searchQuery = el.searchInput.value;
  renderSearchResults(state.searchQuery);
  // live-filter gallery while typing in search panel
  render();
});

el.demoOnly.addEventListener('change', () => {
  state.demoOnly = el.demoOnly.checked;
  render();
});
el.reset.addEventListener('click', () => {
  state.schoolSet.clear();
  state.mediumSet.clear();
  state.demoOnly = false;
  state.searchQuery = '';
  el.demoOnly.checked = false;
  el.searchInput.value = '';
  el.schoolFilters.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  el.mediumFilters.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  render();
});

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

  if (e.key === 'Escape') {
    if (!el.drawer.hidden) closeDrawer();
    else if (!el.searchFloat.hidden) closeSearch();
    else if (!el.filterFloat.hidden) closeFilters();
    else if (!el.tips.hidden) hideTips();
    return;
  }

  if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.key === '/' || e.key === 'f') {
      e.preventDefault();
      openSearch();
    } else if (e.key === '.' || e.key === 'm') {
      e.preventDefault();
      toggleFilters();
    }
  }
});

window.addEventListener('resize', () => {
  if (state.tipsMode === 'hover' && state.tipsItemId) {
    const card = el.gallery.querySelector(`[data-id="${state.tipsItemId}"]`);
    if (card) positionTipsNear(card);
  }
  if (!el.drawer.hidden && state.activeDemo) {
    // keep canvas fullscreen on resize without restarting demo mid-frame
    sizeDemoCanvas();
  }
});

async function main() {
  const res = await fetch('/alife/data/catalog.json');
  state.catalog = await res.json();
  for (const it of state.catalog.items) {
    if (it.id === 'lenia' && (!it.demo || it.demo === 'lenia')) it.demo = 'lenia-lite';
    if (it.id === 'tierra' && (!it.demo || it.demo === 'tierra-lite')) it.demo = 'tierra-lite';
    if (it.id === 'wolfram-ca') it.demo = 'eca';
    if (it.id === 'conway-life') it.demo = 'life';
    if (it.id === 'reynolds-path') it.demo = 'boids';
    if (it.id === 'boids') it.demo = 'boids';
  }
  buildSchoolFilters();
  wireMediumFilters();
  render();
}

main().catch((err) => {
  console.error(err);
  el.stats.textContent = '加载失败';
});
