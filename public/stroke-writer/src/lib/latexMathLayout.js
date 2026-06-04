import { classifyChar } from "./charClassifier.js?v=20260307c";
import { getFormulaGlyph, hasFormulaGlyph } from "./latinMathStrokeFont.js?v=20260319d";

const COMMAND_SYMBOLS = new Map([
  ["sum", "Σ"],
  ["int", "∫"],
  ["prod", "∏"],
  ["times", "×"],
  ["cdot", "·"],
  ["div", "÷"],
  ["pm", "±"],
  ["leq", "≤"],
  ["le", "≤"],
  ["geq", "≥"],
  ["ge", "≥"],
  ["neq", "≠"],
  ["ne", "≠"],
  ["to", "→"],
  ["rightarrow", "→"],
  ["leftarrow", "←"],
  ["infty", "∞"],
  ["partial", "∂"],
  ["nabla", "∇"],
  ["Delta", "∆"],
  ["approx", "≈"],
  ["cdots", "⋯"],
  ["ldots", "…"],
  ["oint", "∮"],
  ["iint", "∬"],
  ["iiint", "∭"],
  ["alpha", "α"],
  ["beta", "β"],
  ["gamma", "γ"],
  ["delta", "δ"],
  ["epsilon", "ε"],
  ["varepsilon", "ε"],
  ["zeta", "ζ"],
  ["eta", "η"],
  ["theta", "θ"],
  ["vartheta", "ϑ"],
  ["iota", "ι"],
  ["kappa", "κ"],
  ["lambda", "λ"],
  ["mu", "μ"],
  ["nu", "ν"],
  ["xi", "ξ"],
  ["rho", "ρ"],
  ["sigma", "σ"],
  ["phi", "φ"],
  ["chi", "χ"],
  ["psi", "ψ"],
  ["omega", "ω"],
  ["pi", "π"],
  ["tau", "τ"],
  ["Gamma", "Γ"],
  ["Lambda", "Λ"],
  ["Xi", "Ξ"],
  ["Phi", "Φ"],
  ["Psi", "Ψ"],
  ["Omega", "Ω"],
  ["lbrace", "{"],
  ["rbrace", "}"],
  ["lvert", "|"],
  ["rvert", "|"],
]);

const PASSTHROUGH_COMMANDS = new Set([
  "left",
  "right",
  "big",
  "Big",
  "bigl",
  "bigr",
  "Bigl",
  "Bigr",
  "bigg",
  "Bigg",
  "biggl",
  "biggr",
  "Biggl",
  "Biggr",
]);
const SINGLE_CHAR_ESCAPES = new Map([
  ["{", "{"],
  ["}", "}"],
  ["$", "$"],
  ["%", "%"],
  ["&", "&"],
  ["#", "#"],
  ["_", "_"],
  ["|", "|"],
]);
const SPACING_COMMANDS = new Set([
  "\\",
  ",",
  ";",
  ":",
  "!",
  " ",
  "quad",
  "qquad",
  "enspace",
  "thinspace",
  "medspace",
  "thickspace",
]);
const TEXT_WRAP_COMMANDS = new Set([
  "text",
  "operatorname",
]);
const STYLE_COMMANDS = new Set([
  "mathrm",
  "mathcal",
  "mathbf",
  "mathit",
  "mathbb",
  "mathfrak",
]);
const WORD_COMMANDS = new Set([
  "cos",
  "sin",
  "tan",
  "cot",
  "sec",
  "csc",
  "log",
  "ln",
  "exp",
  "max",
  "min",
  "lim",
  "det",
]);
const LIMIT_WORD_COMMANDS = new Set([
  "lim",
]);
const LARGE_LIMIT_OPERATORS = new Set(["Σ", "∑", "∏", "∫"]);
const RELATION_CHARS = new Set(["=", "<", ">", "≤", "≥", "≈", "≠"]);
const BINARY_CHARS = new Set(["+", "-", "×", "÷", "*", "·", "±"]);
const OPEN_DELIMITER_CHARS = new Set(["(", "[", "{", "|"]);
const CLOSE_DELIMITER_CHARS = new Set([")", "]", "}", "|"]);
const MATH_COMMANDS = new Set([
  "frac",
  "sqrt",
  "sum",
  "int",
  "prod",
  "times",
  "cdot",
  "div",
  "pm",
  "leq",
  "le",
  "geq",
  "ge",
  "neq",
  "ne",
  "to",
  "rightarrow",
  "leftarrow",
  "infty",
  "partial",
  "nabla",
  "Delta",
  "approx",
  "cdots",
  "ldots",
  "oint",
  "iint",
  "iiint",
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "varepsilon",
  "zeta",
  "eta",
  "theta",
  "vartheta",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "nu",
  "xi",
  "rho",
  "sigma",
  "phi",
  "chi",
  "psi",
  "omega",
  "pi",
  "tau",
  "Gamma",
  "Lambda",
  "Xi",
  "Phi",
  "Psi",
  "Omega",
  "cos",
  "sin",
  "tan",
  "cot",
  "sec",
  "csc",
  "log",
  "ln",
  "exp",
  "mathcal",
  "mathbf",
  "mathit",
  "mathbb",
  "mathfrak",
  "left",
  "right",
  "begin",
  "end",
]);

const MATH_METRICS = {
  scriptScale: 0.72,
  scriptGap: 0.08,
  scriptAttachGap: 0.06,
  scriptSupLift: 0.64,
  scriptSubDrop: 0.31,
  scriptMinClearance: 0.09,
  fracScale: 0.82,
  fracPad: 0.2,
  fracGap: 0.15,
  fracRule: 0.055,
  fracAxis: 0.03,
  fracNumRaise: 0.46,
  fracDenDrop: 0.42,
  sqrtBodyScale: 0.95,
  sqrtLead: 0.6,
  delimGap: 0.04,
  delimMinScale: 0.98,
  delimMaxScale: 2.2,
  matrixRowGap: 0.22,
  matrixColGap: 0.34,
  matrixDelimGap: 0.07,
};

