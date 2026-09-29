import React, { useState } from 'react';
import { Plus, Search, X, Settings } from 'lucide-react';
import {
  StylusPenVectorIcon,
  PdfNoteVectorIcon,
  SparkleAiVectorIcon,
} from '../icons/CustomIcons';

interface MobileBottomBarProps {
  isDark: boolean;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  onOpenCreateModal: () => void;
  onOpenHandwriting: () => void;
  onOpenPdfWorkspace: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

/**
 * 移动端底部五宫格悬浮导航坞（零遮挡冲突、包含手写/PDF与直达设置）
 */
export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  isDark,
  isCopilotOpen,
  onToggleCopilot,
  onOpenCreateModal,
  onOpenHandwriting,
  onOpenPdfWorkspace,
  onOpenSettings,
  searchQuery,
  onSearchChange
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState(false);

  return (
    <>
      {/* 搜索弹出浮层 */}
      {isSearchExpanded && (
        <div
          className={`fixed bottom-20 left-4 right-4 max-w-sm mx-auto p-2 border shadow-2xl z-40 mm-view-fade rounded-2xl glass-panel ${
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

      {/* 手写演算 / PDF 讲义批注上拉小浮层 */}
      {isNoteMenuOpen && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 w-64 p-2 border shadow-2xl z-40 mm-view-fade rounded-2xl glass-panel flex flex-col space-y-1.5 ${
            isDark ? 'border-white/15 text-white' : 'border-black/15 text-stone-900'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setIsNoteMenuOpen(false);
              onOpenHandwriting();
            }}
            className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-serif text-left transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
              <StylusPenVectorIcon size={15} />
            </div>
            <div>
              <div className="font-bold">压感手写演算板</div>
              <div className="text-[10px] opacity-60">手写公式识别 LaTeX / 草稿推导</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsNoteMenuOpen(false);
              onOpenPdfWorkspace();
            }}
            className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-serif text-left transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
              <PdfNoteVectorIcon size={15} />
            </div>
            <div>
              <div className="font-bold">PDF 讲义批注台</div>
              <div className="text-[10px] opacity-60">打开教材原位手写 / 框选提取命题</div>
            </div>
          </button>
        </div>
      )}

      {/* 底部五宫格悬浮胶囊坞 */}
      <nav
        className={`fixed bottom-3.5 left-3 right-3 max-w-md mx-auto z-30 pointer-events-auto flex items-center justify-between px-2 py-1.5 rounded-2xl border shadow-2xl transition-all select-none glass-panel ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
      >
        {/* 1. 搜索 */}
        <button
          type="button"
          onClick={() => {
            setIsNoteMenuOpen(false);
            setIsSearchExpanded(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-xl text-[11px] font-serif transition-all cursor-pointer active:scale-95 ${
            isSearchExpanded || searchQuery
              ? 'bg-blue-500/20 text-blue-500 font-semibold'
              : 'opacity-75 hover:opacity-100'
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>搜索</span>
        </button>

        {/* 2. 手写 / PDF 笔记 */}
        <button
          type="button"
          onClick={() => {
            setIsSearchExpanded(false);
            setIsNoteMenuOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-xl text-[11px] font-serif transition-all cursor-pointer active:scale-95 ${
            isNoteMenuOpen
              ? 'bg-blue-500/20 text-blue-500 font-semibold'
              : 'opacity-75 hover:opacity-100'
          }`}
        >
          <StylusPenVectorIcon size={16} className="mb-0.5" />
          <span>手写/PDF</span>
        </button>

        {/* 3. 核心主操作：新建命题 */}
        <button
          type="button"
          onClick={() => {
            setIsNoteMenuOpen(false);
            setIsSearchExpanded(false);
            onOpenCreateModal();
          }}
          className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-serif font-semibold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>新建</span>
        </button>

        {/* 4. AI 导师 / Copilot */}
        <button
          type="button"
          onClick={() => {
            setIsNoteMenuOpen(false);
            setIsSearchExpanded(false);
            onToggleCopilot();
          }}
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-xl text-[11px] font-serif transition-all cursor-pointer active:scale-95 ${
            isCopilotOpen
              ? 'bg-blue-500/20 text-blue-500 font-semibold'
              : 'opacity-75 hover:opacity-100'
          }`}
        >
          <SparkleAiVectorIcon size={16} className="mb-0.5" />
          <span>AI 导师</span>
        </button>

        {/* 5. 系统设置直达 */}
        <button
          type="button"
          onClick={() => {
            setIsNoteMenuOpen(false);
            setIsSearchExpanded(false);
            onOpenSettings();
          }}
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl text-[11px] font-serif opacity-75 hover:opacity-100 transition-all cursor-pointer active:scale-95"
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span>设置</span>
        </button>
      </nav>
    </>
  );
};
