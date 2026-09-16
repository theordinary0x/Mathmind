import type { LayoutOptions } from 'cytoscape';

export function getDagreLayoutConfig(): LayoutOptions {
  return {
    name: 'dagre',
    rankDir: 'LR',
    nodeDimensionsIncludeLabels: true,
    nodeSep: 80,
    rankSep: 140,
    edgeSep: 40,
    animate: true,
    animationDuration: 550,
    animationEasing: 'ease-out-cubic',
    fit: false,
    padding: 60
  } as LayoutOptions;
}

export function getCoseLayoutConfig(): LayoutOptions {
  return {
    name: 'cose',
    animate: true,
    animationDuration: 600,
    animationEasing: 'ease-out-cubic',
    refresh: 20,
    fit: false,
    padding: 60,
    randomize: false,
    componentSpacing: 140,
    nodeRepulsion: () => 1200000,
    nodeOverlap: 10,
    idealEdgeLength: () => 160,
    edgeElasticity: () => 100,
    nestingFactor: 1.2,
    gravity: 0.25,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95
  } as LayoutOptions;
}

export function getGraphLayoutConfig(type: 'dagre' | 'cose'): LayoutOptions {
  return type === 'dagre' ? getDagreLayoutConfig() : getCoseLayoutConfig();
}
