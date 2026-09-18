import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  X,
  Palette,
  Grid,
  HardDrive,
  Keyboard,
  Sparkles,
  Coffee
} from 'lucide-react';
import {
  AppTheme,
  ThemeMode,
  CanvasSettings,
  AutoSaveMode,
  Project
} from '../types';
import { calculateStorageUsage } from '../utils/storage';
import { AiProvider, AiSettings } from '../types/ai';
import { 
  loadAiSettings, 
  saveAiSettings, 
  PROVIDER_CONFIGS, 
  getSavedKeyForProvider 
} from '../services/ai/aiConfig';
import { useTranslation } from '../i18n/LanguageContext';
import { GeneralTab } from './settings/GeneralTab';
import { CanvasTab } from './settings/CanvasTab';
import { StorageTab } from './settings/StorageTab';
import { ShortcutsTab } from './settings/ShortcutsTab';
import { AiConfigTab } from './settings/AiConfigTab';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  canvasSettings: CanvasSettings;
  onUpdateCanvasSettings: (newSettings: CanvasSettings) => void;
  autoSaveMode: AutoSaveMode;
  onAutoSaveModeChange: (mode: AutoSaveMode) => void;
  layoutType: 'dagre' | 'cose';
  onChangeLayout: (layout: 'dagre' | 'cose') => void;
  projects: Project[];
  onExportAllProjects: () => void;
  onResetToDefaults: () => void;
  onManualSave: () => void;
  onOpenSponsor?: () => void;
}

type TabType = 'general' | 'canvas' | 'storage' | 'shortcuts' | 'ai';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  themeMode,
  onThemeModeChange,
  canvasSettings,
  onUpdateCanvasSettings,
  autoSaveMode,
  onAutoSaveModeChange,
  layoutType,
  onChangeLayout,
  projects,
  onExportAllProjects,
  onResetToDefaults,
  onManualSave,
  onOpenSponsor
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [aiSavedNotice, setAiSavedNotice] = useState<boolean>(false);
  const isDark = theme === 'dark';

  const triggerAiSaveNotice = () => {
    setAiSavedNotice(true);
    setTimeout(() => setAiSavedNotice(false), 2000);
  };

  const handleProviderChange = (provider: AiProvider) => {
    const meta = PROVIDER_CONFIGS[provider];
    const savedKey = getSavedKeyForProvider(provider);
    const updated: AiSettings = {
      provider,
      apiKey: savedKey,
      baseUrl: meta.defaultBaseUrl,
      model: meta.defaultModel
    };
    setAiSettings(updated);
    saveAiSettings(updated);
    triggerAiSaveNotice();
  };

  const handleUpdateAiSettings = (partial: Partial<AiSettings>) => {
    const updated = { ...aiSettings, ...partial };
    setAiSettings(updated);
    saveAiSettings(updated);
    triggerAiSaveNotice();
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute storage info
  const storageInfo = useMemo(() => {
    const { formattedSize } = calculateStorageUsage();
    const totalNodes = projects.reduce((acc, p) => acc + (p.dataset?.nodes?.length || 0), 0);
    return {
      size: formattedSize,
      projectCount: projects.length,
      nodeCount: totalNodes
    };
  }, [projects, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className={`relative w-full max-w-3xl h-[620px] max-h-[92vh] border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#18181B] border-white/15 text-[#EDECE8]'
            : 'bg-[#FAF8F5] border-black/15 text-[#2C2B29]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-white/10 bg-zinc-900/60' : 'border-black/10 bg-white/70'
          }`}
        >
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 pr-2">
            <div className="p-1.5 sm:p-2 bg-blue-500/10 text-blue-500 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="settings-modal-title" className="font-serif font-bold text-sm sm:text-lg flex items-center space-x-1.5 sm:space-x-2">
                <span>{t('settings.title')}</span>
                <span className="text-[10px] sm:text-xs font-mono px-1.5 py-0.5 bg-blue-500/15 text-blue-500 font-normal">
                  Ctrl + ,
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs opacity-60 truncate">{t('settings.languageDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 transition-colors shrink-0 ${
              isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-stone-500 hover:text-black'
            }`}
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container (Tabs + Panel) */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Tab Nav */}
          <div
            className={`w-full sm:w-44 md:w-52 border-b sm:border-b-0 sm:border-r p-2 sm:p-2.5 flex flex-row sm:flex-col gap-1.5 sm:space-y-1 shrink-0 overflow-x-auto sm:overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isDark ? 'border-white/10 bg-zinc-900/30' : 'border-black/10 bg-stone-100/50'
            }`}
          >
            <button
              onClick={() => setActiveTab('general')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>{t('settings.tabGeneral')}</span>
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'canvas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>{t('settings.tabCanvas')}</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span>{t('settings.tabStorage')}</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'shortcuts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>{t('settings.tabShortcuts')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t('settings.tabAi')}</span>
            </button>

            {onOpenSponsor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSponsor();
                }}
                className="sm:mt-auto shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap text-amber-500 hover:bg-amber-500/10"
              >
                <Coffee className="w-4 h-4 shrink-0" />
                <span>{t('header.sponsor')}</span>
              </button>
            )}
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
            {activeTab === 'general' && (
              <GeneralTab
                themeMode={themeMode}
                onThemeModeChange={onThemeModeChange}
                isDark={isDark}
              />
            )}

            {activeTab === 'canvas' && (
              <CanvasTab
                canvasSettings={canvasSettings}
                onUpdateCanvasSettings={onUpdateCanvasSettings}
                layoutType={layoutType}
                onChangeLayout={onChangeLayout}
                isDark={isDark}
              />
            )}

            {activeTab === 'storage' && (
              <StorageTab
                autoSaveMode={autoSaveMode}
                onAutoSaveModeChange={onAutoSaveModeChange}
                storageInfo={storageInfo}
                onManualSave={onManualSave}
                onExportAllProjects={onExportAllProjects}
                onResetToDefaults={onResetToDefaults}
                isDark={isDark}
              />
            )}

            {activeTab === 'shortcuts' && (
              <ShortcutsTab isDark={isDark} />
            )}

            {activeTab === 'ai' && (
              <AiConfigTab
                aiSettings={aiSettings}
                onProviderChange={handleProviderChange}
                onUpdateAiSettings={handleUpdateAiSettings}
                aiSavedNotice={aiSavedNotice}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
