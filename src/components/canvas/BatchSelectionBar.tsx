import React from 'react';
import { CheckSquare, Trash2, X, Layers } from 'lucide-react';

interface BatchSelectionBarProps {
  selectedCount: number;
  totalNodeCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  isDark: boolean;
}

export const BatchSelectionBar: React.FC<BatchSelectionBarProps> = ({
  selectedCount,
  totalNodeCount,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  isDark
}) => {
  if (selectedCount < 2) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-3 px-4 py-2 rounded-2xl border shadow-2xl backdrop-blur-md text-xs select-none animate-in fade-in slide-in-from-bottom-4 duration-200 ${
        isDark
          ? 'bg-[#18181B]/90 border-white/20 text-[#EDECE8] shadow-black/60'
          : 'bg-white/95 border-black/15 text-[#2C2B29] shadow-slate-300/50'
      }`}
    >
      <div className="flex items-center space-x-2 pr-2 border-r border-black/10 dark:border-white/10">
        <CheckSquare className="w-4 h-4 text-blue-500" />
        <span className="font-serif font-bold">
          已选中 <span className="text-blue-500 font-mono font-extrabold">{selectedCount}</span> 个命题
        </span>
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={onSelectAll}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
            isDark
              ? 'hover:bg-white/10 text-zinc-300 hover:text-white'
              : 'hover:bg-black/5 text-stone-600 hover:text-stone-900'
          }`}
        >
          全选 ({totalNodeCount})
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center space-x-1 ${
            isDark
              ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
              : 'hover:bg-black/5 text-stone-500 hover:text-stone-800'
          }`}
          title="取消多选 (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>取消 (Esc)</span>
        </button>
      </div>

      <div className="pl-1">
        <button
          type="button"
          onClick={onBatchDelete}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          title="批量删除选中的命题 (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>批量删除 (Del)</span>
        </button>
      </div>
    </div>
  );
};
