import React from 'react';
import { Save, Download, RotateCcw, Check } from 'lucide-react';
import { AutoSaveMode, AUTO_SAVE_OPTIONS } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface StorageTabProps {
  autoSaveMode: AutoSaveMode;
  onAutoSaveModeChange: (mode: AutoSaveMode) => void;
  storageInfo: { size: string; projectCount: number; nodeCount: number };
  onManualSave: () => void;
  onExportAllProjects: () => void;
  onResetToDefaults: () => void;
  isDark: boolean;
}

export const StorageTab: React.FC<StorageTabProps> = ({
  autoSaveMode,
  onAutoSaveModeChange,
  storageInfo,
  onManualSave,
  onExportAllProjects,
  onResetToDefaults,
  isDark
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Auto-save Strategy */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          {t('settings.autosaveTitle')}
        </h3>
        <p className="text-xs opacity-60 mb-3">
          {t('settings.autosaveDesc')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AUTO_SAVE_OPTIONS.map(opt => {
            const isSelected = autoSaveMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => onAutoSaveModeChange(opt.mode)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                    : isDark
                    ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                    : 'border-black/10 hover:border-black/20 bg-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <span>{opt.label}</span>
                    {opt.mode === 'realtime' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-normal">
                        推荐
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-60 mt-0.5">{opt.description}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

      {/* Storage usage stats */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
          {t('settings.storageTitle')}
        </h3>
        <div className={`p-4 rounded-xl border grid grid-cols-3 gap-3 text-center ${
          isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
        }`}>
          <div>
            <div className="text-lg sm:text-xl font-serif font-bold text-blue-500">{storageInfo.projectCount}</div>
            <div className="text-[11px] opacity-60">项目总数</div>
          </div>
          <div className="border-x border-black/10 dark:border-white/10">
            <div className="text-lg sm:text-xl font-serif font-bold text-indigo-500">{storageInfo.nodeCount}</div>
            <div className="text-[11px] opacity-60">命题节点总计</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-serif font-bold text-emerald-500">{storageInfo.size}</div>
            <div className="text-[11px] opacity-60">已用存储空间</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onManualSave}
            className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{t('header.manualSave')} (Ctrl+S)</span>
          </button>

          <button
            onClick={onExportAllProjects}
            className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-colors ${
              isDark ? 'border-white/15 hover:bg-white/5 text-zinc-200' : 'border-black/15 hover:bg-black/5 text-stone-800'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{t('settings.exportBackupBtn')}</span>
          </button>
        </div>

        {/* Reset defaults */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (confirm(t('settings.resetConfirm'))) {
                onResetToDefaults();
              }
            }}
            className="w-full px-3.5 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('settings.resetDefaultsBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
