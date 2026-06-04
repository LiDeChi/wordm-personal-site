const BEGIN_DOCUMENT = "\\begin{document}";
const END_DOCUMENT = "\\end{document}";
const MARKER_SECTION = "[[SECTION]]";
const MARKER_SUBSECTION = "[[SUBSECTION]]";
const MARKER_MULTICOL_START_PREFIX = "[[MCOL_START:";
const MARKER_MULTICOL_END = "[[MCOL_END]]";
const MARKER_MULTICOL_BREAK = "[[MCOL_BREAK]]";
const MARKER_CENTER_START = "[[CENTER_START]]";
const MARKER_CENTER_END = "[[CENTER_END]]";
const MARKER_PAR_BREAK = "[[PAR_BREAK]]";
const MARKER_PAGE_BREAK = "[[PAGE_BREAK]]";
const INLINE_MATH_SYMBOLS = new Map([
  ["\\times", "×"],
  ["\\cdot", "·"],
  ["\\div", "÷"],
  ["\\pm", "±"],
  ["\\leq", "≤"],
  ["\\le", "≤"],
  ["\\geq", "≥"],
  ["\\ge", "≥"],
  ["\\neq", "≠"],
  ["\\ne", "≠"],
  ["\\approx", "≈"],
  ["\\infty", "∞"],
  ["\\pi", "π"],
  ["\\alpha", "α"],
  ["\\beta", "β"],
  ["\\gamma", "γ"],
  ["\\delta", "δ"],
  ["\\epsilon", "ε"],
  ["\\zeta", "ζ"],
  ["\\eta", "η"],
  ["\\theta", "θ"],
  ["\\vartheta", "ϑ"],
  ["\\iota", "ι"],
  ["\\kappa", "κ"],
  ["\\lambda", "λ"],
  ["\\mu", "μ"],
  ["\\nu", "ν"],
  ["\\xi", "ξ"],
  ["\\rho", "ρ"],
  ["\\sigma", "σ"],
  ["\\phi", "φ"],
  ["\\chi", "χ"],
  ["\\psi", "ψ"],
  ["\\omega", "ω"],
  ["\\tau", "τ"],
  ["\\Gamma", "Γ"],
  ["\\Lambda", "Λ"],
  ["\\Xi", "Ξ"],
  ["\\Phi", "Φ"],
  ["\\Psi", "Ψ"],
  ["\\Omega", "Ω"],
  ["\\nabla", "∇"],
]);

function stripComment(line) {
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "%" && !escaped) {
      return line.slice(0, i);
    }
    escaped = char === "\\" && !escaped;
  }
  return line;
}

function readBalancedGroup(text, startIndex) {
  if (text[startIndex] !== "{") {
    return null;
  }
  let depth = 0;
  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          content: text.slice(startIndex + 1, i),
          endIndex: i + 1,
        };
      }
    }
  }
  return null;
}

function replaceCommandWithGroup(input, commandName, transform = (x) => x) {
  let text = input;
  const needle = `\\${commandName}`;

  for (let guard = 0; guard < 64; guard += 1) {
    const at = text.indexOf(needle);
    if (at < 0) {
      break;
    }

    let cursor = at + needle.length;
    while (cursor < text.length && /\s/.test(text[cursor])) {
      cursor += 1;
    }

    if (cursor >= text.length || text[cursor] !== "{") {
      text = `${text.slice(0, at)}${text.slice(cursor)}`;
      continue;
    }

    const group = readBalancedGroup(text, cursor);
    if (!group) {
      break;
    }

    const replacement = transform(group.content);
    text = `${text.slice(0, at)}${replacement}${text.slice(group.endIndex)}`;
  }

  return text;
}

function stripFormattingCommands(line) {
  let text = line;
  for (const command of [
    "textbf",
    "textit",
    "emph",
    "texttt",
    "textsf",
    "textrm",
    "underline",
    "mathbf",
    "mathrm",
  ]) {
    text = replaceCommandWithGroup(text, command);
  }
  return text;
}

