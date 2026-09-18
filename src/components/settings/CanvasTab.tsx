import React, { useRef } from 'react';
import { FileText, Monitor, Grid, Sparkles, Moon, Upload, Check } from 'lucide-react';
import { CanvasSettings, BackgroundPresetType } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface PresetOption {
  id: BackgroundPresetType;
  title: string;
  icon: React.ReactNode;
  previewBg: string;
}

const PRESETS: PresetOption[] = [
  {
    id: 'paper',
    title: '纸张',
    icon: <FileText className="w-4 h-4" />,
    previewBg: 'linear-gradient(135deg, #FAF8F2, #F0EDE4)'
  },
  {
    id: 'chalkboard',
    title: '黑板',
    icon: <Monitor className="w-4 h-4" />,
    previewBg: 'radial-gradient(circle, #18221C 0%, #101612 100%)'
  },
  {
    id: 'grid',
    title: '方格',
    icon: <Grid className="w-4 h-4" />,
    previewBg: 'linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)'
  },
  {
    id: 'dots',
    title: '点阵',
    icon: <Sparkles className="w-4 h-4" />,
    previewBg: 'radial-gradient(#888 1.5px, transparent 1.5px)'
  },
  {
    id: 'dark',
    title: '深色',
    icon: <Moon className="w-4 h-4" />,
    previewBg: 'radial-gradient(circle, #171E28 0%, #0A0D12 100%)'
  }
];

interface CanvasTabProps {
  canvasSettings: CanvasSettings;
  onUpdateCanvasSettings: (newSettings: CanvasSettings) => void;
  layoutType: 'dagre' | 'cose';
  onChangeLayout: (layout: 'dagre' | 'cose') => void;
  isDark: boolean;
}

export const CanvasTab: React.FC<CanvasTabProps> = ({
  canvasSettings,
  onUpdateCanvasSettings,
  layoutType,
  onChangeLayout,
  isDark
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocalizedPresetTitle = (id: BackgroundPresetType) => {
    switch (id) {
      case 'paper': return t('settings.presetPaper');
      case 'chalkboard': return t('settings.presetChalkboard');
      case 'grid': return t('settings.presetGrid');
      case 'dots': return t('settings.presetDots');
      case 'dark': return t('settings.presetDark');
      default: return id;
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件 (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件过大，请选择 5MB 以下的图片');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onUpdateCanvasSettings({
        ...canvasSettings,
        backgroundPreset: 'custom',
        customBgImage: dataUrl
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Background Preset */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          {t('settings.canvasPresetTitle')}
        </h3>
        <p className="text-xs opacity-60 mb-3">{t('settings.canvasPresetDesc')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PRESETS.map(preset => {
            const isActive = canvasSettings.backgroundPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onUpdateCanvasSettings({ ...canvasSettings, backgroundPreset: preset.id })}
                className={`p-2.5 border flex items-center space-x-2.5 text-left transition-all ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                    : isDark
                    ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                    : 'border-black/10 hover:border-black/20 bg-white'
                }`}
              >
                <div
                  className="w-7 h-7 border flex items-center justify-center shrink-0 shadow-inner"
                  style={{ background: preset.previewBg }}
                >
                  <span className={isActive ? 'text-blue-500' : 'opacity-70'}>{preset.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{getLocalizedPresetTitle(preset.id)}</div>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              </button>
            );
          })}

          {/* Custom Image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 border flex items-center space-x-2.5 text-left transition-all ${
              canvasSettings.backgroundPreset === 'custom'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="w-7 h-7 border border-dashed flex items-center justify-center shrink-0">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {canvasSettings.backgroundPreset === 'custom' ? '自定义图片' : '上传图片'}
              </div>
            </div>
            {canvasSettings.backgroundPreset === 'custom' && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Opacity & Blur Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 border space-y-2 ${
          isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
        }`}>
          <div className="flex justify-between items-center text-xs font-medium">
            <span>{t('settings.bgOpacity')}</span>
            <span className="font-mono text-blue-500 font-bold">{Math.round(canvasSettings.bgOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={canvasSettings.bgOpacity}
            onChange={e => onUpdateCanvasSettings({ ...canvasSettings, bgOpacity: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div className={`p-4 border space-y-2 ${
          isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
        }`}>
          <div className="flex justify-between items-center text-xs font-medium">
            <span>{t('settings.bgBlur')}</span>
            <span className="font-mono text-blue-500 font-bold">{canvasSettings.bgBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={canvasSettings.bgBlur}
            onChange={e => onUpdateCanvasSettings({ ...canvasSettings, bgBlur: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

      {/* Layout Algorithm & Interactions */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
          图谱布局与画布行为
        </h3>
        <div className="space-y-3">
          {/* Layout switcher */}
          <div className={`p-4 border flex items-center justify-between ${
            isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
          }`}>
            <div>
              <div className="text-xs font-bold">默认拓扑布局算法</div>
              <div className="text-[11px] opacity-60">选择逻辑推导层次或物理力导向布局</div>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/10 p-1">
              <button
                onClick={() => onChangeLayout('dagre')}
                className={`px-2.5 py-1 text-xs font-medium transition-all ${
                  layoutType === 'dagre'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {t('header.dagreLayout')}
              </button>
              <button
                onClick={() => onChangeLayout('cose')}
                className={`px-2.5 py-1 text-xs font-medium transition-all ${
                  layoutType === 'cose'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {t('header.coseLayout')}
              </button>
            </div>
          </div>

          {/* Context menu toggle */}
          <div className={`p-4 border flex items-center justify-between ${
            isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
          }`}>
            <div>
              <div className="text-xs font-bold">{t('settings.preventContext')}</div>
              <div className="text-[11px] opacity-60">优先展示 MathMind 画布专用快捷操作菜单</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={canvasSettings.preventBrowserContextMenu}
                onChange={e => onUpdateCanvasSettings({ ...canvasSettings, preventBrowserContextMenu: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
