import React, { useEffect } from 'react';
import { X, Heart, Coffee } from 'lucide-react';
import { AppTheme } from '../types';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

export const SponsorModal: React.FC<SponsorModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100"
    >
      <div
        className={`border shadow-2xl w-full max-w-sm flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#18181B] border-white/10 text-[#EDECE8]'
            : 'bg-white border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-[#222226] border-white/10' : 'bg-[#FAF8F5] border-black/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-serif font-bold">赞助支持 (Sponsor)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-white shadow-md border border-black/5 mb-4">
            <img
              src="/sponsor-qrcode.jpg"
              alt="微信赞助二维码"
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>微信扫码赞赏</span>
          </div>

          <p className="text-xs opacity-75 font-serif leading-relaxed max-w-xs">
            MathMind 是一款开源免费的数学命题推演网络工具。如果你觉得它对你的学习有所帮助，欢迎赞助支持后续的功能维护，非常感谢你的认可。
          </p>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end ${
            isDark ? 'bg-[#222226] border-white/10' : 'bg-[#FAF8F5] border-black/10'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-black/5 hover:bg-black/10 text-stone-800'
            }`}
          >
            关闭 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
