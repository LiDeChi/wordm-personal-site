const COMMAND_REPLACEMENTS = [
  ["\\\\rightarrow", "→"],
  ["\\\\leftarrow", "←"],
  ["\\\\to", "→"],
  ["\\\\cdots", "⋯"],
  ["\\\\ldots", "⋯"],
  ["\\\\times", "×"],
  ["\\\\cdot", "·"],
  ["\\\\div", "÷"],
  ["\\\\pm", "±"],
  ["\\\\leq", "≤"],
  ["\\\\le", "≤"],
  ["\\\\geq", "≥"],
  ["\\\\ge", "≥"],
  ["\\\\neq", "≠"],
  ["\\\\ne", "≠"],
  ["\\\\sum", "Σ"],
  ["\\\\int", "∫"],
  ["\\\\pi", "π"],
  ["\\\\infty", "∞"],
  ["\\\\partial", "∂"],
  ["\\\\Delta", "∆"],
  ["\\\\approx", "≈"],
  ["\\\\alpha", "α"],
  ["\\\\beta", "β"],
  ["\\\\gamma", "γ"],
  ["\\\\delta", "δ"],
  ["\\\\epsilon", "ε"],
  ["\\\\varepsilon", "ε"],
  ["\\\\zeta", "ζ"],
  ["\\\\eta", "η"],
  ["\\\\theta", "θ"],
  ["\\\\vartheta", "ϑ"],
  ["\\\\iota", "ι"],
  ["\\\\kappa", "κ"],
  ["\\\\lambda", "λ"],
  ["\\\\mu", "μ"],
  ["\\\\nu", "ν"],
  ["\\\\xi", "ξ"],
  ["\\\\rho", "ρ"],
  ["\\\\sigma", "σ"],
  ["\\\\phi", "φ"],
  ["\\\\chi", "χ"],
  ["\\\\psi", "ψ"],
  ["\\\\omega", "ω"],
  ["\\\\tau", "τ"],
  ["\\\\Gamma", "Γ"],
  ["\\\\Lambda", "Λ"],
  ["\\\\Xi", "Ξ"],
  ["\\\\Phi", "Φ"],
  ["\\\\Psi", "Ψ"],
  ["\\\\Omega", "Ω"],
  ["\\\\nabla", "∇"],
];

function replaceAll(text, from, to) {
  return text.replace(new RegExp(from, "g"), to);
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

function skipSpaces(text, startIndex) {
  let index = startIndex;
  while (index < text.length && /\s/.test(text[index])) {
    index += 1;
  }
  return index;
}

function expandStructuredCommands(text, depth = 0) {
  if (depth > 6) {
    return text;
  }

  let output = "";
  let i = 0;

  while (i < text.length) {
    if (text.startsWith("\\frac", i)) {
      let cursor = skipSpaces(text, i + 5);
      const numerator = readBalancedGroup(text, cursor);
      if (!numerator) {
        output += text[i];
        i += 1;
        continue;
      }

      cursor = skipSpaces(text, numerator.endIndex);
      const denominator = readBalancedGroup(text, cursor);
      if (!denominator) {
        output += text[i];
        i += 1;
        continue;
      }

      const top = expandStructuredCommands(numerator.content, depth + 1);
      const bottom = expandStructuredCommands(denominator.content, depth + 1);
      output += `(${top})/(${bottom})`;
      i = denominator.endIndex;
      continue;
    }

    if (text.startsWith("\\sqrt", i)) {
      const cursor = skipSpaces(text, i + 5);
      const body = readBalancedGroup(text, cursor);
      if (!body) {
        output += text[i];
        i += 1;
        continue;
      }
      const core = expandStructuredCommands(body.content, depth + 1);
      output += `√(${core})`;
      i = body.endIndex;
      continue;
    }

    output += text[i];
    i += 1;
  }

  return output;
}

function unwrapTextCommands(text) {
  let output = text;
  output = output.replace(/\\text\s*\{([^{}]*)\}/g, "$1");
  output = output.replace(/\\mathrm\s*\{([^{}]*)\}/g, "$1");
  output = output.replace(/\\operatorname\s*\{([^{}]*)\}/g, "$1");
  return output;
}

export function normalizeLatexInput(inputText, enableLatex = true) {
  if (!enableLatex) {
    return {
      text: inputText,
      transformed: false,
      unknownCommands: [],
    };
  }

  let text = inputText ?? "";
  const before = text;
  const unknownCommands = new Set();

  text = text.replace(/\$\$/g, "");
  text = text.replace(/\$/g, "");
  text = text.replace(/\\left/g, "");
  text = text.replace(/\\right/g, "");
  text = text.replace(/\\\\/g, "\n");
  text = text.replace(/\\qquad/g, "   ");
  text = text.replace(/\\quad/g, "  ");
  text = text.replace(/\\,/g, " ");
  text = text.replace(/\\;/g, " ");
  text = text.replace(/\\:/g, " ");
  text = text.replace(/\\!/g, "");
  text = text.replace(/\\ /g, " ");

  text = expandStructuredCommands(text);
  text = unwrapTextCommands(text);

  for (const [command, replacement] of COMMAND_REPLACEMENTS) {
    text = replaceAll(text, command, replacement);
  }

  text = text.replace(/\\([a-zA-Z]+)/g, (_full, name) => {
    unknownCommands.add(name);
    return "";
  });

  text = text.replace(/\\([{}_^\\])/g, "$1");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n[ \t]+/g, "\n");

  return {
    text,
    transformed: text !== before,
    unknownCommands: Array.from(unknownCommands),
  };
}
