import React from 'react';
import { MarkdownMathRenderer } from '../MarkdownMathRenderer';

export const FieldLatexPreview: React.FC<{
  label: string;
  content: string;
  isDark: boolean;
  className?: string;
}> = ({ label, content, isDark, className = '' }) => {
  if (!content) return null;
  return (
    <div
      className={`mt-1.5 p-2.5 rounded-xl border border-dashed text-xs transition-colors ${
        isDark ? 'bg-white/[0.04] border-white/15 text-zinc-200' : 'bg-stone-100/80 border-stone-300 text-stone-800'
      } ${className}`}
    >
      <div className="text-[9px] font-mono opacity-50 mb-0.5 font-normal">{label}:</div>
      <MarkdownMathRenderer content={content.replace(/\\\\|\\n|<br\s*\/?>/gi, '\n')} isDark={isDark} />
    </div>
  );
};
