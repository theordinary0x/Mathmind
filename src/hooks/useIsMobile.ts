import { useState, useEffect } from 'react';

/**
 * 响应式移动端视口检测 Hook
 * 
 * 监听窗口尺寸变化，以 768px（标准平板/大屏手机断点）作为分界线，
 * 兼顾横竖屏旋转与桌面端 F12 手机模拟器实时响应。
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
