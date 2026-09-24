import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { PropositionNode, NODE_TYPES, AppTheme, PropositionType, CanvasSettings, PropositionStatus, PROPOSITION_STATUSES, CornerStyle } from '../types';
import { ContextMenu, ContextMenuState } from './ContextMenu';
import { MiniMap } from './MiniMap';
import { getSavedCanvasSettings, saveCanvasSettings } from '../utils/storage';
import { latexToUnicode } from '../utils/latexToUnicode';
import { getCytoscapeStyles } from '../styles/cytoscapeStyles';
import { getGraphLayoutConfig } from '../utils/layoutConfigs';
import { getCanvasBackgroundStyle } from '../utils/canvasBackground';
import { useCanvasHighlight } from '../hooks/useCanvasHighlight';
import { useCanvasElementsSync } from '../hooks/useCanvasElementsSync';
import { bindCytoscapeCanvasEvents } from '../utils/canvasEvents';
import { handleCanvasSmoothWheel } from '../utils/canvasSmoothWheel';
import { exportGraphToPng } from '../utils/canvasExport';
import { SelectionOverlay, SelectionToolMode } from './canvas/SelectionOverlay';
import { BatchSelectionBar } from './canvas/BatchSelectionBar';
import { CanvasControlsIsland } from './canvas/CanvasControlsIsland';
import { CanvasModeBanners } from './canvas/CanvasModeBanners';
import { CanvasNodeHtmlOverlay } from './canvas/CanvasNodeHtmlOverlay';
import { isPointInBox, isPointInPolygon, Point, BoundingBox } from '../utils/selectionHelper';
import { useTranslation } from '../i18n/LanguageContext';

cytoscape.use(dagre);

interface GraphCanvasProps {
  nodes: PropositionNode[];
  selectedNodeId: string | null;
  selectedNodeIds?: Set<string>;
  onSelectNode: (nodeId: string | null) => void;
  onSelectMultipleNodes?: (nodeIds: string[], mode: 'replace' | 'toggle' | 'add') => void;
  onBatchDeleteNodes?: (nodeIds: string[]) => void;
  onSelectAllNodes?: () => void;
  onClearSelection?: () => void;
  toolMode?: SelectionToolMode;
  onChangeToolMode?: (mode: SelectionToolMode) => void;
  layoutType: 'dagre' | 'cose';
  isFocusMode: boolean;
  searchQuery: string;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  isConnectingMode: boolean;
  setIsConnectingMode: (active: boolean) => void;
  theme: AppTheme;
  onCopyNode: (node: PropositionNode) => void;
  onCutNode: (node: PropositionNode) => void;
  onPasteNode: (position?: { x: number; y: number }) => void;
  hasClipboard: boolean;
  onChangeNodeType: (nodeId: string, newType: PropositionType) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNodeAtPos: (pos?: { x: number; y: number }) => void;
  onOpenEditNode: (nodeId: string) => void;
  onToggleLayout: () => void;
  onNodesPositionChange?: (updates: { id: string; position: { x: number; y: number } }[]) => void;
  onUpdateNodeStatus?: (nodeId: string, status?: PropositionStatus) => void;
  projectName: string;
  projectId?: string;
  canvasSettings?: CanvasSettings;
  onUpdateCanvasSettings?: (settings: CanvasSettings) => void;
  cornerStyle?: CornerStyle;
}

