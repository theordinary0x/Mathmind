import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Save, 
  Zap, 
  RefreshCw, 
  ChevronUp, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { AppTheme, AutoSaveMode, AUTO_SAVE_OPTIONS } from '../types';
import { latexToUnicode } from '../utils/latexToUnicode';
import { useTranslation } from '../i18n/LanguageContext';

interface StatusBarProps {
  theme: AppTheme;
  projectName: string;
  nodeCount: number;
  edgeCount: number;
  selectedTitle: string | null;
  lastSavedTime: string;
  canUndo: boolean;
  canRedo: boolean;
  onOpenShortcuts?: () => void;
  // Auto-save additions
  autoSaveMode: AutoSaveMode;
  onChangeAutoSaveMode: (mode: AutoSaveMode) => void;
  isDirty: boolean;
  isSaving: boolean;
  onManualSave: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  projectName,
  nodeCount,
  edgeCount,
  selectedTitle,
  lastSavedTime,
  canUndo,
  canRedo,
  onOpenShortcuts,
  autoSaveMode,
  onChangeAutoSaveMode,
  isDirty,
  isSaving,
  onManualSave
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  // Click outside listener for the auto-save selector popover
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Current mode label
  const currentOption = AUTO_SAVE_OPTIONS.find(o => o.mode === autoSaveMode) || AUTO_SAVE_OPTIONS[0];

