/**
 * 诗经长卷 – progressive clay panorama
 * Low-res preview first, then seamless strips near the viewport.
 */
(function () {
  "use strict";

  const meta = window.SHIJING_WORLD || {};
  const W = meta.W || 43257;
  const H = meta.H || 941;
  const V = "46";
  const FULL = "assets/scroll/panorama.jpg?v=" + V;
  const PREVIEW = "assets/scroll/panorama-preview.jpg?v=" + V;
  const MANIFEST = "assets/scroll/strips.json?v=" + V;

  window.SHIJING_LANDSCAPE = {
    W: W,
    H: H,
    mode: meta.mode || "clay-panorama",
    src: FULL,
    version: V,
  };

  let stripRow = null;
  let stripsMeta = null;
  let loaded = Object.create(null);
  let loading = Object.create(null);
  let lastCam = { x: 0, scale: 1, vw: 1280 };

  function styleBase(el) {
    el.draggable = false;
    el.style.display = "block";
    el.style.maxWidth = "none";
    el.style.pointerEvents = "none";
    el.style.userSelect = "none";
    el.style.margin = "0";
    el.style.padding = "0";
    el.style.border = "0";
    el.style.verticalAlign = "top";
  }

  function loadStrip(s) {
    if (loaded[s.i] || loading[s.i] || !stripRow) return;
    loading[s.i] = true;
    const img = document.createElement("img");
    img.className = "panorama-strip";
    img.alt = "";
    styleBase(img);
    img.decoding = "async";
    img.style.position = "absolute";
    img.style.left = s.x + "px";
    img.style.top = "0";
    img.style.width = s.w + "px";
    img.style.height = H + "px";
    img.style.opacity = "0";
    img.style.transition = "opacity 0.35s ease";
    img.onload = function () {
      loaded[s.i] = true;
      delete loading[s.i];
      img.style.opacity = "1";
      maybeHidePreview();
    };
    img.onerror = function () {
      delete loading[s.i];
    };
    img.src = s.src + (s.src.indexOf("?") >= 0 ? "&" : "?") + "v=" + V;
    stripRow.appendChild(img);
  }

  function maybeHidePreview() {
    if (!stripsMeta) return;
    const preview = window.SHIJING_LANDSCAPE.previewImg;
    if (!preview) return;
    let done = 0;
    for (let i = 0; i < stripsMeta.length; i++) {
      if (loaded[i]) done++;
    }
    if (done >= Math.min(3, stripsMeta.length)) {
      preview.classList.add("is-fading");
    }
    if (done >= stripsMeta.length) {
      preview.style.display = "none";
    }
  }

  function visibleRange(cam) {
    const scale = cam.scale || 1;
    const vw = cam.vw || window.innerWidth || 1280;
    const worldLeft = (-(cam.x || 0)) / scale;
    const worldRight = worldLeft + vw / scale;
    const pad = vw / scale;
    return {
      left: Math.max(0, worldLeft - pad),
      right: Math.min(W, worldRight + pad),
    };
  }

  function updateVisible(cam) {
    if (cam) lastCam = cam;
    if (!stripsMeta) return;
    const range = visibleRange(lastCam);
    const queue = [];
    for (let i = 0; i < stripsMeta.length; i++) {
      const s = stripsMeta[i];
      const sRight = s.x + s.w;
      if (sRight >= range.left && s.x <= range.right) {
        queue.push(s);
      }
    }
    // prioritize center of viewport
    const mid = (range.left + range.right) / 2;
    queue.sort(function (a, b) {
      const da = Math.abs(a.x + a.w / 2 - mid);
      const db = Math.abs(b.x + b.w / 2 - mid);
      return da - db;
    });
    for (let j = 0; j < queue.length; j++) {
      loadStrip(queue[j]);
    }
  }

  function prefetchRest() {
    if (!stripsMeta) return;
    let i = 0;
    function step() {
      while (i < stripsMeta.length && (loaded[i] || loading[i])) i++;
      if (i >= stripsMeta.length) return;
      loadStrip(stripsMeta[i]);
      i++;
      if (window.requestIdleCallback) {
        window.requestIdleCallback(step, { timeout: 1200 });
      } else {
        setTimeout(step, 120);
      }
    }
    step();
  }

  function fetchManifest() {
    return fetch(MANIFEST)
      .then(function (r) {
        if (!r.ok) throw new Error("manifest " + r.status);
        return r.json();
      })
      .catch(function () {
        return null;
      });
  }

  window.renderLandscape = function (container) {
    if (!container) return null;
    container.innerHTML = "";
    container.style.position = "relative";
    container.style.width = W + "px";
    container.style.height = H + "px";
    container.style.background = "#5a6e5a";
    container.style.overflow = "hidden";
    container.style.display = "block";
    container.style.lineHeight = "0";
    container.style.fontSize = "0";

    const preview = document.createElement("img");
    preview.className = "panorama-preview";
    preview.alt = "诗经泥彩长卷";
    styleBase(preview);
    preview.decoding = "async";
    preview.style.width = W + "px";
    preview.style.height = H + "px";
    preview.style.objectFit = "fill";
    preview.style.position = "absolute";
    preview.style.left = "0";
    preview.style.top = "0";
    preview.style.zIndex = "0";
    preview.src = PREVIEW;
    container.appendChild(preview);
    window.SHIJING_LANDSCAPE.previewImg = preview;

    stripRow = document.createElement("div");
    stripRow.className = "panorama-strips";
    stripRow.style.position = "absolute";
    stripRow.style.left = "0";
    stripRow.style.top = "0";
    stripRow.style.width = W + "px";
    stripRow.style.height = H + "px";
    stripRow.style.zIndex = "1";
    container.appendChild(stripRow);

    window.SHIJING_LANDSCAPE.updateVisible = updateVisible;
    window.SHIJING_LANDSCAPE.src = FULL;

    fetchManifest().then(function (man) {
      if (man && man.strips && man.strips.length) {
        stripsMeta = man.strips;
        updateVisible(lastCam);
        // warm nearby then idle-load the rest
        setTimeout(prefetchRest, 600);
        return;
      }
      // fallback: single full image
      const img = document.createElement("img");
      img.className = "panorama-img";
      img.alt = "诗经泥彩长卷";
      styleBase(img);
      img.decoding = "async";
      img.style.width = W + "px";
      img.style.height = H + "px";
      img.style.objectFit = "fill";
      img.style.position = "absolute";
      img.style.left = "0";
      img.style.top = "0";
      img.style.zIndex = "1";
      img.src = FULL;
      container.appendChild(img);
      preview.style.display = "none";
      window.SHIJING_LANDSCAPE.img = img;
    });

    return preview;
  };
})();
