import { useEffect, useRef } from 'react';
import { PropositionNode } from '../types';

interface UseAppKeyboardShortcutsProps {
  isCreateModalOpen: boolean;
  isProjectManagerOpen: boolean;
  isShortcutsModalOpen: boolean;
  isSettingsOpen: boolean;
  isNodeDetailModalOpen?: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  setIsProjectManagerOpen: (open: boolean) => void;
  handleOpenCreateModal: () => void;
  handleOpenEditNode?: (nodeId: string) => void;
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
  handleToggleCopilot?: () => void;
  showToast: (msg: string) => void;
}

export function useAppKeyboardShortcuts(props: UseAppKeyboardShortcutsProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = propsRef.current;

      // 1. 中文/日文输入法合成状态（IME）挂起单键快捷键，防止打字冲突
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      // 2. 如果主弹窗处于打开状态，挂起全局快捷键
      if (
        p.isCreateModalOpen ||
        p.isProjectManagerOpen ||
        p.isShortcutsModalOpen ||
        p.isSettingsOpen ||
        p.isNodeDetailModalOpen
      ) {
        return;
      }

      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 输入框聚焦状态下，仅放行保存 (Ctrl+S)、设置 (Ctrl+,) 和失焦 (Esc)
      if (isInput) {
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
          e.preventDefault();
          p.setIsSettingsOpen(true);
          return;
        }
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

      // --- 全系统单一快捷键标准 (1-to-1 映射，无别名) ---

      // 1. 编辑当前选中命题 (Enter)
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (p.selectedNodeId && p.handleOpenEditNode) {
          e.preventDefault();
          p.handleOpenEditNode(p.selectedNodeId);
          return;
        }
      }

      // 2. 新建命题 (N)
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.handleOpenCreateModal();
        return;
      }

      // 3. 删除命题 (Delete)
      if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (p.selectedNodeIds && p.selectedNodeIds.size > 1) {
          e.preventDefault();
          p.handleBatchDeleteNodes?.(Array.from(p.selectedNodeIds));
        } else if (p.selectedNodeId) {
          e.preventDefault();
          p.handleDeleteNode(p.selectedNodeId);
        }
        return;
      }

      // 4. 复制 (Ctrl+C)
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

      // 5. 粘贴 (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        p.handlePasteNode();
        return;
      }

      // 6. 连线模式开关 (L)
      if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.setIsConnectingMode(prev => {
          const next = !prev;
          p.showToast(next ? '连线模式：请点击起点命题，再点击终点命题' : '已退出连线模式');
          return next;
        });
        return;
      }

      // 7. 分层拓扑布局 (1)
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.setLayoutType('dagre');
        p.showToast('已切换至：分层拓扑布局 (Dagre)');
        return;
      }

      // 8. 力导向物理布局 (2)
      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.setLayoutType('cose');
        p.showToast('已切换至：力导向物理布局 (CoSE)');
        return;
      }

      // 9. 单链溯源聚焦模式 (F)
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.setIsFocusMode(prev => {
          const next = !prev;
          p.showToast(next ? '聚焦模式：已高亮选中节点的祖先链条' : '已退出聚焦模式');
          return next;
        });
        return;
      }

      // 10. 视口全览居中 (0)
      if (e.key === '0' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
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

      // 11. 放大画布 (=)
      if (e.key === '=' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
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

      // 12. 缩小画布 (-)
      if (e.key === '-' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
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

      // 13. 外观主题切换 (T)
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.cycleTheme();
        return;
      }

      // 14. 画板框选模式 (B)
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.handleToggleBoxSelection?.();
        return;
      }

      // 15. 全局搜索聚焦 (/)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 16. Copilot 侧边栏开关 (I)
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (p.handleToggleCopilot) {
          p.handleToggleCopilot();
        } else if (p.setIsCopilotOpen) {
          p.setIsCopilotOpen(!p.isCopilotOpen);
        }
        return;
      }

      // 17. 项目管理面板 (P)
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        p.setIsProjectManagerOpen(true);
        return;
      }

      // 18. 快捷键指南帮助 (?)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        p.setIsShortcutsModalOpen(true);
        return;
      }

      // 19. 全局系统设置 (Ctrl+,)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        p.setIsSettingsOpen(true);
        return;
      }

      // 20. 撤销 (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        p.handleUndo();
        return;
      }

      // 21. 重做 (Ctrl+Y)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        p.handleRedo();
        return;
      }

      // 22. 立即保存 (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        p.doSaveNow(true);
        return;
      }

      // 23. 另存为 JSON (Ctrl+Shift+S)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's' && !e.altKey) {
        e.preventDefault();
        p.handleSaveAs();
        return;
      }

      // 24. 退出/取消 (Esc)
      if (e.key === 'Escape') {
        if (p.isConnectingMode) {
          p.setIsConnectingMode(false);
          p.showToast('已退出连线模式');
        } else if (p.toolMode && p.toolMode !== 'none') {
          p.setToolMode?.('none');
          if (p.selectedNodeIds && p.selectedNodeIds.size > 0) {
            p.handleClearSelection?.();
          }
          p.showToast('已退出圈选模式');
        } else if (p.isCopilotOpen) {
          p.setIsCopilotOpen?.(false);
        } else if (p.selectedNodeIds && p.selectedNodeIds.size > 0) {
          p.handleClearSelection?.();
        } else if (p.selectedNodeId) {
          p.setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
