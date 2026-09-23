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

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentProject,
  nodeCount,
  onOpenProjectManager,
  onOpenMenu,
  isDark
}) => {
  return (
    <header
      className={`h-12 px-3 border-b flex items-center justify-between shrink-0 select-none z-20 ${
        isDark
          ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]'
          : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
      }`}
    >
      {/* 左侧：Logo 与品牌 */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="p-1 border border-blue-500/30 bg-blue-500/10">
          <BookOpen className="w-4 h-4 text-[#3B82F6]" />
        </div>
        <span className="font-serif font-bold text-sm tracking-tight">
          MathMind
        </span>
      </div>

      {/* 中间：项目切换触发器 */}
      <button
        type="button"
        onClick={onOpenProjectManager}
        className={`flex items-center space-x-1 px-2.5 py-1 text-xs border max-w-[170px] truncate transition-colors cursor-pointer ${
          isDark
            ? 'bg-[#202024] border-[#2E2E33] hover:border-blue-500 text-zinc-200'
            : 'bg-white border-[#D4CDC0] hover:border-blue-600 text-stone-800'
        }`}
        title="切换或管理数学体系"
      >
        <Layers className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
        <span className="font-serif font-medium truncate">
          {currentProject.name}
        </span>
        <span className="text-[10px] opacity-60 font-mono shrink-0">
          ({nodeCount})
        </span>
        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>

      {/* 右侧：功能抽屉菜单按钮 */}
      <button
        type="button"
        onClick={onOpenMenu}
        className={`p-1.5 border transition-colors cursor-pointer ${
          isDark
            ? 'border-[#2E2E33] hover:border-blue-500 text-zinc-200 bg-[#202024]'
            : 'border-[#D4CDC0] hover:border-blue-600 text-stone-800 bg-white'
        }`}
        title="更多工具与设置"
      >
        <Menu className="w-4 h-4" />
      </button>
    </header>
  );
};
