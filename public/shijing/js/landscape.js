/**
 * 诗经长卷 – clay panorama landscape (stitched outpaint tiles)
 * WebP single-file max dimension is 16383px; this scroll is wider, so we
 * prefer tiled WebP, then fall back to a progressive JPEG.
 */
(function () {
  "use strict";

  const meta = window.SHIJING_WORLD || {};
  const W = meta.W || 46308;
  const H = meta.H || 941;
  const V = "30";
  const JPG = "assets/scroll/panorama.jpg?" + "v=" + V;
  // 3 tiles cover full width (each under WebP 16383 limit)
  const WEBP_TILES = [
    { src: "assets/scroll/panorama-0.webp?" + "v=" + V, w: 15436 },
    { src: "assets/scroll/panorama-1.webp?" + "v=" + V, w: 15436 },
    { src: "assets/scroll/panorama-2.webp?" + "v=" + V, w: 15436 },
  ];

  window.SHIJING_LANDSCAPE = {
    W,
    H,
    mode: meta.mode || "clay-panorama",
    src: JPG,
  };

  function supportsWebp() {
    try {
      var c = document.createElement("canvas");
      return c.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (e) {
      return false;
    }
  }

  function styleImg(img, w) {
    img.className = "panorama-img";
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    img.style.display = "block";
    img.style.width = w + "px";
    img.style.height = H + "px";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";
    img.style.userSelect = "none";
    img.style.flex = "0 0 auto";
  }

  function loadJpg(container) {
    const img = document.createElement("img");
    styleImg(img, W);
    img.alt = "诗经泥彩长卷";
    img.src = JPG;
    container.appendChild(img);
    window.SHIJING_LANDSCAPE.img = img;
    window.SHIJING_LANDSCAPE.src = JPG;
    return img;
  }

  function loadWebpTiles(container) {
    const row = document.createElement("div");
    row.className = "panorama-row";
    row.style.display = "flex";
    row.style.flexDirection = "row";
    row.style.width = W + "px";
    row.style.height = H + "px";
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", "诗经泥彩长卷");

    let failed = false;
    const imgs = [];
    WEBP_TILES.forEach(function (t, i) {
      const img = document.createElement("img");
      styleImg(img, t.w);
      img.src = t.src;
      img.onerror = function () {
        if (failed) return;
        failed = true;
        container.innerHTML = "";
        loadJpg(container);
      };
      row.appendChild(img);
      imgs.push(img);
    });
    container.appendChild(row);
    window.SHIJING_LANDSCAPE.img = imgs[0];
    window.SHIJING_LANDSCAPE.imgs = imgs;
    window.SHIJING_LANDSCAPE.src = WEBP_TILES[0].src;
    return imgs[0];
  }

  window.renderLandscape = function (container) {
    if (!container) return null;
    container.innerHTML = "";
    container.style.width = W + "px";
    container.style.height = H + "px";
    container.style.background = "#5a6e5a";
    container.style.overflow = "hidden";

    if (supportsWebp()) {
      return loadWebpTiles(container);
    }
    return loadJpg(container);
  };
})();
