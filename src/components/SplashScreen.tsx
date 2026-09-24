import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isDark: boolean;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isDark, onFinished }) => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    // 850ms 保持展示，等待底层 Cytoscape 节点布局完成与 KaTeX 字体解析稳定
    const timer = setTimeout(() => {
      setPhase('fading');
    }, 850);

    // 渐隐动画结束后卸载
    const hideTimer = setTimeout(() => {
      setPhase('hidden');
      onFinished?.();
    }, 1550);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [onFinished]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none transition-all duration-700 ease-out ${
        phase === 'fading'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        isDark
          ? 'bg-[#121214] text-[#EDECE8]'
          : 'bg-[#FAF8F5] text-[#2C2B29]'
      }`}
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)'
      }}
    >
      {/* 居中动态徽标与拓扑波纹 */}
      <div className="relative flex items-center justify-center mb-6">
        {/* 背景脉冲光晕 */}
        <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 animate-ping duration-1000" />
        <div className="absolute w-32 h-32 rounded-full bg-blue-500/10 blur-xl animate-pulse" />

        {/* 核心几何徽标 */}
        <div
          className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border transition-all ${
            isDark
              ? 'bg-[#18181B] border-blue-500/30 text-blue-400 shadow-blue-500/10'
              : 'bg-white border-blue-500/20 text-blue-600 shadow-blue-500/10'
          }`}
        >
          <BookOpen className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      {/* 品牌名称 */}
      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-2">
        <span>MathMind</span>
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
      </h1>

      {/* 标语 */}
      <p className="text-xs sm:text-sm font-serif opacity-60 mb-8 tracking-wide">
        让数理逻辑如星系般清晰可见
      </p>

      {/* 优雅进度微光条 */}
      <div className="w-48 sm:w-56 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full animate-[progress_1.2s_ease-in-out_infinite]"
          style={{
            width: '60%',
            animation: 'shimmer 1.4s ease-in-out infinite'
          }}
        />
      </div>

      <div className="text-[11px] font-mono opacity-40 mt-3">
        正在构建数理拓扑网络...
      </div>
    </div>
  );
};