  return (
    <footer
      className={`h-6 px-3 sm:px-4 border-t flex items-center justify-between text-[11px] font-mono select-none z-20 shrink-0 transition-colors gap-2 relative ${
        isDark
          ? 'bg-[#18181B] border-white/10 text-[#A1A1AA]'
          : 'bg-[#FAF8F5] border-black/10 text-[#78756E]'
      }`}
    >
      {/* Auto-save Configuration Popover */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className={`absolute bottom-7 left-3 w-72 shadow-2xl border backdrop-blur-md p-3 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? 'bg-[#18181B]/95 border-white/10 text-zinc-200'
              : 'bg-white/95 border-black/10 text-stone-800'
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center space-x-1.5 font-sans font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('settings.autosaveTitle')}</span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-1 font-sans">
            {AUTO_SAVE_OPTIONS.map(opt => {
              const isActive = opt.mode === autoSaveMode;
              return (
                <button
                  key={opt.mode}
                  onClick={() => {
                    onChangeAutoSaveMode(opt.mode);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs transition-all text-left group ${
                    isActive
                      ? isDark
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-medium'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 font-medium'
                      : isDark
                        ? 'hover:bg-white/5 text-zinc-300'
                        : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      {opt.mode === 'realtime' && <Zap className="w-3 h-3 text-emerald-500 shrink-0" />}
                      {opt.mode !== 'realtime' && opt.mode !== 'manual' && <Clock className="w-3 h-3 text-blue-500 shrink-0" />}
                      {opt.mode !== 'manual' && opt.mode !== 'realtime' && null}
                      {opt.mode === 'manual' && <Save className="w-3 h-3 text-stone-400 shrink-0" />}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <div className="text-[10px] opacity-60 truncate mt-0.5 font-normal">
                      {opt.description}
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-blue-500" />}
                </button>
              );
            })}
          </div>

          {/* Popover Footer Action */}
          <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between font-sans">
            <span className="text-[10px] opacity-50 font-mono">
              {t('statusBar.lastSaved', { time: lastSavedTime || '---' })}
            </span>
            <button
              onClick={() => {
                onManualSave();
              }}
              disabled={isSaving}
              className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-medium transition-colors shadow-xs ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-stone-800 hover:bg-stone-900 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{t('common.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  <span>{t('common.save')} (Ctrl+S)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Left info & Auto-Save Pill Trigger */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0">
        {/* Interactive Auto-Save Button */}
        <button
          ref={triggerRef}
          onClick={() => setIsMenuOpen(prev => !prev)}
          className={`flex items-center space-x-1 px-1.5 py-0.5 transition-colors font-medium shrink-0 group cursor-pointer ${
            isSaving
              ? 'text-blue-400 bg-blue-500/10'
              : isDirty
                ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-emerald-500 hover:bg-emerald-500/10'
          }`}
          title={t('settings.autosaveDesc')}
        >
          {isSaving ? (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
          ) : isDirty ? (
            <AlertCircle className="w-3 h-3 text-amber-500" />
          ) : autoSaveMode === 'realtime' ? (
            <Zap className="w-3 h-3 text-emerald-500" />
          ) : autoSaveMode === 'manual' ? (
            <Save className="w-3 h-3 text-zinc-400" />
          ) : (
            <Clock className="w-3 h-3 text-emerald-500" />
          )}

          <span className="hidden sm:inline">
            {isSaving
              ? t('common.saving')
              : isDirty
                ? t('statusBar.saveStatusDirty')
                : autoSaveMode === 'realtime'
                  ? `${t('statusBar.saveStatusSaved')} (${lastSavedTime})`
                  : `${t('common.saved')} (${lastSavedTime})`}
          </span>
          <span className="sm:hidden">
            {isSaving ? t('common.saving') : isDirty ? t('statusBar.saveStatusDirty') : t('common.saved')}
          </span>

          <ChevronUp className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-transform" />
        </button>

        <span className="opacity-30">|</span>

        <div className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[260px]">
          {t('statusBar.projectLabel')}: <span className={isDark ? 'text-white font-bold' : 'text-[#2C2B29] font-bold font-serif'}>{projectName}</span>
        </div>

        <span className="opacity-30 hidden sm:inline">|</span>

        <div className="shrink-0 hidden sm:block">
          {t('statusBar.nodeCount', { count: nodeCount })} · {t('statusBar.edgeCount', { count: edgeCount })}
        </div>

        {selectedTitle && (
          <>
            <span className="opacity-30 hidden md:inline">|</span>
            <div className="truncate max-w-[160px] md:max-w-[220px] hidden md:block">
              {t('statusBar.selectedLabel')}: <span className={isDark ? 'text-blue-300 font-serif' : 'text-[#1E3A5F] font-serif'}>{latexToUnicode(selectedTitle)}</span>
            </div>
          </>
        )}
      </div>

      {/* Right Shortcuts & History */}
      <div className="flex items-center space-x-2 text-[10px] shrink-0">
        <div className="hidden xl:flex items-center space-x-2">
          <span className={canUndo ? (isDark ? 'text-[#E4E4E7]' : 'text-[#2C2B29]') : (isDark ? 'text-[#52525B]' : 'text-[#B5AFA4]')}>
            Ctrl+Z {t('common.undo')}
          </span>
          <span className={canRedo ? (isDark ? 'text-[#E4E4E7]' : 'text-[#2C2B29]') : (isDark ? 'text-[#52525B]' : 'text-[#B5AFA4]')}>
            Ctrl+Y {t('common.redo')}
          </span>
          <span>Ctrl+S {t('common.save')}</span>
          <span>N {t('common.edit')}</span>
          <span>L {t('header.connectMode')}</span>
          <span>F {t('header.focusMode')}</span>
          <span>1/2 {t('header.switchLayout')}</span>
          <span>0 {t('canvas.fitView')}</span>
        </div>
        <div className="hidden sm:flex xl:hidden items-center space-x-2">
          <span>Ctrl+S 保存</span>
          <span>N {t('common.edit')}</span>
          <span>0 全览</span>
        </div>
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hover:underline opacity-80 hover:opacity-100 flex items-center space-x-0.5 ml-1 text-blue-400 font-semibold cursor-pointer"
            title={`${t('shortcuts.title')} (?)`}
          >
            <span>? {t('statusBar.shortcutsTip')}</span>
          </button>
        )}
      </div>
    </footer>
  );
};
