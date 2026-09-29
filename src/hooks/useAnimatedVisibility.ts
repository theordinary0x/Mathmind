import { useState, useEffect } from 'react';

/**
 * 管理模态框与抽屉的平滑入场/退场过渡生命周期
 * 解决原本 `if (!isOpen) return null` 导致无过渡动画瞬间挂载/卸载的问题
 */
export function useAnimatedVisibility(isOpen: boolean, durationMs = 240) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let timer: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setShouldRender(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setShouldRender(false);
      }, durationMs);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [isOpen, durationMs]);

  return { shouldRender, isVisible };
}
