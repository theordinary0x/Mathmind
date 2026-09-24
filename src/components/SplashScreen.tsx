import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isDark: boolean;
  onStartDismiss?: () => void;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isDark, onStartDismiss, onFinished }) => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    // 450ms 展示核心品牌，随后触发渐隐并协同唤醒底层画布绽放入场
    const timer = setTimeout(() => {
      setPhase('fading');
      onStartDismiss?.();
    }, 450);

    // 渐隐动画结束后彻底卸载
    const hideTimer = setTimeout(() => {
      setPhase('hidden');
      onFinished?.();
    }, 950);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [onStartDismiss, onFinished]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${
        phase === 'fading'
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100 pointer-events-auto'
      } ${
        isDark
          ? 'bg-[#121214] text-[#EDECE8]'
          : 'bg-[#FAF8F5] text-[#2C2B29]'
      }`}
    >
      {/* 居中动态徽标与拓扑波纹 (纯 GPU 合成加速，仅内部做微缩放，杜绝全屏纹理重采样卡顿) */}
      <div
        className={`relative flex items-center justify-center mb-6 transition-all duration-500 ease-out ${
          phase === 'fading' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 背景同心脉冲光环 - 独立 GPU 合成层，不占用主线程 */}
        <div
          className="absolute w-28 h-28 rounded-full border border-blue-500/30 will-change-transform transform-gpu pointer-events-none"
          style={{ animation: 'mm-pulse-ring 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite' }}
        />
        <div
          className="absolute w-36 h-36 rounded-full border border-blue-400/20 will-change-transform transform-gpu pointer-events-none"
          style={{ animation: 'mm-pulse-ring 2.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite', animationDelay: '0.4s' }}
        />

        {/* 核心几何徽标 */}
        <div
          className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border transform-gpu will-change-transform transition-colors ${
            isDark
              ? 'bg-[#18181B] border-blue-500/30 text-blue-400 shadow-blue-500/10'
              : 'bg-white border-blue-500/25 text-blue-600 shadow-blue-500/10'
          }`}
        >
          <BookOpen className="w-8 h-8" />
        </div>
      </div>

      {/* 品牌名称 */}
      <div
        className={`flex flex-col items-center transition-all duration-500 ease-out ${
          phase === 'fading' ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-2">
          <span>MathMind</span>
          <Sparkles
            className="w-4 h-4 text-amber-400 will-change-transform transform-gpu"
            style={{ animation: 'mm-spin-slow 6s linear infinite' }}
          />
        </h1>

        {/* 标语 */}
        <p className="text-xs sm:text-sm font-serif opacity-60 mb-8 tracking-wide">
          让数理逻辑如星系般清晰可见
        </p>

        {/* 硬件加速极速流光条 (60~120 FPS 满帧独立渲染) */}
        <div className="w-52 sm:w-60 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
          <div
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full will-change-transform transform-gpu"
            style={{
              animation: 'mm-shimmer 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        </div>

        <div className="text-[11px] font-mono opacity-40 mt-3">
          正在构建数理拓扑网络...
        </div>
      </div>
    </div>
  );
};
