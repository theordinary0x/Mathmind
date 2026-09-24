import React from 'react';
import { Sun, Moon, Laptop, Check, Sparkles, Square, Layers, CircleDot, Zap, ZapOff, Activity, Gauge } from 'lucide-react';
import { ThemeMode, CornerStyle, SurfaceMaterial, AnimationFpsMode } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { UpdateCheckerCard } from './UpdateCheckerCard';

interface GeneralTabProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  cornerStyle: CornerStyle;
  onCornerStyleChange: (style: CornerStyle) => void;
  surfaceMaterial: SurfaceMaterial;
  onSurfaceMaterialChange: (material: SurfaceMaterial) => void;
  fpsMode: AnimationFpsMode;
  onFpsModeChange: (mode: AnimationFpsMode) => void;
  isDark: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  themeMode,
  onThemeModeChange,
  cornerStyle,
  onCornerStyleChange,
  surfaceMaterial,
  onSurfaceMaterialChange,
  fpsMode,
  onFpsModeChange,
  isDark
}) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Language Switcher */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          {t('settings.languageTitle')}
        </h3>
        <p className="text-xs opacity-60 mb-3">
          {t('settings.languageDesc')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Chinese */}
          <button
            type="button"
            onClick={() => setLanguage('zh')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              language === 'zh'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🇨🇳</span>
              <div className="text-left">
                <div className="text-xs font-bold">{t('settings.langZh')}</div>
                <div className="text-[10px] opacity-60">Simplified Chinese</div>
              </div>
            </div>
            {language === 'zh' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              language === 'en'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <div className="text-xs font-bold">{t('settings.langEn')}</div>
                <div className="text-[10px] opacity-60">English</div>
              </div>
            </div>
            {language === 'en' && <Check className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>

      <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

      {/* 2. Theme Mode Switcher */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          {t('settings.themeTitle')}
        </h3>
        <p className="text-xs opacity-60 mb-3">
          {t('settings.themeDesc')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Paper Light */}
          <button
            onClick={() => onThemeModeChange('paper')}
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all rounded-xl ${
              themeMode === 'paper'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold">{t('settings.themePaper')}</div>
              <div className="text-[10px] opacity-60">羊皮纸暖色调</div>
            </div>
            {themeMode === 'paper' && <Check className="w-3.5 h-3.5 text-blue-500" />}
          </button>

          {/* Dark */}
          <button
            onClick={() => onThemeModeChange('dark')}
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all rounded-xl ${
              themeMode === 'dark'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-zinc-800 text-blue-400 rounded-lg">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold">{t('settings.themeDark')}</div>
              <div className="text-[10px] opacity-60">护眼低对比暗黑</div>
            </div>
            {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-blue-500" />}
          </button>

          {/* System */}
          <button
            onClick={() => onThemeModeChange('system')}
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all rounded-xl ${
              themeMode === 'system'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold">{t('settings.themeSystem')}</div>
              <div className="text-[10px] opacity-60">自动匹配系统设置</div>
            </div>
            {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </div>

      <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

      {/* 3. 边角形态 (Corner Geometry) */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          边角形态 (Corner Geometry)
        </h3>
        <p className="text-xs opacity-60 mb-3">
          控制全局弹窗、顶底栏、操作卡片与按钮的轮廓几何特征
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rounded */}
          <button
            type="button"
            onClick={() => onCornerStyleChange('rounded')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              cornerStyle === 'rounded'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl border border-blue-500 flex items-center justify-center bg-blue-500/10">
                <CircleDot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">优雅圆角 (Rounded)</div>
                <div className="text-[10px] opacity-60">现代流畅触感，柔和温润</div>
              </div>
            </div>
            {cornerStyle === 'rounded' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Sharp */}
          <button
            type="button"
            onClick={() => onCornerStyleChange('sharp')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-none ${
              cornerStyle === 'sharp'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border border-zinc-500 flex items-center justify-center bg-zinc-500/10">
                <Square className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">严谨直角 (Sharp)</div>
                <div className="text-[10px] opacity-60">经典工程结构，纯正学术硬朗</div>
              </div>
            </div>
            {cornerStyle === 'sharp' && <Check className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>

      <hr className={isDark ? 'border-white/10' : 'border-black/10'} />

      {/* 4. 表面材质 (Surface Material) */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          表面材质 (Surface Material)
        </h3>
        <p className="text-xs opacity-60 mb-3">
          控制面板在画布上方的透光质感与背景滤镜
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Glass */}
          <button
            type="button"
            onClick={() => onSurfaceMaterialChange('glass')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              surfaceMaterial === 'glass'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-amber-500/40 flex items-center justify-center bg-amber-500/10">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">磨砂毛玻璃 (Frosted Glass)</div>
                <div className="text-[10px] opacity-60">半透明模糊滤镜，通透层次景深</div>
              </div>
            </div>
            {surfaceMaterial === 'glass' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Solid */}
          <button
            type="button"
            onClick={() => onSurfaceMaterialChange('solid')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              surfaceMaterial === 'solid'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-zinc-500/40 flex items-center justify-center bg-zinc-500/10">
                <Layers className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">纯平不透明 (Solid Surface)</div>
                <div className="text-[10px] opacity-60">100% 不透明基底，最高对比与防眩光</div>
              </div>
            </div>
            {surfaceMaterial === 'solid' && <Check className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>

      <hr className={isDark ? 'border-[#2E2E33]' : 'border-[#D4CDC0]'} />

      {/* 5. 动画与目标帧率 (FPS Profile) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">
            动画与目标帧率 (Animation & FPS Target)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
            {fpsMode === 'high' ? '120Hz+ 满血高刷' : fpsMode === 'standard' ? '60 FPS 标准' : fpsMode === 'economy' ? '30 FPS 节能' : '0 FPS 极速无影'}
          </span>
        </div>
        <p className="text-xs opacity-60 mb-3">
          调控画布拓扑物理模拟重绘频率与全局动画补间时长，兼顾丝滑视效与设备功耗。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* High 120Hz */}
          <button
            type="button"
            onClick={() => onFpsModeChange('high')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              fpsMode === 'high'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-amber-500/40 flex items-center justify-center bg-amber-500/10">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>120Hz+ 满血高刷</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded">流畅优先</span>
                </div>
                <div className="text-[10px] opacity-60">高频物理细分重绘与 650ms 丝滑长补间</div>
              </div>
            </div>
            {fpsMode === 'high' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Standard 60fps */}
          <button
            type="button"
            onClick={() => onFpsModeChange('standard')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              fpsMode === 'standard'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-blue-500/40 flex items-center justify-center bg-blue-500/10">
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>60 FPS 标准流体</span>
                  <span className="text-[9px] px-1 py-0.2 bg-blue-500/20 text-blue-400 rounded">推荐</span>
                </div>
                <div className="text-[10px] opacity-60">平衡帧率与计算负荷，经典流体动效</div>
              </div>
            </div>
            {fpsMode === 'standard' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Economy 30fps */}
          <button
            type="button"
            onClick={() => onFpsModeChange('economy')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              fpsMode === 'economy'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-emerald-500/40 flex items-center justify-center bg-emerald-500/10">
                <Gauge className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>30 FPS 节能低耗</span>
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">省电</span>
                </div>
                <div className="text-[10px] opacity-60">降低刷新步长与动效时长，延长续航</div>
              </div>
            </div>
            {fpsMode === 'economy' && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Off 0fps */}
          <button
            type="button"
            onClick={() => onFpsModeChange('off')}
            className={`p-3.5 border flex items-center justify-between transition-all rounded-xl ${
              fpsMode === 'off'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg border border-zinc-500/40 flex items-center justify-center bg-zinc-500/10">
                <ZapOff className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>极速无影 (0 FPS)</span>
                  <span className="text-[9px] px-1 py-0.2 bg-zinc-500/20 text-zinc-400 rounded">零等待</span>
                </div>
                <div className="text-[10px] opacity-60">彻底关闭补间动画，窗口与节点瞬移就位</div>
              </div>
            </div>
            {fpsMode === 'off' && <Check className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>

      <hr className={isDark ? 'border-[#2E2E33]' : 'border-[#D4CDC0]'} />

      {/* 5. 检查更新与版本信息 */}
      <UpdateCheckerCard isDark={isDark} />

      <hr className={isDark ? 'border-[#2E2E33]' : 'border-[#D4CDC0]'} />

      {/* 6. 排版引擎信息 */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          排版与数学排版引擎
        </h3>
        <div className={`p-4 border space-y-2 rounded-xl ${
          isDark ? 'border-white/10 bg-[#121214]' : 'border-black/10 bg-white'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>KaTeX 极速数学渲染引擎 · 行内与块级公式支持</span>
          </div>
          <p className="text-xs opacity-70 leading-relaxed">
            MathMind 内置高性能 KaTeX 数学公式渲染器，使用单美元符号 <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 text-[11px]">$...$</code> 进行行内渲染，使用双美元符号 <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 text-[11px]">$$...$$</code> 进行居中大公式展示。
          </p>
        </div>
      </div>
    </div>
  );
};
