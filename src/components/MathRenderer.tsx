import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedParts = useMemo(() => {
    if (!content) return [];

    // Regex to split by $$...$$ (block math) and $...$ (inline math)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    const parts: { type: 'text' | 'inline-math' | 'block-math'; value: string }[] = [];
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.slice(lastIndex, match.index)
        });
      }

      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        parts.push({
          type: 'block-math',
          value: raw.slice(2, -2).trim()
        });
      } else if (raw.startsWith('$') && raw.endsWith('$')) {
        parts.push({
          type: 'inline-math',
          value: raw.slice(1, -1).trim()
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex)
      });
    }

    return parts;
  }, [content]);

  return (
    <div className={`leading-relaxed text-[#2C2B29] ${className}`}>
      {renderedParts.map((part, idx) => {
        if (part.type === 'block-math') {
          try {
            const html = katex.renderToString(part.value, {
              displayMode: true,
              throwOnError: false
            });
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto text-center py-1"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <pre key={idx} className="text-red-500 font-mono text-sm">{part.value}</pre>;
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
                className="inline-block px-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={idx} className="text-red-500 font-mono text-xs">${part.value}$</code>;
          }
        }

        // Text: render with preserve-newlines
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {part.value}
          </span>
        );
      })}
    </div>
  );
};
