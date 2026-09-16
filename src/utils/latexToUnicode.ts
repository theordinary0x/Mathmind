// LaTeX to Unicode mathematical notation converter
// Used for high-fidelity canvas labels, tooltips, and text contexts

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ᵃ',
  'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'k': 'ᵏ',
  'm': 'ᵐ', 'p': 'ᵖ', 't': 'ᵗ'
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

  // Greek Letters (Lowercase)
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\delta\b/g, 'δ'],
  [/\\epsilon\b|\\varepsilon\b/g, 'ε'],
  [/\\zeta\b/g, 'ζ'],
  [/\\eta\b/g, 'η'],
  [/\\theta\b|\\vartheta\b/g, 'θ'],
  [/\\iota\b/g, 'ι'],
  [/\\kappa\b/g, 'κ'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\nu\b/g, 'ν'],
  [/\\xi\b/g, 'ξ'],
  [/\\pi\b/g, 'π'],
  [/\\rho\b|\\varrho\b/g, 'ρ'],
  [/\\sigma\b/g, 'σ'],
  [/\\tau\b/g, 'τ'],
  [/\\upsilon\b/g, 'υ'],
  [/\\phi\b|\\varphi\b/g, 'φ'],
  [/\\chi\b/g, 'χ'],
  [/\\psi\b/g, 'ψ'],
  [/\\omega\b/g, 'ω'],

  // Greek Letters (Uppercase)
  [/\\Gamma\b/g, 'Γ'],
  [/\\Delta\b/g, 'Δ'],
  [/\\Theta\b/g, 'Θ'],
  [/\\Lambda\b/g, 'Λ'],
  [/\\Xi\b/g, 'Ξ'],
  [/\\Pi\b/g, 'Π'],
  [/\\Sigma\b/g, 'Σ'],
  [/\\Phi\b/g, 'Φ'],
  [/\\Psi\b/g, 'Ψ'],
  [/\\Omega\b/g, 'Ω'],

  // Logic & Quantifiers
  [/\\forall\b/g, '∀'],
  [/\\exists\b/g, '∃'],
  [/\\nexists\b/g, '∄'],
  [/\\neg\b/g, '¬'],
  [/\\land\b/g, '∧'],
  [/\\lor\b/g, '∨'],
  [/\\implies\b/g, '⟹'],
  [/\\impliedby\b/g, '⟸'],
  [/\\iff\b/g, '⟺'],
  [/\\to\b|\\rightarrow\b/g, '→'],
  [/\\leftarrow\b/g, '←'],
  [/\\leftrightarrow\b/g, '↔'],
  [/\\Rightarrow\b/g, '⇒'],
  [/\\Leftarrow\b/g, '⇐'],
  [/\\Leftrightarrow\b/g, '⇔'],
  [/\\mapsto\b/g, '↦'],

  // Set Operations
  [/\\in\b/g, '∈'],
  [/\\notin\b/g, '∉'],
  [/\\ni\b/g, '∋'],
  [/\\subset\b/g, '⊂'],
  [/\\subseteq\b/g, '⊆'],
  [/\\supset\b/g, '⊃'],
  [/\\supseteq\b/g, '⊇'],
  [/\\cap\b/g, '∩'],
  [/\\cup\b/g, '∪'],
  [/\\setminus\b/g, '∖'],
  [/\\emptyset\b|\\varnothing\b/g, '∅'],

  // Relational Operators
  [/\\neq\b|\\ne\b/g, '≠'],
  [/\\le\b|\\leq\b/g, '≤'],
  [/\\ge\b|\\geq\b/g, '≥'],
  [/\\approx\b/g, '≈'],
  [/\\equiv\b/g, '≡'],
  [/\\sim\b/g, '∼'],
  [/\\cong\b/g, '≅'],
  [/\\propto\b/g, '∝'],

  // Arithmetic & Calculus
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\mp\b/g, '∓'],
  [/\\infty\b/g, '∞'],
  [/\\sqrt\b/g, '√'],
  [/\\sum\b/g, '∑'],
  [/\\prod\b/g, '∏'],
  [/\\int\b/g, '∫'],
  [/\\partial\b/g, '∂'],
  [/\\nabla\b/g, '∇']
];

export function latexToUnicode(text: string): string {
  if (!text) return '';
  let result = text;

  // 1. Convert text blocks: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  result = result.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, '$1');

  // 2. Convert fractions: \frac{a}{b} -> a/b
  result = result.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)');

  // 3. Replace all recognized mathematical symbols and Greek characters
  for (const [regex, replacement] of SYMBOL_MAP) {
    result = result.replace(regex, replacement);
  }

  // 4. Convert superscripts: ^{...} and ^x
  result = result.replace(/\^\{([^{}]+)\}/g, (_, inner) => {
    return inner.split('').map((ch: string) => SUPERSCRIPT_MAP[ch] || ch).join('');
  });
  result = result.replace(/\^([0-9a-zA-Z\+\-\=])/g, (_, ch) => SUPERSCRIPT_MAP[ch] || `^${ch}`);

  // 5. Convert subscripts: _{...} and _x
  result = result.replace(/_\{([^{}]+)\}/g, (_, inner) => {
    return inner.split('').map((ch: string) => SUBSCRIPT_MAP[ch] || ch).join('');
  });
  result = result.replace(/_([0-9a-zA-Z\+\-\=])/g, (_, ch) => SUBSCRIPT_MAP[ch] || `_${ch}`);

  // 6. Clean escaped symbols: \{ -> {, \} -> }, \$ -> $
  result = result.replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\\$/g, '$');

  // 7. Strip math delimiters: $$...$$ or $...$ or \(...\)
  result = result.replace(/\$\$|\$|\\\(|\\\)/g, '');

  return result;
}
