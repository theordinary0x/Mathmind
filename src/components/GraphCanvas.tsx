import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { PropositionNode, NODE_TYPES } from '../types';

// Register extensions
cytoscape.use(dagre);

interface GraphCanvasProps {
  nodes: PropositionNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  layoutType: 'dagre' | 'cose';
  isFocusMode: boolean;
  searchQuery: string;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  isConnectingMode: boolean;
  setIsConnectingMode: (active: boolean) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  layoutType,
  isFocusMode,
  searchQuery,
  onConnectNodes,
  isConnectingMode,
  setIsConnectingMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      boxSelectionEnabled: false,
      autounselectify: false,
      minZoom: 0.2,
      maxZoom: 3.0,
      wheelSensitivity: 0.25,
      style: [
        // Node base styling - Minimalist Paper Aesthetic
        {
          selector: 'node',
          style: {
            'label': 'data(title)',
            'font-family': '"Noto Serif SC", serif, -apple-system, sans-serif',
            'font-size': '12px',
            'font-weight': 600,
            'color': '#2C2B29',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'background-color': '#FFFFFF',
            'border-width': 2,
            'border-color': 'data(borderColor)',
            'width': 'label',
            'height': 'label',
            'padding': '14px',
            'shape': 'round-rectangle',
            'transition-property': 'background-color, border-color, opacity, border-width',
            'transition-duration': 0.2
          }
        },
        // Axiom specific pill
        {
          selector: 'node[type = "axiom"]',
          style: {
            'shape': 'round-rectangle',
            'border-color': '#26547C',
            'background-color': '#F0F4F8'
          }
        },
        {
          selector: 'node[type = "definition"]',
          style: {
            'shape': 'round-rectangle',
            'border-color': '#2A7B62',
            'background-color': '#F0F7F4'
          }
        },
        {
          selector: 'node[type = "theorem"]',
          style: {
            'shape': 'round-rectangle',
            'border-color': '#A8423F',
            'background-color': '#FCF2F1'
          }
        },
        {
          selector: 'node[type = "corollary"]',
          style: {
            'shape': 'round-rectangle',
            'border-color': '#C67D28',
            'background-color': '#FCF7F0'
          }
        },
        // Edge styling (Arrow from Premise A to Conclusion B)
        {
          selector: 'edge',
          style: {
            'width': 1.8,
            'line-color': '#C8C2B5',
            'target-arrow-color': '#A8A295',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 0.2
          }
        },
        // Selected node highlight
        {
          selector: 'node:selected, node.selected',
          style: {
            'border-width': 3.5,
            'border-color': '#2C2B29',
            'background-color': '#FFFFFF'
          }
        },
        // Lineage highlighting (Upstream premise / Downstream conclusion)
        {
          selector: 'node.upstream-highlight',
          style: {
            'border-width': 3,
            'border-color': '#26547C',
            'background-color': '#E8F1F7'
          }
        },
        {
          selector: 'node.downstream-highlight',
          style: {
            'border-width': 3,
            'border-color': '#A8423F',
            'background-color': '#FBECEB'
          }
        },
        {
          selector: 'edge.highlighted-edge',
          style: {
            'width': 2.8,
            'line-color': '#2C2B29',
            'target-arrow-color': '#2C2B29',
            'z-index': 99
          }
        },
        // Dimmed / Focus Mode faded
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.12
          }
        },
        // Search matched highlight
        {
          selector: 'node.search-matched',
          style: {
            'border-width': 4,
            'border-color': '#D97706',
            'background-color': '#FEF3C7'
          }
        },
        // Connecting source indicator
        {
          selector: 'node.connect-source',
          style: {
            'border-width': 4,
            'border-style': 'dashed',
            'border-color': '#2563EB',
            'background-color': '#DBEAFE'
          }
        }
      ]
    });

    // Handle node click
    cy.on('tap', 'node', (evt: EventObject) => {
      const clickedId = evt.target.id();

      if (isConnectingMode) {
        if (!connectSourceId) {
          // Select source premise
          setConnectSourceId(clickedId);
          evt.target.addClass('connect-source');
        } else {
          if (connectSourceId !== clickedId) {
            // Target conclusion reached: Target depends on Source!
            onConnectNodes(connectSourceId, clickedId);
          }
          // Reset connecting mode
          setIsConnectingMode(false);
          setConnectSourceId(null);
          cy.nodes().removeClass('connect-source');
        }
        return;
      }

      onSelectNode(clickedId);
    });

    // Handle background click (unselect & reset focus)
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        if (isConnectingMode) {
          setIsConnectingMode(false);
          setConnectSourceId(null);
          cy.nodes().removeClass('connect-source');
        } else {
          onSelectNode(null);
        }
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Update elements when nodes change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Convert nodes to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [];

    // Add nodes
    nodes.forEach(node => {
      const typeConfig = NODE_TYPES[node.type] || NODE_TYPES.theorem;
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          title: node.title,
          type: node.type,
          borderColor: typeConfig.borderColor,
          bgColor: typeConfig.bgColor
        }
      });
    });

    // Add edges (source = premise, target = conclusion)
    nodes.forEach(node => {
      node.depends_on.forEach(upstreamId => {
        // Only create edge if upstream node exists
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

    // Apply layout
    runLayout(layoutType);
  }, [nodes]);

  // Layout function
  const runLayout = useCallback((type: 'dagre' | 'cose') => {
    const cy = cyRef.current;
    if (!cy || cy.elements().length === 0) return;

    let layoutConfig: cytoscape.LayoutOptions;

    if (type === 'dagre') {
      // Hierarchical DAG: Left-to-Right or Top-to-Bottom
      layoutConfig = {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 100,
        edgeSep: 30,
        animate: true,
        animationDuration: 400
      } as cytoscape.LayoutOptions;
    } else {
      // Force-directed layout
      layoutConfig = {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        refresh: 20,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 400000,
        nodeOverlap: 20,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100
      };
    }

    const layout = cy.layout(layoutConfig);
    layout.run();
  }, []);

  // Update layout when layoutType changes
  useEffect(() => {
    runLayout(layoutType);
  }, [layoutType, runLayout]);

  // Handle Focus Mode & Lineage Highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Reset previous styles
    cy.elements().removeClass('dimmed selected upstream-highlight downstream-highlight highlighted-edge');

    if (!selectedNodeId) {
      return;
    }

    const targetNode = cy.$id(selectedNodeId);
    if (targetNode.length === 0) return;

    targetNode.addClass('selected');

    if (isFocusMode) {
      // Calculate full upstream ancestors and downstream descendants
      const predecessors = targetNode.predecessors();
      const successors = targetNode.successors();

      // Highlight upstream nodes and edges
      predecessors.nodes().addClass('upstream-highlight');
      successors.nodes().addClass('downstream-highlight');

      // Highlight edges in lineage
      predecessors.edges().addClass('highlighted-edge');
      successors.edges().addClass('highlighted-edge');

      // Dim all elements not in the focus lineage
      const lineage = targetNode.union(predecessors).union(successors);
      cy.elements().difference(lineage).addClass('dimmed');
    }
  }, [selectedNodeId, isFocusMode]);

  // Handle Search Query
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
        zoom: 1.2,
        duration: 300
      });
    }
  }, [searchQuery]);

  // Fit to screen helper
  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { eles: cyRef.current.elements(), padding: 50 },
        duration: 350
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#FAF8F5]">
      {/* Interactive Cytoscape Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#E8E3D9] shadow-sm text-xs text-[#5C5A55]">
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 hover:bg-[#F5F2EB] rounded text-[#2C2B29] font-medium transition-colors"
          title="适应画布全览"
        >
          全屏适应 (Fit)
        </button>
        <span className="text-[#D4CDC0]">|</span>
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
          className="px-2 py-1 hover:bg-[#F5F2EB] rounded text-[#2C2B29] font-bold"
        >
          +
        </button>
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          className="px-2 py-1 hover:bg-[#F5F2EB] rounded text-[#2C2B29] font-bold"
        >
          -
        </button>
      </div>

      {/* Connect Mode Banner */}
      {isConnectingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-5 py-2.5 rounded-full shadow-lg flex items-center space-x-3 text-sm animate-pulse z-50">
          <span>
            {connectSourceId
              ? `已选定前提：${nodes.find(n => n.id === connectSourceId)?.title || connectSourceId}。请点击结论节点建立依赖。`
              : '请在图上点击作为【前提条件】的节点 A'}
          </span>
          <button
            onClick={() => {
              setIsConnectingMode(false);
              setConnectSourceId(null);
              cyRef.current?.nodes().removeClass('connect-source');
            }}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* Color Legend (Subtle minimalist) */}
      <div className="absolute bottom-6 right-6 flex items-center space-x-4 bg-white/85 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#E8E3D9] text-xs text-[#5C5A55] pointer-events-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#26547C]" />
          <span>公理</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#2A7B62]" />
          <span>定义</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#A8423F]" />
          <span>定理</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#C67D28]" />
          <span>推论</span>
        </div>
      </div>
    </div>
  );
};
