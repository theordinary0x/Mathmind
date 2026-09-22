import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirmDiscard: () => void;
  onCancelStay: () => void;
  isDark: boolean;
}

/**
 * 未保存离开确认弹窗
 * 
 * 具备 1 秒防手滑物理锁相机制（1s Lockout）：
 * 弹窗弹出后的前 1000ms 内，严格拦截 Enter 与 Esc 键，且确认按钮进入倒计时禁用状态，
 * 彻底防止用户因打字或连续手滑直接误触退出导致内容丢失。
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onConfirmDiscard,
  onCancelStay,
  isDark
}) => {
  const [lockCountdown, setLockCountdown] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) {
      setLockCountdown(1);
      return;
    }

    setLockCountdown(1);
    const timer = setTimeout(() => {
      setLockCountdown(0);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 倒计时未结束前，严格拦截 Enter 与 Esc，防止连击手滑
      if (lockCountdown > 0) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancelStay();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirmDiscard();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, lockCountdown, onCancelStay, onConfirmDiscard]);

  if (!isOpen) return null;

  const isLocked = lockCountdown > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100 select-none"
      onClick={e => e.stopPropagation()}
    >
      <div
        className={`w-full max-w-md border shadow-2xl p-6 font-sans select-text ${
          isDark
            ? 'bg-[#18181B] border-[#3F3F46] text-[#EDECE8]'
            : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="p-2 border shrink-0 text-amber-500 border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm tracking-wide">
              未保存的修改
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed font-sans">
              当前页面有尚未保存的修改。如果直接离开，修改内容将全部丢失。是否确定离开？
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-dashed border-[#3F3F46]/40 text-xs">
          <button
            type="button"
            onClick={onCancelStay}
            className={`px-3.5 py-1.5 border font-medium transition-colors cursor-pointer ${
              isDark
                ? 'border-[#3F3F46] hover:border-blue-500 text-zinc-200 hover:text-white bg-[#202024]'
                : 'border-[#D4CDC0] hover:border-blue-600 text-stone-700 hover:text-blue-600 bg-white'
            }`}
          >
            继续编辑
          </button>

          <button
            type="button"
            disabled={isLocked}
            onClick={onConfirmDiscard}
            className={`px-3.5 py-1.5 border font-medium transition-all ${
              isLocked
                ? 'opacity-40 cursor-not-allowed border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-red-600/80 bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 cursor-pointer shadow-xs active:scale-98'
            }`}
          >
            {isLocked ? '放弃并离开 (1s)' : '放弃并离开'}
          </button>
        </div>
      </div>
    </div>
  );
};
