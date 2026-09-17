/**
 * 诗经长卷 – clay panorama landscape
 * Prefer a single progressive JPEG (no tile seams). WebP tiles removed for now.
 */
(function () {
  "use strict";

  const meta = window.SHIJING_WORLD || {};
  const W = meta.W || 46308;
  const H = meta.H || 941;
  const V = "40";
  const JPG = "assets/scroll/panorama.jpg?" + "v=" + V;

  window.SHIJING_LANDSCAPE = {
    W,
    H,
    mode: meta.mode || "clay-panorama",
    src: JPG,
  };

  function styleImg(img, w) {
    img.className = "panorama-img";
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    img.style.display = "block";
    img.style.width = w + "px";
    img.style.height = H + "px";
    img.style.maxWidth = "none";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";
    img.style.userSelect = "none";
    img.style.flex = "none";
    img.style.margin = "0";
    img.style.padding = "0";
    img.style.border = "0";
    img.style.verticalAlign = "top";
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

  window.renderLandscape = function (container) {
    if (!container) return null;
    container.innerHTML = "";
    container.style.width = W + "px";
    container.style.height = H + "px";
    container.style.background = "#5a6e5a";
    container.style.overflow = "hidden";
    container.style.display = "block";
    container.style.lineHeight = "0";
    container.style.fontSize = "0";
    return loadJpg(container);
  };
})();
