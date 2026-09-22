// LaTeX to Unicode mathematical notation converter
// Used for high-fidelity canvas labels, tooltips, and text contexts

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'j': 'ʲ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
  'g': 'ᵍ', 'h': 'ʰ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ',
  'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ',
  'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ',
  'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ',
  '*': '﹡'
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ'
};

const SYMBOL_MAP: [RegExp, string][] = [
  // Number Sets
  [/\\mathbb\{N\}/g, 'ℕ'],
  [/\\mathbb\{Z\}/g, 'ℤ'],
  [/\\mathbb\{Q\}/g, 'ℚ'],
  [/\\mathbb\{R\}/g, 'ℝ'],
  [/\\mathbb\{C\}/g, 'ℂ'],
  [/\\mathbb\{P\}/g, 'ℙ'],
  [/\\mathbb\{H\}/g, 'ℍ'],
  [/\\mathbb\{F\}/g, '𝔽'],

  // Greek Letters (Lowercase)
  [/\\alpha(?![a-zA-Z])/g, 'α'],
  [/\\beta(?![a-zA-Z])/g, 'β'],
  [/\\gamma(?![a-zA-Z])/g, 'γ'],
  [/\\delta(?![a-zA-Z])/g, 'δ'],
  [/\\epsilon(?![a-zA-Z])|\\varepsilon(?![a-zA-Z])/g, 'ε'],
  [/\\zeta(?![a-zA-Z])/g, 'ζ'],
  [/\\eta(?![a-zA-Z])/g, 'η'],
  [/\\theta(?![a-zA-Z])|\\vartheta(?![a-zA-Z])/g, 'θ'],
  [/\\iota(?![a-zA-Z])/g, 'ι'],
  [/\\kappa(?![a-zA-Z])/g, 'κ'],
  [/\\lambda(?![a-zA-Z])/g, 'λ'],
  [/\\mu(?![a-zA-Z])/g, 'μ'],
  [/\\nu(?![a-zA-Z])/g, 'ν'],
  [/\\xi(?![a-zA-Z])/g, 'ξ'],
  [/\\pi(?![a-zA-Z])|\\varpi(?![a-zA-Z])/g, 'π'],
  [/\\rho(?![a-zA-Z])|\\varrho(?![a-zA-Z])/g, 'ρ'],
  [/\\sigma(?![a-zA-Z])|\\varsigma(?![a-zA-Z])/g, 'σ'],
  [/\\tau(?![a-zA-Z])/g, 'τ'],
  [/\\upsilon(?![a-zA-Z])/g, 'υ'],
  [/\\phi(?![a-zA-Z])|\\varphi(?![a-zA-Z])/g, 'φ'],
  [/\\chi(?![a-zA-Z])/g, 'χ'],
  [/\\psi(?![a-zA-Z])/g, 'ψ'],
  [/\\omega(?![a-zA-Z])/g, 'ω'],

  // Greek Letters (Uppercase)
  [/\\Gamma(?![a-zA-Z])/g, 'Γ'],
  [/\\Delta(?![a-zA-Z])/g, 'Δ'],
  [/\\Theta(?![a-zA-Z])/g, 'Θ'],
  [/\\Lambda(?![a-zA-Z])/g, 'Λ'],
  [/\\Xi(?![a-zA-Z])/g, 'Ξ'],
  [/\\Pi(?![a-zA-Z])/g, 'Π'],
  [/\\Sigma(?![a-zA-Z])/g, 'Σ'],
  [/\\Upsilon(?![a-zA-Z])/g, 'Υ'],
  [/\\Phi(?![a-zA-Z])/g, 'Φ'],
  [/\\Psi(?![a-zA-Z])/g, 'Ψ'],
  [/\\Omega(?![a-zA-Z])/g, 'Ω'],

  // Logic & Quantifiers
  [/\\forall(?![a-zA-Z])/g, '∀'],
  [/\\exists(?![a-zA-Z])/g, '∃'],
  [/\\nexists(?![a-zA-Z])/g, '∄'],
  [/\\neg(?![a-zA-Z])|\\lnot(?![a-zA-Z])/g, '¬'],
  [/\\land(?![a-zA-Z])|\\wedge(?![a-zA-Z])/g, '∧'],
  [/\\lor(?![a-zA-Z])|\\vee(?![a-zA-Z])/g, '∨'],
  [/\\implies(?![a-zA-Z])|\\Longrightarrow(?![a-zA-Z])/g, ' ⟹ '],
  [/\\impliedby(?![a-zA-Z])|\\Longleftarrow(?![a-zA-Z])/g, ' ⟸ '],
  [/\\iff(?![a-zA-Z])|\\Longleftrightarrow(?![a-zA-Z])/g, ' ⟺ '],
  [/\\to(?![a-zA-Z])|\\rightarrow(?![a-zA-Z])/g, ' → '],
  [/\\gets(?![a-zA-Z])|\\leftarrow(?![a-zA-Z])/g, ' ← '],
  [/\\leftrightarrow(?![a-zA-Z])/g, ' ↔ '],
  [/\\Rightarrow(?![a-zA-Z])/g, ' ⇒ '],
  [/\\Leftarrow(?![a-zA-Z])/g, ' ⇐ '],
  [/\\Leftrightarrow(?![a-zA-Z])/g, ' ⇔ '],
  [/\\mapsto(?![a-zA-Z])/g, ' ↦ '],
  [/\\uparrow(?![a-zA-Z])/g, '↑'],
  [/\\downarrow(?![a-zA-Z])/g, '↓'],
  [/\\updownarrow(?![a-zA-Z])/g, '↕'],
  [/\\nearrow(?![a-zA-Z])/g, '↗'],
  [/\\searrow(?![a-zA-Z])/g, '↘'],

  // Set Operations
  [/\\in(?![a-zA-Z])/g, ' ∈ '],
  [/\\notin(?![a-zA-Z])/g, ' ∉ '],
  [/\\ni(?![a-zA-Z])|\\owns(?![a-zA-Z])/g, ' ∋ '],
  [/\\subset(?![a-zA-Z])/g, ' ⊂ '],
  [/\\subseteq(?![a-zA-Z])/g, ' ⊆ '],
  [/\\supset(?![a-zA-Z])/g, ' ⊃ '],
  [/\\supseteq(?![a-zA-Z])/g, ' ⊇ '],
  [/\\subsetneq(?![a-zA-Z])/g, ' ⊊ '],
  [/\\supsetneq(?![a-zA-Z])/g, ' ⊋ '],
  [/\\cap(?![a-zA-Z])/g, ' ∩ '],
  [/\\cup(?![a-zA-Z])/g, ' ∪ '],
  [/\\setminus(?![a-zA-Z])/g, ' ∖ '],
  [/\\emptyset(?![a-zA-Z])|\\varnothing(?![a-zA-Z])/g, '∅'],
  [/\\aleph(?![a-zA-Z])/g, 'ℵ'],

  // Relational Operators
  [/\\neq(?![a-zA-Z])|\\ne(?![a-zA-Z])/g, ' ≠ '],
  [/\\le(?![a-zA-Z])|\\leq(?![a-zA-Z])/g, ' ≤ '],
  [/\\ge(?![a-zA-Z])|\\geq(?![a-zA-Z])/g, ' ≥ '],
  [/\\approx(?![a-zA-Z])/g, ' ≈ '],
  [/\\sim(?![a-zA-Z])/g, ' ∼ '],
  [/\\simeq(?![a-zA-Z])/g, ' ≃ '],
  [/\\cong(?![a-zA-Z])/g, ' ≅ '],
  [/\\equiv(?![a-zA-Z])/g, ' ≡ '],
  [/\\propto(?![a-zA-Z])/g, ' ∝ '],
  [/\\ll(?![a-zA-Z])/g, ' ≪ '],
  [/\\gg(?![a-zA-Z])/g, ' ≫ '],
  [/\\parallel(?![a-zA-Z])/g, ' ∥ '],
  [/\\perp(?![a-zA-Z])/g, ' ⊥ '],

  // Arithmetic, Calculus & Functions
  [/\\times(?![a-zA-Z])/g, '×'],
  [/\\cdot(?![a-zA-Z])/g, '·'],
  [/\\div(?![a-zA-Z])/g, '÷'],
  [/\\pm(?![a-zA-Z])/g, '±'],
  [/\\mp(?![a-zA-Z])/g, '∓'],
  [/\\ast(?![a-zA-Z])/g, '∗'],
  [/\\star(?![a-zA-Z])/g, '⋆'],
  [/\\circ(?![a-zA-Z])/g, '∘'],
  [/\\bullet(?![a-zA-Z])/g, '•'],
  [/\\oplus(?![a-zA-Z])/g, '⊕'],
  [/\\otimes(?![a-zA-Z])/g, '⊗'],
  [/\\odot(?![a-zA-Z])/g, '⊙'],
  [/\\infty(?![a-zA-Z])/g, '∞'],
  [/\\sum(?![a-zA-Z])/g, '∑'],
  [/\\prod(?![a-zA-Z])/g, '∏'],
  [/\\coprod(?![a-zA-Z])/g, '∐'],
  [/\\int(?![a-zA-Z])/g, '∫'],
  [/\\iint(?![a-zA-Z])/g, '∬'],
  [/\\iiint(?![a-zA-Z])/g, '∭'],
  [/\\oint(?![a-zA-Z])/g, '∮'],
  [/\\partial(?![a-zA-Z])/g, '∂'],
  [/\\nabla(?![a-zA-Z])/g, '∇'],
  [/\\prime(?![a-zA-Z])/g, '′'],
  [/\\Im(?![a-zA-Z])/g, 'Im'],
  [/\\Re(?![a-zA-Z])/g, 'Re'],

  // Dots
  [/\\cdots(?![a-zA-Z])/g, '⋯'],
  [/\\ldots(?![a-zA-Z])/g, '…'],
  [/\\ddots(?![a-zA-Z])/g, '⋱'],
  [/\\vdots(?![a-zA-Z])/g, '⋮'],

  // Brackets & Delimiters
  [/\\langle(?![a-zA-Z])/g, '⟨'],
  [/\\rangle(?![a-zA-Z])/g, '⟩'],
  [/\\lfloor(?![a-zA-Z])/g, '⌊'],
  [/\\rfloor(?![a-zA-Z])/g, '⌋'],
  [/\\lceil(?![a-zA-Z])/g, '⌈'],
  [/\\rceil(?![a-zA-Z])/g, '⌉'],
  [/\\\|/g, '‖']
];

