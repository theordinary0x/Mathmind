import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  isNested?: boolean;
}

export const THEOREM_ENV_CONFIG: Record<
  string,
  { label: string; en: string; border: string; bg: string; text: string }
> = {
  theorem: {
    label: '定理',
    en: 'Theorem',
    border: 'border-rose-500/40 border-l-rose-500',
    bg: 'bg-rose-500/5',
    text: 'text-rose-600 dark:text-rose-400'
  },
  proposition: {
    label: '命题',
    en: 'Proposition',
    border: 'border-purple-500/40 border-l-purple-500',
    bg: 'bg-purple-500/5',
    text: 'text-purple-600 dark:text-purple-400'
  },
  lemma: {
    label: '引理',
    en: 'Lemma',
    border: 'border-indigo-500/40 border-l-indigo-500',
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  definition: {
    label: '定义',
    en: 'Definition',
    border: 'border-emerald-500/40 border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  corollary: {
    label: '推论',
    en: 'Corollary',
    border: 'border-amber-500/40 border-l-amber-500',
    bg: 'bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400'
  },
  axiom: {
    label: '公理',
    en: 'Axiom',
    border: 'border-blue-500/40 border-l-blue-500',
    bg: 'bg-blue-500/5',
    text: 'text-blue-600 dark:text-blue-400'
  },
  proof: {
    label: '证明',
    en: 'Proof',
    border: 'border-zinc-400/40 border-l-zinc-500',
    bg: 'bg-zinc-500/5',
    text: 'text-zinc-600 dark:text-zinc-400'
  },
  example: {
    label: '例',
    en: 'Example',
    border: 'border-cyan-500/40 border-l-cyan-500',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-600 dark:text-cyan-400'
  },
  remark: {
    label: '注记',
    en: 'Remark',
    border: 'border-stone-500/40 border-l-stone-500',
    bg: 'bg-stone-500/5',
    text: 'text-stone-600 dark:text-stone-400'
  },
  conjecture: {
    label: '猜想',
    en: 'Conjecture',
    border: 'border-pink-500/40 border-l-pink-500',
    bg: 'bg-pink-500/5',
    text: 'text-pink-600 dark:text-pink-400'
  }
};

/**
 * Sanitize AI tool citation debris, markdown wrappers, and auto-complete unclosed tags
 */
export function sanitizeMathContent(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Strip markdown code fences if copied as ```latex ... ```
  cleaned = cleaned.replace(/^```(?:latex|tex|markdown)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  // 2. Strip AI citation debris: ```[cite: 1], [cite: 1, 2], 【1†source】
  cleaned = cleaned.replace(/`*\[cite:\s*[\d,\s]+\]`*/gi, '');
  cleaned = cleaned.replace(/【\d+†source】/g, '');
  cleaned = cleaned.replace(/`{3,}/g, '');

  // 3. Auto-close unclosed theorem environments if copied partially or during typing
  const envKeys = Object.keys(THEOREM_ENV_CONFIG);
  for (const env of envKeys) {
    const beginRegex = new RegExp(`\\\\begin\\{${env}\\}`, 'g');
    const endRegex = new RegExp(`\\\\end\\{${env}\\}`, 'g');
    const beginCount = (cleaned.match(beginRegex) || []).length;
    const endCount = (cleaned.match(endRegex) || []).length;
    if (beginCount > endCount) {
      cleaned = cleaned + `\n\\end{${env}}`.repeat(beginCount - endCount);
    }
  }

  return cleaned.trim();
}

type RenderPart =
  | { type: 'text'; value: string }
  | { type: 'inline-math'; value: string }
  | { type: 'block-math'; value: string }
  | { type: 'theorem-env'; env: string; optTitle?: string; value: string };

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  isNested = false
}) => {
  const renderedParts = useMemo<RenderPart[]>(() => {
    if (!content) return [];

    const sanitized = sanitizeMathContent(content);

    // Master tokenizer regex:
    // 1. Theorem environments: \begin{proposition}[title] ... \end{proposition}
    // 2. Delimited block math: $$...$$ or \[...\]
    // 3. Bare math environments: \begin{align*}...\end{align*}, \begin{equation}...\end{equation}, etc.
    // 4. Delimited inline math: $...$ or \(...\)
    const regex =
      /(?:\\begin\{(theorem|proposition|lemma|definition|corollary|axiom|proof|example|remark|conjecture)\}(?:\[(.*?)\])?([\s\S]*?)\\end\{\1\})|(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])|(\\begin\{(?:align\*?|alignat\*?|gather\*?|equation\*?|multline\*?|split|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\}[\s\S]*?\\end\{(?:align\*?|alignat\*?|gather\*?|equation\*?|multline\*?|split|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\})|(\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

    const parts: RenderPart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sanitized)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: sanitized.slice(lastIndex, match.index)
        });
      }

      if (match[1]) {
        // Theorem environment
        parts.push({
          type: 'theorem-env',
          env: match[1].toLowerCase(),
          optTitle: match[2]?.trim() || undefined,
          value: match[3].trim()
        });
      } else if (match[4]) {
        // Delimited block math: $$...$$ or \[...\]
        const raw = match[4];
        let val = raw;
        if (raw.startsWith('$$') && raw.endsWith('$$')) {
          val = raw.slice(2, -2).trim();
        } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
          val = raw.slice(2, -2).trim();
        }
        parts.push({ type: 'block-math', value: val });
      } else if (match[5]) {
        // Bare math environment: \begin{align*} ... \end{align*}
        parts.push({ type: 'block-math', value: match[5].trim() });
      } else if (match[6]) {
        // Inline math: $...$ or \(...\)
        const raw = match[6];
        let val = raw;
        if (raw.startsWith('$') && raw.endsWith('$')) {
          val = raw.slice(1, -1).trim();
        } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
          val = raw.slice(2, -2).trim();
        }
        parts.push({ type: 'inline-math', value: val });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sanitized.length) {
      parts.push({
        type: 'text',
        value: sanitized.slice(lastIndex)
      });
    }

    return parts;
  }, [content]);

  return (
    <div className={`leading-relaxed text-inherit ${className}`}>
      {renderedParts.map((part, idx) => {
        if (part.type === 'theorem-env') {
          const cfg = THEOREM_ENV_CONFIG[part.env] || {
            label: part.env.charAt(0).toUpperCase() + part.env.slice(1),
            en: part.env,
            border: 'border-zinc-400/40 border-l-zinc-500',
            bg: 'bg-zinc-500/5',
            text: 'text-zinc-700 dark:text-zinc-300'
          };

          return (
            <div
              key={idx}
              className={`my-3 p-3.5 rounded-lg border-l-4 border ${cfg.border} ${cfg.bg} transition-colors shadow-xs`}
            >
              <div className={`font-serif font-bold text-xs flex items-center space-x-1.5 mb-2 select-none ${cfg.text}`}>
                <span className="px-1.5 py-0.5 rounded-sm bg-black/5 dark:bg-white/10 uppercase tracking-wider text-[10px]">
                  {cfg.label}
                </span>
                <span className="opacity-50 text-[11px] font-sans">({cfg.en})</span>
                {part.optTitle && (
                  <>
                    <span className="opacity-30">·</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {part.optTitle}
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm font-serif leading-relaxed">
                <MathRenderer content={part.value} isNested={true} />
              </div>
              {part.env === 'proof' && (
                <div className="text-right text-xs opacity-60 mt-1 font-mono select-none" title="证明完毕 (Q.E.D.)">
                  ∎
                </div>
              )}
            </div>
          );
        }

        if (part.type === 'block-math') {
          try {
            const html = katex.renderToString(part.value, {
              displayMode: true,
              throwOnError: false
            });
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto text-center py-1 font-serif"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <div
                key={idx}
                className="my-2 p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-mono text-xs border border-red-200 dark:border-red-900 rounded"
              >
                {part.value}
              </div>
            );
          }
        }

        if (part.type === 'inline-math') {
          try {
            const html = katex.renderToString(part.value, {
              displayMode: false,
              throwOnError: false
            });
            return (
              <span
                key={idx}
                className="inline-block px-0.5 align-middle"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={idx} className="text-red-500 font-mono text-xs px-1">
                ${part.value}$
              </code>
            );
          }
        }

        // Plain text: replace LaTeX newlines `\\` with `\n` and preserve whitespace
        const formattedText = part.value.replace(/\\\\/g, '\n');
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {formattedText}
          </span>
        );
      })}
    </div>
  );
};
