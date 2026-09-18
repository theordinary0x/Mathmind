import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Point, BoundingBox } from '../../utils/selectionHelper';

export type SelectionToolMode = 'none' | 'box' | 'lasso';

interface SelectionOverlayProps {
  toolMode: SelectionToolMode;
  onSelectBox: (box: BoundingBox, isAppend: boolean) => void;
  onSelectLasso: (polygon: Point[], isAppend: boolean) => void;
  onExitMode?: () => void;
  clearTrigger?: any;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  toolMode,
  onSelectBox,
  onSelectLasso,
  onExitMode,
  clearTrigger,
  containerRef
}) => {
  const [isModifierShift, setIsModifierShift] = useState(false);
  const [isModifierAlt, setIsModifierAlt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeType, setActiveType] = useState<'box' | 'lasso' | null>(null);

  // Box state
  const [boxStart, setBoxStart] = useState<Point | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<Point | null>(null);

  // Lasso state
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);

  const onExitModeRef = useRef(onExitMode);
  onExitModeRef.current = onExitMode;

  // 彻底清理拖拽与轨迹状态
  const resetSelectionState = useCallback(() => {
    setIsDragging(false);
    setActiveType(null);
    setBoxStart(null);
    setBoxCurrent(null);
    setLassoPoints([]);
    setIsModifierAlt(false);
    setIsModifierShift(false);
  }, []);

  // 响应外部清除选区信号 (例如点击取消按钮或 Esc)
  useEffect(() => {
    resetSelectionState();
  }, [clearTrigger, resetSelectionState]);

  // 当外部 toolMode 主动切换为 none 时，也立即清理任何残留轨迹
  useEffect(() => {
    if (toolMode === 'none' && !isDragging) {
      setBoxStart(null);
      setBoxCurrent(null);
      setLassoPoints([]);
    }
  }, [toolMode, isDragging]);

  // 监听全局按键修饰符及 Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Shift') setIsModifierShift(true);
      if (e.key === 'Alt') setIsModifierAlt(true);
      if (e.key === 'Escape') {
        resetSelectionState();
        onExitModeRef.current?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsModifierShift(false);
      if (e.key === 'Alt') setIsModifierAlt(false);
    };

    // 窗口失焦时（如 Alt+Tab、Win 键）立即重置修饰符和残留拖拽
    const handleWindowBlur = () => {
      resetSelectionState();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [resetSelectionState]);

  // 拖拽全周期锁定：只要正在拖拽 (isDragging)，绝不能丢失捕获 (pointer-events-none)
  const shouldCapture = isDragging || toolMode === 'box' || toolMode === 'lasso' || isModifierShift || isModifierAlt;
  const currentActionType = toolMode === 'lasso' || isModifierAlt ? 'lasso' : (toolMode === 'box' || isModifierShift ? 'box' : null);

  const getContainerRelativePos = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const container = containerRef.current;
    if (!container) return { x: e.clientX, y: e.clientY };
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [containerRef]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // 仅限左键
    if (!shouldCapture || !currentActionType) return;

    e.preventDefault();
    e.stopPropagation();

    // 硬件级锁定指针捕获，确保 mouseup/pointerup 绝不丢失
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    const startPos = getContainerRelativePos(e);
    setIsDragging(true);
    setActiveType(currentActionType);

    if (currentActionType === 'box') {
      setBoxStart(startPos);
      setBoxCurrent(startPos);
      setLassoPoints([]);
    } else {
      setLassoPoints([startPos]);
      setBoxStart(null);
      setBoxCurrent(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const pos = getContainerRelativePos(e);

    if (activeType === 'box') {
      setBoxCurrent(pos);
    } else if (activeType === 'lasso') {
      setLassoPoints(prev => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(pos.x - last.x, pos.y - last.y) < 4) {
          return prev;
        }
        return [...prev, pos];
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    const isAppend = e.ctrlKey || e.metaKey;

    try {
      if (activeType === 'box' && boxStart && boxCurrent) {
        const w = Math.abs(boxCurrent.x - boxStart.x);
        const h = Math.abs(boxCurrent.y - boxStart.y);
        if (w > 5 || h > 5) {
          onSelectBox({
            x1: boxStart.x,
            y1: boxStart.y,
            x2: boxCurrent.x,
            y2: boxCurrent.y
          }, isAppend);
        }
      } else if (activeType === 'lasso' && lassoPoints.length >= 3) {
        onSelectLasso(lassoPoints, isAppend);
      }
    } catch (err) {
      console.error('Error during selection handling:', err);
    } finally {
      // 100% 强制清除状态与轨迹，杜绝任何残留在屏幕上
      resetSelectionState();
    }
  };

  // 全局兜底：防止任何极端情况（如在浏览器外松开按键）导致拖拽未终结
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerUp = () => {
      resetSelectionState();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, resetSelectionState]);

  // 渲染框选几何尺寸
  const boxStyle = boxStart && boxCurrent ? {
    left: Math.min(boxStart.x, boxCurrent.x),
    top: Math.min(boxStart.y, boxCurrent.y),
    width: Math.abs(boxCurrent.x - boxStart.x),
    height: Math.abs(boxCurrent.y - boxStart.y)
  } : null;

  const lassoSvgPath = lassoPoints.length > 1
    ? `M ${lassoPoints.map(p => `${p.x} ${p.y}`).join(' L ')} Z`
    : '';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 z-20 select-none ${
        shouldCapture ? 'cursor-crosshair' : 'pointer-events-none'
      }`}
    >
      {/* 矩形框选视效 */}
      {isDragging && activeType === 'box' && boxStyle && (
        <div
          style={{
            position: 'absolute',
            left: `${boxStyle.left}px`,
            top: `${boxStyle.top}px`,
            width: `${boxStyle.width}px`,
            height: `${boxStyle.height}px`
          }}
          className="border-2 border-dashed border-blue-500 bg-blue-500/15 rounded-sm pointer-events-none backdrop-blur-[0.5px]"
        />
      )}

      {/* 自由套索圈选视效 */}
      {isDragging && activeType === 'lasso' && lassoPoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={lassoSvgPath}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      )}
    </div>
  );
};
