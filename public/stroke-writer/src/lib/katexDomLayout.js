let layoutHost = null;

function hasDomRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getKatexRuntime() {
  if (!hasDomRuntime()) {
    return null;
  }
  const runtime = window.katex;
  if (!runtime || typeof runtime.render !== "function") {
    return null;
  }
  return runtime;
}

function ensureLayoutHost() {
  if (!hasDomRuntime()) {
    return null;
  }
  if (layoutHost && layoutHost.isConnected) {
    return layoutHost;
  }
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.visibility = "visible";
  host.style.opacity = "0";
  host.style.pointerEvents = "none";
  host.style.whiteSpace = "nowrap";
  host.style.zIndex = "-1";
  host.style.padding = "0";
  host.style.margin = "0";
  host.style.border = "0";
  document.body.appendChild(host);
  layoutHost = host;
  return host;
}

function isVisibleTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) {
    return false;
  }
  if (!node.textContent || !node.textContent.trim()) {
    return false;
  }
  const parent = node.parentElement;
  if (!parent) {
    return false;
  }
  const style = window.getComputedStyle(parent);
  if (style.visibility === "hidden" || style.display === "none") {
    return false;
  }
  if (Number(style.opacity) === 0) {
    return false;
  }
  return true;
}

function measureTextNodeChars(textNode, rootRect, defaultFontSize) {
  const text = textNode.textContent ?? "";
  const items = [];
  const parent = textNode.parentElement;
  const parentStyle = parent ? window.getComputedStyle(parent) : null;
  const parentFontSizePx = Number.parseFloat(parentStyle?.fontSize || "");
  const styleDrivenFontSize = Number.isFinite(parentFontSizePx) ? parentFontSizePx : defaultFontSize;
  const range = document.createRange();
  try {
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (!char || /\s/.test(char)) {
        continue;
      }
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) {
        continue;
      }
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }
      items.push({
        type: "char",
        char,
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
        baseline: rect.bottom - rootRect.top,
        width: rect.width,
        height: rect.height,
        fontSize: Math.max(8, Math.min(defaultFontSize * 1.6, Math.max(defaultFontSize * 0.24, styleDrivenFontSize))),
        style: null,
      });
    }
  } finally {
    range.detach?.();
  }
  return items;
}

function collectCharItems(root, defaultFontSize) {
  const rootRect = root.getBoundingClientRect();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const items = [];
  let textNode = walker.nextNode();
  while (textNode) {
    if (isVisibleTextNode(textNode)) {
      items.push(...measureTextNodeChars(textNode, rootRect, defaultFontSize));
    }
    textNode = walker.nextNode();
  }
  return items;
}

function collectRuleItems(root) {
  const rootRect = root.getBoundingClientRect();
  const result = [];
  const nodes = Array.from(root.querySelectorAll("*"));
  for (const node of nodes) {
    const className = String(node.className ?? "");
    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
      continue;
    }
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    const explicitRuleClass =
      className.includes("frac-line") ||
      className.includes("sqrt-line") ||
      className.includes("overline-line");
    const borderBottomWidth = Number.parseFloat(style.borderBottomWidth || "0");
    const hasRuleBorder = borderBottomWidth > 0 && style.borderBottomStyle !== "none";
    if (!explicitRuleClass && !hasRuleBorder) {
      continue;
    }

    const thickness = Math.max(1, borderBottomWidth || Math.min(2.4, rect.height));
    const y = rect.bottom - rootRect.top - thickness * 0.5;
    result.push({
      type: "line",
      x: rect.left - rootRect.left,
      y,
      width: rect.width,
      thickness,
    });
  }
  return result;
}

function dedupeItems(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = `${item.type}|${item.char ?? ""}|${Math.round(item.x * 10)}|${Math.round(item.y * 10)}|${Math.round((item.width ?? 0) * 10)}|${Math.round((item.height ?? 0) * 10)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }
  return output;
}

function normalizeLayoutItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    if (item.type === "line") {
      const top = item.y - item.thickness * 0.5;
      const bottom = item.y + item.thickness * 0.5;
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, bottom);
      continue;
    }

    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + (item.width ?? item.fontSize * 0.6));
    maxY = Math.max(maxY, item.y + (item.height ?? item.fontSize));
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  const shiftX = -minX;
  const shiftY = -minY;
  return {
    items: items.map((item) => ({
      ...item,
      x: item.x + shiftX,
      y: item.y + shiftY,
    })),
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

export async function layoutLatexMathLineWithKatex(line, options = {}) {
  const katex = getKatexRuntime();
  const host = ensureLayoutHost();
  let latex = String(line ?? "").trim();
  if (!katex || !host || !latex) {
    return null;
  }

  const fontSize = Math.max(10, Number(options.fontSize) || 72);
  const displayMode = Boolean(options.displayMode);
  if (!displayMode) {
    // Keep inline operators compact (e.g. \sum_{i=1}^{n}) to avoid oversized
    // top/bottom limits that collide with neighboring handwritten glyphs.
    latex = latex.replace(/\\(sum|prod)(?!\s*\\(?:limits|nolimits))/g, "\\$1\\nolimits ");
  }
  host.innerHTML = "";

  const root = document.createElement("div");
  root.style.display = "inline-block";
  root.style.fontSize = `${fontSize}px`;
  root.style.lineHeight = "1";
  root.style.whiteSpace = "nowrap";
  host.appendChild(root);

  try {
    katex.render(latex, root, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "html",
      trust: false,
    });
  } catch {
    host.innerHTML = "";
    return null;
  }

  const htmlRoot = root.querySelector(".katex-html");
  if (!htmlRoot) {
    host.innerHTML = "";
    return null;
  }

  const charItems = collectCharItems(htmlRoot, fontSize);
  if (charItems.length === 0) {
    host.innerHTML = "";
    return null;
  }
  const ruleItems = collectRuleItems(htmlRoot);
  const merged = dedupeItems(charItems.concat(ruleItems));
  host.innerHTML = "";
  return normalizeLayoutItems(merged);
}
