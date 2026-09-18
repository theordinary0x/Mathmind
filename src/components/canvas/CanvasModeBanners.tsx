import React from 'react';
import { SelectionToolMode } from './SelectionOverlay';
import { useTranslation } from '../../i18n/LanguageContext';

interface CanvasModeBannersProps {
  toolMode: SelectionToolMode;
  onExitToolMode: () => void;
  isConnectingMode: boolean;
  connectSourceTitle: string | null;
  onExitConnectMode: () => void;
}

export const CanvasModeBanners: React.FC<CanvasModeBannersProps> = ({
  toolMode,
  onExitToolMode,
  isConnectingMode,
  connectSourceTitle,
  onExitConnectMode
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Box / Lasso Mode Active Banner */}
      {toolMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 shadow-2xl flex items-center space-x-3 text-xs z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="font-medium">
            {toolMode === 'box' ? t('canvas.boxModeActive') : t('canvas.lassoModeActive')}
          </span>
          <button
            onClick={onExitToolMode}
            className="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 transition-colors font-medium flex items-center space-x-1"
          >
            <span>{t('canvas.exit')}</span>
            <kbd className="px-1 text-[9px] font-mono bg-white/25">Esc</kbd>
          </button>
        </div>
      )}

      {/* Connect Mode Banner */}
      {isConnectingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white px-5 py-2.5 shadow-2xl flex items-center space-x-4 text-xs z-50 border border-white/30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 bg-blue-300 animate-ping" />
            <span className="font-medium">
              {connectSourceTitle
                ? t('canvas.connectPromptTarget', { title: connectSourceTitle })
                : t('canvas.connectPromptStart')}
            </span>
          </div>
          <button
            onClick={onExitConnectMode}
            className="text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-0.5 border border-white/40 transition-colors font-medium flex items-center space-x-1"
          >
            <span>{t('canvas.exitConnectMode')}</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white/25">Esc / L</kbd>
          </button>
        </div>
      )}
    </>
  );
};
