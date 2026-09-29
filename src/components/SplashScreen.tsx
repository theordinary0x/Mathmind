import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { SparkleAiVectorIcon } from './icons/CustomIcons';

interface SplashScreenProps {
  isDark: boolean;
  isReady?: boolean;
  onStartDismiss?: () => void;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isDark,
  isReady = true,
  onStartDismiss,
  onFinished,
}) => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // 保证最短品牌展示帧（360ms），同时设置 1500ms 兜底防卡死
    const minTimer = setTimeout(() => {
      setMinDelayPassed(true);
    }, 360);

    const safetyTimer = setTimeout(() => {
      setForceReady(true);
    }, 1500);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'visible') return;
    if (minDelayPassed && (isReady || forceReady)) {
      setPhase('fading');
      onStartDismiss?.();
    }
  }, [phase, minDelayPassed, isReady, forceReady, onStartDismiss]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const hideTimer = setTimeout(() => {
      setPhase('hidden');
      onFinished?.();
    }, 420);
    return () => clearTimeout(hideTimer);
  }, [phase, onFinished]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none transition-opacity duration-400 ease-out ${
        phase === 'fading'
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100 pointer-events-auto'
      } ${
        isDark
          ? 'bg-[#121214] text-[#EDECE8]'
          : 'bg-[#FAF8F5] text-[#2C2B29]'
      }`}
    >
      {/* 居中动态徽标与拓扑波纹 (纯透明度平滑揭幕，杜绝缩放跳变) */}
      <div
        className={`relative flex items-center justify-center mb-6 transition-opacity duration-300 ease-out ${
          phase === 'fading' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* 背景同心脉冲光环 - 独立 GPU 合成层 */}
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
          className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border transform-gpu transition-colors ${
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
        className={`flex flex-col items-center transition-opacity duration-300 ease-out ${
          phase === 'fading' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-2">
          <span>MathMind</span>
          <SparkleAiVectorIcon
            size={16}
            className="text-blue-400 will-change-transform transform-gpu"
          />
        </h1>

        {/* 标语 */}
        <p className="text-xs sm:text-sm font-serif opacity-60 mb-8 tracking-wide">
          让数理逻辑如星系般清晰可见
        </p>

        {/* 硬件加速极速流光条 */}
        <div className="w-52 sm:w-60 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
          <div
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full will-change-transform transform-gpu"
            style={{
              animation: 'mm-shimmer 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        </div>

        <div className="text-[11px] font-mono opacity-40 mt-3">
          正在渲染数理拓扑网络...
        </div>
      </div>
    </div>
  );
};
