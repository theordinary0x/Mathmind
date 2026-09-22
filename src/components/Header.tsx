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
import { useTranslation } from '../i18n/LanguageContext';

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
  isCopilotOpen?: boolean;
  onToggleCopilot?: () => void;
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
      className={`inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-mono leading-none select-none ${colorStyles} ${className}`}
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
  isCopilotOpen,
  onToggleCopilot,
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
  const { t, language } = useTranslation();

  return (
    <header
      className={`h-13 sm:h-14 px-3 sm:px-4 border-b flex items-center justify-between select-none z-20 shrink-0 transition-colors gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap ${
        isDark ? 'bg-[#18181B] border-[#2E2E33] text-[#EDECE8]' : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
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
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 text-xs transition-colors group shrink-0 ${
            isDark
              ? 'hover:bg-white/5 text-zinc-200'
              : 'hover:bg-black/5 text-stone-800'
          }`}
          title={`${t('header.projectManager')} (P)`}
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
        <div className={`hidden md:flex items-center p-0.5 shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 transition-colors ${
              canUndo
                ? isDark
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-white text-stone-900 shadow-xs'
                : 'opacity-25 cursor-not-allowed'
            }`}
            title={`${t('common.undo')} (Ctrl+Z)`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 transition-colors ${
              canRedo
                ? isDark
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-white text-stone-900 shadow-xs'
                : 'opacity-25 cursor-not-allowed'
            }`}
            title={`${t('common.redo')} (Ctrl+Y)`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="relative flex-1 min-w-[70px] max-w-[130px] sm:max-w-[160px] md:max-w-[210px] mx-1 shrink">
        <Search className="w-3.5 h-3.5 opacity-40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          id="global-search-input"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t('header.searchPlaceholder')}
          className={`w-full pl-7 pr-4 py-1 text-xs border focus:outline-none transition-all font-serif ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white placeholder-zinc-500 focus:border-blue-500'
              : 'bg-white border-[#D4CDC0] text-stone-900 placeholder-stone-400 focus:border-blue-500'
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
        {/* Canvas Tools Cluster */}
        <div className={`hidden sm:flex items-center p-0.5 border ${isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'}`}>
          {/* Layout Switcher */}
          <button
            onClick={() => onChangeLayout('dagre')}
            className={`flex items-center space-x-1 px-1.5 py-0.5 text-xs transition-all whitespace-nowrap ${
              layoutType === 'dagre'
                ? isDark
                  ? 'bg-[#27272A] text-white shadow-xs font-semibold'
                  : 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title={`${t('header.dagreLayout')} (1)`}
          >
            <GitFork className="w-3 h-3" />
            <span className="hidden xl:inline">{language === 'zh' ? '分层' : 'DAG'}</span>
            <KbdBadge isDark={isDark} active={layoutType === 'dagre'}>1</KbdBadge>
          </button>
          <button
            onClick={() => onChangeLayout('cose')}
            className={`flex items-center space-x-1 px-1.5 py-0.5 text-xs transition-all whitespace-nowrap ${
              layoutType === 'cose'
                ? isDark
                  ? 'bg-[#27272A] text-white shadow-xs font-semibold'
                  : 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title={`${t('header.coseLayout')} (2)`}
          >
            <Network className="w-3 h-3" />
            <span className="hidden xl:inline">{language === 'zh' ? '力导向' : 'Force'}</span>
            <KbdBadge isDark={isDark} active={layoutType === 'cose'}>2</KbdBadge>
          </button>

          <div className="h-3 w-[1px] bg-black/10 dark:bg-white/10 mx-0.5 shrink-0" />

          {/* Focus Mode */}
          <button
            onClick={onToggleFocusMode}
            className={`flex items-center space-x-1 px-1.5 py-0.5 text-xs transition-colors whitespace-nowrap ${
              isFocusMode
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : isDark
                  ? 'hover:bg-white/5 text-zinc-300 opacity-75 hover:opacity-100'
                  : 'hover:bg-black/5 text-stone-700 opacity-75 hover:opacity-100'
            }`}
            title={`${t('header.focusMode')} (F)`}
          >
            {isFocusMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <KbdBadge isDark={isDark} active={isFocusMode}>F</KbdBadge>
          </button>

          {/* Connect Mode */}
          <button
            onClick={onToggleConnectingMode}
            className={`flex items-center space-x-1 px-1.5 py-0.5 text-xs transition-colors whitespace-nowrap ${
              isConnectingMode
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : isDark
                  ? 'hover:bg-white/5 text-zinc-300 opacity-75 hover:opacity-100'
                  : 'hover:bg-black/5 text-stone-700 opacity-75 hover:opacity-100'
            }`}
            title={`${t('header.connectMode')} (L)`}
          >
            <Link2 className="w-3 h-3" />
            <KbdBadge isDark={isDark} active={isConnectingMode}>L</KbdBadge>
          </button>
        </div>

        {/* Primary Action: New Proposition */}
        <button
          onClick={onOpenCreateModal}
          className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 text-xs font-medium transition-all shadow-xs whitespace-nowrap ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-[#2C2B29] hover:bg-[#3F3E3A] text-white'
          }`}
          title={`${t('header.newProposition')} (N)`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t('header.newProposition')}</span>
          <span className="md:hidden">新建</span>
          <KbdBadge isDark={isDark} variant="solid" className="hidden lg:inline-flex">N</KbdBadge>
        </button>

        {/* AI Copilot Sidebar Toggle Button */}
        {onToggleCopilot && (
          <button
            onClick={onToggleCopilot}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1 text-xs font-medium transition-all shadow-xs whitespace-nowrap border ${
              isCopilotOpen
                ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                : isDark
                ? 'bg-[#202024] hover:bg-[#27272A] text-zinc-200 border-[#2E2E33]'
                : 'bg-white hover:bg-stone-100 text-stone-800 border-[#D4CDC0]'
            }`}
            title="Math Copilot 智能结对助手 (I)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">{language === 'zh' ? 'AI 助手' : 'AI Copilot'}</span>
            <KbdBadge isDark={isDark} variant="solid" className="hidden lg:inline-flex">I</KbdBadge>
          </button>
        )}

        <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden sm:block shrink-0 mx-0.5" />

        {/* Utility Icon Group */}
        <div className="flex items-center space-x-0.5 shrink-0">
          {/* Save */}
          <button
            onClick={() => (onManualSave ? onManualSave() : onSaveAs())}
            onContextMenu={e => {
              e.preventDefault();
              onSaveAs();
            }}
            className={`p-1.5 transition-colors ${
              isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
            }`}
            title={language === 'zh' ? '立即保存 (Ctrl+S) · 右键另存为 (Ctrl+Shift+S)' : 'Save (Ctrl+S) · Right-click to Save As (Ctrl+Shift+S)'}
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-1.5 transition-colors ${
              isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
            }`}
            title={`${t('common.import')} JSON`}
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
              className={`p-1.5 transition-colors ${
                isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-black/5 text-stone-700'
              }`}
              title={`${t('header.shortcuts')} (?)`}
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 transition-colors text-amber-500 ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
            title={isDark ? (language === 'zh' ? '切换浅色模式 (T)' : 'Switch to Light (T)') : (language === 'zh' ? '切换深色模式 (T)' : 'Switch to Dark (T)')}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-[#1E3A5F]" />}
          </button>

          {/* Sponsor Button */}
          {onOpenSponsor && (
            <button
              onClick={onOpenSponsor}
              className={`p-1.5 transition-colors ${
                isDark ? 'hover:bg-white/5 text-amber-400 hover:text-amber-300' : 'hover:bg-black/5 text-amber-600 hover:text-amber-700'
              }`}
              title={`${t('header.sponsor')}`}
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
          )}

          {/* System Settings */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`p-1.5 transition-colors ${
                isDark ? 'hover:bg-white/5 text-zinc-300 hover:text-white' : 'hover:bg-black/5 text-stone-700 hover:text-black'
              }`}
              title={`${t('header.settings')} (Ctrl+,)`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
