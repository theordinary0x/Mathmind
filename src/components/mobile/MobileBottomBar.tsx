import React, { useState } from 'react';
import { Sparkles, Plus, Search, X } from 'lucide-react';

interface MobileBottomBarProps {
  isDark: boolean;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  onOpenCreateModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  isDark,
  isCopilotOpen,
  onToggleCopilot,
  onOpenCreateModal,
  searchQuery,
  onSearchChange
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <>
      {/* 搜索弹出浮层 */}
      {isSearchExpanded && (
        <div
          className={`fixed bottom-15 left-3 right-3 p-2.5 border shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 rounded-xl glass-panel ${
            isDark ? 'border-white/10 text-white' : 'border-black/10 text-stone-900'
          }`}
        >
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="搜索画布中的命题与定理..."
              className={`w-full pl-8 pr-8 py-2 text-xs border focus:outline-none font-serif rounded-lg ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-white/80 border-black/10 text-stone-900 placeholder-stone-400 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 底部悬浮操作岛（支持圆角与毛玻璃） */}
      <nav
        className={`fixed bottom-0 left-0 right-0 h-13 border-t flex items-center justify-around px-4 z-20 select-none glass-panel backdrop-blur-md ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* 1. 搜索按钮 */}
        <button
          type="button"
          onClick={() => setIsSearchExpanded(prev => !prev)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 text-[11px] font-serif transition-all cursor-pointer rounded-lg active:scale-95 ${
            isSearchExpanded || searchQuery
              ? 'text-blue-500 font-medium'
              : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>搜索</span>
        </button>

        {/* 2. 新建命题按钮 */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-3 text-[11px] font-serif opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer rounded-lg active:scale-95"
        >
          <Plus className="w-4 h-4 mb-0.5" />
          <span>新建命题</span>
        </button>

        {/* 3. AI 导师 / Copilot 按钮 */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 text-[11px] font-serif transition-all cursor-pointer rounded-lg active:scale-95 ${
            isCopilotOpen
              ? 'text-blue-500 font-bold bg-blue-500/10'
              : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 mb-0.5 text-amber-400" />
            <span>Copilot</span>
          </div>
        </button>
      </nav>
    </>
  );
};
