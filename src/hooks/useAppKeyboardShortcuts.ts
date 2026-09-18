import { useEffect, useRef } from 'react';
import { PropositionNode } from '../types';

interface UseAppKeyboardShortcutsProps {
  isCreateModalOpen: boolean;
  isProjectManagerOpen: boolean;
  isShortcutsModalOpen: boolean;
  isSettingsOpen: boolean;
  isAiModalOpen?: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  setIsProjectManagerOpen: (open: boolean) => void;
  handleOpenCreateModal: () => void;
  handleOpenAiModal?: () => void;
  isConnectingMode: boolean;
  setIsConnectingMode: React.Dispatch<React.SetStateAction<boolean>>;
  setLayoutType: (type: 'dagre' | 'cose') => void;
  cycleTheme: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  doSaveNow: (showFeedback?: boolean) => void;
  handleSaveAs: () => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNodeIds?: Set<string>;
  handleBatchDeleteNodes?: (ids: string[]) => void;
  handleClearSelection?: () => void;
  handleToggleBoxSelection?: () => void;
  toolMode?: 'none' | 'box' | 'lasso';
  setToolMode?: (mode: 'none' | 'box' | 'lasso') => void;
  nodes: PropositionNode[];
  handleCopyNode: (node: PropositionNode) => void;
  handlePasteNode: () => void;
  handleDeleteNode: (nodeId: string) => void;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  isCopilotOpen?: boolean;
  setIsCopilotOpen?: (open: boolean) => void;
  showToast: (msg: string) => void;
}

export function useAppKeyboardShortcuts(props: UseAppKeyboardShortcutsProps) {
  // Use a ref to hold latest props to avoid constantly rebinding the global listener
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = propsRef.current;

      // Ignore during IME composition (Chinese / Japanese input)
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      // If any major dialog is open, do not trigger global single-key shortcuts
      if (p.isCreateModalOpen || p.isProjectManagerOpen || p.isShortcutsModalOpen || p.isSettingsOpen || p.isAiModalOpen) {
        return;
      }

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
          e.preventDefault();
          p.setIsSettingsOpen(true);
          return;
        }
        // Save project/file (Ctrl+S) even while typing in an input/textarea
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          p.doSaveNow(true);
          return;
        }
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Open AI Ingestion (I, Shift+I or Ctrl+I)
      if (
        (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ||
        (e.shiftKey && e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey && !e.metaKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i' && !e.altKey)
      ) {
        e.preventDefault();
        p.handleOpenAiModal?.();
        return;
      }

      // Open Settings (Ctrl+, / Cmd+,)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        p.setIsSettingsOpen(true);
        return;
      }

      // Help shortcuts modal (?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        p.setIsShortcutsModalOpen(true);
        return;
      }

      // Create proposition (N or Ctrl+N, avoiding browser Ctrl+N conflict with preventDefault)
      if (
        (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey && !e.altKey)
      ) {
        e.preventDefault();
        p.handleOpenCreateModal();
        return;
      }

      // Toggle connect mode (L)
      if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.setIsConnectingMode(prev => {
          const next = !prev;
          p.showToast(next ? '连线模式：请先点击起点，再点击终点' : '已退出连线模式');
          return next;
        });
        return;
      }

      // Open project manager (P, M, or Ctrl+P, avoiding browser print dialog with preventDefault)
      if (
        ((e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'm') && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey && !e.altKey)
      ) {
        e.preventDefault();
        p.setIsProjectManagerOpen(true);
        return;
      }

      // Layout toggle (1: Dagre, 2: CoSE)
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.setLayoutType('dagre');
        p.showToast('已切换至：分层拓扑布局 (Dagre)');
        return;
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.setLayoutType('cose');
        p.showToast('已切换至：力导向布局 (CoSE)');
        return;
      }

      // Toggle theme (T)
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.cycleTheme();
        return;
      }

      // Search focus (/ or Alt+F, avoiding browser Ctrl+F conflict)
      if ((e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) || (e.altKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Canvas Zoom & Fit (0, +, -)
      if (e.key === '0' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const cy = (window as any).cy;
        if (cy) {
          cy.animate({
            fit: { eles: cy.elements(), padding: 60 },
            duration: 250
          });
        }
        return;
      }
      if ((e.key === '=' || e.key === '+') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const cy = (window as any).cy;
        if (cy) {
          const current = cy.zoom();
          cy.animate({
            zoom: Math.min(current * 1.5, 8.0),
            duration: 180
          });
        }
        return;
      }
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const cy = (window as any).cy;
        if (cy) {
          const current = cy.zoom();
          cy.animate({
            zoom: Math.max(current / 1.5, 0.05),
            duration: 180
          });
        }
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) p.handleRedo();
        else p.handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        p.handleRedo();
        return;
      }

      // Manual Save (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        p.doSaveNow(true);
        return;
      }

      // Save as (Alt+S, Ctrl+Shift+S / Cmd+Shift+S, avoiding browser Ctrl+S conflict)
      if (
        (e.altKey && e.key.toLowerCase() === 's') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's')
      ) {
        e.preventDefault();
        p.handleSaveAs();
        return;
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (p.selectedNodeId) {
          const node = p.nodes.find(n => n.id === p.selectedNodeId);
          if (node) {
            e.preventDefault();
            p.handleCopyNode(node);
          }
        }
        return;
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        p.handlePasteNode();
        return;
      }

      // Box selection mode (B)
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.handleToggleBoxSelection?.();
        return;
      }

      // Delete (Single or Batch)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (p.selectedNodeIds && p.selectedNodeIds.size > 1) {
          e.preventDefault();
          p.handleBatchDeleteNodes?.(Array.from(p.selectedNodeIds));
        } else if (p.selectedNodeId) {
          e.preventDefault();
          p.handleDeleteNode(p.selectedNodeId);
        }
        return;
      }

      // Focus mode (F)
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.setIsFocusMode(prev => !prev);
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (p.isConnectingMode) {
          p.setIsConnectingMode(false);
          p.showToast('已退出连线模式');
        } else if (p.toolMode && p.toolMode !== 'none') {
          p.setToolMode?.('none');
          p.showToast('已退出圈选模式');
        } else if (p.selectedNodeIds && p.selectedNodeIds.size > 0) {
          p.handleClearSelection?.();
        } else if (p.selectedNodeId) {
          p.setSelectedNodeId(null);
        } else if (p.isCopilotOpen) {
          p.setIsCopilotOpen?.(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
