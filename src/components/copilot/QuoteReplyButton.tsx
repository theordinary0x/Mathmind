import React, { useEffect, useState, useRef } from 'react';
import { MessageSquareQuote } from 'lucide-react';

interface QuoteReplyButtonProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onQuote: (quotedText: string) => void;
  isDark: boolean;
}

export const QuoteReplyButton: React.FC<QuoteReplyButtonProps> = ({
  containerRef,
  onQuote,
  isDark
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 2) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // 确保选区位于 containerRef 内部
      const range = selection.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 相对于视口计算浮动位置，并保证不溢出容器
      const left = Math.max(containerRect.left + 10, Math.min(rect.left + rect.width / 2, containerRect.right - 90));
      const top = Math.max(containerRect.top + 5, rect.top - 34);

      setSelectedText(text);
      setPosition({ top, left });
    };

    const handleMouseUp = () => {
      // 延迟微小时间等待选区完成
      setTimeout(handleSelection, 20);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 若点击目标不是浮标自身，则预先重置
      const target = e.target as HTMLElement;
      if (!target.closest('.quote-reply-btn')) {
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [containerRef]);

  if (!position || !selectedText) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuote(selectedText);
    setPosition(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 99
      }}
      className="quote-reply-btn animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={handleClick}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-serif font-medium shadow-lg border transition-all cursor-pointer select-none active:scale-95 ${
          isDark
            ? 'bg-[#27272A] border-[#3F3F46] text-white hover:bg-[#323238] shadow-black/60'
            : 'bg-[#2C2B29] border-[#1F1E1D] text-white hover:bg-[#3D3C38] shadow-stone-500/30'
        }`}
      >
        <MessageSquareQuote className="w-3.5 h-3.5 text-blue-400" />
        <span>引用回复</span>
      </button>
    </div>
  );
};