export function latexToUnicode(text: string): string {
  if (!text) return '';
  let result = text;

  // 0. Clean and normalize glued LaTeX commands (e.g. \congImf -> \cong Imf, \inX -> \in X, \alpha1 -> \alpha 1)
  result = result.replace(/\\([a-zA-Z]+)([A-Z0-9])/g, '\\$1 $2');

  // 1. Temporarily protect literal escaped dollar signs \$
  result = result.replace(/\\\$/g, '\uE000');

  // 2. Strip display/inline math delimiters: $$...$$, $...$, \(...\), \[...\]
  result = result.replace(/\$\$|\$|\\\(|\\\)|\\\[|\\\]/g, '');

  // 3. Normalize brackets: \left( -> (, \right) -> ), \left. -> '', etc.
  result = result
    .replace(/\\left\s*\(/g, '(')
    .replace(/\\right\s*\)/g, ')')
    .replace(/\\left\s*\[/g, '[')
    .replace(/\\right\s*\]/g, ']')
    .replace(/\\left\s*\\\{/g, '{')
    .replace(/\\right\s*\\\}/g, '}')
    .replace(/\\left\s*\|/g, '|')
    .replace(/\\right\s*\|/g, '|')
    .replace(/\\(?:left|right)\s*\./g, '');

  // 4. Strip text and styling macros: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}, etc.
  // Preserve spacing if glued to preceding command or token
  result = result.replace(/(\\?[a-zA-Z0-9]+)?\\(?:text|mathrm|mathbf|mathit|mathcal|mathscr|bm|boldsymbol|operatorname)\{([^{}]+)\}/g, (_, prefix, content) => {
    return prefix ? `${prefix} ${content}` : content;
  });

  // 4.1 Strip backslash from standard mathematical function names
  result = result.replace(/\\(lim|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|lg|log|exp|deg|det|dim|ker|hom|gcd|max|min|sup|inf)(?![a-zA-Z])/g, '$1');

  // 5. Convert roots: \sqrt[n]{x} -> ⁿ√(x), \sqrt{x} -> √(x)
  result = result.replace(/\\sqrt\[([^{}\]]+)\]\{([^{}]+)\}/g, (_, deg, val) => {
    const supDeg = deg.split('').map((c: string) => SUPERSCRIPT_MAP[c] || c).join('');
    return `${supDeg}√(${val})`;
  });
  result = result.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 6. Convert accents: \vec{x} -> x⃗, \hat{x} -> x̂, \bar{x} -> x̄, \dot{x} -> ẋ
  result = result
    .replace(/\\vec\{([^{}]+)\}/g, '$1\u20D7')
    .replace(/\\hat\{([^{}]+)\}/g, '$1\u0302')
    .replace(/\\bar\{([^{}]+)\}|\\overline\{([^{}]+)\}/g, '$1$2\u0304')
    .replace(/\\dot\{([^{}]+)\}/g, '$1\u0307')
    .replace(/\\ddot\{([^{}]+)\}/g, '$1\u0308')
    .replace(/\\tilde\{([^{}]+)\}/g, '$1\u0303');

  // 7. Convert fractions iteratively: \frac{a}{b} -> (a/b)
  let prevResult = '';
  let iterations = 0;
  while (result !== prevResult && iterations < 5) {
    prevResult = result;
    iterations++;
    result = result.replace(/\\(?:frac|dfrac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)');
  }

  // 8. Replace mathematical symbols and Greek characters
  for (const [regex, replacement] of SYMBOL_MAP) {
    result = result.replace(regex, replacement);
  }

  // 9. Convert superscripts: ^{...} and ^x
  result = result.replace(/\^\{([^{}]+)\}/g, (_, inner) => {
    return inner.split('').map((ch: string) => SUPERSCRIPT_MAP[ch] || ch).join('');
  });
  result = result.replace(/\^([0-9a-zA-Z\+\-\=\*\(\)])/g, (_, ch) => SUPERSCRIPT_MAP[ch] || `^${ch}`);

  // 10. Convert subscripts: _{...} and _x
  result = result.replace(/_\{([^{}]+)\}/g, (_, inner) => {
    return inner.split('').map((ch: string) => SUBSCRIPT_MAP[ch] || ch).join('');
  });
  result = result.replace(/_([0-9a-zA-Z\+\-\=\(\)])/g, (_, ch) => SUBSCRIPT_MAP[ch] || `_${ch}`);

  // 11. Clean escaped braces & symbols: \{ -> {, \} -> }
  result = result
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\:/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '   ')
    .replace(/\\ /g, ' ');

  // 12. Restore literal dollar signs
  result = result.replace(/\uE000/g, '$');

  // 13. Normalize consecutive spaces while preserving single spaces
  result = result.replace(/[ \t]{2,}/g, ' ').trim();

  return result;
}

