import type { StylesheetStyle } from 'cytoscape';

export const darkStyles: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'label': 'data(displayTitle)',
      'font-family': '"Noto Serif SC", "Source Serif 4", Georgia, serif',
      'font-size': '13px',
      'font-weight': 600,
      'color': '#EDECE8',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '180px',
      'text-opacity': 0,
      'line-height': 1.3,
      'background-color': '#1C1C20',
      'border-width': 1.5,
      'border-color': 'data(darkBorderColor)',
      'width': 'label',
      'height': 'label',
      'padding': '14px',
      'shape': 'rectangle',
      'z-index': 10,
      'z-compound-depth': 'top',
      'min-zoomed-font-size': 5,
      'transition-property': 'background-color, border-color, opacity, border-width',
      'transition-duration': 0.15
    }
  },
  {
    selector: 'node[type = "axiom"]',
    style: {
      'border-color': '#5888C4',
      'background-color': '#141E2D',
      'color': '#D3E3F8'
    }
  },
  {
    selector: 'node[type = "definition"]',
    style: {
      'border-color': '#4CA47A',
      'background-color': '#12241C',
      'color': '#D0F0E2'
    }
  },
  {
    selector: 'node[type = "proposition"]',
    style: {
      'border-color': '#8B5CF6',
      'background-color': '#241738',
      'color': '#E9D5FF'
    }
  },
  {
    selector: 'node[type = "theorem"]',
    style: {
      'border-color': '#C45766',
      'background-color': '#281518',
      'color': '#FCE0E3'
    }
  },
  {
    selector: 'node[type = "corollary"]',
    style: {
      'border-color': '#C8833B',
      'background-color': '#281C10',
      'color': '#FDEBD9'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2.0,
      'line-color': '#52525B',
      'target-arrow-color': '#71717A',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'control-point-step-size': 40,
      'target-distance-from-node': 4,
      'source-distance-from-node': 2,
      'arrow-scale': 1.3,
      'opacity': 0.8,
      'z-index': 1,
      'transition-property': 'line-color, target-arrow-color, width, opacity',
      'transition-duration': 0.15
    }
  },
  {
    selector: 'edge:hover',
    style: {
      'width': 3.0,
      'line-color': '#93C5FD',
      'target-arrow-color': '#93C5FD',
      'opacity': 1.0,
      'z-index': 20
    }
  },
  {
    selector: 'node:hover',
    style: {
      'z-index': 35
    }
  },
  {
    selector: 'node:selected, node.selected',
    style: {
      'border-width': 3,
      'border-color': '#FFFFFF',
      'background-color': '#28282E',
      'z-index': 40
    }
  },
  {
    selector: 'node.upstream-highlight',
    style: {
      'border-width': 3,
      'border-color': '#5888C4',
      'background-color': '#1E324E',
      'z-index': 30
    }
  },
  {
    selector: 'node.downstream-highlight',
    style: {
      'border-width': 3,
      'border-color': '#C45766',
      'background-color': '#3E1C22',
      'z-index': 30
    }
  },
  {
    selector: 'edge.highlighted-edge',
    style: {
      'width': 2.8,
      'line-color': '#FFFFFF',
      'target-arrow-color': '#FFFFFF',
      'opacity': 1,
      'z-index': 25
    }
  },
  {
    selector: '.dimmed',
    style: {
      'opacity': 0.08
    }
  },
  {
    selector: 'node.search-matched',
    style: {
      'border-width': 3,
      'border-color': '#FBBF24',
      'background-color': '#45320A',
      'z-index': 35
    }
  },
  {
    selector: 'node.connect-source',
    style: {
      'border-width': 3,
      'border-style': 'dashed',
      'border-color': '#60A5FA',
      'background-color': '#1E3A8A',
      'opacity': 1,
      'z-index': 45
    }
  },
  {
    selector: 'node.newly-created',
    style: {
      'border-width': 3.5,
      'border-color': '#3B82F6',
      'border-style': 'solid',
      'opacity': 1,
      'z-index': 50
    }
  }
];

