import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import { Check, Copy } from 'lucide-react';
import { THEOREM_ENV_CONFIG } from '../utils/theoremConfig';

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
  isDark?: boolean;
}

/**
 * 带有语言标签与一键复制功能的高级代码块组件
 */
const CodeBlock: React.FC<{
  code: string;
  language: string;
  isDark: boolean;
}> = ({ code, language, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 overflow-hidden border font-mono text-xs transition-colors shadow-xs ${
        isDark
          ? 'bg-[#1C1C20] border-[#333338] text-zinc-100'
          : 'bg-[#F5F4F0] border-stone-200 text-stone-800'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] select-none ${
          isDark
            ? 'bg-black/30 border-[#333338] text-zinc-400'
            : 'bg-stone-200/50 border-stone-200 text-stone-600'
        }`}
      >
        <span className="uppercase font-semibold tracking-wider text-[10px]">
          {language || 'TEXT'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-blue-500 transition-colors cursor-pointer"
          title="复制代码到剪贴板"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">复制代码</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto select-text leading-relaxed">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

type RenderSegment =
  | { type: 'html'; html: string }
  | { type: 'code'; code: string; language: string }
  | { type: 'theorem'; env: string; optTitle?: string; value: string };

export const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({
  content,
  className = '',
  isDark = true
}) => {
  const segments = useMemo<RenderSegment[]>(() => {
    if (!content) return [];

    let text = content;

    // 1. 抽取围栏代码块 (Fenced Code Blocks: ```lang ... ```)
    const codeBlocks: Array<{ id: string; code: string; language: string }> = [];
    const codeBlockRegex = /(?:^|\n)```([a-zA-Z0-9_\-\.\+]*)\r?\n([\s\S]*?)\r?\n```(?:\n|$)/g;
    text = text.replace(codeBlockRegex, (_, lang, code) => {
      const id = `<div data-code-block="${codeBlocks.length}"></div>`;
      codeBlocks.push({ id, code: code.replace(/\r\n/g, '\n'), language: (lang || '').trim() });
      return `\n\n${id}\n\n`;
    });

    // 2. 抽取数学定理环境 (\begin{theorem}...\end{theorem})
    const theoremBlocks: Array<{ id: string; env: string; optTitle?: string; value: string }> = [];
    const theoremRegex =
      /\\begin\{(theorem|proposition|lemma|definition|corollary|axiom|proof|example|remark|conjecture)\}(?:\[(.*?)\])?([\s\S]*?)\\end\{\1\}/g;
    text = text.replace(theoremRegex, (_, env, optTitle, value) => {
      const id = `<div data-theorem-block="${theoremBlocks.length}"></div>`;
      theoremBlocks.push({ id, env, optTitle, value: value.trim() });
      return `\n\n${id}\n\n`;
    });

    // 3. 抽取独立块级数学公式 ($$...$$ / \[...\] / \begin{align*}...\end{align*})
    const blockMaths: string[] = [];
    const blockMathRegex =
      /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:align\*?|alignat\*?|gather\*?|equation\*?|multline\*?|split|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\}[\s\S]*?\\end\{(?:align\*?|alignat\*?|gather\*?|equation\*?|multline\*?|split|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\})/g;
    text = text.replace(blockMathRegex, (match) => {
      const id = `<div data-katex-block="${blockMaths.length}"></div>`;
      let inner = match.trim();
      if (inner.startsWith('$$') && inner.endsWith('$$')) {
        inner = inner.slice(2, -2).trim();
      } else if (inner.startsWith('\\[') && inner.endsWith('\\]')) {
        inner = inner.slice(2, -2).trim();
      }
      blockMaths.push(inner);
      return `\n\n${id}\n\n`;
    });

    // 4. 抽取行内公式 ($...$ 或 \(...\))
    const inlineMaths: string[] = [];
    // 匹配未转义的单美元符号或 \(...\)
    const inlineMathRegex = /(\$(?:[^\$\n\\]|\\.)+?\$|\\\([\s\S]*?\\\))/g;
    text = text.replace(inlineMathRegex, (match) => {
      const id = `<span data-katex-inline="${inlineMaths.length}"></span>`;
      let inner = match.trim();
      if (inner.startsWith('$') && inner.endsWith('$')) {
        inner = inner.slice(1, -1).trim();
      } else if (inner.startsWith('\\(') && inner.endsWith('\\)')) {
        inner = inner.slice(2, -2).trim();
      }
      inlineMaths.push(inner);
      return id;
    });

    // 5. 将其余标准 Markdown（标题、粗体、列表、表格、引用块等）交由 marked 渲染为 HTML
    let parsedHtml = '';
    try {
      parsedHtml = marked.parse(text, {
        gfm: true,
        breaks: true,
        async: false
      }) as string;
    } catch {
      parsedHtml = text;
    }

    // 6. 将行内数学公式替换回 KaTeX HTML (使用标准 HTML 标签避免被 marked 误解析为斜体)
    parsedHtml = parsedHtml.replace(/<span data-katex-inline="(\d+)"><\/span>/g, (_, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const math = inlineMaths[idx];
      if (math === undefined) return '';
      try {
        return katex.renderToString(math, {
          displayMode: false,
          throwOnError: false
        });
      } catch {
        return `<span class="text-rose-500 font-mono text-xs">${math}</span>`;
      }
    });

    // 7. 将独立块级数学公式替换回居中渲染的 KaTeX HTML
    parsedHtml = parsedHtml.replace(/(?:<p>)?<div data-katex-block="(\d+)"><\/div>(?:<\/p>)?/g, (_, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const math = blockMaths[idx];
      if (math === undefined) return '';
      try {
        const rendered = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false
        });
        return `<div class="my-3 overflow-x-auto text-center py-1 font-serif">${rendered}</div>`;
      } catch {
        return `<div class="my-2 p-2 bg-red-500/10 text-rose-500 font-mono text-xs border border-rose-500/30">${math}</div>`;
      }
    });

    // 8. 结合代码块 (CodeBlock) 与定理块 (Theorem) 切割为复合 React 渲染片段
    const splitRegex = /(?:<p>)?(<div data-code-block="\d+"><\/div>|<div data-theorem-block="\d+"><\/div>)(?:<\/p>)?/g;
    const resultSegments: RenderSegment[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = splitRegex.exec(parsedHtml)) !== null) {
      if (match.index > lastIndex) {
        const htmlChunk = parsedHtml.substring(lastIndex, match.index);
        if (htmlChunk.trim()) {
          resultSegments.push({ type: 'html', html: htmlChunk });
        }
      }

      const token = match[1];
      if (token.includes('data-code-block=')) {
        const codeIdx = parseInt(token.match(/data-code-block="(\d+)"/)?.[1] || '0', 10);
        const item = codeBlocks[codeIdx];
        if (item) {
          resultSegments.push({
            type: 'code',
            code: item.code,
            language: item.language
          });
        }
      } else if (token.includes('data-theorem-block=')) {
        const thmIdx = parseInt(token.match(/data-theorem-block="(\d+)"/)?.[1] || '0', 10);
        const item = theoremBlocks[thmIdx];
        if (item) {
          resultSegments.push({
            type: 'theorem',
            env: item.env,
            optTitle: item.optTitle,
            value: item.value
          });
        }
      }

      lastIndex = splitRegex.lastIndex;
    }

    if (lastIndex < parsedHtml.length) {
      const htmlChunk = parsedHtml.substring(lastIndex);
      if (htmlChunk.trim()) {
        resultSegments.push({ type: 'html', html: htmlChunk });
      }
    }

    return resultSegments;
  }, [content]);

  return (
    <div className={`math-markdown leading-relaxed text-inherit font-serif ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              code={seg.code}
              language={seg.language}
              isDark={isDark}
            />
          );
        }

        if (seg.type === 'theorem') {
          const cfg = THEOREM_ENV_CONFIG[seg.env] || {
            label: seg.env.charAt(0).toUpperCase() + seg.env.slice(1),
            en: seg.env,
            border: 'border-zinc-400/40 border-l-zinc-500',
            bg: 'bg-zinc-500/5',
            text: 'text-zinc-700 dark:text-zinc-300'
          };

          return (
            <div
              key={idx}
              className={`my-3 p-3.5 border-l-4 border ${cfg.border} ${cfg.bg} transition-colors shadow-xs`}
            >
              <div
                className={`font-serif font-bold text-xs flex items-center space-x-1.5 mb-2 select-none ${cfg.text}`}
              >
                <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 uppercase tracking-wider text-[10px]">
                  {cfg.label}
                </span>
                <span className="opacity-50 text-[11px] font-sans">({cfg.en})</span>
                {seg.optTitle && (
                  <>
                    <span className="opacity-30">·</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {seg.optTitle}
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm font-serif leading-relaxed">
                <MarkdownMathRenderer content={seg.value} isDark={isDark} />
              </div>
              {seg.env === 'proof' && (
                <div
                  className="text-right text-xs opacity-60 mt-1 font-mono select-none"
                  title="证明完毕 (Q.E.D.)"
                >
                  ∎
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: seg.html }}
          />
        );
      })}
    </div>
  );
};
