import React from 'react';
import { BookOpen, Layers, ChevronDown, Menu } from 'lucide-react';
import { Project } from '../../types';

interface MobileHeaderProps {
  currentProject: Project;
  nodeCount: number;
  onOpenProjectManager: () => void;
  onOpenMenu: () => void;
  isDark: boolean;
}

/**
 * 方案 B：极简全屏沉浸（Procreate 模式）悬浮顶栏
 * 采用全屏穿透浮动胶囊岛设计，不挤占画布空间，触摸手势可穿透未遮挡区域。
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentProject,
  nodeCount,
  onOpenProjectManager,
  onOpenMenu,
  isDark
}) => {
  return (
    <header className="fixed top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between select-none">
      {/* 左侧：MathMind 品牌悬浮胶囊 */}
      <div
        className={`pointer-events-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-full border shadow-lg glass-panel transition-transform active:scale-95 ${
          isDark
            ? 'border-white/10 text-[#EDECE8]'
            : 'border-black/10 text-[#2C2B29]'
        }`}
      >
        <div className="p-1 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <span className="font-serif font-bold text-xs tracking-tight">
          MathMind
        </span>
      </div>

      {/* 中间：公理体系悬浮胶囊 */}
      <button
        type="button"
        onClick={onOpenProjectManager}
        className={`pointer-events-auto flex items-center space-x-2 px-3.5 py-1.5 rounded-full border shadow-lg active:scale-95 transition-all cursor-pointer glass-panel ${
          isDark
            ? 'border-white/10 hover:border-blue-500/50 text-zinc-100 hover:bg-white/5'
            : 'border-black/10 hover:border-blue-600/50 text-stone-800 hover:bg-black/5'
        }`}
        title="切换或管理数学公理体系"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 badge-dot" />
        <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="font-serif font-semibold text-xs truncate max-w-[105px]">
          {currentProject.name}
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-blue-500/15 text-blue-500 dark:text-blue-400 font-bold shrink-0">
          {nodeCount}
        </span>
        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>

      {/* 右侧：功能抽屉菜单悬浮胶囊 */}
      <button
        type="button"
        onClick={onOpenMenu}
        className={`pointer-events-auto p-2 rounded-full border shadow-lg active:scale-95 transition-all cursor-pointer glass-panel ${
          isDark
            ? 'border-white/10 hover:border-blue-500/50 text-zinc-200 hover:bg-white/5'
            : 'border-black/10 hover:border-blue-600/50 text-stone-800 hover:bg-black/5'
        }`}
        title="更多工具与设置"
      >
        <Menu className="w-4 h-4" />
      </button>
    </header>
  );
};