function isAsciiLetter(char) {
  return /^[A-Za-z]$/.test(char);
}

function isDigit(char) {
  return /^[0-9]$/.test(char);
}

function isLargeLimitOperatorNode(node) {
  if (!node) {
    return false;
  }
  if (node.type === "char") {
    return LARGE_LIMIT_OPERATORS.has(node.char);
  }
  return Boolean(node.type === "wordop" && node.displayLimits);
}

function isIntegralOperatorNode(node) {
  return Boolean(node?.type === "char" && node.char === "∫");
}

function resolveIntegralScriptPlacement(baseMetrics, fontSize, supMetrics, subMetrics) {
  const scriptOffsetX = fontSize * 0.12;
  const supLift = Math.max(baseMetrics.height * 0.84, fontSize * 0.62);
  let subDrop = Math.max(baseMetrics.depth + fontSize * 0.22, fontSize * 0.5);
  const supBaselineOffset = -supLift;
  if (supMetrics && subMetrics) {
    const supBottom = supBaselineOffset + supMetrics.depth;
    const subTop = subDrop - subMetrics.height;
    const minClearance = fontSize * 0.14;
    if (subTop - supBottom < minClearance) {
      subDrop += minClearance - (subTop - supBottom);
    }
  }
  return { scriptOffsetX, supLift, subDrop, supBaselineOffset };
}

function charAdvance(char, fontSize) {
  if (!char || char === " ") {
    return fontSize * 0.32;
  }
  if (classifyChar(char) === "han") {
    return fontSize;
  }

  if (hasFormulaGlyph(char)) {
    const glyphAdvance = getFormulaGlyph(char).advance * fontSize;

    if (/[.,;:'"`]/.test(char)) {
      return glyphAdvance * 0.74;
    }
    if (/[(){}\[\]]/.test(char)) {
      return glyphAdvance * 0.88;
    }
    if (/[+\-×÷*·]/.test(char)) {
      return glyphAdvance * 0.9;
    }
    if (/[=<>≤≥≈≠]/.test(char)) {
      return glyphAdvance * 0.92;
    }
    if (char === "∫") {
      return glyphAdvance * 0.9;
    }
    if (char === "Σ" || char === "∑" || char === "∏") {
      return glyphAdvance * 0.96;
    }
    if (char === "√") {
      return Math.max(fontSize * 0.64, glyphAdvance * 0.92);
    }
    if (/[A-Za-z0-9]/.test(char)) {
      return glyphAdvance * 1.04;
    }
    if (/[α-ωΑ-Ω]/u.test(char)) {
      return glyphAdvance * 1.01;
    }
    return glyphAdvance * 0.96;
  }

  if (isDigit(char) || isAsciiLetter(char)) {
    return fontSize * 0.62;
  }
  return fontSize * 0.6;
}

function styleScale(style) {
  if (style === "mathcal") {
    return 1.04;
  }
  if (style === "mathbf") {
    return 1.03;
  }
  return 1;
}

function operatorGap(char, fontSize) {
  return 0;
}

function resolveStyledChar(char, style) {
  if (style === "mathcal" && char === "L") {
    return "ℒ";
  }
  return char;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stableNoise(a, b = 0, c = 0) {
  const seed = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
}

function createCharNode(char) {
  return { type: "char", char };
}

function createSequence(children) {
  return { type: "seq", children: children.filter(Boolean) };
}

function createStyledNode(style, body) {
  return {
    type: "styled",
    style,
    body: body ?? createCharNode("?"),
  };
}

function createWordOperatorNode(text, options = {}) {
  return {
    type: "wordop",
    text,
    displayLimits: Boolean(options.displayLimits),
  };
}

function createMatrixNode(rows, options = {}) {
  return {
    type: "matrix",
    rows: Array.isArray(rows) ? rows : [],
    leftDelimiter: options.leftDelimiter ?? "",
    rightDelimiter: options.rightDelimiter ?? "",
  };
}

function splitTopLevel(text, separatorPredicate) {
  const chunks = [];
  let current = "";
  let braceDepth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (braceDepth === 0) {
      const separatorLength = separatorPredicate(text, i);
      if (separatorLength > 0) {
        chunks.push(current);
        current = "";
        i += separatorLength - 1;
        continue;
      }
    }
    if (char === "\\") {
      current += char;
      if (i + 1 < text.length) {
        current += text[i + 1];
        i += 1;
      }
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
      current += char;
      continue;
    }
    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      current += char;
      continue;
    }
    current += char;
  }

  chunks.push(current);
  return chunks;
}

function parseMatrixBody(bodyText, environmentName) {
  const leftDelimiter =
    environmentName === "bmatrix"
      ? "["
      : environmentName === "pmatrix"
        ? "("
        : environmentName === "vmatrix"
          ? "|"
          : environmentName === "Vmatrix"
            ? "|"
            : "";
  const rightDelimiter =
    environmentName === "bmatrix"
      ? "]"
      : environmentName === "pmatrix"
        ? ")"
        : environmentName === "vmatrix"
          ? "|"
          : environmentName === "Vmatrix"
            ? "|"
            : "";

  const rowTexts = splitTopLevel(bodyText, (text, index) => (text.startsWith("\\\\", index) ? 2 : 0));
  const rows = rowTexts
    .map((rowText) =>
      splitTopLevel(rowText, (text, index) => (text[index] === "&" ? 1 : 0)).map((cellText) => {
        const parser = new LatexParser(cellText.trim());
        const ast = parser.parseSequence(false);
        return ast.children.length ? ast : createCharNode(" ");
      }),
    )
    .filter((row) => row.length > 0);

  return createMatrixNode(rows, { leftDelimiter, rightDelimiter });
}

