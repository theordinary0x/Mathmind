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

/**
 * 方案 B：极简全屏沉浸（Procreate 模式）悬浮底栏
 * 采用悬浮胶囊底岛设计，不遮挡大面积画布，便于拇指单手触控。
 */
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
          className={`fixed bottom-18 left-4 right-4 max-w-sm mx-auto p-2 border shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 rounded-2xl glass-panel ${
            isDark ? 'border-white/15 text-white' : 'border-black/15 text-stone-900'
          }`}
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 opacity-40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="搜索画布中的命题与定理..."
              className={`w-full pl-9 pr-9 py-2 text-xs border focus:outline-none font-serif rounded-xl ${
                isDark
                  ? 'bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-white/90 border-black/10 text-stone-900 placeholder-stone-400 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 底部悬浮胶囊操作岛 */}
      <nav
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-full border shadow-2xl transition-all select-none glass-panel ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* 1. 搜索触发按钮 */}
        <button
          type="button"
          onClick={() => setIsSearchExpanded(prev => !prev)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer active:scale-95 ${
            isSearchExpanded || searchQuery
              ? 'bg-blue-500/20 text-blue-500 font-semibold border border-blue-500/30'
              : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="搜索命题"
        >
          <Search className="w-3.5 h-3.5" />
          <span>搜索</span>
        </button>

        {/* 分隔符 */}
        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />

        {/* 2. 核心主操作：新建命题 */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-serif font-medium text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          title="新建公理/定理/定义"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>新建</span>
        </button>

        {/* 分隔符 */}
        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />

        {/* 3. AI 导师 / Copilot 按钮 */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer active:scale-95 ${
            isCopilotOpen
              ? 'bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30'
              : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="AI 导师与推理助手"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>导师</span>
        </button>
      </nav>
    </>
  );
};
