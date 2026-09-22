import React from 'react';
import { CanvasSettings } from '../types';
import { getHybridPaperTexture, getChalkboardTexture } from './paperTexture';

/**
 * Computes the dynamic layered background CSS style based on user canvas settings and theme
 */
export function getCanvasBackgroundStyle(
  canvasSettings: CanvasSettings,
  isDark: boolean,
  isCanvasDark: boolean
): React.CSSProperties {
  const preset = canvasSettings.backgroundPreset;

  if (preset === 'custom' && canvasSettings.customBgImage) {
    return {
      backgroundImage: `url(${canvasSettings.customBgImage})`,
      backgroundSize: canvasSettings.bgRepeat ? 'auto' : 'cover',
      backgroundRepeat: canvasSettings.bgRepeat ? 'repeat' : 'no-repeat',
      backgroundPosition: 'center',
      backgroundColor: isCanvasDark ? '#121214' : '#FFFFFF'
    };
  }

  if (preset === 'grid') {
    return {
      backgroundColor: isDark ? '#121417' : '#FFFFFF',
      backgroundImage: isDark
        ? 'linear-gradient(#22272E 1px, transparent 1px), linear-gradient(90deg, #22272E 1px, transparent 1px), linear-gradient(#2D333B 1px, transparent 1px), linear-gradient(90deg, #2D333B 1px, transparent 1px)'
        : 'linear-gradient(#EDF2F7 1px, transparent 1px), linear-gradient(90deg, #EDF2F7 1px, transparent 1px), linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)',
      backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px'
    };
  }

  if (preset === 'paper' || preset === 'parchment') {
    const paperTexture = getHybridPaperTexture(isDark);
    return {
      backgroundColor: isDark ? '#1A1612' : '#FAF8F4',
      backgroundImage: isDark
        ? `radial-gradient(circle at 50% 50%, rgba(34, 28, 22, 0.4) 0%, rgba(20, 16, 13, 0.8) 100%), url("${paperTexture}")`
        : `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5) 0%, rgba(244, 239, 230, 0.5) 100%), url("${paperTexture}")`,
      backgroundRepeat: 'repeat'
    };
  }

  // 黑板预设：无论在浅色或深色模式下，均呈现真正深邃的黑板绿石板色，并带有细腻石板微晶齿度、粉笔轻擦痕与微粒
  if (preset === 'chalkboard') {
    const chalkboardTexture = getChalkboardTexture();
    return {
      backgroundColor: '#141D18',
      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(28, 42, 34, 0.45) 0%, rgba(16, 24, 19, 0.85) 100%), url("${chalkboardTexture}")`,
      backgroundRepeat: 'repeat'
    };
  }

  // 黑色/深色预设：无论在浅色或深色模式下，均呈现真正的黑曜石深色质感
  if (preset === 'dark') {
    const obsidianNoise = `data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='oN'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23oN)' opacity='0.035'/%3E%3C/svg%3E`;
    return {
      backgroundColor: '#0A0D12',
      backgroundImage: `radial-gradient(circle at 50% 0%, #171E28 0%, #0A0D12 100%), url("${obsidianNoise}")`,
      backgroundRepeat: 'repeat'
    };
  }

  // Default: dots
  return {
    backgroundColor: isDark ? '#121214' : '#FAFAFA',
    backgroundImage: isDark
      ? 'radial-gradient(#27272A 1.5px, transparent 1.5px)'
      : 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
    backgroundSize: '24px 24px'
  };
}