export function formatCanvasTitle(title: string, status?: PropositionStatus): string {
  if (!title) return '';
  const statusIcon = status ? PROPOSITION_STATUSES[status]?.icon : '';
  const fullTitle = statusIcon ? `${statusIcon} ${title}` : title;
  const converted = latexToUnicode(fullTitle);
  return converted
    .replace(/<br\s*\/?>/gi, '\n') // Converts <br> to newline
    .replace(/\\\\/g, '\n') // Converts LaTeX \\ to newline
    .replace(/\\n/g, '\n') // Converts typed \n to newline
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({

  nodes,
  selectedNodeId,
  selectedNodeIds = new Set(),
  onSelectNode,
  onSelectMultipleNodes,
  onBatchDeleteNodes,
  onSelectAllNodes,
  onClearSelection,
  toolMode: toolModeProp,
  onChangeToolMode: onChangeToolModeProp,
  layoutType,
  isFocusMode,
  searchQuery,
  onConnectNodes,
  isConnectingMode,
  setIsConnectingMode,
  theme,
  onCopyNode,
  onCutNode,
  onPasteNode,
  hasClipboard,
  onChangeNodeType,
  onDeleteNode,
  onCreateNodeAtPos,
  onOpenEditNode,
  onToggleLayout,
  onNodesPositionChange,
  onUpdateNodeStatus,
  projectName,
  projectId,
  canvasSettings: canvasSettingsProp,
  onUpdateCanvasSettings: onUpdateCanvasSettingsProp,
  cornerStyle = 'rounded',
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [currentZoomPercent, setCurrentZoomPercent] = useState<number>(100);
  const prevProjectRef = useRef<string>(projectId || projectName);

  // Selection Tool Mode (none | box | lasso)
  const [internalToolMode, setInternalToolMode] = useState<SelectionToolMode>('none');
  const toolMode = toolModeProp !== undefined ? toolModeProp : internalToolMode;
  const setToolMode = useCallback((mode: SelectionToolMode | ((prev: SelectionToolMode) => SelectionToolMode)) => {
    if (typeof mode === 'function') {
      const nextMode = mode(toolMode);
      if (onChangeToolModeProp) onChangeToolModeProp(nextMode);
      else setInternalToolMode(nextMode);
    } else {
      if (onChangeToolModeProp) onChangeToolModeProp(mode);
      else setInternalToolMode(mode);
    }
  }, [toolMode, onChangeToolModeProp]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas',
    node: null
  });

  const [internalCanvasSettings, setInternalCanvasSettings] = useState<CanvasSettings>(getSavedCanvasSettings);
  const canvasSettings = canvasSettingsProp || internalCanvasSettings;

  const handleUpdateCanvasSettings = useCallback((newSettings: CanvasSettings) => {
    if (onUpdateCanvasSettingsProp) {
      onUpdateCanvasSettingsProp(newSettings);
    } else {
      setInternalCanvasSettings(newSettings);
      saveCanvasSettings(newSettings);
    }
  }, [onUpdateCanvasSettingsProp]);

  const isDark = theme === 'dark';
  const isCanvasDark = useMemo(() => {
    return isDark || canvasSettings.backgroundPreset === 'chalkboard' || canvasSettings.backgroundPreset === 'dark';
  }, [isDark, canvasSettings.backgroundPreset]);

  // Synchronize canvas preset only when user actively switches the global theme mode
  const prevIsDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    if (prevIsDarkRef.current !== isDark) {
      const wasDark = prevIsDarkRef.current;
      prevIsDarkRef.current = isDark;
      if (wasDark && !isDark && canvasSettings.backgroundPreset === 'chalkboard') {
        const updated: CanvasSettings = { ...canvasSettings, backgroundPreset: 'paper' };
        handleUpdateCanvasSettings(updated);
      } else if (!wasDark && isDark && canvasSettings.backgroundPreset === 'paper') {
        const updated: CanvasSettings = { ...canvasSettings, backgroundPreset: 'chalkboard' };
        handleUpdateCanvasSettings(updated);
      }
    }
  }, [isDark, canvasSettings, handleUpdateCanvasSettings]);

  // Prevent browser context menu globally on canvas & elements (allowing native copy/paste only in inputs/textareas)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.shiftKey) return; // Allow Shift + Right Click to inspect or open browser menu if needed
      
      const target = e.target as HTMLElement | null;
      // Allow browser native menu inside text inputs / textareas / contenteditable so users can copy/paste
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (canvasSettings.preventBrowserContextMenu) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, [canvasSettings.preventBrowserContextMenu]);

  // Compute layered background texture
  const computedBackgroundStyle = useMemo<React.CSSProperties>(() => {
    return getCanvasBackgroundStyle(canvasSettings, isDark, isCanvasDark);
  }, [canvasSettings, isDark, isCanvasDark]);

  // Avoid stale closures in Cytoscape callbacks
  const isConnectingModeRef = useRef(isConnectingMode);
  isConnectingModeRef.current = isConnectingMode;

  const connectSourceIdRef = useRef<string | null>(connectSourceId);
  connectSourceIdRef.current = connectSourceId;

  const onConnectNodesRef = useRef(onConnectNodes);
  onConnectNodesRef.current = onConnectNodes;

  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  const setIsConnectingModeRef = useRef(setIsConnectingMode);
  setIsConnectingModeRef.current = setIsConnectingMode;

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const onCreateNodeAtPosRef = useRef(onCreateNodeAtPos);
  onCreateNodeAtPosRef.current = onCreateNodeAtPos;

  const onOpenEditNodeRef = useRef(onOpenEditNode);
  onOpenEditNodeRef.current = onOpenEditNode;

  const onNodesPositionChangeRef = useRef(onNodesPositionChange);
  onNodesPositionChangeRef.current = onNodesPositionChange;

  const selectedNodeIdsRef = useRef<Set<string>>(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;

  const onSelectMultipleNodesRef = useRef(onSelectMultipleNodes);
  onSelectMultipleNodesRef.current = onSelectMultipleNodes;

  const onClearSelectionRef = useRef(onClearSelection);
  onClearSelectionRef.current = onClearSelection;

  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragAnchorStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Box selection geometry check
  const handleSelectBox = useCallback((box: BoundingBox, isAppend: boolean) => {
    const cy = cyRef.current;
    if (!cy) return;
    const matchedIds: string[] = [];
    cy.nodes().forEach(node => {
      const pos = node.renderedPosition();
      if (isPointInBox(pos, box)) {
        matchedIds.push(node.id());
      }
    });
    if (onSelectMultipleNodes) {
      onSelectMultipleNodes(matchedIds, isAppend ? 'add' : 'replace');
    }
  }, [onSelectMultipleNodes]);

  // Lasso polygon selection geometry check
  const handleSelectLasso = useCallback((polygon: Point[], isAppend: boolean) => {
    const cy = cyRef.current;
    if (!cy) return;
    const matchedIds: string[] = [];
    cy.nodes().forEach(node => {
      const pos = node.renderedPosition();
      if (isPointInPolygon(pos, polygon)) {
        matchedIds.push(node.id());
      }
    });
    if (onSelectMultipleNodes) {
      onSelectMultipleNodes(matchedIds, isAppend ? 'add' : 'replace');
    }
  }, [onSelectMultipleNodes]);

  // Initialize Cytoscape
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const cy = cytoscape({
      container,
      boxSelectionEnabled: false,
      autounselectify: false,
      userZoomingEnabled: false, // 彻底禁用 Cytoscape 原生有缺陷的滚轮缩放，完全由我们接管
      minZoom: 0.05,
      maxZoom: 8.0,
      wheelSensitivity: 0.1,
      style: []
    });

    bindCytoscapeCanvasEvents(
      cy,
      {
        containerRef,
        isConnectingModeRef,
        connectSourceIdRef,
        onConnectNodesRef,
        onSelectNodeRef,
        setIsConnectingModeRef,
        nodesRef,
        onCreateNodeAtPosRef,
        onOpenEditNodeRef,
        onNodesPositionChangeRef,
        selectedNodeIdsRef,
        onSelectMultipleNodesRef,
        onClearSelectionRef,
        dragStartPositionsRef,
        dragAnchorStartPosRef
      },
      {
        setConnectSourceId,
        setContextMenu
      }
    );

    // Zoom event
    cy.on('zoom', () => {
      setCurrentZoomPercent(Math.round(cy.zoom() * 100));
    });

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    cyRef.current = cy;
    (window as any).cy = cy;
    setCyInstance(cy);

    // Intercept native wheel on container to eliminate Cytoscape dampening & delta explosion
    const handleWheel = (e: WheelEvent) => {
      handleCanvasSmoothWheel(e, cy, container, setCurrentZoomPercent);
    };

    container.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true } as any);
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
      setCyInstance(null);
    };
  }, []);

  // Update Cytoscape styles when theme or cornerStyle changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(getCytoscapeStyles(isCanvasDark, cornerStyle)).update();
  }, [isCanvasDark, cornerStyle]);

  // Sync external mode cancel
  useEffect(() => {
    if (!isConnectingMode && cyRef.current) {
      connectSourceIdRef.current = null;
      setConnectSourceId(null);
      cyRef.current.nodes().removeClass('connect-source');
    }
  }, [isConnectingMode]);

  // Layout runner with smooth animation & anti-overlap parameters
  const runLayout = useCallback((type: 'dagre' | 'cose', _isSwitch: boolean = false) => {
    const cy = cyRef.current;
    if (!cy || cy.elements().length === 0) return;

    const layoutConfig = getGraphLayoutConfig(type);

    const layout = cy.layout(layoutConfig);

    // Smoothly frame all elements in view upon layout completion
    layout.one('layoutstop', () => {
      cy.resize();
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: 60
        },
        duration: 400,
        easing: 'ease-out-cubic'
      });
      setCurrentZoomPercent(Math.round(cy.zoom() * 100));
    });

    layout.run();
  }, []);

  // Incremental elements synchronization & layout
  useCanvasElementsSync({
    cyRef,
    nodes,
    projectName,
    projectId,
    layoutType,
    runLayout,
    formatTitle: formatCanvasTitle
  });

  // Focus mode lineage highlighting, selection styling & search query matching
  useCanvasHighlight({
    cyRef,
    selectedNodeId,
    selectedNodeIds,
    isFocusMode,
    searchQuery
  });

  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { eles: cyRef.current.elements(), padding: 60 },
        duration: 250
      });
    }
  };

  const setZoomLevel = (scale: number) => {
    if (cyRef.current) {
      cyRef.current.animate({
        zoom: scale,
        duration: 200
      });
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      const current = cyRef.current.zoom();
      cyRef.current.animate({
        zoom: Math.min(current * 1.6, 8.0),
        duration: 180
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const current = cyRef.current.zoom();
      cyRef.current.animate({
        zoom: Math.max(current / 1.6, 0.05),
        duration: 180
      });
    }
  };

  // Keyboard shortcuts for canvas zoom and fit (0, +, -)
  useEffect(() => {
    const handleCanvasKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      if (e.key === '0' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleResetZoom();
      } else if ((e.key === '=' || e.key === '+') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleCanvasKeyDown);
    return () => window.removeEventListener('keydown', handleCanvasKeyDown);
  }, []);

  // Export High-Res PNG
  const handleExportPng = () => {
    if (!cyRef.current) return;
    exportGraphToPng(cyRef.current, projectName, isDark);
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#121214]' : 'bg-[#FAF9F5]'
      }`}
      onContextMenu={e => {
        if (!e.shiftKey && canvasSettings.preventBrowserContextMenu) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Dynamic Background Layer (Supports Presets, Custom Image, Opacity & Blur) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          ...computedBackgroundStyle,
          opacity: canvasSettings.bgOpacity,
          filter: canvasSettings.bgBlur > 0 ? `blur(${canvasSettings.bgBlur}px)` : undefined,
          transform: canvasSettings.bgBlur > 0 ? 'scale(1.04)' : undefined
        }}
      />

      {/* Cytoscape Container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full relative z-0 ${
          isConnectingMode 
            ? 'cursor-crosshair' 
            : toolMode === 'box' || toolMode === 'lasso'
            ? 'cursor-crosshair'
            : 'cursor-grab active:cursor-grabbing'
        }`} 
      />

      {/* Real KaTeX Mathematical Typography Overlay */}
      <CanvasNodeHtmlOverlay
        cy={cyInstance}
        nodes={nodes}
        theme={theme}
      />

      {/* Selection Overlay for Box & Lasso */}
      <SelectionOverlay
        toolMode={toolMode}
        onSelectBox={handleSelectBox}
        onSelectLasso={handleSelectLasso}
        onExitMode={() => setToolMode('none')}
        clearTrigger={selectedNodeIds.size === 0}
        containerRef={containerRef}
      />

      {/* Floating Batch Selection Bar */}
      <BatchSelectionBar
        selectedCount={selectedNodeIds.size}
        totalNodeCount={nodes.length}
        onSelectAll={() => onSelectAllNodes?.()}
        onClearSelection={() => onClearSelection?.()}
        onBatchDelete={() => onBatchDeleteNodes?.(Array.from(selectedNodeIds))}
        isDark={isDark}
      />

      {/* Floating Canvas Controls - Modern Frosted Glass Island */}
      <CanvasControlsIsland
        currentZoomPercent={currentZoomPercent}
        onResetZoom={handleResetZoom}
        onRelayout={() => runLayout(layoutType)}
        onSetZoomLevel={setZoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        toolMode={toolMode}
        onChangeToolMode={setToolMode}
        isDark={isDark}
      />

      {/* Mode Banners (Box, Lasso, Connect) */}
      <CanvasModeBanners
        toolMode={toolMode}
        onExitToolMode={() => setToolMode('none')}
        isConnectingMode={isConnectingMode}
        connectSourceTitle={connectSourceId ? (nodes.find(n => n.id === connectSourceId)?.title || connectSourceId) : null}
        onExitConnectMode={() => {
          setIsConnectingMode(false);
          setConnectSourceId(null);
          connectSourceIdRef.current = null;
          cyRef.current?.nodes().removeClass('connect-source');
        }}
      />

      {/* MiniMap */}
      <MiniMap cy={cyInstance} theme={theme} />

      {/* Right Click Context Menu */}
      <ContextMenu
        menuState={contextMenu}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        onStartConnectFromNode={nodeId => {
          setIsConnectingMode(true);
          setConnectSourceId(nodeId);
          connectSourceIdRef.current = nodeId;
          cyRef.current?.nodes().removeClass('connect-source');
          cyRef.current?.$id(nodeId).addClass('connect-source');
        }}
        onCopyNode={onCopyNode}
        onCutNode={onCutNode}
        onPasteNode={onPasteNode}
        hasClipboard={hasClipboard}
        onChangeNodeType={onChangeNodeType}
        onOpenEditNode={onOpenEditNode}
        onDeleteNode={onDeleteNode}
        onCreateNodeAtPos={onCreateNodeAtPos}
        onExportPng={handleExportPng}
        onFitCanvas={handleResetZoom}
        onToggleLayout={onToggleLayout}
        currentLayout={layoutType}
        theme={theme}
        selectedNodeCount={selectedNodeIds.size}
        onBatchDelete={() => onBatchDeleteNodes?.(Array.from(selectedNodeIds))}
        onUpdateNodeStatus={onUpdateNodeStatus}
      />
    </div>
  );
};