/**
 * 规范化可能粘连的 LaTeX 命令（如 \congImf -> \cong Imf, \inX -> \in X）
 */
export function cleanAndNormalizeLatex(text: string): string {
  if (!text) return '';
  let result = text;
  // 分离紧贴大写字母或数字的 LaTeX 命令（如 \congImf -> \cong Imf, \alpha1 -> \alpha 1）
  result = result.replace(/\\([a-zA-Z]+)([A-Z0-9])/g, '\\$1 $2');
  return result;
}

/**
 * 确保公式包含定界符，使 KaTeX 能够识别并高保真排版
 */
export function ensureMathDelimiters(text: string): string {
  if (!text) return '';
  const normalized = cleanAndNormalizeLatex(text);
  // 若已显式包含数学定界符，直接放行
  if (/\$|\\\(|\\\[/.test(normalized)) {
    return normalized;
  }
  // 若包含反斜杠宏命令或上下标，但未用 $ 包裹
  if (/\\[a-zA-Z]+|[_^]\{?[0-9a-zA-Z]/.test(normalized)) {
    // 形式如 "《第一同构定理： G/\ker f\congImf》" 或 "T1: a+b=c"
    const colonMatch = normalized.match(/^([^:：]+[:：]\s*)([\s\S]+)$/);
    if (colonMatch) {
      const prefix = colonMatch[1];
      let formula = colonMatch[2];
      let suffix = '';
      if (formula.endsWith('》') && prefix.startsWith('《')) {
        formula = formula.slice(0, -1);
        suffix = '》';
      }
      return `${prefix}$${formula.trim()}$${suffix}`;
    }

    // 若包含中文字符与 LaTeX 混合
    if (/[\u4e00-\u9fa5]/.test(normalized)) {
      return normalized.replace(/([a-zA-Z0-9\\_{}^+\-*/=()\[\]<>|~,.\s]{3,})/g, (segment) => {
        if (/\\[a-zA-Z]+|[_^]/.test(segment)) {
          return `$${segment.trim()}$`;
        }
        return segment;
      });
    }

    // 纯数学公式直接包裹
    return `$${normalized}$`;
  }
  return normalized;
}

/**
 * 将多行或包含独立公式的标题扁平化为适合单行显示的紧凑标题
 * 1. 优先将跨行的 $$...$$ 块级公式降级并展平为行内公式 $...$
 * 2. 将换行符转换为水平间隔符 ' · '
 * 3. 补全未闭合或缺失的数学定界符，确保 KaTeX 平滑渲染且不产生块级换行溢出
 */
export function formatSingleLineFormulaTitle(text: string): string {
  if (!text) return '';
  // 先处理可能跨行的 $$...$$ 块级公式
  let normalized = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => {
    const flattened = inner.replace(/[\r\n]+/g, ' ').trim();
    return `$${flattened}$`;
  });
  // 将剩余孤立的 $$ 替换为 $
  normalized = normalized.replace(/\$\$/g, '$');

  const lines = normalized
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  return lines
    .map(line => ensureMathDelimiters(line))
    .join(' · ');
}