function normalizeMathFragment(fragment) {
  let text = String(fragment ?? "");
  const wordFnPattern = "(cos|sin|tan|cot|sec|csc|log|ln|exp|max|min|lim)";

  for (const [command, symbol] of INLINE_MATH_SYMBOLS.entries()) {
    text = text.replace(new RegExp(command.replace(/\\/g, "\\\\"), "g"), symbol);
  }

  text = text
    .replace(new RegExp(`([0-9A-Za-z)\\]}])\\\\${wordFnPattern}\\b`, "g"), "$1 $2")
    .replace(new RegExp(`\\\\${wordFnPattern}\\b`, "g"), "$1")
    .replace(/\\mathcal\s*\{([^{}]+)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^{}]+)\}/g, "$1")
    .replace(/\\mathbf\s*\{([^{}]+)\}/g, "$1")
    .replace(/\\left\b/g, "")
    .replace(/\\right\b/g, "")
    .replace(/\\,/g, "")
    .replace(/\\;/g, " ")
    .replace(/\\:/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\([{}_^\\])/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text;
}

function normalizeInlineLatexText(line) {
  let text = stripComment(line);
  if (!text.trim()) {
    return "";
  }

  text = stripFormattingCommands(text);
  text = replaceCommandWithGroup(text, "mathcal");
  text = replaceCommandWithGroup(text, "mathbb");
  text = replaceCommandWithGroup(text, "mathbf");
  text = replaceCommandWithGroup(text, "mathit");
  text = replaceCommandWithGroup(text, "LaTeX", () => "LaTeX");
  text = replaceCommandWithGroup(text, "XeLaTeX", () => "XeLaTeX");
  text = replaceCommandWithGroup(text, "LuaLaTeX", () => "LuaLaTeX");

  text = text
    .replace(/\\LaTeX\b/g, "LaTeX")
    .replace(/\\XeLaTeX\b/g, "XeLaTeX")
    .replace(/\\LuaLaTeX\b/g, "LuaLaTeX")
    .replace(/\\TeX\b/g, "TeX")
    .replace(/\$([^$]+)\$/g, (_full, expr) => normalizeMathFragment(expr))
    // Keep CJK punctuation as-is so document mode can render Chinese writing faithfully.
    .replace(/``/g, "“")
    .replace(/''/g, "”")
    .replace(/~+/g, " ")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\:/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, " ")
    .replace(/\\left\b/g, "")
    .replace(/\\right\b/g, "")
    .replace(/\\par\b/g, "")
    .replace(/\\noindent\b/g, "")
    .replace(/\\hfill\b/g, " ")
    .replace(/\\vspace\*?\{[^}]*\}/g, "")
    .replace(/\\hspace\*?\{[^}]*\}/g, " ")
    .replace(/\{\\\}/g, "")
    .replace(/\\%/g, "%")
    .replace(/\\#/g, "#")
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\[A-Za-z]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, (match) => {
      if (
        /^\\(frac|sqrt|sum|int|prod|times|cdot|div|pm|leq|le|geq|ge|neq|ne|approx|infty|partial|nabla|Delta|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|rho|sigma|phi|chi|psi|omega|pi|tau|Gamma|Lambda|Xi|Phi|Psi|Omega|mathcal|mathbb|mathfrak|mathit|mathrm|mathbf|left|right|to|rightarrow|leftarrow|lim|max|min|begin|end|cos|sin|tan|cot|sec|csc|log|ln|exp)\b/.test(
          match,
        )
      ) {
        return match;
      }
      return "";
    })
    .replace(/[ \t]+/g, " ")
    .trim();

  return text;
}