function edgeRole(node, side = "left") {
  if (!node) {
    return "none";
  }
  if (node.type === "seq") {
    const children = side === "left" ? node.children : [...node.children].reverse();
    for (const child of children) {
      const role = edgeRole(child, side);
      if (role !== "none" && role !== "space") {
        return role;
      }
    }
    return "none";
  }
  if (node.type === "styled") {
    return edgeRole(node.body, side);
  }
  if (node.type === "char") {
    if (node.char === " ") {
      return "space";
    }
    if (RELATION_CHARS.has(node.char)) {
      return "relation";
    }
    if (BINARY_CHARS.has(node.char)) {
      return "binary";
    }
    if (OPEN_DELIMITER_CHARS.has(node.char)) {
      return "open";
    }
    if (CLOSE_DELIMITER_CHARS.has(node.char)) {
      return "close";
    }
    if (/[,;:]/.test(node.char)) {
      return "punct";
    }
    return "atom";
  }
  if (node.type === "wordop") {
    return "wordop";
  }
  return "atom";
}

function sequenceInterGap(previousNode, currentNode, fontSize) {
  const left = edgeRole(previousNode, "right");
  const right = edgeRole(currentNode, "left");

  if (left === "none" || right === "none" || left === "space" || right === "space") {
    return 0;
  }

  if (left === "wordop") {
    if (right === "open") {
      return fontSize * 0.02;
    }
    if (right === "close") {
      return 0;
    }
    return fontSize * 0.058;
  }

  if (right === "wordop") {
    if (left === "open") {
      return fontSize * 0.02;
    }
    return fontSize * 0.058;
  }

  if (left === "relation" || right === "relation") {
    return fontSize * 0.096;
  }
  if (left === "binary" || right === "binary") {
    return fontSize * 0.064;
  }
  if ((left === "atom" || left === "close") && right === "open") {
    return fontSize * 0.01;
  }
  return 0;
}

function measureWordOperator(node, fontSize) {
  const letters = Array.from(node.text ?? "");
  if (!letters.length) {
    return { width: 0, height: fontSize * 0.78, depth: fontSize * 0.22 };
  }
  const letterSize = fontSize * 0.96;
  let width = 0;
  for (let i = 0; i < letters.length; i += 1) {
    width += charAdvance(letters[i], letterSize) * 0.93;
    if (i < letters.length - 1) {
      width += letterSize * 0.014;
    }
  }
  return {
    width,
    height: letterSize * 0.78,
    depth: letterSize * 0.22,
  };
}

class LatexParser {
  constructor(input) {
    this.input = input ?? "";
    this.index = 0;
    this.unsupported = false;
  }

  eof() {
    return this.index >= this.input.length;
  }

  peek(offset = 0) {
    return this.input[this.index + offset];
  }

  consume() {
    const char = this.input[this.index];
    this.index += 1;
    return char;
  }

  startsWith(value) {
    return this.input.startsWith(value, this.index);
  }

  skipSpaces() {
    while (!this.eof() && /\s/.test(this.peek())) {
      this.index += 1;
    }
  }

  readCommandName() {
    if (this.peek() !== "\\") {
      return "";
    }
    this.consume();
    if (this.eof()) {
      return "";
    }
    if (!/[A-Za-z]/.test(this.peek())) {
      return this.consume();
    }
    let name = "";
    while (!this.eof() && /[A-Za-z]/.test(this.peek())) {
      name += this.consume();
    }
    return name;
  }

  parseGroupOrAtom() {
    this.skipSpaces();
    if (this.peek() === "{") {
      this.consume();
      const node = this.parseSequence(true);
      if (this.peek() === "}") {
        this.consume();
      }
      return node;
    }
    return this.parseAtomWithScripts();
  }

  parseScriptArgument() {
    this.skipSpaces();
    if (this.peek() === "{") {
      this.consume();
      const node = this.parseSequence(true);
      if (this.peek() === "}") {
        this.consume();
      }
      return node;
    }
    return this.parseAtom();
  }

  readDelimiterToken() {
    this.skipSpaces();
    if (this.eof()) {
      return "";
    }

    if (this.peek() === "\\") {
      const command = this.readCommandName();
      if (command === ".") {
        return "";
      }
      const escapedLiteral = SINGLE_CHAR_ESCAPES.get(command);
      if (escapedLiteral) {
        return escapedLiteral;
      }
      const mapped = COMMAND_SYMBOLS.get(command);
      if (mapped) {
        return mapped;
      }
      return command.length === 1 ? command : "";
    }

    if (this.peek() === ".") {
      this.consume();
      return "";
    }

    return this.consume();
  }

  parseUntilRightDelimiter() {
    const children = [];
    while (!this.eof()) {
      if (this.startsWith("\\right")) {
        this.readCommandName();
        return {
          body: createSequence(children),
          rightDelimiter: this.readDelimiterToken(),
        };
      }

      const before = this.index;
      const node = this.parseAtomWithScripts();
      if (!node) {
        if (this.index === before && !this.eof()) {
          this.consume();
        }
        continue;
      }
      children.push(node);
    }

    return {
      body: createSequence(children),
      rightDelimiter: "",
    };
  }

  parseCommand(command) {
    if (command === "begin") {
      const group = this.parseGroupOrAtom();
      const envName = group?.type === "seq" ? group.children.map((node) => node.char ?? "").join("") : "";
      if (["matrix", "bmatrix", "pmatrix", "vmatrix", "Vmatrix"].includes(envName)) {
        const endToken = `\\end{${envName}}`;
        const endAt = this.input.indexOf(endToken, this.index);
        if (endAt < 0) {
          this.unsupported = true;
          return null;
        }
        const bodyText = this.input.slice(this.index, endAt);
        this.index = endAt + endToken.length;
        return parseMatrixBody(bodyText, envName);
      }
      this.unsupported = true;
      return null;
    }

    if (command === "end") {
      this.unsupported = true;
      return null;
    }

    if (command === "left") {
      const leftDelimiter = this.readDelimiterToken();
      const delimited = this.parseUntilRightDelimiter();
      return {
        type: "delimited",
        leftDelimiter,
        rightDelimiter: delimited.rightDelimiter,
        body: delimited.body,
      };
    }

    if (command === "frac") {
      const numerator = this.parseGroupOrAtom();
      const denominator = this.parseGroupOrAtom();
      return {
        type: "frac",
        numerator: numerator ?? createCharNode("?"),
        denominator: denominator ?? createCharNode("?"),
      };
    }

    if (command === "sqrt") {
      const body = this.parseGroupOrAtom();
      return {
        type: "sqrt",
        body: body ?? createCharNode("?"),
      };
    }

    if (TEXT_WRAP_COMMANDS.has(command)) {
      return this.parseGroupOrAtom();
    }

    if (STYLE_COMMANDS.has(command)) {
      return createStyledNode(command, this.parseGroupOrAtom());
    }

    if (PASSTHROUGH_COMMANDS.has(command)) {
      return null;
    }

    if (SPACING_COMMANDS.has(command)) {
      return createCharNode(" ");
    }

    const escapedLiteral = SINGLE_CHAR_ESCAPES.get(command);
    if (escapedLiteral) {
      return createCharNode(escapedLiteral);
    }

    const mapped = COMMAND_SYMBOLS.get(command);
    if (mapped) {
      return createCharNode(mapped);
    }

    if (WORD_COMMANDS.has(command)) {
      return createWordOperatorNode(command, {
        displayLimits: LIMIT_WORD_COMMANDS.has(command),
      });
    }

    if (command.length > 1) {
      this.unsupported = true;
      return null;
    }

    // Keep unknown single-char commands visible literally ("\?"), instead of swallowing "\".
    return createSequence([createCharNode("\\"), ...Array.from(command).map((char) => createCharNode(char))]);
  }

