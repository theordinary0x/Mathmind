import React from 'react';
import { BookOpen, Layers, ChevronDown, Menu, Settings, Undo2, Redo2 } from 'lucide-react';
import { Project } from '../../types';

interface MobileHeaderProps {
  currentProject: Project;
  nodeCount: number;
  onOpenProjectManager: () => void;
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isDark: boolean;
}

/**
 * 移动端顶部悬浮导航栏（零重叠、设置直达）
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentProject,
  nodeCount,
  onOpenProjectManager,
  onOpenSettings,
  onOpenMenu,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isDark
}) => {
  return (
    <header className="fixed top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between gap-2 select-none">
      {/* 左侧：品牌 + 当前公理体系切换胶囊 */}
      <button
        type="button"
        onClick={onOpenProjectManager}
        className={`pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-lg active:scale-95 transition-all cursor-pointer glass-panel min-w-0 ${
          isDark
            ? 'border-white/10 hover:border-blue-500/50 text-zinc-100'
            : 'border-black/10 hover:border-blue-600/50 text-stone-800'
        }`}
        title="切换或管理数学公理体系"
      >
        <div className="p-1 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0 hidden xs:inline" />
        <span className="font-serif font-semibold text-xs truncate max-w-[125px]">
          {currentProject.name}
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-blue-500/15 text-blue-500 dark:text-blue-400 font-bold shrink-0">
          {nodeCount}
        </span>
        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>

      {/* 右侧：撤销/重做 + 设置直达 + 工具抽屉胶囊 */}
      <div
        className={`pointer-events-auto flex items-center space-x-0.5 p-1 rounded-full border shadow-lg glass-panel shrink-0 ${
          isDark ? 'border-white/10 text-zinc-200' : 'border-black/10 text-stone-800'
        }`}
      >
        {onUndo && (
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-full disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="撤销"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onRedo && (
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-full disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="重做"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-px h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-full text-blue-500 hover:bg-blue-500/10 active:scale-95 transition-all cursor-pointer"
          title="全局系统设置"
          aria-label="全局系统设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenMenu}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="更多画布与文件工具"
          aria-label="更多画布与文件工具"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
