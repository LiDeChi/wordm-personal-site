const HAN_REGEX = /\p{Script=Han}/u;
const CJK_PUNCT_REGEX = /[、，。：；（）【】“”‘’？！《》]/;

const MATH_SYMBOLS = new Set([
  "+",
  "-",
  "=",
  "·",
  "*",
  "/",
  "\\",
  "^",
  "_",
  "<",
  ">",
  "≤",
  "≥",
  "≠",
  "±",
  "×",
  "÷",
  "√",
  "∑",
  "Σ",
  "∫",
  "π",
  "∞",
  "∂",
  "∆",
  "≈",
  "→",
  "←",
  "α",
  "β",
  "γ",
  "δ",
  "ε",
  "ζ",
  "η",
  "θ",
  "ϑ",
  "ι",
  "κ",
  "λ",
  "μ",
  "ν",
  "ξ",
  "ρ",
  "σ",
  "φ",
  "χ",
  "ψ",
  "ω",
  "τ",
  "Γ",
  "Λ",
  "Ξ",
  "Φ",
  "Ψ",
  "Ω",
]);

export function classifyChar(char) {
  if (char === " " || char === "\t") {
    return "space";
  }

  if (char === "\n" || char === "\r") {
    return "newline";
  }

  if (HAN_REGEX.test(char)) {
    return "han";
  }

  if (CJK_PUNCT_REGEX.test(char)) {
    return "latin";
  }

  if (MATH_SYMBOLS.has(char)) {
    return "math";
  }

  if (/[\u0000-\u007f]/.test(char)) {
    return "latin";
  }

  return "other";
}