  parseAtom() {
    if (this.eof()) {
      return null;
    }

    const char = this.peek();
    if (char === "}") {
      return null;
    }

    if (char === "{") {
      this.consume();
      const node = this.parseSequence(true);
      if (this.peek() === "}") {
        this.consume();
      }
      return node;
    }

    if (char === "\\") {
      const command = this.readCommandName();
      return this.parseCommand(command);
    }

    if (/\s/.test(char)) {
      this.consume();
      return createCharNode(" ");
    }

    this.consume();
    return createCharNode(char);
  }

  parseAtomWithScripts() {
    let base = this.parseAtom();
    if (!base) {
      return null;
    }

    let superscript = null;
    let subscript = null;

    while (!this.eof()) {
      const marker = this.peek();
      if (marker !== "^" && marker !== "_") {
        break;
      }
      this.consume();
      const script = this.parseScriptArgument() ?? createCharNode("?");
      if (marker === "^") {
        superscript = script;
      } else {
        subscript = script;
      }
    }

    if (!superscript && !subscript) {
      return base;
    }

    return {
      type: "scripts",
      base,
      superscript,
      subscript,
    };
  }

  parseSequence(stopAtRightBrace = false) {
    const children = [];
    while (!this.eof()) {
      if (stopAtRightBrace && this.peek() === "}") {
        break;
      }
      const before = this.index;
      const node = this.parseAtomWithScripts();
      if (!node) {
        // Avoid skipping the next meaningful token when a command is intentionally ignored (e.g. \left/\right).
        if (this.index === before && !this.eof()) {
          this.consume();
        }
        continue;
      }
      children.push(node);
    }
    return createSequence(children);
  }
}

