import { useRef, useCallback, MouseEvent } from 'react';

/**
 * 防误触的遮罩层点击关闭 Hook
 * 
 * 避免用户在弹窗内选中文字或拖拽滑块时，光标滑出弹窗在遮罩层松开导致的意外关闭。
 * 只有当 mousedown 和 mouseup 均发生在遮罩层自身（e.target === e.currentTarget）时，
 * 才判定为用户有意识的“点击外部背景关闭”操作。
 */
export function useBackdropClose(onClose?: () => void) {
  const isBackdropMouseDownRef = useRef(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isBackdropMouseDownRef.current = e.target === e.currentTarget;
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isBackdropMouseDownRef.current && e.target === e.currentTarget) {
      onClose?.();
    }
    isBackdropMouseDownRef.current = false;
  }, [onClose]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp
  };
}
