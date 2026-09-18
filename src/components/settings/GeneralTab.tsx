import React from 'react';
import { Sun, Moon, Laptop, Check, Sparkles } from 'lucide-react';
import { ThemeMode } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface GeneralTabProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  isDark: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  themeMode,
  onThemeModeChange,
  isDark
}) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Language Switcher */}
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
            className={`p-3.5 border flex items-center justify-between transition-all ${
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
            className={`p-3.5 border flex items-center justify-between transition-all ${
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
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all ${
              themeMode === 'paper'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-amber-100 text-amber-800">
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
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all ${
              themeMode === 'dark'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-zinc-800 text-blue-400">
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
            className={`p-3.5 border flex flex-col items-center justify-center space-y-2 transition-all ${
              themeMode === 'system'
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                : isDark
                ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
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

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">
          排版与数学排版引擎
        </h3>
        <div className={`p-4 border space-y-2 ${
          isDark ? 'border-white/10 bg-zinc-900/40' : 'border-black/10 bg-white'
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