export const lightStyles: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'label': 'data(displayTitle)',
      'font-family': '"Noto Serif SC", "Source Serif 4", Georgia, serif',
      'font-size': '13px',
      'font-weight': 600,
      'color': '#0F172A',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '180px',
      'text-opacity': 0,
      'line-height': 1.3,
      'background-color': '#FFFFFF',
      'border-width': 2,
      'border-color': 'data(borderColor)',
      'width': 'label',
      'height': 'label',
      'padding': '14px',
      'shape': 'rectangle',
      'z-index': 10,
      'z-compound-depth': 'top',
      'min-zoomed-font-size': 5,
      'transition-property': 'background-color, border-color, opacity, border-width, color',
      'transition-duration': 0.15
    }
  },
  {
    selector: 'node[type = "axiom"]',
    style: {
      'border-color': '#2563EB',
      'background-color': '#F0F7FF',
      'color': '#1E3A8A'
    }
  },
  {
    selector: 'node[type = "definition"]',
    style: {
      'border-color': '#059669',
      'background-color': '#F0FDF4',
      'color': '#065F46'
    }
  },
  {
    selector: 'node[type = "proposition"]',
    style: {
      'border-color': '#7C3AED',
      'background-color': '#F5F3FF',
      'color': '#5B21B6'
    }
  },
  {
    selector: 'node[type = "theorem"]',
    style: {
      'border-color': '#DC2626',
      'background-color': '#FEF2F2',
      'color': '#991B1B'
    }
  },
  {
    selector: 'node[type = "corollary"]',
    style: {
      'border-color': '#D97706',
      'background-color': '#FFFBEB',
      'color': '#92400E'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2.0,
      'line-color': '#64748B',
      'target-arrow-color': '#475569',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'control-point-step-size': 40,
      'target-distance-from-node': 4,
      'source-distance-from-node': 2,
      'arrow-scale': 1.3,
      'opacity': 0.8,
      'z-index': 1,
      'transition-property': 'line-color, target-arrow-color, width, opacity',
      'transition-duration': 0.15
    }
  },
  {
    selector: 'edge:hover',
    style: {
      'width': 3.0,
      'line-color': '#2563EB',
      'target-arrow-color': '#2563EB',
      'opacity': 1.0,
      'z-index': 20
    }
  },
  {
    selector: 'node:hover',
    style: {
      'z-index': 35
    }
  },
  {
    selector: 'node:selected, node.selected',
    style: {
      'border-width': 3.5,
      'border-color': '#0F172A',
      'background-color': '#FFFFFF',
      'z-index': 40
    }
  },
  {
    selector: 'node.upstream-highlight',
    style: {
      'border-width': 3,
      'border-color': '#2563EB',
      'background-color': '#DBEAFE',
      'color': '#1E40AF',
      'z-index': 30
    }
  },
  {
    selector: 'node.downstream-highlight',
    style: {
      'border-width': 3,
      'border-color': '#DC2626',
      'background-color': '#FEE2E2',
      'color': '#991B1B',
      'z-index': 30
    }
  },
  {
    selector: 'edge.highlighted-edge',
    style: {
      'width': 3.0,
      'line-color': '#2563EB',
      'target-arrow-color': '#2563EB',
      'opacity': 1,
      'z-index': 25
    }
  },
  {
    selector: '.dimmed',
    style: {
      'opacity': 0.12
    }
  },
  {
    selector: 'node.search-matched',
    style: {
      'border-width': 3,
      'border-color': '#D97706',
      'background-color': '#FEF3C7',
      'color': '#92400E',
      'z-index': 35
    }
  },
  {
    selector: 'node.connect-source',
    style: {
      'border-width': 3.5,
      'border-style': 'dashed',
      'border-color': '#2563EB',
      'background-color': '#DBEAFE',
      'opacity': 1,
      'z-index': 45
    }
  },
  {
    selector: 'node.newly-created',
    style: {
      'border-width': 4,
      'border-color': '#2563EB',
      'border-style': 'solid',
      'opacity': 1,
      'z-index': 50
    }
  }
];

export function getCytoscapeStyles(isDark: boolean): StylesheetStyle[] {
  return isDark ? darkStyles : lightStyles;
}