function measureNode(node, fontSize) {
  if (!node) {
    return { width: 0, height: fontSize * 0.78, depth: fontSize * 0.22 };
  }

  if (node.type === "char") {
    if (node.char === " ") {
      return { width: charAdvance(" ", fontSize), height: 0, depth: 0 };
    }
    const baseWidth = charAdvance(node.char, fontSize);
    const gap = operatorGap(node.char, fontSize);
    return {
      width: baseWidth + gap,
      height: fontSize * 0.78,
      depth: fontSize * 0.22,
    };
  }

  if (node.type === "seq") {
    let width = 0;
    let height = 0;
    let depth = 0;
    let previous = null;
    for (const child of node.children) {
      const metrics = measureNode(child, fontSize);
      if (previous) {
        width += sequenceInterGap(previous, child, fontSize);
      }
      width += metrics.width;
      height = Math.max(height, metrics.height);
      depth = Math.max(depth, metrics.depth);
      previous = child;
    }
    return { width, height, depth };
  }

  if (node.type === "wordop") {
    return measureWordOperator(node, fontSize);
  }

  if (node.type === "scripts") {
    const baseMetrics = measureNode(node.base, fontSize);
    const scriptSize = fontSize * MATH_METRICS.scriptScale;
    const supMetrics = node.superscript ? measureNode(node.superscript, scriptSize) : null;
    const subMetrics = node.subscript ? measureNode(node.subscript, scriptSize) : null;
    const scriptGap = fontSize * MATH_METRICS.scriptGap;

    if (isIntegralOperatorNode(node.base)) {
      const scriptWidth = Math.max(supMetrics?.width ?? 0, subMetrics?.width ?? 0);
      const { scriptOffsetX, supLift, subDrop } = resolveIntegralScriptPlacement(
        baseMetrics,
        fontSize,
        supMetrics,
        subMetrics,
      );
      const width =
        baseMetrics.width +
        (scriptWidth > 0 ? scriptOffsetX + scriptWidth : 0);
      const height = Math.max(
        baseMetrics.height,
        supMetrics ? supLift + supMetrics.height : 0,
      );
      const depth = Math.max(
        baseMetrics.depth,
        subMetrics ? subDrop + subMetrics.depth : 0,
      );
      return { width, height, depth };
    }

    if (isLargeLimitOperatorNode(node.base)) {
      const width =
        Math.max(baseMetrics.width, supMetrics?.width ?? 0, subMetrics?.width ?? 0) + fontSize * 0.08;
      const height =
        baseMetrics.height +
        (supMetrics ? scriptGap + supMetrics.height + supMetrics.depth : 0);
      const depth =
        baseMetrics.depth +
        (subMetrics ? scriptGap + subMetrics.height + subMetrics.depth : 0);
      return { width, height, depth };
    }

    const supLift = Math.max(
      fontSize * MATH_METRICS.scriptSupLift,
      baseMetrics.height * 0.82,
    );
    let subDrop = Math.max(
      fontSize * MATH_METRICS.scriptSubDrop,
      baseMetrics.depth + fontSize * 0.06,
    );
    const supBaselineOffset = -supLift;
    if (supMetrics && subMetrics) {
      const supBottom = supBaselineOffset + supMetrics.depth;
      const subTop = subDrop - subMetrics.height;
      const minClearance = fontSize * MATH_METRICS.scriptMinClearance;
      if (subTop - supBottom < minClearance) {
        subDrop += minClearance - (subTop - supBottom);
      }
    }

    const scriptWidth = Math.max(supMetrics?.width ?? 0, subMetrics?.width ?? 0);
    const width =
      baseMetrics.width +
      (scriptWidth > 0 ? fontSize * MATH_METRICS.scriptAttachGap + scriptWidth : 0);
    const height = Math.max(
      baseMetrics.height,
      supMetrics ? -supBaselineOffset + supMetrics.height : 0,
    );
    const depth = Math.max(
      baseMetrics.depth,
      subMetrics ? subDrop + subMetrics.depth : 0,
    );
    return { width, height, depth };
  }

  if (node.type === "frac") {
    const numeratorSize = fontSize * MATH_METRICS.fracScale;
    const denominatorSize = fontSize * MATH_METRICS.fracScale;
    const numerator = measureNode(node.numerator, numeratorSize);
    const denominator = measureNode(node.denominator, denominatorSize);
    const pad = fontSize * MATH_METRICS.fracPad;
    const gap = fontSize * MATH_METRICS.fracGap;
    const rule = Math.max(1, fontSize * MATH_METRICS.fracRule);
    const axis = fontSize * MATH_METRICS.fracAxis;
    const numBaseline = Math.min(
      -fontSize * MATH_METRICS.fracNumRaise,
      axis - rule * 0.5 - gap - numerator.depth,
    );
    const denBaseline = Math.max(
      fontSize * MATH_METRICS.fracDenDrop,
      axis + rule * 0.5 + gap + denominator.height,
    );
    const topOffset = numBaseline - numerator.height;
    const bottomOffset = denBaseline + denominator.depth;
    return {
      width: Math.max(numerator.width, denominator.width) + pad * 2,
      height: -topOffset,
      depth: bottomOffset,
    };
  }

  if (node.type === "sqrt") {
    const bodySize = fontSize * MATH_METRICS.sqrtBodyScale;
    const body = measureNode(node.body, bodySize);
    return {
      width: fontSize * MATH_METRICS.sqrtLead + body.width + fontSize * 0.08,
      height: Math.max(fontSize * 0.9, body.height + fontSize * 0.17),
      depth: Math.max(fontSize * 0.12, body.depth),
    };
  }

  if (node.type === "delimited") {
    const body = measureNode(node.body, fontSize);
    const totalBody = body.height + body.depth;
    const delimiterScale = clamp(
      totalBody / (fontSize * 1.02),
      MATH_METRICS.delimMinScale,
      MATH_METRICS.delimMaxScale,
    );
    const delimiterSize = fontSize * delimiterScale;
    const leftChar = node.leftDelimiter || "";
    const rightChar = node.rightDelimiter || "";
    const leftWidth = leftChar ? charAdvance(leftChar, delimiterSize) : 0;
    const rightWidth = rightChar ? charAdvance(rightChar, delimiterSize) : 0;
    const sideGap = fontSize * MATH_METRICS.delimGap;
    const width =
      body.width +
      (leftWidth > 0 ? leftWidth + sideGap : 0) +
      (rightWidth > 0 ? sideGap + rightWidth : 0);
    const delimiterHeight = delimiterSize * 0.78;
    const delimiterDepth = delimiterSize * 0.22;
    return {
      width,
      height: Math.max(body.height, delimiterHeight),
      depth: Math.max(body.depth, delimiterDepth),
    };
  }

  if (node.type === "styled") {
    const scaledSize = fontSize * styleScale(node.style);
    const metrics = measureNode(node.body, scaledSize);
    const widthPad = node.style === "mathcal" ? scaledSize * 0.03 : 0;
    return {
      width: metrics.width + widthPad,
      height: metrics.height,
      depth: metrics.depth,
    };
  }

  if (node.type === "matrix") {
    const rows = Array.isArray(node.rows) ? node.rows : [];
    if (!rows.length) {
      return { width: fontSize * 0.6, height: fontSize * 0.78, depth: fontSize * 0.22 };
    }
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const cellMetrics = rows.map((row) => row.map((cell) => measureNode(cell, fontSize)));
    const columnWidths = new Array(columnCount).fill(0);
    const rowHeights = new Array(rows.length).fill(fontSize * 0.78);
    const rowDepths = new Array(rows.length).fill(fontSize * 0.22);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
        const metrics = cellMetrics[rowIndex][colIndex] ?? { width: 0, height: 0, depth: 0 };
        columnWidths[colIndex] = Math.max(columnWidths[colIndex], metrics.width);
        rowHeights[rowIndex] = Math.max(rowHeights[rowIndex], metrics.height);
        rowDepths[rowIndex] = Math.max(rowDepths[rowIndex], metrics.depth);
      }
    }
    const columnGap = fontSize * MATH_METRICS.matrixColGap;
    const rowGap = fontSize * MATH_METRICS.matrixRowGap;
    const innerWidth =
      columnWidths.reduce((sum, width) => sum + width, 0) + columnGap * Math.max(0, columnCount - 1);
    const contentHeight =
      rowHeights.reduce((sum, value) => sum + value, 0) +
      rowDepths.reduce((sum, value) => sum + value, 0) +
      rowGap * Math.max(0, rows.length - 1);
    const delimiterSize = clamp(
      Math.max(fontSize, contentHeight * 0.92),
      fontSize * 0.98,
      fontSize * 2.2,
    );
    const leftDelimiterSize = node.leftDelimiter ? delimiterSize * 1.04 : 0;
    const rightDelimiterSize = node.rightDelimiter ? delimiterSize * 0.98 : 0;
    const leftDelimiterWidth = node.leftDelimiter ? charAdvance(node.leftDelimiter, leftDelimiterSize) : 0;
    const rightDelimiterWidth = node.rightDelimiter ? charAdvance(node.rightDelimiter, rightDelimiterSize) : 0;
    const sideGap = fontSize * MATH_METRICS.matrixDelimGap;
    return {
      width:
        innerWidth +
        (node.leftDelimiter ? leftDelimiterWidth + sideGap : 0) +
        (node.rightDelimiter ? rightDelimiterWidth + sideGap : 0),
      height: Math.max(contentHeight * 0.56, leftDelimiterSize * 0.78, rightDelimiterSize * 0.78),
      depth: Math.max(contentHeight * 0.44, leftDelimiterSize * 0.22, rightDelimiterSize * 0.22),
    };
  }

  return {
    width: fontSize * 0.6,
    height: fontSize * 0.78,
    depth: fontSize * 0.22,
  };
}

