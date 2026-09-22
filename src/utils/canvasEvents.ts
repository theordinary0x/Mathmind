import React from 'react';
import { Core, EventObject } from 'cytoscape';
import { PropositionNode } from '../types';
import { ContextMenuState } from '../components/ContextMenu';

export interface CanvasEventRefs {
  containerRef: React.RefObject<HTMLDivElement>;
  isConnectingModeRef: React.MutableRefObject<boolean>;
  connectSourceIdRef: React.MutableRefObject<string | null>;
  onConnectNodesRef: React.MutableRefObject<(sourceId: string, targetId: string) => void>;
  onSelectNodeRef: React.MutableRefObject<(nodeId: string | null) => void>;
  setIsConnectingModeRef: React.MutableRefObject<(active: boolean) => void>;
  nodesRef: React.MutableRefObject<PropositionNode[]>;
  onCreateNodeAtPosRef: React.MutableRefObject<((pos?: { x: number; y: number }) => void) | undefined>;
  onOpenEditNodeRef: React.MutableRefObject<((nodeId: string) => void) | undefined>;
  onNodesPositionChangeRef: React.MutableRefObject<((updates: { id: string; position: { x: number; y: number } }[]) => void) | undefined>;
  selectedNodeIdsRef: React.MutableRefObject<Set<string>>;
  onSelectMultipleNodesRef: React.MutableRefObject<((nodeIds: string[], mode: 'replace' | 'toggle' | 'add') => void) | undefined>;
  onClearSelectionRef: React.MutableRefObject<(() => void) | undefined>;
  dragStartPositionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  dragAnchorStartPosRef: React.MutableRefObject<{ x: number; y: number } | null>;
}

export interface CanvasEventCallbacks {
  setConnectSourceId: (id: string | null) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
}

/**
 * Attaches all interactive Cytoscape event listeners (click, double click, right click, multi-drag)
 */
export function bindCytoscapeCanvasEvents(
  cy: Core,
  refs: CanvasEventRefs,
  callbacks: CanvasEventCallbacks
) {
  const {
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
  } = refs;

  const { setConnectSourceId, setContextMenu } = callbacks;

  // Left click node: Select only (No modal!)
  cy.on('tap', 'node', (evt: EventObject) => {
    const clickedId = evt.target.id();
    const originalEvent = evt.originalEvent as MouseEvent | undefined;
    const isCtrlOrCmd = originalEvent ? originalEvent.ctrlKey || originalEvent.metaKey : false;

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

  // Left click background: Clear selection
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

  // Right click on node (cxttap): Open node context menu
  cy.on('cxttap', 'node', (evt: EventObject) => {
    const origEvent = (evt as any).originalEvent;
    if (origEvent) {
      origEvent.preventDefault?.();
      origEvent.stopPropagation?.();
    }

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

  // Right click on canvas background: Open canvas context menu
  cy.on('cxttap', (evt: EventObject) => {
    if (evt.target === cy) {
      const origEvent = (evt as any).originalEvent;
      if (origEvent) {
        origEvent.preventDefault?.();
        origEvent.stopPropagation?.();
      }

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

  // Double click: empty canvas -> create node; node -> open edit modal
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
}
