/**
 * 诗经长卷 – interactive panoramic scroll viewer (clay panorama + scene SFX)
 */
(function () {
  "use strict";

  const worldMeta = window.SHIJING_WORLD || {};
  const WORLD_W = worldMeta.W || 46308;
  const WORLD_H = worldMeta.H || 941;
  const SECTION_X = window.SHIJING_SECTION_X || {
    国风: 0.02,
    小雅: 0.96,
    大雅: 0.98,
    颂: 0.98,
  };

  const poems = window.SHIJING_POEMS || [];
  const hotspots = window.SHIJING_HOTSPOTS || [];
  const featured = new Set(window.SHIJING_FEATURED || []);
  const poemById = Object.create(null);
  poems.forEach((p, i) => {
    poemById[p.id] = p;
    p._index = i;
  });

  let currentIndex = 0;
  let listFilter = "all";

  const cam = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.15,
    maxScale: 5.0,
  };

  const viewport = document.getElementById("viewport");
  const world = document.getElementById("world");
  const hotspotsEl = document.getElementById("hotspots");
  const landscapeEl = document.getElementById("landscape");

  // ---------- Landscape ----------
  if (window.renderLandscape) {
    window.renderLandscape(landscapeEl);
  }
  world.style.width = WORLD_W + "px";
  world.style.height = WORLD_H + "px";

  // ---------- Scene SFX (Web Audio) ----------
  const SFX_BASE = "assets/sfx/";
  const SFX_KEYS = [
    "water",
    "birds",
    "wind",
    "rain",
    "drums",
    "farm",
    "night",
    "banquet",
    "ambient",
  ];
  const MUTE_KEY = "shijing-audio-muted";
  let audioMuted = localStorage.getItem(MUTE_KEY) === "1";
  let audioCtx = null;
  const bufferCache = Object.create(null);
  let currentSource = null;
  let currentGain = null;

  function ensureAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function loadBuffer(key) {
    if (bufferCache[key]) return bufferCache[key];
    bufferCache[key] = fetch(SFX_BASE + key + ".wav")
      .then(function (r) {
        return r.arrayBuffer();
      })
      .then(function (ab) {
        const ctx = ensureAudioCtx();
        if (!ctx) return null;
        return ctx.decodeAudioData(ab.slice(0));
      })
      .catch(function () {
        return null;
      });
    return bufferCache[key];
  }

  function stopSfx() {
    try {
      if (currentSource) {
        currentSource.stop(0);
      }
    } catch (e) {}
    currentSource = null;
    currentGain = null;
  }

  function themeForHotspot(h) {
    const poem = poemById[h.poemId];
    const lineBlob = [
      h.line || "",
      h.title || "",
      poem ? poem.famousLine || "" : "",
      poem ? (poem.famousLines || []).join("") : "",
      poem ? poem.fullText || "" : "",
    ].join("\n");
    const sub = poem ? poem.subsection || "" : "";

    if (/雨|霖|雪/.test(lineBlob)) return "rain";
    if (/鼓|钟鼓|车|戍|军|师|征|战|戎|甲兵|无衣|干城|武夫|猎|狩|乘马/.test(lineBlob))
      return "drums";
    if (/月出|夜|宵|夙夜|蟋蟀|白露|昧旦/.test(lineBlob) || /月/.test(h.title || ""))
      return "night";
    if (/宴|饮酒|鹿鸣|笙|琴瑟|嘉宾|燕乐|钟鼓乐之/.test(lineBlob)) return "banquet";
    if (/桑|田|农|稼|穑|禾|麦|黍|稷|七月/.test(lineBlob)) return "farm";
    if (/雎鸠|黄鸟|鸟|鸠|燕|雀|鸿|雁|雉|于飞|其鸣喈|关关/.test(lineBlob)) return "birds";
    if (/飘风|大风|谷风|终风|凯风|风雨|风其|扬风|苇|蒹葭|芦荻|杨柳依依/.test(lineBlob))
      return "wind";
    if (/河|水|洲|江|淮|汉广|泉源|流之|泳|舟|楫|涟|溱|洧|淇|泾|渭|在河/.test(lineBlob))
      return "water";
    if (/豳|魏|唐/.test(sub)) return "farm";
    if (sub === "秦风") return "drums";
    return "ambient";
  }

  function playSfx(key) {
    if (audioMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    stopSfx();
    const k = SFX_KEYS.indexOf(key) >= 0 ? key : "ambient";
    loadBuffer(k).then(function (buf) {
      if (!buf || audioMuted) return;
      stopSfx();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = 0.55;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.onended = function () {
        if (currentSource === src) {
          currentSource = null;
          currentGain = null;
        }
      };
      currentSource = src;
      currentGain = gain;
      try {
        src.start(0);
      } catch (e) {}
    });
  }

  function syncMuteButton() {
    const btn = document.getElementById("btn-mute");
    if (!btn) return;
    btn.classList.toggle("muted", audioMuted);
    btn.setAttribute("aria-pressed", audioMuted ? "true" : "false");
    btn.title = audioMuted ? "开启音效" : "静音";
    btn.textContent = audioMuted ? "音效关" : "音效";
  }

  const muteBtn = document.getElementById("btn-mute");
  if (muteBtn) {
    syncMuteButton();
    muteBtn.addEventListener("click", function () {
      audioMuted = !audioMuted;
      localStorage.setItem(MUTE_KEY, audioMuted ? "1" : "0");
      if (audioMuted) stopSfx();
      syncMuteButton();
    });
  }

  // Preload common sfx quietly
  SFX_KEYS.forEach(function (k) {
    loadBuffer(k);
  });

  // ---------- Hotspots ----------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openPoemById(poemId) {
    const p = poemById[poemId];
    if (!p) return;
    openPoem(p._index);
  }

  function renderHotspots() {
    hotspotsEl.innerHTML = "";
    hotspots.forEach(function (h, hi) {
      const btn = document.createElement("button");
      btn.className = "hotspot";
      if (featured.has(h.title)) btn.classList.add("featured");
      btn.type = "button";
      btn.style.left = (h.x / 100) * WORLD_W + "px";
      btn.style.top = (h.y / 100) * WORLD_H + "px";
      btn.dataset.poemId = h.poemId;
      btn.dataset.hi = String(hi);
      btn.setAttribute("aria-label", h.title + " " + h.line);
      btn.innerHTML =
        '<span class="hotspot-dot"></span>' +
        '<span class="hotspot-label">「' +
        escapeHtml(h.line) +
        "」</span>";

      const openFromHotspot = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPoemById(h.poemId);
      };
      btn.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      btn.addEventListener("pointerup", openFromHotspot);
      btn.addEventListener("click", openFromHotspot);

      btn.addEventListener("pointerenter", function () {
        playSfx(themeForHotspot(h));
      });
      btn.addEventListener("pointerleave", function () {
        stopSfx();
      });
      btn.addEventListener("mouseenter", function () {
        playSfx(themeForHotspot(h));
      });
      btn.addEventListener("mouseleave", function () {
        stopSfx();
      });

      hotspotsEl.appendChild(btn);
    });
    const onScrollCount = poems.filter(function (p) {
      return p.onScroll;
    }).length;
    document.getElementById("status-count").textContent =
      "名句 " + hotspots.length + " · 诗篇 " + poems.length + "（卷上 " + onScrollCount + "）";
  }

  // ---------- Camera ----------
  function applyTransform() {
    world.style.transform =
      "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.scale + ")";
    updateMinimap();
    updateStatusSection();
    updateJump();
  }

  function clampCamera() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = WORLD_W * cam.scale;
    const sh = WORLD_H * cam.scale;

    if (sw <= vw) {
      cam.x = (vw - sw) / 2;
    } else {
      cam.x = Math.min(0, Math.max(vw - sw, cam.x));
    }
    if (sh <= vh) {
      cam.y = (vh - sh) / 2;
    } else {
      cam.y = Math.min(0, Math.max(vh - sh, cam.y));
    }
  }

  function fitInitial() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    cam.scale = Math.min(vw / (WORLD_W * 0.18), vh / WORLD_H) * 0.95;
    cam.scale = Math.max(cam.minScale, Math.min(cam.maxScale, cam.scale));
    cam.x = 0;
    cam.y = (vh - WORLD_H * cam.scale) / 2;
    clampCamera();
    applyTransform();
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewport.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const wx = (mx - cam.x) / cam.scale;
    const wy = (my - cam.y) / cam.scale;
    const next = Math.max(cam.minScale, Math.min(cam.maxScale, cam.scale * factor));
    cam.scale = next;
    cam.x = mx - wx * cam.scale;
    cam.y = my - wy * cam.scale;
    clampCamera();
    applyTransform();
  }

  function panToPoem(p, open) {
    if (p && p.onScroll && p.x != null) {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const targetScale = Math.max(0.5, Math.min(1.2, cam.scale));
      cam.scale = targetScale;
      const px = (p.x / 100) * WORLD_W * cam.scale;
      const py = ((p.y != null ? p.y : 50) / 100) * WORLD_H * cam.scale;
      cam.x = vw / 2 - px;
      cam.y = vh / 2 - py;
      clampCamera();
      applyTransform();
    }
    if (open && p) {
      openPoem(p._index);
    }
  }

  function jumpSection(name) {
    // Quick locate only — same continuous scroll, no section "pages".
    let target = null;
    for (let i = 0; i < poems.length; i++) {
      const p = poems[i];
      if (!p.onScroll || p.x == null) continue;
      if (p.section === name) {
        target = p;
        break;
      }
    }
    if (!target && SECTION_X[name] != null) {
      target = { x: SECTION_X[name] * 100 };
    }
    if (!target) return;
    const vw = viewport.clientWidth;
    const ratio = (target.x || 0) / 100;
    cam.x = -ratio * WORLD_W * cam.scale + vw * 0.15;
    clampCamera();
    applyTransform();
  }

  function updateStatusSection() {
    const vw = viewport.clientWidth;
    const centerWorldX = (-cam.x + vw / 2) / cam.scale;
    const pct = (centerWorldX / WORLD_W) * 100;
    let nearest = null;
    let best = Infinity;
    for (let i = 0; i < poems.length; i++) {
      const p = poems[i];
      if (!p.onScroll || p.x == null) continue;
      const d = Math.abs(p.x - pct);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    const label = nearest
      ? nearest.section + " · " + nearest.subsection
      : "连续长卷";
    document.getElementById("status-section").textContent = label;
  }

  function updateJump() {
    const vw = viewport.clientWidth;
    const centerWorldX = (-cam.x + vw / 2) / cam.scale;
    const pct = (centerWorldX / WORLD_W) * 100;
    let nearest = null;
    let best = Infinity;
    for (let i = 0; i < poems.length; i++) {
      const p = poems[i];
      if (!p.onScroll || p.x == null) continue;
      const d = Math.abs(p.x - pct);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    const sec = nearest ? nearest.section : "国风";
    document.querySelectorAll(".jump-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.section === sec);
    });
  }

  // ---------- Pointer / wheel / touch ----------
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointers = new Map();
  let lastPinchDist = 0;
  let panMoved = false;
  const DRAG_THRESHOLD = 6;

  function isInteractiveTarget(el) {
    return !!(
      el &&
      el.closest &&
      el.closest(
        ".hotspot, .minimap, button, a, input, .drawer, .modal, .search-wrap, .top-bar, .jump-rail"
      )
    );
  }

  viewport.addEventListener("pointerdown", function (e) {
    if (isInteractiveTarget(e.target)) return;
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    panMoved = false;
    if (pointers.size === 1) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      viewport.classList.add("dragging");
    } else if (pointers.size === 2) {
      dragging = false;
      const pts = Array.from(pointers.values());
      lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  });

  viewport.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDist > 0) {
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        zoomAt(midX, midY, dist / lastPinchDist);
      }
      lastPinchDist = dist;
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (!panMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    panMoved = true;
    lastX = e.clientX;
    lastY = e.clientY;
    cam.x += dx;
    cam.y += dy;
    clampCamera();
    applyTransform();
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = 0;
    if (pointers.size === 0) {
      dragging = false;
      viewport.classList.remove("dragging");
    }
  }
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomAt(e.clientX, e.clientY, factor);
    },
    { passive: false }
  );

  // ---------- Modal ----------
  const SCENE_DETAILS = {
    关雎: "assets/details/guanju.png",
    桃夭: "assets/details/taoyao.png",
    静女: "assets/details/jingnv.png",
    蒹葭: "assets/details/jianjia.png",
    七月: "assets/details/qiyue.png",
    氓: "assets/details/meng.png",
    子衿: "assets/details/zijin.png",
    采薇: "assets/details/caiwei.png",
  };

  const modal = document.getElementById("modal");
  function openPoem(idx) {
    if (idx < 0 || idx >= poems.length) return;
    currentIndex = idx;
    const p = poems[idx];
    document.getElementById("modal-path").textContent =
      p.section + " · " + p.subsection + " · " + p.title;
    document.getElementById("modal-title").textContent = p.title;
    document.getElementById("modal-famous").textContent = "「" + p.famousLine + "」";
    document.getElementById("modal-text").textContent = p.fullText;
    const sceneEl = document.getElementById("modal-scene");
    const sceneSrc = SCENE_DETAILS[p.title];
    if (sceneEl) {
      if (sceneSrc) {
        sceneEl.src = sceneSrc + "?v=29";
        sceneEl.alt = p.title + " · 场景特写";
        sceneEl.hidden = false;
      } else {
        sceneEl.removeAttribute("src");
        sceneEl.alt = "";
        sceneEl.hidden = true;
      }
    }
    modal.hidden = false;
  }
  function closeModal() {
    modal.hidden = true;
  }
  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });
  document.getElementById("modal-prev").addEventListener("click", function () {
    openPoem((currentIndex - 1 + poems.length) % poems.length);
  });
  document.getElementById("modal-next").addEventListener("click", function () {
    openPoem((currentIndex + 1) % poems.length);
  });
  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft")
      openPoem((currentIndex - 1 + poems.length) % poems.length);
    if (e.key === "ArrowRight") openPoem((currentIndex + 1) % poems.length);
  });

  // ---------- Search ----------
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  function doSearch(q) {
    q = q.trim();
    if (!q) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }
    const hits = poems
      .filter(function (p) {
        return (
          p.title.includes(q) ||
          (p.famousLine && p.famousLine.includes(q)) ||
          (p.famousLines && p.famousLines.some(function (l) {
            return l.includes(q);
          })) ||
          p.subsection.includes(q) ||
          p.fullText.includes(q)
        );
      })
      .slice(0, 20);
    if (!hits.length) {
      searchResults.innerHTML =
        '<div class="search-item" style="cursor:default">未觅得相关诗篇</div>';
      searchResults.hidden = false;
      return;
    }
    searchResults.innerHTML = hits
      .map(function (p) {
        return (
          '<button type="button" class="search-item" data-idx="' +
          p._index +
          '">' +
          '<div class="si-title">' +
          escapeHtml(p.title) +
          (p.onScroll ? "" : " · 未绘") +
          "</div>" +
          '<div class="si-path">' +
          escapeHtml(p.section + " · " + p.subsection) +
          "</div>" +
          '<div class="si-line">「' +
          escapeHtml(p.famousLine) +
          "」</div>" +
          "</button>"
        );
      })
      .join("");
    searchResults.hidden = false;
  }

  searchInput.addEventListener("input", function () {
    doSearch(searchInput.value);
  });
  searchInput.addEventListener("focus", function () {
    if (searchInput.value.trim()) doSearch(searchInput.value);
  });
  searchResults.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-idx]");
    if (!btn) return;
    const idx = +btn.dataset.idx;
    searchResults.hidden = true;
    searchInput.blur();
    panToPoem(poems[idx], true);
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-wrap")) searchResults.hidden = true;
  });

  // ---------- Section rail ----------
  document.getElementById("jump-rail").addEventListener("click", function (e) {
    const btn = e.target.closest(".jump-btn");
    if (!btn) return;
    jumpSection(btn.dataset.section);
  });

  // ---------- List drawer ----------
  const drawer = document.getElementById("list-drawer");
  const poemList = document.getElementById("poem-list");

  function renderList() {
    const items =
      listFilter === "all" ? poems : poems.filter(function (p) {
        return p.section === listFilter;
      });
    poemList.innerHTML = items
      .map(function (p) {
        return (
          "<li><button type='button' data-idx='" +
          p._index +
          "'>" +
          "<div class='pl-title'>" +
          escapeHtml(p.title) +
          (p.onScroll ? "" : " · 未绘") +
          "</div>" +
          "<div class='pl-path'>" +
          escapeHtml(p.section + " · " + p.subsection) +
          "</div>" +
          "<div class='pl-line'>「" +
          escapeHtml(p.famousLine) +
          "」</div>" +
          "</button></li>"
        );
      })
      .join("");
  }

  document.getElementById("btn-list").addEventListener("click", function () {
    renderList();
    drawer.hidden = false;
  });
  drawer.querySelectorAll("[data-close-drawer]").forEach(function (el) {
    el.addEventListener("click", function () {
      drawer.hidden = true;
    });
  });
  drawer.querySelector(".drawer-filters").addEventListener("click", function (e) {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    listFilter = btn.dataset.filter;
    drawer.querySelectorAll(".filter-btn").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    renderList();
  });
  poemList.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-idx]");
    if (!btn) return;
    drawer.hidden = true;
    panToPoem(poems[+btn.dataset.idx], true);
  });

  // ---------- Help ----------
  const helpModal = document.getElementById("help-modal");
  document.getElementById("btn-help").addEventListener("click", function () {
    helpModal.hidden = false;
  });
  helpModal.querySelectorAll("[data-close-help]").forEach(function (el) {
    el.addEventListener("click", function () {
      helpModal.hidden = true;
    });
  });

  // ---------- Minimap ----------
  const mmCanvas = document.getElementById("minimap-canvas");
  const mmVp = document.getElementById("minimap-viewport");
  const mm = document.getElementById("minimap");

  function drawMinimap() {
    const ctx = mmCanvas.getContext("2d");
    const w = mmCanvas.width;
    const h = mmCanvas.height;
    // clay-ish tones matching panorama
    ctx.fillStyle = "#8a9a78";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6a8498";
    ctx.fillRect(0, 0, w, h * 0.38);
    ctx.fillStyle = "#7a8e5a";
    ctx.fillRect(0, h * 0.38, w, h * 0.62);
    ctx.strokeStyle = "rgba(90,140,160,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.quadraticCurveTo(w * 0.35, h * 0.55, w * 0.7, h * 0.72);
    ctx.quadraticCurveTo(w * 0.85, h * 0.8, w, h * 0.65);
    ctx.stroke();
    ctx.fillStyle = "rgba(196,160,80,0.8)";
    hotspots.forEach(function (hs) {
      ctx.beginPath();
      ctx.arc((hs.x / 100) * w, (hs.y / 100) * h, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updateMinimap() {
    const vw = viewport.clientWidth;
    const worldVisible = vw / cam.scale;
    const ratio = worldVisible / WORLD_W;
    const leftRatio = -cam.x / cam.scale / WORLD_W;
    mmVp.style.width = Math.min(100, ratio * 100) + "%";
    mmVp.style.left = Math.max(0, leftRatio * 100) + "%";
  }

  mm.addEventListener("click", function (e) {
    const rect = mm.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const vw = viewport.clientWidth;
    cam.x = -ratio * WORLD_W * cam.scale + vw / 2;
    clampCamera();
    applyTransform();
  });

  // ---------- Boot ----------
  renderHotspots();
  drawMinimap();
  fitInitial();
  window.addEventListener("resize", function () {
    clampCamera();
    applyTransform();
  });

  const guanju = poems.find(function (p) {
    return p.title === "关雎" && p.subsection === "周南";
  });
  if (guanju) {
    setTimeout(function () {
      panToPoem(guanju, false);
    }, 100);
  }

  // Expose for debug
  window.SHIJING_APP = {
    WORLD_W: WORLD_W,
    WORLD_H: WORLD_H,
    hotspotCount: hotspots.length,
    themeFor: themeForHotspotClean,
  };
})();
