import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, AutoSaveMode, AUTO_SAVE_OPTIONS } from '../types';
import { saveProjects, getSavedAutoSaveMode, saveAutoSaveMode } from '../utils/storage';

interface UseAutoSaveProps {
  projects: Project[];
  showToast: (msg: string) => void;
}

export function useAutoSave({ projects, showToast }: UseAutoSaveProps) {
  const [autoSaveMode, setAutoSaveMode] = useState<AutoSaveMode>(() => getSavedAutoSaveMode());
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Keep references to avoid stale closures in timers
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const doSaveNow = useCallback((showFeedback = false) => {
    try {
      setIsSaving(true);
      saveProjects(projectsRef.current);
      setIsDirty(false);
      const timeStr = new Date().toLocaleTimeString();
      setLastSavedTime(timeStr);
      if (showFeedback) {
        showToast(`已保存至本地存储 (${timeStr})`);
      }
      setTimeout(() => {
        setIsSaving(false);
      }, 250);
    } catch (err: any) {
      console.error('Save failed:', err);
      setIsSaving(false);
      showToast('保存失败，请检查本地存储空间');
    }
  }, [showToast]);

  const handleChangeAutoSaveMode = useCallback((mode: AutoSaveMode) => {
    setAutoSaveMode(mode);
    saveAutoSaveMode(mode);
    const opt = AUTO_SAVE_OPTIONS.find(o => o.mode === mode);
    showToast(`保存方式已设为：${opt?.label || mode}`);
    if (isDirtyRef.current) {
      doSaveNow();
    }
  }, [doSaveNow, showToast]);

  // Real-time auto-save: debounced save whenever dirty
  useEffect(() => {
    if (autoSaveMode === 'realtime' && isDirty) {
      const timer = setTimeout(() => {
        doSaveNow();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [projects, autoSaveMode, isDirty, doSaveNow]);

  // Interval auto-save (5s, 15s, 30s, 1m, 5m)
  useEffect(() => {
    if (autoSaveMode === 'realtime' || autoSaveMode === 'manual') {
      return;
    }
    const opt = AUTO_SAVE_OPTIONS.find(o => o.mode === autoSaveMode);
    if (!opt || opt.intervalMs <= 0) return;

    const intervalId = setInterval(() => {
      if (isDirtyRef.current) {
        doSaveNow();
      }
    }, opt.intervalMs);

    return () => clearInterval(intervalId);
  }, [autoSaveMode, doSaveNow]);

  return {
    autoSaveMode,
    isDirty,
    setIsDirty,
    isSaving,
    lastSavedTime,
    doSaveNow,
    handleChangeAutoSaveMode
  };
}
