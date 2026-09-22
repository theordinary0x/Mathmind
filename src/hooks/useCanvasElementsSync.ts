import { useEffect, useRef, MutableRefObject } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { PropositionNode, PropositionStatus, NODE_TYPES } from '../types';

interface UseCanvasElementsSyncProps {
  cyRef: MutableRefObject<Core | null>;
  nodes: PropositionNode[];
  projectName: string;
  projectId?: string;
  layoutType: 'dagre' | 'cose';
  runLayout: (type: 'dagre' | 'cose', isSwitch?: boolean) => void;
  formatTitle: (title: string, status?: PropositionStatus) => string;
}

export function useCanvasElementsSync({
  cyRef,
  nodes,
  projectName,
  projectId,
  layoutType,
  runLayout,
  formatTitle
}: UseCanvasElementsSyncProps) {
  const prevProjectRef = useRef<string>(projectId || projectName);

  // Incremental element update to preserve positions and prevent flickering
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
            displayTitle: formatTitle(node.title, node.status),
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
          displayTitle: formatTitle(node.title, node.status),
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
            displayTitle: formatTitle(node.title, node.status),
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
  }, [cyRef, nodes, projectName, projectId, runLayout, formatTitle]);

  // Layout change effect
  const isFirstMountLayoutRef = useRef(true);
  useEffect(() => {
    if (isFirstMountLayoutRef.current) {
      isFirstMountLayoutRef.current = false;
      return;
    }
    runLayout(layoutType, false);
  }, [layoutType, runLayout]);
}
