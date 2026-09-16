import React, { useRef } from 'react';
import { 
  GitFork, 
  Network, 
  Eye, 
  EyeOff, 
  Plus, 
  Link2, 
  Download, 
  Upload, 
  Search, 
  BookOpen, 
  ChevronDown, 
  Layers, 
  Undo2, 
  Redo2, 
  Save, 
  Moon, 
  Sun,
  Keyboard,
  Settings,
  Coffee,
  Sparkles
} from 'lucide-react';
import { Project, AppTheme } from '../types';

interface HeaderProps {
  currentProject: Project;
  onOpenProjectManager: () => void;
  layoutType: 'dagre' | 'cose';
  onChangeLayout: (type: 'dagre' | 'cose') => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isConnectingMode: boolean;
  onToggleConnectingMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onOpenAiIngestion?: () => void;
  onSaveAs: () => void;
  onManualSave?: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nodeCount: number;
  theme: AppTheme;
  onToggleTheme: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenSettings?: () => void;
  onOpenSponsor?: () => void;
}

const KbdBadge: React.FC<{
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
  variant?: 'default' | 'solid';
  active?: boolean;
}> = ({
  children,
  isDark,
  className = '',
  variant = 'default',
  active = false
}) => {
  let colorStyles = '';
  if (variant === 'solid' || active) {
    colorStyles = 'bg-white/20 text-white font-medium';
  } else {
    colorStyles = isDark
      ? 'bg-white/10 text-zinc-300'
      : 'bg-black/5 text-stone-600';
  }

  return (
    <kbd
      className={`inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-mono leading-none rounded select-none ${colorStyles} ${className}`}
    >
      {children}
    </kbd>
  );
};

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onOpenProjectManager,
  layoutType,
  onChangeLayout,
  isFocusMode,
  onToggleFocusMode,
  isConnectingMode,
  onToggleConnectingMode,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenAiIngestion,
  onSaveAs,
  onManualSave,
  onImport,
  nodeCount,
  theme,
  onToggleTheme,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenShortcutsModal,
  onOpenSettings,
  onOpenSponsor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  return (
    <header
      className={`h-13 sm:h-14 px-3 sm:px-4 border-b flex items-center justify-between select-none z-20 shrink-0 transition-colors gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap ${
        isDark ? 'bg-[#18181B] border-white/10 text-[#EDECE8]' : 'bg-[#FAF8F5] border-black/10 text-[#2C2B29]'
      }`}
    >
      {/* Left: Brand & Project Info & History */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" />
          <h1 className="font-serif font-bold text-sm sm:text-base tracking-tight hidden lg:inline">
            MathMind
          </h1>
        </div>

        <div className="h-3.5 w-[1px] bg-black/10 dark:bg-white/10 hidden sm:block shrink-0" />

        {/* Project Switcher Trigger */}
        <button
          onClick={onOpenProjectManager}
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 text-xs rounded-md transition-colors group shrink-0 ${
            isDark
              ? 'hover:bg-white/5 text-zinc-200'
              : 'hover:bg-black/5 text-stone-800'
          }`}
          title="项目管理 (P / Ctrl+P)"
        >
          <Layers className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
          <span className="font-serif font-medium max-w-[60px] sm:max-w-[100px] md:max-w-[130px] lg:max-w-[170px] truncate">
            {currentProject.name}
          </span>
          <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({nodeCount})</span>
          <KbdBadge isDark={isDark} className="hidden md:inline-flex">P</KbdBadge>
          <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 shrink-0" />
        </button>

        {/* Undo / Redo Buttons */}
        <div className={`hidden md:flex items-center rounded-md p-0.5 shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors ${
              canUndo
                ? isDark
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-white text-stone-900 shadow-xs'
                : 'opacity-25 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors ${
              canRedo
                ? isDark
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-white text-stone-900 shadow-xs'
                : 'opacity-25 cursor-not-allowed'
            }`}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="relative flex-1 min-w-[60px] max-w-[110px] sm:max-w-[150px] md:max-w-[200px] mx-1 shrink">
        <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          id="global-search-input"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索... (/)"
          className={`w-full pl-7 pr-4 py-1 text-xs rounded-md border focus:outline-none transition-all font-serif ${
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:border-blue-400/60 focus:bg-white/10'
              : 'bg-black/5 border-black/10 text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:bg-white'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        {/* Layout Switcher (Sleek Segmented Capsule) */}
        <div className={`hidden sm:flex items-center rounded-lg p-0.5 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <button
            onClick={() => onChangeLayout('dagre')}
            className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
              layoutType === 'dagre'
                ? isDark
                  ? 'bg-[#27272A] text-white shadow-xs font-semibold'
                  : 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="分层拓扑布局 (1)"
          >
            <GitFork className="w-3 h-3" />
            <span className="hidden xl:inline">分层</span>
            <KbdBadge isDark={isDark} active={layoutType === 'dagre'}>1</KbdBadge>
          </button>
          <button
            onClick={() => onChangeLayout('cose')}
            className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
              layoutType === 'cose'
                ? isDark
                  ? 'bg-[#27272A] text-white shadow-xs font-semibold'
                  : 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="力导向布局 (2)"
          >
            <Network className="w-3 h-3" />
            <span className="hidden xl:inline">力导向</span>
            <KbdBadge isDark={isDark} active={layoutType === 'cose'}>2</KbdBadge>
          </button>
        </div>

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`hidden sm:flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
            isFocusMode
              ? 'bg-blue-600 text-white font-medium shadow-xs'
              : isDark
                ? 'hover:bg-white/5 text-zinc-300 opacity-80 hover:opacity-100'
                : 'hover:bg-black/5 text-stone-700 opacity-80 hover:opacity-100'
          }`}
          title="聚焦模式 (F)"
        >
          {isFocusMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{isFocusMode ? '聚焦: 开' : '聚焦'}</span>
          <KbdBadge isDark={isDark} active={isFocusMode}>F</KbdBadge>
        </button>

        {/* Connect Mode Toggle */}
        <button
          onClick={onToggleConnectingMode}
          className={`hidden sm:flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
            isConnectingMode
              ? 'bg-blue-600 text-white font-medium shadow-xs'
              : isDark
                ? 'hover:bg-white/5 text-zinc-300 opacity-80 hover:opacity-100'
                : 'hover:bg-black/5 text-stone-700 opacity-80 hover:opacity-100'
          }`}
          title="连线模式 (L)"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{isConnectingMode ? '连线中...' : '连线'}</span>
          <KbdBadge isDark={isDark} active={isConnectingMode}>L</KbdBadge>
        </button>

        {/* New Proposition Button */}
        <button
          onClick={onOpenCreateModal}
          className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-all shadow-xs whitespace-nowrap ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-[#2C2B29] hover:bg-[#3F3E3A] text-white'
          }`}
          title="新建命题 (N / Ctrl+N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">新建命题</span>
          <KbdBadge isDark={isDark} variant="solid" className="hidden xl:inline-flex">N</KbdBadge>
        </button>

        {/* AI Ingestion Button */}
        {onOpenAiIngestion && (
          <button
            onClick={onOpenAiIngestion}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-all shadow-xs whitespace-nowrap ${
              isDark
                ? 'bg-indigo-600/90 hover:bg-indigo-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="AI 智能录入教材 (Shift+I)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI 录入</span>
            <KbdBadge isDark={isDark} variant="solid" className="hidden xl:inline-flex">Shift+I</KbdBadge>
          </button>
        )}

        {/* Save to Local / Export */}
        <button
          onClick={() => (onManualSave ? onManualSave() : onSaveAs())}
          onContextMenu={e => {
            e.preventDefault();
            onSaveAs();
          }}
          className={`hidden sm:flex items-center space-x-1 px-1.5 sm:px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
            isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
          }`}
          title="立即保存 (Ctrl+S) · 右键或 Alt+S 另存为文件"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden 2xl:inline">保存</span>
          <KbdBadge isDark={isDark} className="hidden xl:inline-flex">Ctrl+S</KbdBadge>
        </button>

        {/* Import JSON */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`hidden sm:block p-1.5 rounded-md transition-colors ${
            isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
          }`}
          title="导入 JSON"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImport}
          accept=".json"
          className="hidden"
        />

        {/* Shortcuts Help */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className={`hidden sm:flex items-center space-x-1 p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
            }`}
            title="快捷键指南 (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <KbdBadge isDark={isDark} className="hidden xl:inline-flex">?</KbdBadge>
          </button>
        )}

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center space-x-1 p-1.5 rounded-md transition-colors text-amber-500 ${
            isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
          }`}
          title={isDark ? '切换浅色模式 (T)' : '切换深色模式 (T)'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-[#1E3A5F]" />}
          <KbdBadge isDark={isDark} className="hidden xl:inline-flex">T</KbdBadge>
        </button>

        {/* Sponsor Button */}
        {onOpenSponsor && (
          <button
            onClick={onOpenSponsor}
            className={`flex items-center space-x-1 p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-white/5 text-amber-400 hover:text-amber-300' : 'hover:bg-black/5 text-amber-600 hover:text-amber-700'
            }`}
            title="赞助支持 (Sponsor)"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline text-xs font-serif">赞助</span>
          </button>
        )}

        {/* System Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1 p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-white/5 text-zinc-300 hover:text-white' : 'hover:bg-black/5 text-stone-700 hover:text-black'
            }`}
            title="系统设置 (Ctrl+,)"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <KbdBadge isDark={isDark} className="hidden xl:inline-flex">Ctrl+,</KbdBadge>
          </button>
        )}
      </div>
    </header>
  );
};