function emitNode(node, x, baseline, fontSize, items, activeStyle = null) {
  if (!node) {
    return x;
  }

  if (node.type === "char") {
    const resolvedChar = resolveStyledChar(node.char, activeStyle);
    const baseWidth = charAdvance(resolvedChar, fontSize);
    const gap = operatorGap(resolvedChar, fontSize);
    const width = baseWidth + gap;
    if (resolvedChar !== " ") {
      items.push({
        type: "char",
        char: resolvedChar,
        x,
        y: baseline - fontSize * 0.78,
        fontSize,
        style: activeStyle,
      });
    }
    return x + width;
  }

  if (node.type === "seq") {
    let cursorX = x;
    let previous = null;
    for (const child of node.children) {
      if (previous) {
        cursorX += sequenceInterGap(previous, child, fontSize);
      }
      cursorX = emitNode(child, cursorX, baseline, fontSize, items, activeStyle);
      previous = child;
    }
    return cursorX;
  }

  if (node.type === "wordop") {
    const letterSize = fontSize * 0.96;
    const letters = Array.from(node.text ?? "");
    let cursorX = x;
    for (let i = 0; i < letters.length; i += 1) {
      const char = letters[i];
      items.push({
        type: "char",
        char,
        x: cursorX,
        y: baseline - letterSize * 0.78,
        fontSize: letterSize,
        style: null,
      });
      cursorX += charAdvance(char, letterSize) * 0.93;
      if (i < letters.length - 1) {
        cursorX += letterSize * 0.014;
      }
    }
    return cursorX;
  }

  if (node.type === "scripts") {
    const baseMetrics = measureNode(node.base, fontSize);
    const metrics = measureNode(node, fontSize);
    const scriptSize = fontSize * MATH_METRICS.scriptScale;

    if (isIntegralOperatorNode(node.base)) {
      const endX = emitNode(node.base, x, baseline, fontSize, items, activeStyle);
      const supMetrics = node.superscript ? measureNode(node.superscript, scriptSize) : null;
      const subMetrics = node.subscript ? measureNode(node.subscript, scriptSize) : null;
      const scriptWidth = Math.max(supMetrics?.width ?? 0, subMetrics?.width ?? 0);
      const { scriptOffsetX, subDrop, supBaselineOffset } = resolveIntegralScriptPlacement(
        baseMetrics,
        fontSize,
        supMetrics,
        subMetrics,
      );
      const scriptX = endX + scriptOffsetX;

      if (node.superscript) {
        emitNode(
          node.superscript,
          scriptX,
          baseline + supBaselineOffset,
          scriptSize,
          items,
          activeStyle,
        );
      }
      if (node.subscript) {
        emitNode(
          node.subscript,
          scriptX,
          baseline + subDrop,
          scriptSize,
          items,
          activeStyle,
        );
      }

      return Math.max(endX, scriptX + scriptWidth, x + metrics.width);
    }

    if (isLargeLimitOperatorNode(node.base)) {
      const supMetrics = node.superscript ? measureNode(node.superscript, scriptSize) : null;
      const subMetrics = node.subscript ? measureNode(node.subscript, scriptSize) : null;
      const scriptGap = fontSize * MATH_METRICS.scriptGap;
      const baseX = x + (metrics.width - baseMetrics.width) * 0.5;
      emitNode(node.base, baseX, baseline, fontSize, items, activeStyle);

      if (node.superscript && supMetrics) {
        const supX = x + (metrics.width - supMetrics.width) * 0.5;
        const supBaseline = baseline - baseMetrics.height - scriptGap - supMetrics.depth;
        emitNode(node.superscript, supX, supBaseline, scriptSize, items, activeStyle);
      }
      if (node.subscript && subMetrics) {
        const subX = x + (metrics.width - subMetrics.width) * 0.5;
        const subBaseline = baseline + baseMetrics.depth + scriptGap + subMetrics.height;
        emitNode(node.subscript, subX, subBaseline, scriptSize, items, activeStyle);
      }

      return x + metrics.width;
    }

    const endX = emitNode(node.base, x, baseline, fontSize, items, activeStyle);
    const scriptWidth = Math.max(
      node.superscript ? measureNode(node.superscript, scriptSize).width : 0,
      node.subscript ? measureNode(node.subscript, scriptSize).width : 0,
    );
    const supMetrics = node.superscript ? measureNode(node.superscript, scriptSize) : null;
    const subMetrics = node.subscript ? measureNode(node.subscript, scriptSize) : null;
    const supLift = Math.max(
      fontSize * MATH_METRICS.scriptSupLift,
      baseMetrics.height * 0.82,
    );
    let subDrop = Math.max(
      fontSize * MATH_METRICS.scriptSubDrop,
      baseMetrics.depth + fontSize * 0.06,
    );
    const supBaselineOffset = -supLift;
    if (supMetrics && subMetrics) {
      const supBottom = supBaselineOffset + supMetrics.depth;
      const subTop = subDrop - subMetrics.height;
      const minClearance = fontSize * MATH_METRICS.scriptMinClearance;
      if (subTop - supBottom < minClearance) {
        subDrop += minClearance - (subTop - supBottom);
      }
    }
    const scriptX = endX + fontSize * MATH_METRICS.scriptAttachGap;

    if (node.superscript) {
      emitNode(
        node.superscript,
        scriptX,
        baseline + supBaselineOffset,
        scriptSize,
        items,
        activeStyle,
      );
    }
    if (node.subscript) {
      emitNode(
        node.subscript,
        scriptX,
        baseline + subDrop,
        scriptSize,
        items,
        activeStyle,
      );
    }

    return Math.max(endX, scriptX + scriptWidth, x + metrics.width);
  }

  if (node.type === "frac") {
    const metrics = measureNode(node, fontSize);
    const numeratorSize = fontSize * MATH_METRICS.fracScale;
    const denominatorSize = fontSize * MATH_METRICS.fracScale;
    const numeratorMetrics = measureNode(node.numerator, numeratorSize);
    const denominatorMetrics = measureNode(node.denominator, denominatorSize);
    const pad = fontSize * MATH_METRICS.fracPad;
    const gap = fontSize * MATH_METRICS.fracGap;
    const rule = Math.max(1, fontSize * MATH_METRICS.fracRule);
    const axis = fontSize * MATH_METRICS.fracAxis;
    const innerWidth = Math.max(numeratorMetrics.width, denominatorMetrics.width);
    const lineY = baseline + axis;
    const numBaseline = Math.min(
      baseline - fontSize * MATH_METRICS.fracNumRaise,
      lineY - rule * 0.5 - gap - numeratorMetrics.depth,
    );
    const denBaseline = Math.max(
      baseline + fontSize * MATH_METRICS.fracDenDrop,
      lineY + rule * 0.5 + gap + denominatorMetrics.height,
    );

    const numX = x + pad + (innerWidth - numeratorMetrics.width) * 0.5;
    const denX = x + pad + (innerWidth - denominatorMetrics.width) * 0.5;

    emitNode(node.numerator, numX, numBaseline, numeratorSize, items, activeStyle);
    emitNode(node.denominator, denX, denBaseline, denominatorSize, items, activeStyle);
    items.push({
      type: "line",
      x: x + pad,
      y: lineY,
      width: innerWidth,
      thickness: rule,
    });

    return x + metrics.width;
  }

  if (node.type === "delimited") {
    const bodyMetrics = measureNode(node.body, fontSize);
    const totalBody = bodyMetrics.height + bodyMetrics.depth;
    const delimiterScale = clamp(
      totalBody / (fontSize * 1.02),
      MATH_METRICS.delimMinScale,
      MATH_METRICS.delimMaxScale,
    );
    const delimiterSize = fontSize * delimiterScale;
    const leftChar = node.leftDelimiter || "";
    const rightChar = node.rightDelimiter || "";
    const leftWidth = leftChar ? charAdvance(leftChar, delimiterSize) : 0;
    const rightWidth = rightChar ? charAdvance(rightChar, delimiterSize) : 0;
    const sideGap = fontSize * MATH_METRICS.delimGap;
    const bodyCenterY = baseline + (bodyMetrics.depth - bodyMetrics.height) * 0.5;
    const delimiterBaseline = bodyCenterY + delimiterSize * 0.28;

    let cursorX = x;
    if (leftChar) {
      items.push({
        type: "char",
        char: leftChar,
        x: cursorX,
        y: delimiterBaseline - delimiterSize * 0.78,
        fontSize: delimiterSize,
        style: activeStyle,
      });
      cursorX += leftWidth + sideGap;
    }

    cursorX = emitNode(node.body, cursorX, baseline, fontSize, items, activeStyle);

    if (rightChar) {
      cursorX += sideGap;
      items.push({
        type: "char",
        char: rightChar,
        x: cursorX,
        y: delimiterBaseline - delimiterSize * 0.78,
        fontSize: delimiterSize,
        style: activeStyle,
      });
      cursorX += rightWidth;
    }

    return cursorX;
  }

  if (node.type === "matrix") {
    const rows = Array.isArray(node.rows) ? node.rows : [];
    if (!rows.length) {
      return x;
    }

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const cellMetrics = rows.map((row) => row.map((cell) => measureNode(cell, fontSize)));
    const columnWidths = new Array(columnCount).fill(0);
    const rowHeights = new Array(rows.length).fill(fontSize * 0.78);
    const rowDepths = new Array(rows.length).fill(fontSize * 0.22);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
        const metrics = cellMetrics[rowIndex][colIndex] ?? { width: 0, height: 0, depth: 0 };
        columnWidths[colIndex] = Math.max(columnWidths[colIndex], metrics.width);
        rowHeights[rowIndex] = Math.max(rowHeights[rowIndex], metrics.height);
        rowDepths[rowIndex] = Math.max(rowDepths[rowIndex], metrics.depth);
      }
    }

    const columnGap = fontSize * MATH_METRICS.matrixColGap;
    const rowGap = fontSize * MATH_METRICS.matrixRowGap;
    const innerWidth =
      columnWidths.reduce((sum, width) => sum + width, 0) + columnGap * Math.max(0, columnCount - 1);
    const totalContentHeight =
      rowHeights.reduce((sum, value) => sum + value, 0) +
      rowDepths.reduce((sum, value) => sum + value, 0) +
      rowGap * Math.max(0, rows.length - 1);
    const delimiterSize = clamp(
      Math.max(fontSize, totalContentHeight * 0.92),
      fontSize * 0.98,
      fontSize * 2.2,
    );
    const leftDelimiterSize = node.leftDelimiter ? delimiterSize * 1.04 : 0;
    const rightDelimiterSize = node.rightDelimiter ? delimiterSize * 0.98 : 0;
    const leftDelimiterWidth = node.leftDelimiter ? charAdvance(node.leftDelimiter, leftDelimiterSize) : 0;
    const rightDelimiterWidth = node.rightDelimiter ? charAdvance(node.rightDelimiter, rightDelimiterSize) : 0;
    const sideGap = fontSize * MATH_METRICS.matrixDelimGap;

    let cursorX = x;
    const leftDelimiterTilt = (stableNoise(rows.length, columnCount, 1) - 0.5) * fontSize * 0.08;
    const rightDelimiterTilt = (stableNoise(rows.length, columnCount, 6) - 0.5) * fontSize * 0.07;
    if (node.leftDelimiter) {
      items.push({
        type: "char",
        char: node.leftDelimiter,
        x: cursorX,
        y: baseline - leftDelimiterSize * 0.78 + leftDelimiterTilt,
        fontSize: leftDelimiterSize,
        style: activeStyle,
      });
      cursorX += leftDelimiterWidth + sideGap;
    }

    let contentTop = baseline - totalContentHeight * 0.52;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowBaseline =
        contentTop + rowHeights[rowIndex] + (stableNoise(rowIndex + 1, rows.length, 2) - 0.5) * fontSize * 0.05;
      let cellX = cursorX;
      for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
        const cell = rows[rowIndex][colIndex];
        const metrics = cellMetrics[rowIndex][colIndex] ?? { width: 0, height: 0, depth: 0 };
        if (cell) {
          const offsetX =
            (columnWidths[colIndex] - metrics.width) * 0.5 +
            (stableNoise(rowIndex + 1, colIndex + 1, 3) - 0.5) * fontSize * 0.07;
          const offsetY = (stableNoise(rowIndex + 1, colIndex + 1, 4) - 0.5) * fontSize * 0.04;
          emitNode(cell, cellX + offsetX, rowBaseline + offsetY, fontSize, items, activeStyle);
        }
        cellX += columnWidths[colIndex] + (colIndex < columnCount - 1 ? columnGap : 0);
      }
      contentTop +=
        rowHeights[rowIndex] +
        rowDepths[rowIndex] +
        rowGap +
        (stableNoise(rowIndex + 1, rows.length, 5) - 0.5) * fontSize * 0.03;
    }

    cursorX += innerWidth;
    if (node.rightDelimiter) {
      cursorX += sideGap;
      items.push({
        type: "char",
        char: node.rightDelimiter,
        x: cursorX,
        y: baseline - rightDelimiterSize * 0.78 - rightDelimiterTilt * 0.6,
        fontSize: rightDelimiterSize,
        style: activeStyle,
      });
      cursorX += rightDelimiterWidth;
    }

    return cursorX;
  }

  if (node.type === "sqrt") {
    const bodySize = fontSize * MATH_METRICS.sqrtBodyScale;
    const bodyMetrics = measureNode(node.body, bodySize);
    const radicalWidth = fontSize * MATH_METRICS.sqrtLead;
    const radicalBaseline = baseline + fontSize * 0.02;

    items.push({
      type: "char",
      char: "√",
      x,
      y: radicalBaseline - fontSize * 0.78,
      fontSize: fontSize * 1.02,
      style: activeStyle,
    });

    const bodyX = x + radicalWidth;
    emitNode(node.body, bodyX, baseline, bodySize, items, activeStyle);
    items.push({
      type: "line",
      x: bodyX,
      y: baseline - bodyMetrics.height - fontSize * 0.048,
      width: bodyMetrics.width + fontSize * 0.08,
      thickness: Math.max(1, fontSize * 0.043),
    });

    return x + measureNode(node, fontSize).width;
  }

  if (node.type === "styled") {
    const scaledSize = fontSize * styleScale(node.style);
    return emitNode(node.body, x, baseline, scaledSize, items, node.style);
  }

  return x;
}

