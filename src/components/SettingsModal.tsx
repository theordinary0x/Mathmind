import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Settings,
  X,
  Palette,
  Grid,
  HardDrive,
  Keyboard,
  Sun,
  Moon,
  Laptop,
  Save,
  Download,
  RotateCcw,
  Sparkles,
  Check,
  FileText,
  Monitor,
  Upload
} from 'lucide-react';
import {
  AppTheme,
  ThemeMode,
  CanvasSettings,
  BackgroundPresetType,
  AutoSaveMode,
  AUTO_SAVE_OPTIONS,
  Project
} from '../types';
import { calculateStorageUsage } from '../utils/storage';

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
}

type TabType = 'general' | 'canvas' | 'storage' | 'shortcuts';

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

const SHORTCUT_LIST = [
  { group: '全局导航与设置', items: [
    { key: 'Ctrl + ,', desc: '打开系统设置' },
    { key: 'Ctrl + S', desc: '立即保存到本地存储' },
    { key: 'Alt + S', desc: '另存为 JSON 文件' },
    { key: 'P / Ctrl + P', desc: '打开项目管理面板' },
    { key: '?', desc: '查看快捷键指南' },
    { key: '/', desc: '聚焦快速搜索框' },
    { key: 'T', desc: '快速切换深浅主题' }
  ]},
  { group: '命题编辑', items: [
    { key: 'N / Ctrl + N', desc: '新建命题节点' },
    { key: '双击画布', desc: '在光标所在位置新建命题' },
    { key: 'Ctrl + Enter', desc: '保存 / 提交当前编辑' },
    { key: 'Delete / Backspace', desc: '删除选中节点' },
    { key: 'Ctrl + C / X / V', desc: '复制 / 剪切 / 粘贴命题' },
    { key: 'Ctrl + Z / Y', desc: '撤销 / 重做' }
  ]},
  { group: '画布与视图', items: [
    { key: '1', desc: '分层拓扑布局 (Dagre)' },
    { key: '2', desc: '物理力导向布局 (CoSE)' },
    { key: 'F', desc: '切换单链聚焦模式' },
    { key: '0', desc: '居中并自适应全览' },
    { key: '+ / -', desc: '缩放画布视图' },
    { key: 'L', desc: '切换连线模式' },
    { key: 'Esc', desc: '退出连线 / 取消选中 / 关闭弹窗' }
  ]}
];

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
  onManualSave
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

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
        className={`relative w-full max-w-3xl h-[620px] max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
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
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="settings-modal-title" className="font-serif font-bold text-sm sm:text-lg flex items-center space-x-1.5 sm:space-x-2">
                <span>系统设置</span>
                <span className="text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-normal">
                  Ctrl + ,
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs opacity-60 truncate">自定义 MathMind 外观、画布渲染与数据管理策略</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-stone-500 hover:text-black'
            }`}
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container (Tabs + Panel) */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Tab Nav: Horizontal on mobile, vertical sidebar on desktop */}
          <div
            className={`w-full sm:w-44 md:w-52 border-b sm:border-b-0 sm:border-r p-2 sm:p-2.5 flex flex-row sm:flex-col gap-1.5 sm:space-y-1 shrink-0 overflow-x-auto sm:overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isDark ? 'border-white/10 bg-zinc-900/30' : 'border-black/10 bg-stone-100/50'
            }`}
          >
            <button
              onClick={() => setActiveTab('general')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>常规与外观</span>
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'canvas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>画布与背景</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span>保存与数据</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left whitespace-nowrap ${
                activeTab === 'shortcuts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-300 hover:bg-white/5'
                  : 'text-stone-700 hover:bg-black/5'
              }`}
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>快捷键速查</span>
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
            {/* TAB 1: 常规与外观 */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
                    主题外观 (Theme)
                  </h3>
                  <p className="text-xs opacity-60 mb-3">
                    选择您喜爱的界面色调风格或跟随操作系统自动调整
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Paper Light */}
                    <button
                      onClick={() => onThemeModeChange('paper')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        themeMode === 'paper'
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                          : isDark
                          ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                          : 'border-black/10 hover:border-black/20 bg-white'
                      }`}
                    >
                      <div className="p-2.5 rounded-full bg-amber-100 text-amber-800">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold">浅色手稿 (Paper)</div>
                        <div className="text-[10px] opacity-60">羊皮纸暖色调</div>
                      </div>
                      {themeMode === 'paper' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>

                    {/* Dark */}
                    <button
                      onClick={() => onThemeModeChange('dark')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        themeMode === 'dark'
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                          : isDark
                          ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                          : 'border-black/10 hover:border-black/20 bg-white'
                      }`}
                    >
                      <div className="p-2.5 rounded-full bg-zinc-800 text-blue-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold">深色黑板 (Dark)</div>
                        <div className="text-[10px] opacity-60">护眼低对比暗黑</div>
                      </div>
                      {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>

                    {/* System */}
                    <button
                      onClick={() => onThemeModeChange('system')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        themeMode === 'system'
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                          : isDark
                          ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                          : 'border-black/10 hover:border-black/20 bg-white'
                      }`}
                    >
                      <div className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold">跟随系统 (System)</div>
                        <div className="text-[10px] opacity-60">自动匹配系统设置</div>
                      </div>
                      {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  </div>
                </div>

                <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
                    排版与数学排版引擎
                  </h3>
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                  }`}>
                    <div className="flex items-center space-x-2 text-xs font-medium">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>KaTeX 极速数学渲染引擎 · 行内与块级公式支持</span>
                    </div>
                    <p className="text-xs opacity-70 leading-relaxed">
                      MathMind 内置高性能 KaTeX 数学公式渲染器，使用单美元符号 <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">$...$</code> 进行行内渲染，使用双美元符号 <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">$$...$$</code> 进行居中大公式展示。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 画布与背景 */}
            {activeTab === 'canvas' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Background Preset */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
                    背景风格预设
                  </h3>
                  <p className="text-xs opacity-60 mb-3">为您的数学网络选择最契合的思考底色</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PRESETS.map(preset => {
                      const isActive = canvasSettings.backgroundPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => onUpdateCanvasSettings({ ...canvasSettings, backgroundPreset: preset.id })}
                          className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-left transition-all ${
                            isActive
                              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                              : isDark
                              ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                              : 'border-black/10 hover:border-black/20 bg-white'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-inner"
                            style={{ background: preset.previewBg }}
                          >
                            <span className={isActive ? 'text-blue-500' : 'opacity-70'}>{preset.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{preset.title}</div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </button>
                      );
                    })}

                    {/* Custom Image */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-left transition-all ${
                        canvasSettings.backgroundPreset === 'custom'
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                          : isDark
                          ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                          : 'border-black/10 hover:border-black/20 bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg border border-dashed flex items-center justify-center shrink-0">
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
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                  }`}>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span>背景不透明度</span>
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

                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                  }`}>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span>背景模糊度 (毛玻璃)</span>
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
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                    }`}>
                      <div>
                        <div className="text-xs font-bold">默认拓扑布局算法</div>
                        <div className="text-[11px] opacity-60">选择逻辑推导层次或物理力导向布局</div>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/10 p-1 rounded-lg">
                        <button
                          onClick={() => onChangeLayout('dagre')}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                            layoutType === 'dagre'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          层次 (Dagre)
                        </button>
                        <button
                          onClick={() => onChangeLayout('cose')}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                            layoutType === 'cose'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          引力 (CoSE)
                        </button>
                      </div>
                    </div>

                    {/* Context menu toggle */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                    }`}>
                      <div>
                        <div className="text-xs font-bold">拦截浏览器原生右键菜单</div>
                        <div className="text-[11px] opacity-60">优先展示 MathMind 画布专用快捷操作菜单</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={canvasSettings.preventBrowserContextMenu}
                          onChange={e => onUpdateCanvasSettings({ ...canvasSettings, preventBrowserContextMenu: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 保存与数据 */}
            {activeTab === 'storage' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Auto-save Strategy */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
                    自动保存策略 (Auto-Save)
                  </h3>
                  <p className="text-xs opacity-60 mb-3">
                    实时保存将即时同步节点编辑与拖拽排版；您也可以自定义定时同步频率
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
                    本地存储与数据统计
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
                      onClick={() => {
                        onManualSave();
                      }}
                      className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>立即保存所有更改 (Ctrl+S)</span>
                    </button>

                    <button
                      onClick={onExportAllProjects}
                      className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-colors ${
                        isDark ? 'border-white/15 hover:bg-white/5 text-zinc-200' : 'border-black/15 hover:bg-black/5 text-stone-800'
                      }`}
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>导出全量工程备份 (.json)</span>
                    </button>
                  </div>

                  {/* Reset defaults */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (confirm('确定要恢复官方预置体系吗？现有的修改将被官方示例（皮亚诺与欧几里得体系）覆盖重置。')) {
                          onResetToDefaults();
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors text-amber-600 dark:text-amber-400 hover:bg-amber-500/10`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>恢复官方默认示例项目</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 快捷键速查 */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
                    键盘快捷键清单
                  </h3>
                  <p className="text-xs opacity-60 mb-3">
                    熟练使用快捷键可显著提升数学推导与知识图谱排版效率
                  </p>
                </div>

                <div className="space-y-4">
                  {SHORTCUT_LIST.map(group => (
                    <div
                      key={group.group}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold opacity-80">{group.group}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map(item => (
                          <div key={item.desc} className="flex items-center justify-between text-xs py-1">
                            <span className="opacity-70">{item.desc}</span>
                            <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] select-none ${
                              isDark ? 'bg-white/10 text-zinc-200' : 'bg-black/5 text-stone-800'
                            }`}>
                              {item.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