function sanitizeMathLine(text) {
  return text
    .replace(/^\s*\\\[\s*/, "")
    .replace(/\s*\\\]\s*$/, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractDocumentBody(source) {
  const beginAt = source.indexOf(BEGIN_DOCUMENT);
  if (beginAt < 0) {
    return {
      body: source,
      isDocument: false,
    };
  }
  const endAt = source.lastIndexOf(END_DOCUMENT);
  const start = beginAt + BEGIN_DOCUMENT.length;
  const stop = endAt > start ? endAt : source.length;
  return {
    body: source.slice(start, stop),
    isDocument: true,
  };
}

export function extractLatexDocumentForHandwriting(sourceText) {
  const source = String(sourceText ?? "");
  const { body, isDocument } = extractDocumentBody(source);
  const rawLines = body.split(/\r?\n/);
  const out = [];

  let inDisplayMath = false;
  let displayMathBuffer = [];
  let inTabular = false;
  let tabularColumnCount = 0;
  let tabularRuleLine = "";
  let lastWasTabularRule = false;
  let skipEnvName = "";

  function pushLine(text) {
    const normalized = normalizeInlineLatexText(text);
    if (!normalized) {
      return;
    }
    out.push(normalized);
  }

  function pushParagraphBreak() {
    const prev = out[out.length - 1];
    if (!prev) {
      return;
    }
    if (
      prev === MARKER_PAR_BREAK ||
      String(prev).startsWith(MARKER_SECTION) ||
      String(prev).startsWith(MARKER_SUBSECTION) ||
      prev === MARKER_CENTER_START ||
      prev === MARKER_CENTER_END ||
      prev === MARKER_MULTICOL_BREAK ||
      prev === MARKER_MULTICOL_END ||
      prev === MARKER_PAGE_BREAK ||
      String(prev).startsWith(MARKER_MULTICOL_START_PREFIX)
    ) {
      return;
    }
    out.push(MARKER_PAR_BREAK);
  }

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex += 1) {
    const raw = rawLines[lineIndex] ?? "";
    const line = stripComment(raw).trim();

    if (!line) {
      pushParagraphBreak();
      continue;
    }

    if (skipEnvName) {
      if (new RegExp(`^\\\\end\\{${skipEnvName}\\}`).test(line)) {
        skipEnvName = "";
      }
      continue;
    }

    if (inDisplayMath) {
      if (line.includes("\\]")) {
        const beforeEnd = line.split("\\]")[0];
        if (beforeEnd.trim()) {
          displayMathBuffer.push(beforeEnd);
        }
        const mathLine = sanitizeMathLine(displayMathBuffer.join(" "));
        if (mathLine) {
          out.push(mathLine);
        }
        inDisplayMath = false;
        displayMathBuffer = [];
      } else {
        displayMathBuffer.push(line);
      }
      continue;
    }

    if (line.startsWith("\\[")) {
      const rest = line.slice(2);
      if (rest.includes("\\]")) {
        const mathLine = sanitizeMathLine(rest);
        if (mathLine) {
          out.push(mathLine);
        }
      } else {
        inDisplayMath = true;
        displayMathBuffer = [rest];
      }
      continue;
    }

    if (inTabular) {
      if (/^\\end\{tabular\}/.test(line)) {
        inTabular = false;
        tabularColumnCount = 0;
        tabularRuleLine = "";
        lastWasTabularRule = false;
        continue;
      }
      if (/^\\hline/.test(line)) {
        if (tabularRuleLine && !lastWasTabularRule) {
          out.push(tabularRuleLine);
        }
        lastWasTabularRule = true;
        continue;
      }
      const rowContent = line
        .replace(/\\\\/g, "")
        .replace(/\\hline/g, "")
        .trim();
      if (rowContent.includes("&")) {
        const cells = rowContent
          .split("&")
          .map((cell) => normalizeInlineLatexText(cell))
          .filter(Boolean);
        if (cells.length) {
          out.push(`| ${cells.join(" | ")} |`);
          lastWasTabularRule = false;
        }
      }
      continue;
    }

    if (/^\\begin\{tabular\}/.test(line)) {
      inTabular = true;
      const spec = line.match(/^\\begin\{tabular\}\{([^}]*)\}/)?.[1] ?? "";
      tabularColumnCount = (spec.match(/[lcrpmbxX]/g) ?? []).length;
      tabularRuleLine =
        tabularColumnCount > 0
          ? `+${Array.from({ length: tabularColumnCount }, () => "---").join("+")}+`
          : "";
      lastWasTabularRule = false;
      continue;
    }

    if (/^\\begin\{(?:tikzcd|tikzpicture)\}/.test(line)) {
      skipEnvName = line.match(/^\\begin\{([^}]+)\}/)?.[1] ?? "";
      out.push("[图公式]");
      continue;
    }

    if (/^\\section\*?\{/.test(line)) {
      const sectionTitle = line.replace(/^\\section\*?\{/, "").replace(/\}\s*$/, "");
      const normalizedTitle = normalizeInlineLatexText(sectionTitle);
      if (normalizedTitle) {
        out.push(`${MARKER_SECTION} ${normalizedTitle}`);
      }
      continue;
    }
    if (/^\\subsection\*?\{/.test(line)) {
      const sectionTitle = line.replace(/^\\subsection\*?\{/, "").replace(/\}\s*$/, "");
      const normalizedTitle = normalizeInlineLatexText(sectionTitle);
      if (normalizedTitle) {
        out.push(`${MARKER_SUBSECTION} ${normalizedTitle}`);
      }
      continue;
    }

    const multicolsBegin = line.match(/^\\begin\{multicols\}\{(\d+)\}/);
    if (multicolsBegin) {
      const columnCount = Math.max(1, Number(multicolsBegin[1]) || 2);
      out.push(`${MARKER_MULTICOL_START_PREFIX}${columnCount}]]`);
      continue;
    }
    if (/^\\end\{multicols\}/.test(line)) {
      out.push(MARKER_MULTICOL_END);
      continue;
    }
    if (/^\\columnbreak\b/.test(line)) {
      out.push(MARKER_MULTICOL_BREAK);
      continue;
    }
    if (/^\\(?:newpage|pagebreak|clearpage)\b/.test(line)) {
      out.push(MARKER_PAGE_BREAK);
      continue;
    }

    if (/^\\begin\{center\}/.test(line)) {
      out.push(MARKER_CENTER_START);
      continue;
    }
    if (/^\\end\{center\}/.test(line)) {
      out.push(MARKER_CENTER_END);
      continue;
    }

    if (/^\\begin\{minipage\}/.test(line)) {
      continue;
    }
    if (/^\\end\{minipage\}/.test(line)) {
      continue;
    }
    if (/^\\resizebox\b/.test(line)) {
      continue;
    }
    if (/^\\includegraphics\b/.test(line)) {
      out.push("[图]");
      continue;
    }

    if (/^[{}$]+$/.test(line)) {
      continue;
    }

    // Skip most preamble-like directives if present in extracted body snippets.
    if (/^\\(?:documentclass|usepackage|setlength|setmainfont|setCJKmainfont|IfFontExistsTF)\b/.test(line)) {
      continue;
    }

    pushLine(line);
  }

  const merged = [];
  for (let i = 0; i < out.length; i += 1) {
    const current = out[i];
    const next = out[i + 1];
    if (current === "[图]" && next === "[图公式]") {
      merged.push("[图]  [图公式]");
      i += 1;
      continue;
    }
    if (current === "[图公式]" && next === "[图]") {
      merged.push("[图公式]  [图]");
      i += 1;
      continue;
    }
    if (current === MARKER_PAR_BREAK) {
      const prev = merged[merged.length - 1];
      if (
        !prev ||
        prev === MARKER_PAR_BREAK ||
        String(prev).startsWith(MARKER_SECTION) ||
        String(prev).startsWith(MARKER_SUBSECTION) ||
        prev === MARKER_CENTER_START ||
        prev === MARKER_CENTER_END ||
        prev === MARKER_MULTICOL_BREAK ||
        prev === MARKER_MULTICOL_END ||
        prev === MARKER_PAGE_BREAK ||
        String(prev).startsWith(MARKER_MULTICOL_START_PREFIX)
      ) {
        continue;
      }
      if (
        next === MARKER_CENTER_START ||
        next === MARKER_CENTER_END ||
        next === MARKER_MULTICOL_BREAK ||
        next === MARKER_MULTICOL_END ||
        next === MARKER_PAGE_BREAK ||
        String(next ?? "").startsWith(MARKER_MULTICOL_START_PREFIX)
      ) {
        continue;
      }
    }
    merged.push(current);
  }

  const text = merged.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return {
    text,
    isDocument,
    transformed: text !== source.trim(),
    stats: {
      inputLineCount: rawLines.length,
      outputLineCount: merged.length,
    },
  };
}
