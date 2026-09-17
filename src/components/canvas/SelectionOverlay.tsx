import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Point, BoundingBox } from '../../utils/selectionHelper';

export type SelectionToolMode = 'none' | 'box' | 'lasso';

interface SelectionOverlayProps {
  toolMode: SelectionToolMode;
  onSelectBox: (box: BoundingBox, isAppend: boolean) => void;
  onSelectLasso: (polygon: Point[], isAppend: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  toolMode,
  onSelectBox,
  onSelectLasso,
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

  // Listen to keyboard modifiers (Shift and Alt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Shift') setIsModifierShift(true);
      if (e.key === 'Alt') setIsModifierAlt(true);
      if (e.key === 'Escape') {
        setIsDragging(false);
        setActiveType(null);
        setBoxStart(null);
        setBoxCurrent(null);
        setLassoPoints([]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsModifierShift(false);
      if (e.key === 'Alt') setIsModifierAlt(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const shouldCapture = toolMode === 'box' || toolMode === 'lasso' || isModifierShift || isModifierAlt;
  const currentActionType = toolMode === 'lasso' || isModifierAlt ? 'lasso' : (toolMode === 'box' || isModifierShift ? 'box' : null);

  const getContainerRelativePos = useCallback((e: React.PointerEvent): Point => {
    const container = containerRef.current;
    if (!container) return { x: e.clientX, y: e.clientY };
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [containerRef]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary left click
    if (!shouldCapture || !currentActionType) return;

    e.preventDefault();
    e.stopPropagation();

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
        // Prevent recording redundant tightly packed points (< 4px apart)
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

    const isAppend = e.ctrlKey || e.metaKey;

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

    setIsDragging(false);
    setActiveType(null);
    setBoxStart(null);
    setBoxCurrent(null);
    setLassoPoints([]);
  };

  // Render Box Dimensions
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
      {/* Box Selection Visualizer */}
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

      {/* Lasso Selection SVG Visualizer */}
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
