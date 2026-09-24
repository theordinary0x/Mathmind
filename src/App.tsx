import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PropositionNode, Project, AppTheme, ThemeMode, PropositionType, AutoSaveMode, CanvasSettings, PropositionStatus, PROPOSITION_STATUSES, CornerStyle, SurfaceMaterial } from './types';
import { useAutoSave } from './hooks/useAutoSave';
import { useAppKeyboardShortcuts } from './hooks/useAppKeyboardShortcuts';
import { 
  loadProjects, 
  saveProjects, 
  getActiveProjectId, 
  setActiveProjectId, 
  createNewProject, 
  getDefaultProjects, 
  saveProjectAsJsonFile, 
  parseImportedJson, 
  computeDownstreamMap,
  wouldCreateCycle,
  getSavedAutoSaveMode,
  saveAutoSaveMode,
  getSavedCanvasSettings,
  saveCanvasSettings,
  exportAllProjectsBackup,
  getSavedCornerStyle,
  saveCornerStyle,
  getSavedSurfaceMaterial,
  saveSurfaceMaterial
} from './utils/storage';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { useTranslation } from './i18n/LanguageContext';
import { GraphCanvas } from './components/GraphCanvas';
import { SelectionToolMode } from './components/canvas/SelectionOverlay';
import { NodeDetailModal } from './components/NodeDetailModal';
import { CreateNodeModal } from './components/CreateNodeModal';
import { CopilotSidebar, CopilotExternalTrigger } from './components/copilot/CopilotSidebar';
import { applyGraphMutation } from './utils/graphMutationEngine';
import { GraphMutationDiff } from './types/copilot';
import { StatusBar } from './components/StatusBar';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { SettingsModal } from './components/SettingsModal';
import { SponsorModal } from './components/SponsorModal';
import { useIsMobile } from './hooks/useIsMobile';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileBottomBar } from './components/mobile/MobileBottomBar';
import { MobileMenuDrawer } from './components/mobile/MobileMenuDrawer';

