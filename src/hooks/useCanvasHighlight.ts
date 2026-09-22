import { useEffect, MutableRefObject } from 'react';
import { Core } from 'cytoscape';

interface UseCanvasHighlightProps {
  cyRef: MutableRefObject<Core | null>;
  selectedNodeId: string | null;
  selectedNodeIds?: Set<string>;
  isFocusMode: boolean;
  searchQuery: string;
}

export function useCanvasHighlight({
  cyRef,
  selectedNodeId,
  selectedNodeIds,
  isFocusMode,
  searchQuery
}: UseCanvasHighlightProps) {
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
  }, [cyRef, selectedNodeId, selectedNodeIds, isFocusMode]);

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
  }, [cyRef, searchQuery]);
}
