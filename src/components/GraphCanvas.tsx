import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { PropositionNode, NODE_TYPES, AppTheme, PropositionType, CanvasSettings } from '../types';
import { ContextMenu, ContextMenuState } from './ContextMenu';
import { MiniMap } from './MiniMap';
import { getSavedCanvasSettings, saveCanvasSettings } from '../utils/storage';
import { getHybridPaperTexture, getChalkboardTexture } from '../utils/paperTexture';
import { latexToUnicode } from '../utils/latexToUnicode';
import { getCytoscapeStyles } from '../styles/cytoscapeStyles';
import { getGraphLayoutConfig } from '../utils/layoutConfigs';
import { SelectionOverlay, SelectionToolMode } from './canvas/SelectionOverlay';
import { BatchSelectionBar } from './canvas/BatchSelectionBar';
import { CanvasControlsIsland } from './canvas/CanvasControlsIsland';
import { CanvasModeBanners } from './canvas/CanvasModeBanners';
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
  projectName: string;
  projectId?: string;
  canvasSettings?: CanvasSettings;
  onUpdateCanvasSettings?: (settings: CanvasSettings) => void;
}

export function formatCanvasTitle(title: string): string {
  if (!title) return '';
  const converted = latexToUnicode(title);
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
  projectName,
  projectId,
  canvasSettings: canvasSettingsProp,
  onUpdateCanvasSettings: onUpdateCanvasSettingsProp,
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

  // Prevent browser context menu with Shift-bypass
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.shiftKey) return; // Allow Shift + Right Click to inspect or open browser menu
      if (canvasSettings.preventBrowserContextMenu) {
        e.preventDefault();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu, { capture: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
      }
    };
  }, [canvasSettings.preventBrowserContextMenu]);

  // Compute layered background texture
  const computedBackgroundStyle = useMemo<React.CSSProperties>(() => {
    const preset = canvasSettings.backgroundPreset;

    if (preset === 'custom' && canvasSettings.customBgImage) {
      return {
        backgroundImage: `url(${canvasSettings.customBgImage})`,
        backgroundSize: canvasSettings.bgRepeat ? 'auto' : 'cover',
        backgroundRepeat: canvasSettings.bgRepeat ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        backgroundColor: isCanvasDark ? '#121214' : '#FFFFFF'
      };
    }

    if (preset === 'grid') {
      return {
        backgroundColor: isDark ? '#121417' : '#FFFFFF',
        backgroundImage: isDark
          ? 'linear-gradient(#22272E 1px, transparent 1px), linear-gradient(90deg, #22272E 1px, transparent 1px), linear-gradient(#2D333B 1px, transparent 1px), linear-gradient(90deg, #2D333B 1px, transparent 1px)'
          : 'linear-gradient(#EDF2F7 1px, transparent 1px), linear-gradient(90deg, #EDF2F7 1px, transparent 1px), linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)',
        backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px'
      };
    }

    if (preset === 'paper' || preset === 'parchment') {
      const paperTexture = getHybridPaperTexture(isDark);
      return {
        backgroundColor: isDark ? '#1A1612' : '#FAF8F4',
        backgroundImage: isDark
          ? `radial-gradient(circle at 50% 50%, rgba(34, 28, 22, 0.4) 0%, rgba(20, 16, 13, 0.8) 100%), url("${paperTexture}")`
          : `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5) 0%, rgba(244, 239, 230, 0.5) 100%), url("${paperTexture}")`,
        backgroundRepeat: 'repeat'
      };
    }

    // 黑板预设：无论在浅色或深色模式下，均呈现真正深邃的黑板绿石板色，并带有细腻石板微晶齿度、粉笔轻擦痕与微粒
    if (preset === 'chalkboard') {
      const chalkboardTexture = getChalkboardTexture();
      return {
        backgroundColor: '#141D18',
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(28, 42, 34, 0.45) 0%, rgba(16, 24, 19, 0.85) 100%), url("${chalkboardTexture}")`,
        backgroundRepeat: 'repeat'
      };
    }

    // 黑色/深色预设：无论在浅色或深色模式下，均呈现真正的黑曜石深色质感
    if (preset === 'dark') {
      const obsidianNoise = `data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='oN'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23oN)' opacity='0.035'/%3E%3C/svg%3E`;
      return {
        backgroundColor: '#0A0D12',
        backgroundImage: `radial-gradient(circle at 50% 0%, #171E28 0%, #0A0D12 100%), url("${obsidianNoise}")`,
        backgroundRepeat: 'repeat'
      };
    }

    // Default: dots
    return {
      backgroundColor: isDark ? '#121214' : '#FAFAFA',
      backgroundImage: isDark
        ? 'radial-gradient(#27272A 1.5px, transparent 1.5px)'
        : 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px'
    };
  }, [canvasSettings, isDark]);

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

    // Left click node
    cy.on('tap', 'node', (evt: EventObject) => {
      const clickedId = evt.target.id();
      const originalEvent = evt.originalEvent as MouseEvent | undefined;
      const isCtrlOrCmd = originalEvent ? (originalEvent.ctrlKey || originalEvent.metaKey) : false;

      if (isConnectingModeRef.current) {
        if (!connectSourceIdRef.current) {
          connectSourceIdRef.current = clickedId;
          setConnectSourceId(clickedId);
          cy.nodes().removeClass('connect-source');
          evt.target.addClass('connect-source');
        } else {
          const srcId = connectSourceIdRef.current;
          if (srcId !== clickedId) {
            onConnectNodesRef.current(srcId, clickedId);
          }
          connectSourceIdRef.current = null;
          setConnectSourceId(null);
          setIsConnectingModeRef.current(false);
          cy.nodes().removeClass('connect-source');
        }
        return;
      }

      if (isCtrlOrCmd) {
        if (onSelectMultipleNodesRef.current) {
          onSelectMultipleNodesRef.current([clickedId], 'toggle');
        }
      } else {
        if (onSelectMultipleNodesRef.current) {
          onSelectMultipleNodesRef.current([clickedId], 'replace');
        }
        onSelectNodeRef.current(clickedId);
      }
    });

    // Left click background
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        if (isConnectingModeRef.current) {
          connectSourceIdRef.current = null;
          setConnectSourceId(null);
          setIsConnectingModeRef.current(false);
          cy.nodes().removeClass('connect-source');
        } else {
          if (onClearSelectionRef.current) {
            onClearSelectionRef.current();
          }
          onSelectNodeRef.current(null);
        }
      }
    });

    // Right click on node (cxttap)
    cy.on('cxttap', 'node', (evt: EventObject) => {
      const clickedId = evt.target.id();
      const nodeObj = nodesRef.current.find(n => n.id === clickedId) || null;
      const renderedPos = evt.renderedPosition;
      const containerRect = containerRef.current?.getBoundingClientRect();
      const originX = containerRect ? containerRect.left : 0;
      const originY = containerRect ? containerRect.top : 56;

      const selected = selectedNodeIdsRef.current;
      if (!selected.has(clickedId)) {
        if (onSelectMultipleNodesRef.current) {
          onSelectMultipleNodesRef.current([clickedId], 'replace');
        }
        onSelectNodeRef.current(clickedId);
      }

      setContextMenu({
        isOpen: true,
        x: originX + renderedPos.x,
        y: originY + renderedPos.y,
        type: 'node',
        node: nodeObj
      });
    });

    // Right click on canvas background
    cy.on('cxttap', (evt: EventObject) => {
      if (evt.target === cy) {
        const renderedPos = evt.renderedPosition;
        const modelPos = evt.position;
        const containerRect = containerRef.current?.getBoundingClientRect();
        const originX = containerRect ? containerRect.left : 0;
        const originY = containerRect ? containerRect.top : 56;

        setContextMenu({
          isOpen: true,
          x: originX + renderedPos.x,
          y: originY + renderedPos.y,
          type: 'canvas',
          node: null,
          canvasPosition: modelPos
        });
      }
    });

    // Double click: empty canvas -> create node; node -> open edit
    cy.on('dbltap', (evt: EventObject) => {
      if (evt.target === cy) {
        if (onCreateNodeAtPosRef.current) {
          onCreateNodeAtPosRef.current(evt.position);
        }
      } else if (evt.target.isNode && evt.target.isNode()) {
        if (onOpenEditNodeRef.current) {
          onOpenEditNodeRef.current(evt.target.id());
        }
      }
    });

    // Multi-node drag start
    cy.on('grab', 'node', (evt: EventObject) => {
      const targetNode = evt.target;
      const targetId = targetNode.id();
      const selected = selectedNodeIdsRef.current;
      if (selected && selected.has(targetId) && selected.size > 1) {
        const map = new Map<string, { x: number; y: number }>();
        selected.forEach(id => {
          const n = cy.$id(id);
          if (n.length > 0) {
            map.set(id, { ...n.position() });
          }
        });
        dragStartPositionsRef.current = map;
        dragAnchorStartPosRef.current = { ...targetNode.position() };
      } else {
        dragStartPositionsRef.current.clear();
        dragAnchorStartPosRef.current = null;
      }
    });

    // Multi-node drag move
    cy.on('drag', 'node', (evt: EventObject) => {
      const targetNode = evt.target;
      const targetId = targetNode.id();
      const startMap = dragStartPositionsRef.current;
      const anchorStart = dragAnchorStartPosRef.current;
      if (anchorStart && startMap.size > 1 && startMap.has(targetId)) {
        const currentPos = targetNode.position();
        const dx = currentPos.x - anchorStart.x;
        const dy = currentPos.y - anchorStart.y;
        startMap.forEach((startPos, id) => {
          if (id !== targetId) {
            const n = cy.$id(id);
            if (n.length > 0) {
              n.position({
                x: Math.round(startPos.x + dx),
                y: Math.round(startPos.y + dy)
              });
            }
          }
        });
      }
    });

    // Node drag release: persist new positions (single or batch)
    cy.on('dragfree', 'node', (evt: EventObject) => {
      const targetNode = evt.target;
      const targetId = targetNode.id();
      const startMap = dragStartPositionsRef.current;
      if (startMap.size > 1 && startMap.has(targetId)) {
        const updates: { id: string; position: { x: number; y: number } }[] = [];
        startMap.forEach((_, id) => {
          const n = cy.$id(id);
          if (n.length > 0) {
            const pos = n.position();
            updates.push({
              id,
              position: { x: Math.round(pos.x), y: Math.round(pos.y) }
            });
          }
        });
        dragStartPositionsRef.current.clear();
        dragAnchorStartPosRef.current = null;
        if (onNodesPositionChangeRef.current && updates.length > 0) {
          onNodesPositionChangeRef.current(updates);
        }
      } else {
        const pos = targetNode.position();
        if (onNodesPositionChangeRef.current) {
          onNodesPositionChangeRef.current([
            {
              id: targetId,
              position: { x: Math.round(pos.x), y: Math.round(pos.y) }
            }
          ]);
        }
      }
    });

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

    // Intercept native wheel on container to completely eliminate Cytoscape's
    // 4-event dampening heuristic and Windows mouse wheel delta explosion
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentCy = cyRef.current;
      if (!currentCy) return;

      const rect = container.getBoundingClientRect();
      const renderedPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Normalize delta across all input hardware & modes:
      // deltaMode: 0 = pixels, 1 = lines, 2 = pages
      let ticks = 0;
      if (e.deltaMode === 1) {
        ticks = e.deltaY;
      } else if (e.deltaMode === 2) {
        ticks = e.deltaY * 5;
      } else {
        // Standard mechanical wheel notch is ~100px or ~120px; touchpads give smooth smaller floats
        ticks = e.deltaY / 100;
      }

      // Clamp ticks to prevent sudden extreme hardware spikes
      const clampedTicks = Math.max(-3, Math.min(3, ticks));
      // Base zoom factor: 1.25x (snappy 25% zoom per standard mechanical notch)
      const calculatedFactor = Math.pow(1.25, -clampedTicks);
      // Hard safety bounds: single event factor is strictly bounded between 0.55x and 1.8x
      const safeFactor = Math.max(0.55, Math.min(1.8, calculatedFactor));

      const currentZoom = currentCy.zoom();
      const minZoom = currentCy.minZoom();
      const maxZoom = currentCy.maxZoom();
      const nextZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * safeFactor));

      if (Math.abs(nextZoom - currentZoom) > 0.0001) {
        currentCy.zoom({
          level: nextZoom,
          renderedPosition: renderedPos
        });
        setCurrentZoomPercent(Math.round(nextZoom * 100));
      }
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

  // Update Cytoscape styles when theme changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(getCytoscapeStyles(isCanvasDark)).update();
  }, [isCanvasDark]);

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

  // Update elements (Incremental update to preserve positions and prevent flickering)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const currentProjKey = projectId || projectName;
    const isProjectSwitch = prevProjectRef.current !== currentProjKey;
    prevProjectRef.current = currentProjKey;

    if (isProjectSwitch || cy.elements().length === 0) {
      // Full load / Project switch: rebuild all elements and run layout
      const elements: cytoscape.ElementDefinition[] = [];

      nodes.forEach(node => {
        const typeConfig = NODE_TYPES[node.type] || NODE_TYPES.theorem;
        elements.push({
          group: 'nodes',
          data: {
            id: node.id,
            title: node.title,
            displayTitle: formatCanvasTitle(node.title),
            type: node.type,
            borderColor: typeConfig.borderColor,
            bgColor: typeConfig.bgColor,
            darkBorderColor: typeConfig.darkBorderColor,
            darkBgColor: typeConfig.darkBgColor
          },
          ...(node.position ? { position: { ...node.position } } : {})
        });
      });

      nodes.forEach(node => {
        (node.depends_on || []).forEach(upstreamId => {
          if (nodes.some(n => n.id === upstreamId)) {
            elements.push({
              group: 'edges',
              data: {
                id: `${upstreamId}->${node.id}`,
                source: upstreamId,
                target: node.id
              }
            });
          }
        });
      });

      cy.elements().remove();
      cy.add(elements);
      cy.resize();
      runLayout(layoutType, true);
      return;
    }

    // Incremental update within same project:
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // 1. Remove nodes no longer in dataset
    cy.nodes().forEach(cyNode => {
      if (!nodeMap.has(cyNode.id())) {
        cy.remove(cyNode);
      }
    });

    // 2. Update existing nodes or add new nodes
    const newNodesToAdd: cytoscape.ElementDefinition[] = [];

    nodes.forEach(node => {
      const cyNode = cy.$id(node.id);
      const typeConfig = NODE_TYPES[node.type] || NODE_TYPES.theorem;

      if (cyNode.length > 0) {
        // Update data
        cyNode.data({
          title: node.title,
          displayTitle: formatCanvasTitle(node.title),
          type: node.type,
          borderColor: typeConfig.borderColor,
          bgColor: typeConfig.bgColor,
          darkBorderColor: typeConfig.darkBorderColor,
          darkBgColor: typeConfig.darkBgColor
        });
      } else {
        // New node! Determine its position intelligently
        let initialPos = node.position;

        if (!initialPos) {
          // If node has prerequisites, place downstream to the right of their center
          const prereqs = node.depends_on || [];
          const prereqNodes = cy.nodes().filter(n => prereqs.includes(n.id()));
          if (prereqNodes.length > 0) {
            let sumX = 0;
            let sumY = 0;
            prereqNodes.forEach(pn => {
              const pos = pn.position();
              sumX += pos.x;
              sumY += pos.y;
            });
            initialPos = {
              x: sumX / prereqNodes.length + 220,
              y: sumY / prereqNodes.length
            };
          } else {
            // Place near the visible center of current viewport
            const ext = cy.extent();
            initialPos = {
              x: (ext.x1 + ext.x2) / 2 + (Math.random() * 40 - 20),
              y: (ext.y1 + ext.y2) / 2 + (Math.random() * 40 - 20)
            };
          }
        }

        newNodesToAdd.push({
          group: 'nodes',
          data: {
            id: node.id,
            title: node.title,
            displayTitle: formatCanvasTitle(node.title),
            type: node.type,
            borderColor: typeConfig.borderColor,
            bgColor: typeConfig.bgColor,
            darkBorderColor: typeConfig.darkBorderColor,
            darkBgColor: typeConfig.darkBgColor
          },
          position: initialPos
        });
      }
    });

    if (newNodesToAdd.length > 0) {
      cy.add(newNodesToAdd);
    }

    // 3. Sync edges
    const desiredEdges = new Set<string>();
    const edgesToAdd: cytoscape.ElementDefinition[] = [];

    nodes.forEach(node => {
      (node.depends_on || []).forEach(upstreamId => {
        if (nodes.some(n => n.id === upstreamId)) {
          const edgeId = `${upstreamId}->${node.id}`;
          desiredEdges.add(edgeId);

          if (cy.$id(edgeId).length === 0) {
            edgesToAdd.push({
              group: 'edges',
              data: {
                id: edgeId,
                source: upstreamId,
                target: node.id
              }
            });
          }
        }
      });
    });

    cy.edges().forEach(cyEdge => {
      if (!desiredEdges.has(cyEdge.id())) {
        cy.remove(cyEdge);
      }
    });

    if (edgesToAdd.length > 0) {
      cy.add(edgesToAdd);
    }
  }, [nodes, projectName, projectId, runLayout]);

  const isFirstMountLayoutRef = useRef(true);
  useEffect(() => {
    if (isFirstMountLayoutRef.current) {
      isFirstMountLayoutRef.current = false;
      return;
    }
    runLayout(layoutType, false);
  }, [layoutType, runLayout]);

  // Focus mode & pan to selected node / multi-selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass('dimmed selected upstream-highlight downstream-highlight highlighted-edge newly-created');

    // Highlight all nodes in multi-selection
    if (selectedNodeIds && selectedNodeIds.size > 0) {
      selectedNodeIds.forEach(id => {
        cy.$id(id).addClass('selected');
      });
    }

    if (!selectedNodeId) return;

    const targetNode = cy.$id(selectedNodeId);
    if (targetNode.length === 0) return;

    targetNode.addClass('selected newly-created');

    // Smoothly center on selected node if outside current viewport, preserving user zoom
    const extent = cy.extent();
    const nodePos = targetNode.position();
    const isVisible =
      nodePos.x >= extent.x1 + 40 &&
      nodePos.x <= extent.x2 - 40 &&
      nodePos.y >= extent.y1 + 40 &&
      nodePos.y <= extent.y2 - 40;

    if (!isVisible) {
      cy.animate({
        center: { eles: targetNode },
        duration: 250,
        easing: 'ease-out-cubic'
      });
    }

    const timer = setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.$id(selectedNodeId).removeClass('newly-created');
      }
    }, 2500);

    if (isFocusMode) {
      const predecessors = targetNode.predecessors();
      const successors = targetNode.successors();

      predecessors.nodes().addClass('upstream-highlight');
      successors.nodes().addClass('downstream-highlight');

      predecessors.edges().addClass('highlighted-edge');
      successors.edges().addClass('highlighted-edge');

      const lineage = targetNode.union(predecessors).union(successors);
      // Only dim background nodes if we have a lineage chain, preserving context for isolated nodes
      if (lineage.length > 1) {
        cy.elements().difference(lineage).addClass('dimmed');
      }
    }

    return () => clearTimeout(timer);
  }, [selectedNodeId, selectedNodeIds, isFocusMode]);

  // Search
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass('search-matched');

    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const matched = cy.nodes().filter(ele => {
      const title = (ele.data('title') || '').toLowerCase();
      const type = (ele.data('type') || '').toLowerCase();
      return title.includes(query) || type.includes(query);
    });

    matched.addClass('search-matched');

    if (matched.length > 0) {
      cy.animate({
        center: { eles: matched },
        zoom: 1.3,
        duration: 250
      });
    }
  }, [searchQuery]);

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
    const pngData = cyRef.current.png({
      full: true,
      scale: 2,
      bg: isDark ? '#121214' : '#FAF8F5'
    });
    const a = document.createElement('a');
    a.href = pngData;
    const cleanName = projectName.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || 'mathmind_graph';
    a.download = `${cleanName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#121214]' : 'bg-[#FAF9F5]'
      }`}
      onContextMenu={e => {
        if (!e.shiftKey && canvasSettings.preventBrowserContextMenu) {
          e.preventDefault();
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

      {/* Selection Overlay for Box & Lasso */}
      <SelectionOverlay
        toolMode={toolMode}
        onSelectBox={handleSelectBox}
        onSelectLasso={handleSelectLasso}
        onExitMode={() => setToolMode('none')}
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
      />
    </div>
  );
};