export const App: React.FC = () => {
  const { t, language } = useTranslation();
  // Theme state: dark | paper | system
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('mathmind_theme_mode_v2');
    return (saved as ThemeMode) || 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to OS system theme changes
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: AppTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemPrefersDark ? 'dark' : 'paper';
    }
    return themeMode;
  }, [themeMode, systemPrefersDark]);

  // Visual Layers State: Corner Geometry & Surface Material
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(() => getSavedCornerStyle());
  const [surfaceMaterial, setSurfaceMaterial] = useState<SurfaceMaterial>(() => getSavedSurfaceMaterial());

  // Synchronize documentElement class for Tailwind dark: variants and visual layers
  useEffect(() => {
    const root = document.documentElement;
    // 1. Theme
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // 2. Corner Geometry
    if (cornerStyle === 'rounded') {
      root.classList.add('corner-rounded');
      root.classList.remove('corner-sharp');
    } else {
      root.classList.add('corner-sharp');
      root.classList.remove('corner-rounded');
    }

    // 3. Surface Material
    if (surfaceMaterial === 'glass') {
      root.classList.add('material-glass');
      root.classList.remove('material-solid');
    } else {
      root.classList.add('material-solid');
      root.classList.remove('material-glass');
    }
  }, [effectiveTheme, cornerStyle, surfaceMaterial]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const handleCornerStyleChange = useCallback((style: CornerStyle) => {
    setCornerStyle(style);
    saveCornerStyle(style);
    showToast(style === 'rounded' ? '已切换为优雅圆角风格' : '已切换为严谨直角风格');
  }, [showToast]);

  const handleSurfaceMaterialChange = useCallback((mat: SurfaceMaterial) => {
    setSurfaceMaterial(mat);
    saveSurfaceMaterial(mat);
    showToast(mat === 'glass' ? '已开启磨砂毛玻璃材质' : '已切换为纯平不透明材质');
  }, [showToast]);

  const cycleTheme = () => {
    const next: ThemeMode = effectiveTheme === 'dark' ? 'paper' : 'dark';
    setThemeMode(next);
    localStorage.setItem('mathmind_theme_mode_v2', next);
    showToast(next === 'dark' ? '深色模式' : '浅色模式');
  };

  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => getActiveProjectId(projects));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [toolMode, setToolMode] = useState<SelectionToolMode>('none');
  const [layoutType, setLayoutType] = useState<'dagre' | 'cose'>('dagre');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false); // 默认关闭聚焦模式，展示全局清晰网络
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createNodeTargetPos, setCreateNodeTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotExternalTrigger, setCopilotExternalTrigger] = useState<CopilotExternalTrigger | null>(null);

  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleCapturePhoto = useCallback((file: File) => {
    setIsCopilotOpen(true);
    setCopilotExternalTrigger({
      text: '请识别并提取这张笔记/教材截图中的所有数学定义、公理、定理与推论，并理清它们之间的前置推导依赖关系，生成可合入当前知识体系的命题图谱变更集。',
      autoSend: true,
      timestamp: Date.now(),
      file
    });
  }, []);

  const handleTriggerCopilot = useCallback((message: string, autoSend: boolean = true) => {
    setIsCopilotOpen(true);
    setCopilotExternalTrigger({ text: message, autoSend, timestamp: Date.now() });
  }, []);

  const [initialCreateNodeData, setInitialCreateNodeData] = useState<Partial<PropositionNode> | null>(null);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(() => getSavedCanvasSettings());

  const handleUpdateCanvasSettings = useCallback((newSettings: CanvasSettings) => {
    setCanvasSettings(newSettings);
    saveCanvasSettings(newSettings);
  }, []);


  const {
    autoSaveMode,
    isDirty,
    setIsDirty,
    isSaving,
    lastSavedTime,
    doSaveNow,
    handleChangeAutoSaveMode
  } = useAutoSave({ projects, showToast });

  // Clipboard State (Ctrl+C / Ctrl+V / Ctrl+X)
  const [clipboardNode, setClipboardNode] = useState<PropositionNode | null>(null);

  // Active project
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const dataset = currentProject.dataset;

  // History stack for Undo / Redo
  const [history, setHistory] = useState<PropositionNode[][]>([dataset.nodes]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Sync history when switching projects
  useEffect(() => {
    setHistory([dataset.nodes]);
    setHistoryIndex(0);
  }, [activeProjectId]);

  // Clean up selectedNodeId / selectedNodeIds if deleted or not in active dataset
  useEffect(() => {
    if (selectedNodeId && !dataset.nodes.some(n => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
    setSelectedNodeIds(prev => {
      const activeIds = new Set(dataset.nodes.map(n => n.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach(id => {
        if (activeIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [dataset.nodes, selectedNodeId]);

  const commitNodesUpdate = useCallback((newNodes: PropositionNode[], actionDescription?: string) => {
    const MAX_HISTORY = 30;
    let updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newNodes);
    if (updatedHistory.length > MAX_HISTORY) {
      updatedHistory = updatedHistory.slice(updatedHistory.length - MAX_HISTORY);
    }
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === currentProject.id) {
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            dataset: {
              ...p.dataset,
              updatedAt: new Date().toISOString(),
              nodes: newNodes
            }
          };
        }
        return p;
      })
    );

    setIsDirty(true);

    if (actionDescription) {
      showToast(actionDescription);
    }
  }, [history, historyIndex, currentProject.id]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevNodes = history[prevIndex];
      setHistoryIndex(prevIndex);

      setProjects(prevProjects =>
        prevProjects.map(p => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              dataset: { ...p.dataset, nodes: prevNodes }
            };
          }
          return p;
        })
      );
      setIsDirty(true);
      showToast('已撤销');
    }
  }, [history, historyIndex, currentProject.id]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextNodes = history[nextIndex];
      setHistoryIndex(nextIndex);

      setProjects(prevProjects =>
        prevProjects.map(p => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              dataset: { ...p.dataset, nodes: nextNodes }
            };
          }
          return p;
        })
      );
      setIsDirty(true);
      showToast('已重做');
    }
  }, [history, historyIndex, currentProject.id]);

  // Copy
  const handleCopyNode = useCallback((node: PropositionNode) => {
    setClipboardNode(node);
    showToast(`已复制：${node.title}`);
  }, []);

  // Cut
  const handleCutNode = useCallback((node: PropositionNode) => {
    setClipboardNode(node);
    const updated = dataset.nodes
      .filter(n => n.id !== node.id)
      .map(n => ({
        ...n,
        depends_on: (n.depends_on || []).filter(id => id !== node.id)
      }));
    commitNodesUpdate(updated, `已剪切：${node.title}`);
    if (selectedNodeId === node.id) setSelectedNodeId(null);
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      next.delete(node.id);
      return next;
    });
  }, [dataset.nodes, commitNodesUpdate, selectedNodeId]);

  // Open Create Proposition Modal
  const handleOpenCreateModal = useCallback((pos?: { x: number; y: number }) => {
    setInitialCreateNodeData(null);
    setCreateNodeTargetPos(pos || null);
    setIsCreateModalOpen(true);
  }, []);

  // Selected Nodes list for Copilot context
  const selectedNodesList = useMemo(() => {
    if (selectedNodeIds.size > 0) {
      return dataset.nodes.filter(n => selectedNodeIds.has(n.id));
    }
    if (selectedNodeId) {
      const single = dataset.nodes.find(n => n.id === selectedNodeId);
      return single ? [single] : [];
    }
    return [];
  }, [dataset.nodes, selectedNodeIds, selectedNodeId]);

  // Apply Graph Mutation proposal from Copilot
  const handleApplyCopilotMutation = useCallback((diff: GraphMutationDiff, enabledActionIds?: Set<string>) => {
    const result = applyGraphMutation(dataset.nodes, diff, { enabledActionIds });
    if (!result.success) {
      showToast(`⚠️ ${result.error}`);
      return;
    }
    commitNodesUpdate(result.newNodes, result.summary);
  }, [dataset.nodes, commitNodesUpdate, showToast]);

  // Paste
  const handlePasteNode = useCallback((position?: { x: number; y: number }) => {
    if (!clipboardNode) {
      showToast('剪贴板为空');
      return;
    }

    const newNode: PropositionNode = {
      ...clipboardNode,
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${clipboardNode.title} (副本)`,
      depends_on: [...(clipboardNode.depends_on || [])],
      position: position || undefined
    };

    const updated = [...dataset.nodes, newNode];
    commitNodesUpdate(updated, `已粘贴命题：${newNode.title}`);
    setSelectedNodeId(newNode.id);
    setSelectedNodeIds(new Set([newNode.id]));
  }, [clipboardNode, dataset.nodes, commitNodesUpdate]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    const target = dataset.nodes.find(n => n.id === nodeId);
    const updatedNodes = dataset.nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        depends_on: (n.depends_on || []).filter(depId => depId !== nodeId)
      }));
    commitNodesUpdate(updatedNodes, `已删除命题：${target?.title || nodeId}`);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    if (editingNodeId === nodeId) {
      setEditingNodeId(null);
    }
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, [dataset.nodes, commitNodesUpdate, selectedNodeId, editingNodeId]);

  // Single selection handler (Select only, no modal)
  const handleSelectSingleNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      setSelectedNodeIds(new Set([nodeId]));
    } else {
      setSelectedNodeIds(new Set());
    }
  }, []);

  // Open & Close Node Edit Modal (Decoupled from simple canvas selection)
  const handleOpenEditNode = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedNodeIds(new Set([nodeId]));
  }, []);

  const handleCloseEditNode = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  // Multi selection handler (Box / Lasso / Ctrl+Click)
  const handleSelectMultipleNodes = useCallback((nodeIds: string[], mode: 'replace' | 'toggle' | 'add') => {
    setSelectedNodeIds(prev => {
      let next: Set<string>;
      if (mode === 'replace') {
        next = new Set(nodeIds);
      } else if (mode === 'add') {
        next = new Set([...prev, ...nodeIds]);
      } else {
        // toggle
        next = new Set(prev);
        nodeIds.forEach(id => {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        });
      }

      if (next.size === 1) {
        setSelectedNodeId(Array.from(next)[0]);
      } else {
        setSelectedNodeId(null);
      }
      return next;
    });
  }, []);

  // Select all nodes
  const handleSelectAllNodes = useCallback(() => {
    const allIds = new Set(dataset.nodes.map(n => n.id));
    setSelectedNodeIds(allIds);
    setSelectedNodeId(null);
  }, [dataset.nodes]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectedNodeId(null);
  }, []);

  // Batch delete nodes
  const handleBatchDeleteNodes = useCallback((nodeIds: string[]) => {
    if (!nodeIds || nodeIds.length === 0) return;
    const deleteSet = new Set(nodeIds);
    const updatedNodes = dataset.nodes
      .filter(n => !deleteSet.has(n.id))
      .map(n => ({
        ...n,
        depends_on: (n.depends_on || []).filter(depId => !deleteSet.has(depId))
      }));
    commitNodesUpdate(updatedNodes, `已批量删除 ${nodeIds.length} 个命题`);
    setSelectedNodeIds(new Set());
    setSelectedNodeId(null);
  }, [dataset.nodes, commitNodesUpdate]);

  // Change node type directly
  const handleChangeNodeType = useCallback((nodeId: string, newType: PropositionType) => {
    const updated = dataset.nodes.map(n => (n.id === nodeId ? { ...n, type: newType } : n));
    commitNodesUpdate(updated, `已更改类型为：${newType}`);
  }, [dataset.nodes, commitNodesUpdate]);

  // Change node status directly (e.g. from context menu)
  const handleUpdateNodeStatus = useCallback((nodeId: string, status?: PropositionStatus) => {
    const target = dataset.nodes.find(n => n.id === nodeId);
    const updated = dataset.nodes.map(n => (n.id === nodeId ? { ...n, status } : n));
    const statusLabel = status ? PROPOSITION_STATUSES[status]?.label || status : '已清除标记';
    commitNodesUpdate(updated, `【${target?.title || nodeId}】${status ? `已标记为：${statusLabel}` : statusLabel}`);
  }, [dataset.nodes, commitNodesUpdate]);

  // Node position drag change handler
  const handleNodesPositionChange = useCallback((updates: { id: string; position: { x: number; y: number } }[]) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === currentProject.id) {
          const updateMap = new Map(updates.map(u => [u.id, u.position]));
          const newNodes = p.dataset.nodes.map(n => {
            const pos = updateMap.get(n.id);
            return pos ? { ...n, position: pos } : n;
          });
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            dataset: {
              ...p.dataset,
              updatedAt: new Date().toISOString(),
              nodes: newNodes
            }
          };
        }
        return p;
      })
    );
    setIsDirty(true);
  }, [currentProject.id]);

  const handleExportAllProjects = useCallback(async () => {
    try {
      const filename = await exportAllProjectsBackup(projects);
      showToast(`已成功导出备份：${filename}`);
    } catch (err: any) {
      if (err.message !== '用户取消了备份导出') {
        showToast('备份导出失败');
      }
    }
  }, [projects]);

  const handleResetToDefaults = useCallback(() => {
    const defaultProjects = getDefaultProjects(language);
    setProjects(defaultProjects);
    setActiveId(defaultProjects[0].id);
    saveProjects(defaultProjects);
    setActiveProjectId(defaultProjects[0].id);
    showToast(t('settings.resetSuccess'));
  }, [language, t]);

  const handleSaveAs = useCallback(async () => {
    try {
      const filename = await saveProjectAsJsonFile(currentProject);
      showToast(`已保存：${filename}`);
    } catch (err: any) {
      if (err.message !== '用户取消了另存为') {
        showToast(`保存失败：${err.message}`);
      }
    }
  }, [currentProject, showToast]);

  // Comprehensive Keyboard Shortcuts Hook
  useAppKeyboardShortcuts({
    isCreateModalOpen,
    isProjectManagerOpen,
    isShortcutsModalOpen,
    isSettingsOpen,
    isNodeDetailModalOpen: editingNodeId !== null,
    isCopilotOpen,
    setIsCopilotOpen,
    setIsSettingsOpen,
    setIsShortcutsModalOpen,
    setIsProjectManagerOpen,
    handleOpenCreateModal,
    handleOpenEditNode,
    handleToggleCopilot: () => setIsCopilotOpen(prev => !prev),
    isConnectingMode,
    setIsConnectingMode,
    setLayoutType,
    cycleTheme,
    handleUndo,
    handleRedo,
    doSaveNow,
    handleSaveAs,
    selectedNodeId,
    setSelectedNodeId: handleSelectSingleNode,
    selectedNodeIds,
    handleBatchDeleteNodes,
    handleClearSelection,
    handleToggleBoxSelection: () => setToolMode(prev => (prev === 'box' ? 'none' : 'box')),
    toolMode,
    setToolMode,
    nodes: dataset.nodes,
    handleCopyNode,
    handlePasteNode,
    handleDeleteNode,
    setIsFocusMode,
    showToast
  });

  const downstreamMap = useMemo(() => {
    return computeDownstreamMap(dataset.nodes);
  }, [dataset.nodes]);

  const totalEdgesCount = useMemo(() => {
    return dataset.nodes.reduce((acc, node) => acc + (node.depends_on || []).length, 0);
  }, [dataset.nodes]);

  const selectedNode = useMemo(() => {
    return dataset.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, dataset.nodes]);

  const editingNode = useMemo(() => {
    return dataset.nodes.find(n => n.id === editingNodeId) || null;
  }, [editingNodeId, dataset.nodes]);

  const handleSelectProject = (projId: string) => {
    setActiveId(projId);
    setActiveProjectId(projId);
    setSelectedNodeId(null);
    setSelectedNodeIds(new Set());
    setToolMode('none');
    showToast(`切换至项目：${projects.find(p => p.id === projId)?.name}`);
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      showToast('无法将命题连接到自身');
      return;
    }

    const targetNode = dataset.nodes.find(n => n.id === targetId);
    const sourceNode = dataset.nodes.find(n => n.id === sourceId);

    if (!targetNode || !sourceNode) return;

    if ((targetNode.depends_on || []).includes(sourceId)) {
      showToast(`「${targetNode.title}」已依赖「${sourceNode.title}」`);
      return;
    }

    if (wouldCreateCycle(dataset.nodes, sourceId, targetId)) {
      showToast(`无法连接：会导致循环论证！「${sourceNode.title}」已依赖「${targetNode.title}」`);
      return;
    }

    const updatedNodes = dataset.nodes.map(n => {
      if (n.id === targetId) {
        return {
          ...n,
          depends_on: [...(n.depends_on || []), sourceId]
        };
      }
      return n;
    });

    commitNodesUpdate(updatedNodes, `建立依赖：${targetNode.title} 依赖 ${sourceNode.title}`);
  };

  const handleUpdateNode = (updatedNode: PropositionNode) => {
    const updatedNodes = dataset.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
    commitNodesUpdate(updatedNodes, `已保存：${updatedNode.title}`);
  };

  const handleCreateNode = (newNode: PropositionNode) => {
    const updatedNodes = [...dataset.nodes, newNode];
    commitNodesUpdate(updatedNodes, `已创建命题：${newNode.title}`);
    setSelectedNodeId(null);
  };

  const handleCreateProject = (name: string, template: 'blank' | 'peano' | 'euclid') => {
    const newProj = createNewProject(name, template, language);
    const updated = [...projects, newProj];
    setProjects(updated);
    setActiveId(newProj.id);
    setActiveProjectId(newProj.id);
    setSelectedNodeId(null);
    showToast(`已创建项目：${newProj.name}`);
  };

  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) {
      showToast('至少需保留一个项目');
      return;
    }
    const updated = projects.filter(p => p.id !== projId);
    setProjects(updated);
    if (activeProjectId === projId) {
      const nextId = updated[0].id;
      setActiveId(nextId);
      setActiveProjectId(nextId);
      setSelectedNodeId(null);
      setSelectedNodeIds(new Set());
      setToolMode('none');
    }
    showToast('已删除项目');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const importedDataset = parseImportedJson(content);
        commitNodesUpdate(importedDataset.nodes, '导入成功');
        setSelectedNodeId(null);
        setSelectedNodeIds(new Set());
        setToolMode('none');
      } catch (err: any) {
        alert(`导入失败：${err.message || 'JSON 格式错误'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isDark = effectiveTheme === 'dark';

  return (
    <div
      className={`flex flex-col w-screen h-screen overflow-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#121214] text-[#EDECE8]' : 'bg-[#FAF8F5] text-[#2C2B29]'
      }`}
    >
      {/* App Opening Animation (Masks initial layout and formula calculation jumps) */}
      <SplashScreen isDark={isDark} />

      {/* Top Header */}
      {isMobile ? (
        <MobileHeader
          currentProject={currentProject}
          nodeCount={dataset.nodes.length}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          isDark={isDark}
        />
      ) : (
        <Header
          currentProject={currentProject}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          layoutType={layoutType}
          onChangeLayout={setLayoutType}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          isConnectingMode={isConnectingMode}
          onToggleConnectingMode={() => setIsConnectingMode(!isConnectingMode)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={() => handleOpenCreateModal()}
          isCopilotOpen={isCopilotOpen}
          onToggleCopilot={() => setIsCopilotOpen(prev => !prev)}
          onSaveAs={handleSaveAs}
          onManualSave={() => doSaveNow(true)}
          onImport={handleImportJson}
          nodeCount={dataset.nodes.length}
          theme={effectiveTheme}
          onToggleTheme={cycleTheme}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSponsor={() => setIsSponsorOpen(true)}
        />
      )}

      {/* Main Canvas Area */}
      <main className={`flex-1 relative overflow-hidden ${isMobile ? 'pb-13' : ''}`}>
        <GraphCanvas
          key={currentProject.id}
          nodes={dataset.nodes}
          selectedNodeId={selectedNodeId}
          selectedNodeIds={selectedNodeIds}
          onSelectNode={handleSelectSingleNode}
          onSelectMultipleNodes={handleSelectMultipleNodes}
          onBatchDeleteNodes={handleBatchDeleteNodes}
          onSelectAllNodes={handleSelectAllNodes}
          onClearSelection={handleClearSelection}
          toolMode={toolMode}
          onChangeToolMode={setToolMode}
          layoutType={layoutType}
          isFocusMode={isFocusMode}
          searchQuery={searchQuery}
          onConnectNodes={handleConnectNodes}
          isConnectingMode={isConnectingMode}
          setIsConnectingMode={setIsConnectingMode}
          theme={effectiveTheme}
          onCopyNode={handleCopyNode}
          onCutNode={handleCutNode}
          onPasteNode={handlePasteNode}
          hasClipboard={!!clipboardNode}
          onChangeNodeType={handleChangeNodeType}
          onDeleteNode={handleDeleteNode}
          onCreateNodeAtPos={handleOpenCreateModal}
          onOpenEditNode={handleOpenEditNode}
          onToggleLayout={() => setLayoutType(prev => (prev === 'dagre' ? 'cose' : 'dagre'))}
          onNodesPositionChange={handleNodesPositionChange}
          onUpdateNodeStatus={handleUpdateNodeStatus}
          projectName={currentProject.name}
          projectId={currentProject.id}
          canvasSettings={canvasSettings}
          onUpdateCanvasSettings={handleUpdateCanvasSettings}
          cornerStyle={cornerStyle}
        />

        {/* AI Copilot Sidebar */}
        <CopilotSidebar
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          allNodes={dataset.nodes}
          selectedNodes={selectedNodesList}
          onApplyMutation={handleApplyCopilotMutation}
          onNavigateToNode={handleOpenEditNode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          theme={effectiveTheme}
          externalTrigger={copilotExternalTrigger}
          onClearExternalTrigger={() => setCopilotExternalTrigger(null)}
          isMobile={isMobile}
        />
      </main>

      {/* Bottom Bar or Status Bar */}
      {isMobile ? (
        <>
          <MobileBottomBar
            isDark={isDark}
            isCopilotOpen={isCopilotOpen}
            onToggleCopilot={() => setIsCopilotOpen(prev => !prev)}
            onOpenCreateModal={() => handleOpenCreateModal()}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <MobileMenuDrawer
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            isDark={isDark}
            theme={effectiveTheme}
            onToggleTheme={cycleTheme}
            cornerStyle={cornerStyle}
            onToggleCornerStyle={() => handleCornerStyleChange(cornerStyle === 'rounded' ? 'sharp' : 'rounded')}
            surfaceMaterial={surfaceMaterial}
            onToggleSurfaceMaterial={() => handleSurfaceMaterialChange(surfaceMaterial === 'glass' ? 'solid' : 'glass')}
            layoutType={layoutType}
            onChangeLayout={setLayoutType}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSaveAs={handleSaveAs}
            onImport={handleImportJson}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSponsor={() => setIsSponsorOpen(true)}
          />
        </>
      ) : (
        <StatusBar
          theme={effectiveTheme}
          projectName={currentProject.name}
          nodeCount={dataset.nodes.length}
          edgeCount={totalEdgesCount}
          selectedTitle={selectedNode?.title || null}
          lastSavedTime={lastSavedTime}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          autoSaveMode={autoSaveMode}
          onChangeAutoSaveMode={handleChangeAutoSaveMode}
          isDirty={isDirty}
          isSaving={isSaving}
          onManualSave={() => doSaveNow(true)}
        />
      )}

      {/* Create Proposition Modal */}
      <CreateNodeModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialCreateNodeData(null);
        }}
        allNodes={dataset.nodes}
        onCreateNode={handleCreateNode}
        onTriggerCopilot={handleTriggerCopilot}
        theme={effectiveTheme}
        initialPosition={createNodeTargetPos}
        initialNodeData={initialCreateNodeData}
      />

      {/* Node Detail Modal (Centered modal aligned with CreateNodeModal) */}
      <NodeDetailModal
        isOpen={editingNodeId !== null}
        node={editingNode}
        allNodes={dataset.nodes}
        downstreamMap={downstreamMap}
        onClose={handleCloseEditNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onNavigateToNode={handleOpenEditNode}
        onTriggerCopilot={handleTriggerCopilot}
        theme={effectiveTheme}
      />

      {/* Modals */}
      {/* Project Manager Modal */}
      {isProjectManagerOpen && (
        <ProjectManagerModal
          isOpen={isProjectManagerOpen}
          onClose={() => setIsProjectManagerOpen(false)}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          theme={effectiveTheme}
        />
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      {isShortcutsModalOpen && (
        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
          theme={effectiveTheme}
        />
      )}

      {/* System Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={effectiveTheme}
          themeMode={themeMode}
          onThemeModeChange={mode => {
            setThemeMode(mode);
            localStorage.setItem('mathmind_theme_mode_v2', mode);
            showToast(mode === 'dark' ? '已切换至深色模式' : mode === 'paper' ? '已切换至浅色纸张模式' : '已设置为跟随系统外观');
          }}
          cornerStyle={cornerStyle}
          onCornerStyleChange={handleCornerStyleChange}
          surfaceMaterial={surfaceMaterial}
          onSurfaceMaterialChange={handleSurfaceMaterialChange}
          canvasSettings={canvasSettings}
          onUpdateCanvasSettings={handleUpdateCanvasSettings}
          autoSaveMode={autoSaveMode}
          onAutoSaveModeChange={handleChangeAutoSaveMode}
          layoutType={layoutType}
          onChangeLayout={setLayoutType}
          projects={projects}
          onExportAllProjects={handleExportAllProjects}
          onResetToDefaults={handleResetToDefaults}
          onManualSave={() => doSaveNow(true)}
          onOpenSponsor={() => setIsSponsorOpen(true)}
        />
      )}

      {/* Sponsor Modal */}
      {isSponsorOpen && (
        <SponsorModal
          isOpen={isSponsorOpen}
          onClose={() => setIsSponsorOpen(false)}
          theme={effectiveTheme}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-9 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2 border shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 font-serif ${
            isDark
              ? 'bg-[#27272A] border-[#3F3F46] text-white shadow-black/80'
              : 'bg-[#1A1A1A] border-[#333333] text-white'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