function normalizeLayoutItems(items) {
  if (!items.length) {
    return {
      items: [],
      width: 0,
      height: 0,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    if (item.type === "char") {
      const width = charAdvance(item.char, item.fontSize) + operatorGap(item.char, item.fontSize);
      const height = item.fontSize;
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + width);
      maxY = Math.max(maxY, item.y + height);
    } else if (item.type === "line") {
      const top = item.y - item.thickness * 0.5;
      const bottom = item.y + item.thickness * 0.5;
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, bottom);
    }
  }

  const shiftX = Number.isFinite(minX) ? -minX : 0;
  const shiftY = Number.isFinite(minY) ? -minY : 0;

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

export function isLatexMathLine(line) {
  const text = (line ?? "").trim();
  if (!text) {
    return false;
  }
  if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\s]+$/u.test(text)) {
    return false;
  }

  // Inline math embedded in prose should remain prose line layout.
  if (/\$[^$]+\$/.test(text)) {
    const proseOutsideMath = text.replace(/\$[^$]*\$/g, "").replace(/[ \t]+/g, "").trim();
    if (proseOutsideMath.length > 0) {
      return false;
    }
  }

  if (/\p{Script=Han}/u.test(text)) {
    const explicitDisplay = /^\s*(\\\[|\$\$)/.test(text);
    const mathCommandCount = (text.match(/\\[A-Za-z]+/g) || []).length;
    const mathSymbolCount = (text.match(/[∑∫√π∞≤≥≠≈±×÷αβγδεθλμνρσφω^_=+\-*/<>]/g) || []).length;
    const hanCount = (text.match(/\p{Script=Han}/gu) || []).length;
    if (!explicitDisplay && mathCommandCount === 0 && hanCount >= 2 && mathSymbolCount <= 6) {
      return false;
    }
  }

  // Explicit math unicode or script markers.
  if (/[∑∫√π∞≤≥≠≈±×÷αβγδεθλμνρσφω^_]/.test(text)) {
    return true;
  }

  // Equations without latex commands.
  if (/[=+\-*/<>]/.test(text) && !/\\[A-Za-z]+/.test(text)) {
    return true;
  }

  // Latex command lines should be treated as math only when they include math commands.
  const commands = Array.from(text.matchAll(/\\([A-Za-z]+)/g), (match) => match[1]);
  if (!commands.length) {
    return false;
  }
  return commands.some((command) => MATH_COMMANDS.has(command));
}

export function layoutLatexMathLine(line, options = {}) {
  const fontSize = options.fontSize ?? 72;
  const parser = new LatexParser(line);
  const ast = parser.parseSequence(false);
  if (parser.unsupported || !ast.children.length) {
    return null;
  }
  const baseline = fontSize * 0.9;
  const items = [];
  emitNode(ast, 0, baseline, fontSize, items);
  return normalizeLayoutItems(items);
}
