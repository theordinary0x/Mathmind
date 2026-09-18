import React from 'react';
import { BoxSelect, Lasso, MousePointer } from 'lucide-react';
import { SelectionToolMode } from './SelectionOverlay';
import { useTranslation } from '../../i18n/LanguageContext';

interface CanvasControlsIslandProps {
  currentZoomPercent: number;
  onResetZoom: () => void;
  onRelayout: () => void;
  onSetZoomLevel: (level: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  toolMode: SelectionToolMode;
  onChangeToolMode: (mode: SelectionToolMode | ((prev: SelectionToolMode) => SelectionToolMode)) => void;
  isDark: boolean;
}

export const CanvasControlsIsland: React.FC<CanvasControlsIslandProps> = ({
  currentZoomPercent,
  onResetZoom,
  onRelayout,
  onSetZoomLevel,
  onZoomIn,
  onZoomOut,
  toolMode,
  onChangeToolMode,
  isDark
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`absolute bottom-4 sm:bottom-6 left-3 sm:left-6 flex items-center border shadow-lg text-xs z-10 p-1 backdrop-blur-md transition-all ${
        isDark
          ? 'bg-[#18181B]/90 border-white/10 text-zinc-300'
          : 'bg-white/90 border-black/10 text-stone-700'
      }`}
    >
      <button
        onClick={onResetZoom}
        className={`px-2.5 py-1 font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
          isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-stone-900'
        }`}
        title={`${t('canvas.fitView')} (0)`}
      >
        <span>{t('canvas.fitView')}</span>
        <kbd className={`px-1 py-0.5 text-[9px] font-mono ${
          isDark ? 'bg-white/10 text-zinc-400' : 'bg-black/5 text-stone-500'
        }`}>0</kbd>
      </button>

      <button
        onClick={onRelayout}
        className={`px-2 py-1 font-medium transition-colors whitespace-nowrap ${
          isDark ? 'hover:bg-white/10 text-blue-400' : 'hover:bg-black/5 text-blue-600'
        }`}
        title={t('canvas.recalculateLayout')}
      >
        {t('canvas.recalculateLayout')}
      </button>

      <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5 hidden sm:block" />

      <button
        onClick={() => onSetZoomLevel(0.5)}
        className={`px-1.5 py-1 font-mono text-[11px] transition-colors hidden sm:inline-block ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
        }`}
      >
        50%
      </button>
      <button
        onClick={() => onSetZoomLevel(1.0)}
        className={`px-1.5 py-1 font-mono text-[11px] font-bold transition-colors hidden sm:inline-block ${
          isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-stone-900'
        }`}
      >
        100%
      </button>

      <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />

      <button
        onClick={onZoomIn}
        className={`w-6 h-6 flex items-center justify-center font-bold text-sm transition-colors ${
          isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-stone-900'
        }`}
        title={`${t('canvas.zoomIn')} (+)`}
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className={`w-6 h-6 flex items-center justify-center font-bold text-sm transition-colors ${
          isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-stone-900'
        }`}
        title={`${t('canvas.zoomOut')} (-)`}
      >
        -
      </button>

      <span className="px-1.5 py-1 font-mono text-[10px] opacity-60">
        {currentZoomPercent}%
      </span>

      <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />

      {/* Selection Tool Mode Toggles */}
      <button
        onClick={() => onChangeToolMode('none')}
        className={`p-1.5 transition-colors ${
          toolMode === 'none'
            ? isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-stone-900 font-bold'
            : isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-stone-500'
        }`}
        title={t('canvas.defaultMode')}
      >
        <MousePointer className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onChangeToolMode(prev => prev === 'box' ? 'none' : 'box')}
        className={`p-1.5 transition-colors ${
          toolMode === 'box'
            ? 'bg-blue-600 text-white'
            : isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-stone-500'
        }`}
        title={t('canvas.boxMode')}
      >
        <BoxSelect className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onChangeToolMode(prev => prev === 'lasso' ? 'none' : 'lasso')}
        className={`p-1.5 transition-colors ${
          toolMode === 'lasso'
            ? 'bg-blue-600 text-white'
            : isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-stone-500'
        }`}
        title={t('canvas.lassoMode')}
      >
        <Lasso className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
